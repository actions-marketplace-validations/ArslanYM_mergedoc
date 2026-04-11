import * as core from "@actions/core";
import type { LLMProvider } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// OpenRouter — OpenAI-compatible API with FREE models
// ─────────────────────────────────────────────────────────────────────────────
//
// OpenRouter provides free access to several models:
//   - Sign up at https://openrouter.ai (GitHub OAuth — 30 seconds)
//   - No credit card required
//   - Free tier: 20 req/min, 200 req/day
//   - Use model "openrouter/auto" to auto-select the best free model
//

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OpenRouterResponse {
  id: string;
  choices: Array<{
    message: { role: string; content: string };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model?: string;
}

export class OpenRouterProvider implements LLMProvider {
  readonly name = "OpenRouter";

  constructor(
    private readonly apiKey: string,
    private readonly model: string
  ) {}

  async generate(systemPrompt: string, userPrompt: string): Promise<string> {
    core.info(`🤖 Calling OpenRouter (${this.model})...`);

    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ];

    const body = {
      model: this.model,
      messages,
      max_tokens: 4096,
      temperature: 0.3,
    };

    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
        "HTTP-Referer": "https://github.com/ArslanYM/mergedoc",
        "X-Title": "MergeDoc AI",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `OpenRouter API error (${response.status}): ${errorText}`
      );
    }

    const data = (await response.json()) as OpenRouterResponse;

    if (!data.choices || data.choices.length === 0) {
      throw new Error("OpenRouter returned no choices in the response.");
    }

    const text = data.choices[0].message.content;

    if (data.model) {
      core.info(`   Routed to model: ${data.model}`);
    }

    if (data.usage) {
      core.info(
        `   Tokens used: ${data.usage.prompt_tokens} in / ${data.usage.completion_tokens} out`
      );
    }

    return text.trim();
  }
}
