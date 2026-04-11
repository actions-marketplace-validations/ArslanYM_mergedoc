import * as core from "@actions/core";
import type { DiffFile } from "../github/pr";
import { estimateTokens, effectiveBudget } from "./tokenizer";

// ─────────────────────────────────────────────────────────────────────────────
// Diff Chunker — Token-safe diff packing
// ─────────────────────────────────────────────────────────────────────────────

export interface DiffChunk {
  /** Index of this chunk (0-based) */
  index: number;

  /** The concatenated diff content for this chunk */
  content: string;

  /** Number of files included in this chunk */
  fileCount: number;

  /** Estimated token count */
  estimatedTokens: number;
}

export interface ChunkingResult {
  /** The packed chunks, ready to send to the LLM */
  chunks: DiffChunk[];

  /** Total number of files included across all chunks */
  totalFilesIncluded: number;

  /** Total number of files that were dropped (exceeded budget even for map-reduce) */
  totalFilesDropped: number;

  /** Whether map-reduce is needed (more than 1 chunk) */
  requiresMapReduce: boolean;
}

/**
 * Packs filtered diff files into token-safe chunks using a greedy algorithm.
 *
 * Strategy:
 * 1. Files are already sorted by priority (source code first).
 * 2. Iterate through files, greedily packing whole files into the current chunk.
 * 3. When a file would exceed the chunk budget, start a new chunk.
 * 4. If a single file exceeds the entire chunk budget, truncate its patch.
 *
 * @param files - Pre-filtered and priority-sorted diff files
 * @param maxDiffTokens - Maximum token budget from config
 */
export function chunkDiffs(
  files: DiffFile[],
  maxDiffTokens: number
): ChunkingResult {
  const budget = effectiveBudget(maxDiffTokens);

  core.info(`📐 Token budget: ${budget.toLocaleString()} (from max ${maxDiffTokens.toLocaleString()})`);

  const chunks: DiffChunk[] = [];
  let currentContent = "";
  let currentTokens = 0;
  let currentFileCount = 0;
  let totalFilesIncluded = 0;
  let totalFilesDropped = 0;

  for (const file of files) {
    if (!file.patch) continue;

    const fileHeader = `\n--- ${file.status}: ${file.filename} ---\n`;
    const fileContent = fileHeader + file.patch;
    const fileTokens = estimateTokens(fileContent);

    // Can this file fit in the current chunk?
    if (currentTokens + fileTokens <= budget) {
      currentContent += fileContent;
      currentTokens += fileTokens;
      currentFileCount++;
      totalFilesIncluded++;
      continue;
    }

    // Current chunk is full — flush it if it has content
    if (currentContent) {
      chunks.push({
        index: chunks.length,
        content: currentContent,
        fileCount: currentFileCount,
        estimatedTokens: currentTokens,
      });
    }

    // Does this single file fit in a fresh chunk?
    if (fileTokens <= budget) {
      currentContent = fileContent;
      currentTokens = fileTokens;
      currentFileCount = 1;
      totalFilesIncluded++;
    } else {
      // File is too large even for a full chunk — truncate the patch
      const truncated = truncatePatch(file.patch, budget, fileHeader);
      if (truncated) {
        chunks.push({
          index: chunks.length,
          content: truncated.content,
          fileCount: 1,
          estimatedTokens: truncated.tokens,
        });
        totalFilesIncluded++;
      } else {
        totalFilesDropped++;
        core.warning(
          `⚠️  Dropped ${file.filename} — patch too large to truncate meaningfully.`
        );
      }
      // Reset for next file
      currentContent = "";
      currentTokens = 0;
      currentFileCount = 0;
    }
  }

  // Flush the final chunk
  if (currentContent) {
    chunks.push({
      index: chunks.length,
      content: currentContent,
      fileCount: currentFileCount,
      estimatedTokens: currentTokens,
    });
  }

  const result: ChunkingResult = {
    chunks,
    totalFilesIncluded,
    totalFilesDropped,
    requiresMapReduce: chunks.length > 1,
  };

  core.info(
    `   Packed ${totalFilesIncluded} file(s) into ${chunks.length} chunk(s)` +
      (totalFilesDropped > 0 ? ` (${totalFilesDropped} dropped)` : "")
  );

  if (result.requiresMapReduce) {
    core.info("   📊 Map-reduce mode will be used for this large diff.");
  }

  return result;
}

/**
 * Truncates a patch to fit within the token budget by keeping
 * the first N lines (hunks from the top of the file).
 */
function truncatePatch(
  patch: string,
  budget: number,
  header: string
): { content: string; tokens: number } | null {
  const headerTokens = estimateTokens(header);
  const availableTokens = budget - headerTokens - 50; // 50 token buffer for truncation notice

  if (availableTokens <= 100) return null;

  const lines = patch.split("\n");
  const truncatedLines: string[] = [];
  let tokens = 0;

  for (const line of lines) {
    const lineTokens = estimateTokens(line + "\n");
    if (tokens + lineTokens > availableTokens) break;
    truncatedLines.push(line);
    tokens += lineTokens;
  }

  if (truncatedLines.length === 0) return null;

  const truncationNotice = `\n... [truncated — ${lines.length - truncatedLines.length} lines omitted] ...`;
  const content = header + truncatedLines.join("\n") + truncationNotice;

  return {
    content,
    tokens: estimateTokens(content),
  };
}
