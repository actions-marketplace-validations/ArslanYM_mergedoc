export type LLMProviderName = "anthropic" | "openai";
export interface Config {
    /** GitHub token with contents:write and pull-requests:read */
    githubToken: string;
    /** API key for the selected LLM provider */
    llmApiKey: string;
    /** Which LLM provider to use */
    llmProvider: LLMProviderName;
    /** Model identifier (e.g. "claude-sonnet-4-20250514", "gpt-4o") */
    modelName: string;
    /** Maximum token budget for diff context */
    maxDiffTokens: number;
    /** Path to the CHANGELOG.md file */
    changelogPath: string;
    /** Glob patterns for files to exclude from analysis */
    excludedFiles: string[];
}
/**
 * Parses and validates all action inputs from the workflow environment.
 * Fails the action immediately if required inputs are missing or invalid.
 */
export declare function parseConfig(): Config;
