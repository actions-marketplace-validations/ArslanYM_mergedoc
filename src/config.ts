import * as core from "@actions/core";

// ─────────────────────────────────────────────────────────────────────────────
// Configuration — parsed and validated action inputs
// ─────────────────────────────────────────────────────────────────────────────

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

/** Default models per provider */
const DEFAULT_MODELS: Record<LLMProviderName, string> = {
  anthropic: "claude-sonnet-4-20250514",
  openai: "gpt-4o",
};

/**
 * Parses and validates all action inputs from the workflow environment.
 * Fails the action immediately if required inputs are missing or invalid.
 */
export function parseConfig(): Config {
  const githubToken = core.getInput("github_token", { required: true });
  const llmApiKey = core.getInput("llm_api_key", { required: true });

  // --- Provider ---
  const rawProvider = core.getInput("llm_provider").toLowerCase().trim();
  if (rawProvider !== "anthropic" && rawProvider !== "openai") {
    throw new Error(
      `Invalid llm_provider "${rawProvider}". Must be "anthropic" or "openai".`
    );
  }
  const llmProvider: LLMProviderName = rawProvider;

  // --- Model ---
  const rawModel = core.getInput("model_name").trim();
  const modelName = rawModel || DEFAULT_MODELS[llmProvider];

  // --- Token budget ---
  const rawTokens = core.getInput("max_diff_tokens").trim();
  const maxDiffTokens = parseInt(rawTokens, 10);
  if (isNaN(maxDiffTokens) || maxDiffTokens < 1000) {
    throw new Error(
      `Invalid max_diff_tokens "${rawTokens}". Must be a number >= 1000.`
    );
  }

  // --- Changelog path ---
  const changelogPath = core.getInput("changelog_path").trim() || "CHANGELOG.md";

  // --- Excluded files ---
  const rawExcluded = core.getInput("excluded_files").trim();
  const excludedFiles = rawExcluded
    ? rawExcluded.split(",").map((p) => p.trim()).filter(Boolean)
    : [];

  // Mask the API key from logs
  core.setSecret(llmApiKey);

  return {
    githubToken,
    llmApiKey,
    llmProvider,
    modelName,
    maxDiffTokens,
    changelogPath,
    excludedFiles,
  };
}
