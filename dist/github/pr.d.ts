import type { OctokitClient } from "./client";
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
export declare function findMergedPR(octokit: OctokitClient, owner: string, repo: string, commitSha: string): Promise<PullRequestInfo | null>;
/**
 * Fetches all changed files for a PR, with full pagination support.
 *
 * Returns the file-level diffs including patches. Each file's `patch`
 * contains the unified diff hunks for that file.
 */
export declare function fetchPRDiff(octokit: OctokitClient, owner: string, repo: string, prNumber: number): Promise<DiffFile[]>;
//# sourceMappingURL=pr.d.ts.map