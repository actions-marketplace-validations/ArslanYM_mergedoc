/**
 * Commits a modified file and pushes to the specified branch.
 *
 * Uses the official github-actions[bot] identity so the commit shows
 * as authored by the GitHub Actions bot in the UI.
 *
 * @returns true if a commit was made, false if there were no changes.
 */
export declare function commitAndPush(filePath: string, prNumber: number, branch?: string): Promise<boolean>;
//# sourceMappingURL=commit.d.ts.map