import * as core from "@actions/core";
import type { OctokitClient } from "./client";

// ─────────────────────────────────────────────────────────────────────────────
// PR Metadata & Diff Fetching
// ─────────────────────────────────────────────────────────────────────────────

export interface PullRequestInfo {
  /** PR number */
  number: number;

  /** PR title */
  title: string;

  /** PR author login */
  author: string;

  /** The merge commit SHA */
  mergeCommitSha: string;

  /** Labels on the PR */
  labels: string[];
}

export interface DiffFile {
  /** Filename relative to repo root */
  filename: string;

  /** Change status: added | removed | modified | renamed | copied */
  status: string;

  /** Number of additions */
  additions: number;

  /** Number of deletions */
  deletions: number;

  /** The unified diff patch for this file (may be undefined for binary) */
  patch: string | undefined;
}

/**
 * Finds the most recently merged PR associated with a given commit SHA.
 *
 * This is the critical bridge for `workflow_run`-based triggers, where
 * the event payload contains the head_sha but NOT the PR metadata.
 */
export async function findMergedPR(
  octokit: OctokitClient,
  owner: string,
  repo: string,
  commitSha: string
): Promise<PullRequestInfo | null> {
  core.info(`🔍 Searching for merged PR associated with commit ${commitSha.substring(0, 7)}...`);

  const { data: prs } =
    await octokit.rest.repos.listPullRequestsAssociatedWithCommit({
      owner,
      repo,
      commit_sha: commitSha,
    });

  // Find the first PR that was actually merged
  const mergedPR = prs.find(
    (pr) => pr.merged_at !== null && pr.state === "closed"
  );

  if (!mergedPR) {
    core.info("ℹ️  No merged PR found for this commit. This may be a direct push.");
    return null;
  }

  core.info(`✅ Found merged PR #${mergedPR.number}: "${mergedPR.title}"`);

  return {
    number: mergedPR.number,
    title: mergedPR.title,
    author: mergedPR.user?.login ?? "unknown",
    mergeCommitSha: mergedPR.merge_commit_sha ?? commitSha,
    labels: mergedPR.labels.map((l) => l.name ?? ""),
  };
}

/**
 * Fetches all changed files for a PR, with full pagination support.
 *
 * Returns the file-level diffs including patches. Each file's `patch`
 * contains the unified diff hunks for that file.
 */
export async function fetchPRDiff(
  octokit: OctokitClient,
  owner: string,
  repo: string,
  prNumber: number
): Promise<DiffFile[]> {
  core.info(`📦 Fetching diff for PR #${prNumber}...`);

  const files = await octokit.paginate(
    octokit.rest.pulls.listFiles,
    {
      owner,
      repo,
      pull_number: prNumber,
      per_page: 100,
    }
  );

  core.info(`   Found ${files.length} changed file(s).`);

  return files.map((file) => ({
    filename: file.filename,
    status: file.status,
    additions: file.additions,
    deletions: file.deletions,
    patch: file.patch,
  }));
}
