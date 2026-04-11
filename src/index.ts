import * as core from "@actions/core";
import * as github from "@actions/github";

import { parseConfig } from "./config";
import { createOctokitClient, getRepoContext } from "./github/client";
import { findMergedPR, fetchPRDiff } from "./github/pr";
import { commitAndPush } from "./github/commit";
import { createLLMProvider } from "./llm/provider";
import {
  SYSTEM_PROMPT,
  buildUserPrompt,
  buildChunkSummaryPrompt,
  buildReducePrompt,
} from "./llm/prompt";
import { filterAndRankFiles } from "./diff/filter";
import { chunkDiffs } from "./diff/chunker";
import { formatChangelogEntry } from "./changelog/formatter";
import { updateChangelog } from "./changelog/writer";

// ─────────────────────────────────────────────────────────────────────────────
// Entry Point
// ─────────────────────────────────────────────────────────────────────────────

async function run(): Promise<void> {
  try {
    // ── 1. Parse inputs ──────────────────────────────────────────────────
    core.startGroup("⚙️  Configuration");
    const config = parseConfig();
    core.info(`Provider: ${config.llmProvider} (${config.modelName})`);
    core.info(`Token budget: ${config.maxDiffTokens.toLocaleString()}`);
    core.info(`Changelog: ${config.changelogPath}`);
    core.endGroup();

    // ── 2. Initialize clients ────────────────────────────────────────────
    const octokit = createOctokitClient(config.githubToken);
    const { owner, repo } = getRepoContext();
    const llm = createLLMProvider(
      config.llmProvider,
      config.llmApiKey,
      config.modelName
    );

    // ── 3. Resolve the merge commit SHA ──────────────────────────────────
    core.startGroup("🔍 Resolving PR");
    const headSha = resolveHeadSha();
    core.info(`Head SHA: ${headSha}`);

    // ── 4. Find the merged PR ────────────────────────────────────────────
    const pr = await findMergedPR(octokit, owner, repo, headSha);

    if (!pr) {
      core.info("No merged PR found for this commit. Skipping.");
      core.setOutput("changelog_updated", "false");
      core.setOutput("files_analyzed", "0");
      core.setOutput("release_notes", "");
      core.endGroup();
      return;
    }
    core.endGroup();

    // ── 5. Fetch and process the diff ────────────────────────────────────
    core.startGroup("📦 Processing Diff");
    const rawFiles = await fetchPRDiff(octokit, owner, repo, pr.number);
    const filteredFiles = filterAndRankFiles(rawFiles, config.excludedFiles);

    if (filteredFiles.length === 0) {
      core.info("No analyzable files in the diff (all excluded or binary). Skipping.");
      core.setOutput("changelog_updated", "false");
      core.setOutput("files_analyzed", "0");
      core.setOutput("release_notes", "");
      core.endGroup();
      return;
    }

    const chunking = chunkDiffs(filteredFiles, config.maxDiffTokens);
    core.setOutput("files_analyzed", String(chunking.totalFilesIncluded));
    core.endGroup();

    // ── 6. Generate release notes via LLM ────────────────────────────────
    core.startGroup("🤖 Generating Release Notes");
    let releaseNotes: string;

    if (!chunking.requiresMapReduce) {
      // Single-pass: entire diff fits in one call
      const userPrompt = buildUserPrompt(
        pr.number,
        pr.title,
        pr.author,
        chunking.chunks[0].content
      );
      releaseNotes = await llm.generate(SYSTEM_PROMPT, userPrompt);
    } else {
      // Map-reduce: chunk summaries → final synthesis
      core.info(
        `📊 Map-reduce: summarizing ${chunking.chunks.length} chunks...`
      );

      const summaries: string[] = [];

      for (const chunk of chunking.chunks) {
        const chunkPrompt = buildChunkSummaryPrompt(
          pr.number,
          pr.title,
          chunk.index,
          chunking.chunks.length,
          chunk.content
        );
        const summary = await llm.generate(SYSTEM_PROMPT, chunkPrompt);
        summaries.push(summary);
        core.info(`   ✅ Chunk ${chunk.index + 1}/${chunking.chunks.length} summarized.`);
      }

      // Reduce step
      core.info("📊 Synthesizing final release notes...");
      const reducePrompt = buildReducePrompt(
        pr.number,
        pr.title,
        pr.author,
        summaries
      );
      releaseNotes = await llm.generate(SYSTEM_PROMPT, reducePrompt);
    }

    core.setOutput("release_notes", releaseNotes);
    core.endGroup();

    // ── 7. Update the changelog ──────────────────────────────────────────
    core.startGroup("📝 Updating Changelog");
    const entry = formatChangelogEntry(
      releaseNotes,
      pr.number,
      pr.title,
      pr.author
    );
    updateChangelog(config.changelogPath, entry);
    core.endGroup();

    // ── 8. Commit and push ───────────────────────────────────────────────
    core.startGroup("🚀 Committing Changes");
    const committed = await commitAndPush(config.changelogPath, pr.number);
    core.setOutput("changelog_updated", String(committed));
    core.endGroup();

    // ── Done ─────────────────────────────────────────────────────────────
    if (committed) {
      core.info("🎉 MergeDoc completed successfully — changelog updated!");
    } else {
      core.info("✅ MergeDoc completed — no changes needed.");
    }
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(`MergeDoc failed: ${error.message}`);
    } else {
      core.setFailed(`MergeDoc failed: ${String(error)}`);
    }
  }
}

/**
 * Resolves the head SHA for PR lookup.
 *
 * Supports two trigger modes:
 * 1. `workflow_run` — uses `github.event.workflow_run.head_sha`
 * 2. `push` / `pull_request` — uses `github.context.sha`
 */
function resolveHeadSha(): string {
  // workflow_run trigger
  const workflowRunPayload = github.context.payload.workflow_run;
  if (workflowRunPayload?.head_sha) {
    return workflowRunPayload.head_sha as string;
  }

  // Direct trigger (push, pull_request)
  return github.context.sha;
}

// ── Execute ──────────────────────────────────────────────────────────────────
run();
