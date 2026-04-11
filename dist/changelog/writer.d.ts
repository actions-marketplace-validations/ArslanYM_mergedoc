/**
 * Reads the existing CHANGELOG.md (or creates a new one) and inserts
 * the new entry at the top, below the header.
 *
 * The insertion point is after the header block and any `## [Unreleased]`
 * section, so entries appear in reverse chronological order.
 */
export declare function updateChangelog(changelogPath: string, newEntry: string): void;
//# sourceMappingURL=writer.d.ts.map