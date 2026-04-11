import type { DiffFile } from "../github/pr";
/**
 * Filters out excluded files and sorts by analysis priority.
 * Binary files (those without a patch) are always excluded.
 */
export declare function filterAndRankFiles(files: DiffFile[], excludedPatterns: string[]): DiffFile[];
/**
 * Simple glob matching (supports * and ** patterns).
 * Avoids pulling in a full glob library for a handful of patterns.
 */
export declare function minimatch(filename: string, pattern: string): boolean;
//# sourceMappingURL=filter.d.ts.map