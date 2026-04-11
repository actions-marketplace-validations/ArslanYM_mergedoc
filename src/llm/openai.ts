import * as core from "@actions/core";
import type { LLMProvider } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// OpenAI (GPT) — Raw fetch implementation
// ─────────────────────────────────────────────────────────────────────────────

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OpenAIResponse {
  id: string;
  choices: Array<{
    message: { role: string; content: string };
    finish_reason: string;
  }>;
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

export class OpenAIProvider implements LLMProvider {
  readonly name = "OpenAI";

  constructor(
    private readonly apiKey: string,
    private readonly model: string
  ) {}

  async generate(systemPrompt: string, userPrompt: string): Promise<string> {
    core.info(`🤖 Calling OpenAI (${this.model})...`);

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

    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `OpenAI API error (${response.status}): ${errorText}`
      );
    }

    const data = (await response.json()) as OpenAIResponse;

    if (!data.choices || data.choices.length === 0) {
      throw new Error("OpenAI returned no choices in the response.");
    }

    const text = data.choices[0].message.content;

    core.info(
      `   Tokens used: ${data.usage.prompt_tokens} in / ${data.usage.completion_tokens} out`
    );

    return text.trim();
  }
}
