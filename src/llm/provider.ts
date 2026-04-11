import type { LLMProvider } from "./types";
import type { LLMProviderName } from "../config";
import { AnthropicProvider } from "./anthropic";
import { OpenAIProvider } from "./openai";
import { GeminiProvider } from "./gemini";

// ─────────────────────────────────────────────────────────────────────────────
// Provider Factory
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates the appropriate LLM provider based on configuration.
 */
export function createLLMProvider(
  providerName: LLMProviderName,
  apiKey: string,
  model: string
): LLMProvider {
  switch (providerName) {
    case "anthropic":
      return new AnthropicProvider(apiKey, model);

    case "openai":
      return new OpenAIProvider(apiKey, model);

    case "gemini":
      return new GeminiProvider(apiKey, model);

    default: {
      const _exhaustive: never = providerName;
      throw new Error(`Unknown LLM provider: ${_exhaustive}`);
    }
  }
}
