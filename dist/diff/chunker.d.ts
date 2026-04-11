import type { DiffFile } from "../github/pr";
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
export declare function chunkDiffs(files: DiffFile[], maxDiffTokens: number): ChunkingResult;
//# sourceMappingURL=chunker.d.ts.map