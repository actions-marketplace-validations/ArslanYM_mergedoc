// ─────────────────────────────────────────────────────────────────────────────
// Changelog Formatter — Markdown output construction
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Wraps the LLM-generated release notes into a full changelog entry
 * with date, PR reference, and author attribution.
 */
export function formatChangelogEntry(
  releaseNotes: string,
  prNumber: number,
  prTitle: string,
  prAuthor: string,
  date: Date = new Date()
): string {
  const dateStr = formatDate(date);

  const lines: string[] = [
    `## [${dateStr}] — PR #${prNumber}: ${prTitle}`,
    "",
    `> Authored by [@${prAuthor}](https://github.com/${prAuthor})`,
    "",
    releaseNotes.trim(),
    "",
    "---",
    "",
  ];

  return lines.join("\n");
}

/**
 * Formats a date as YYYY-MM-DD.
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
