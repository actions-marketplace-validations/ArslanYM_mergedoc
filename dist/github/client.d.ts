import * as github from "@actions/github";
export type OctokitClient = ReturnType<typeof github.getOctokit>;
/**
 * Creates an authenticated Octokit client from the provided GitHub token.
 */
export declare function createOctokitClient(token: string): OctokitClient;
/**
 * Extracts the repository owner and name from the GitHub Actions context.
 */
export declare function getRepoContext(): {
    owner: string;
    repo: string;
};
//# sourceMappingURL=client.d.ts.map