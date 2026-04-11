import type { DiffFile } from "../github/pr";

// ─────────────────────────────────────────────────────────────────────────────
// File Filter — Exclusion logic for diff files
// ─────────────────────────────────────────────────────────────────────────────

/** Files that are always excluded regardless of user configuration */
const ALWAYS_EXCLUDED = [
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  "*.generated.*",
  "*.min.js",
  "*.min.css",
  "*.map",
  "*.woff",
  "*.woff2",
  "*.ttf",
  "*.eot",
  "*.ico",
  "*.png",
  "*.jpg",
  "*.jpeg",
  "*.gif",
  "*.svg",
  "*.webp",
  "*.avif",
  "*.mp4",
  "*.webm",
  "*.pdf",
  "*.zip",
  "*.tar.gz",
  "*.wasm",
  "dist/**",
];

/** Source code extensions ranked by analysis priority (higher = more important) */
const PRIORITY_EXTENSIONS: Record<string, number> = {
  ".ts":    100,
  ".tsx":   100,
  ".js":    95,
  ".jsx":   95,
  ".py":    90,
  ".rs":    90,
  ".go":    90,
  ".java":  85,
  ".kt":    85,
  ".swift": 85,
  ".cpp":   80,
  ".c":     80,
  ".cs":    80,
  ".rb":    75,
  ".php":   75,
  ".vue":   70,
  ".svelte":70,
  ".sql":   60,
  ".graphql":55,
  ".proto": 55,
  ".yaml":  40,
  ".yml":   40,
  ".toml":  40,
  ".json":  35,
  ".md":    20,
  ".txt":   10,
};

/**
 * Filters out excluded files and sorts by analysis priority.
 * Binary files (those without a patch) are always excluded.
 */
export function filterAndRankFiles(
  files: DiffFile[],
  excludedPatterns: string[]
): DiffFile[] {
  const allPatterns = [...ALWAYS_EXCLUDED, ...excludedPatterns];

  return files
    .filter((file) => {
      // Exclude files without patches (binary files)
      if (!file.patch) return false;

      // Check against exclusion patterns
      return !allPatterns.some((pattern) => minimatch(file.filename, pattern));
    })
    .sort((a, b) => {
      const priorityA = getFilePriority(a.filename);
      const priorityB = getFilePriority(b.filename);
      return priorityB - priorityA;
    });
}

/**
 * Gets the analysis priority for a file based on its extension.
 */
function getFilePriority(filename: string): number {
  const ext = getExtension(filename);
  return PRIORITY_EXTENSIONS[ext] ?? 30;
}

/**
 * Extracts the file extension (including the dot) from a filename.
 */
function getExtension(filename: string): string {
  const lastDot = filename.lastIndexOf(".");
  if (lastDot === -1) return "";
  return filename.substring(lastDot).toLowerCase();
}

/**
 * Simple glob matching (supports * and ** patterns).
 * Avoids pulling in a full glob library for a handful of patterns.
 */
export function minimatch(filename: string, pattern: string): boolean {
  // Direct match
  if (filename === pattern) return true;

  // Convert glob pattern to regex
  const regexStr = pattern
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")  // Escape special regex chars (except * and ?)
    .replace(/\*\*/g, "{{GLOBSTAR}}")        // Temporary placeholder for **
    .replace(/\*/g, "[^/]*")                 // * matches anything except /
    .replace(/\?/g, "[^/]")                  // ? matches single char except /
    .replace(/\{\{GLOBSTAR\}\}/g, ".*");     // ** matches everything including /

  const regex = new RegExp(`^${regexStr}$`);
  return regex.test(filename);
}
