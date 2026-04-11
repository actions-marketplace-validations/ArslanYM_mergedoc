// ─────────────────────────────────────────────────────────────────────────────
// Lightweight Token Estimator
// ─────────────────────────────────────────────────────────────────────────────
//
// Avoids a dependency on tiktoken or similar heavy tokenizers.
// Uses a conservative character-based heuristic:
//   - English prose:  ~4 characters per token
//   - Code/diffs:     ~3.5 characters per token (more symbols)
//   - We use 3.5 to be conservative (overestimates tokens → stays under budget)
//

const CHARS_PER_TOKEN = 3.5;

/**
 * Estimates the number of tokens in a string.
 * Conservative — will slightly overcount to prevent budget overflows.
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

/**
 * Returns the effective token budget (90% of max) to leave
 * headroom for the system prompt and response.
 */
export function effectiveBudget(maxDiffTokens: number): number {
  return Math.floor(maxDiffTokens * 0.9);
}
