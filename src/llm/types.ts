// ─────────────────────────────────────────────────────────────────────────────
// LLM Provider Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Provider-agnostic interface for LLM interactions.
 *
 * Both Anthropic and OpenAI implementations conform to this contract,
 * allowing the core logic to be completely decoupled from the API specifics.
 */
export interface LLMProvider {
  /** Human-readable provider name for logging */
  readonly name: string;

  /**
   * Sends a prompt to the LLM and returns the generated text.
   *
   * @param systemPrompt - Instructions for the model's behavior
   * @param userPrompt   - The actual content to analyze (diff + context)
   * @returns The raw text response from the model
   */
  generate(systemPrompt: string, userPrompt: string): Promise<string>;
}

/**
 * Structured release note categories returned by the LLM.
 */
export interface ReleaseNotes {
  features: string[];
  fixes: string[];
  chores: string[];
}
