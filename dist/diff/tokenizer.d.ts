/**
 * Estimates the number of tokens in a string.
 * Conservative — will slightly overcount to prevent budget overflows.
 */
export declare function estimateTokens(text: string): number;
/**
 * Returns the effective token budget (90% of max) to leave
 * headroom for the system prompt and response.
 */
export declare function effectiveBudget(maxDiffTokens: number): number;
//# sourceMappingURL=tokenizer.d.ts.map