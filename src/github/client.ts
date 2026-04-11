import * as github from "@actions/github";

// ─────────────────────────────────────────────────────────────────────────────
// Octokit Client Factory
// ─────────────────────────────────────────────────────────────────────────────

export type OctokitClient = ReturnType<typeof github.getOctokit>;

/**
 * Creates an authenticated Octokit client from the provided GitHub token.
 */
export function createOctokitClient(token: string): OctokitClient {
  return github.getOctokit(token);
}

/**
 * Extracts the repository owner and name from the GitHub Actions context.
 */
export function getRepoContext(): { owner: string; repo: string } {
  const { owner, repo } = github.context.repo;
  return { owner, repo };
}
