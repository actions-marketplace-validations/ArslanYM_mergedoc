import * as core from "@actions/core";
import type { LLMProvider } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// Anthropic (Claude) — Raw fetch implementation
// ─────────────────────────────────────────────────────────────────────────────

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_API_VERSION = "2023-06-01";

interface AnthropicMessage {
  role: "user" | "assistant";
  content: string;
}

interface AnthropicResponse {
  id: string;
  content: Array<{ type: "text"; text: string }>;
  stop_reason: string;
  usage: { input_tokens: number; output_tokens: number };
}

export class AnthropicProvider implements LLMProvider {
  readonly name = "Anthropic";

  constructor(
    private readonly apiKey: string,
    private readonly model: string
  ) {}

  async generate(systemPrompt: string, userPrompt: string): Promise<string> {
    core.info(`🤖 Calling Anthropic (${this.model})...`);

    const messages: AnthropicMessage[] = [
      { role: "user", content: userPrompt },
    ];

    const body = {
      model: this.model,
      max_tokens: 4096,
      system: systemPrompt,
      messages,
    };

    const response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": ANTHROPIC_API_VERSION,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Anthropic API error (${response.status}): ${errorText}`
      );
    }

    const data = (await response.json()) as AnthropicResponse;

    const text = data.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n");

    core.info(
      `   Tokens used: ${data.usage.input_tokens} in / ${data.usage.output_tokens} out`
    );

    return text.trim();
  }
}
