import type { LLMProvider } from "./types";
import type { LLMProviderName } from "../config";
/**
 * Creates the appropriate LLM provider based on configuration.
 */
export declare function createLLMProvider(providerName: LLMProviderName, apiKey: string, model: string): LLMProvider;
//# sourceMappingURL=provider.d.ts.map