import * as core from "@actions/core";
import type { LLMProvider } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// Google Gemini — Raw fetch implementation (FREE TIER)
// ─────────────────────────────────────────────────────────────────────────────
//
// Gemini 2.0 Flash is completely free:
//   - 15 requests/minute, 1 million tokens/minute, 1500 requests/day
//   - No credit card required — just grab a key from https://aistudio.google.com/apikey
//

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

interface GeminiContent {
  role: "user" | "model";
  parts: Array<{ text: string }>;
}

interface GeminiResponse {
  candidates: Array<{
    content: { parts: Array<{ text: string }>; role: string };
    finishReason: string;
  }>;
  usageMetadata: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

export class GeminiProvider implements LLMProvider {
  readonly name = "Google Gemini";

  constructor(
    private readonly apiKey: string,
    private readonly model: string
  ) {}

  async generate(systemPrompt: string, userPrompt: string): Promise<string> {
    core.info(`🤖 Calling Google Gemini (${this.model})...`);

    const url = `${GEMINI_API_BASE}/${this.model}:generateContent?key=${this.apiKey}`;

    const contents: GeminiContent[] = [
      { role: "user", parts: [{ text: userPrompt }] },
    ];

    const body = {
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      contents,
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 4096,
      },
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Gemini API error (${response.status}): ${errorText}`
      );
    }

    const data = (await response.json()) as GeminiResponse;

    if (!data.candidates || data.candidates.length === 0) {
      throw new Error("Gemini returned no candidates in the response.");
    }

    const text = data.candidates[0].content.parts
      .map((part) => part.text)
      .join("\n");

    if (data.usageMetadata) {
      core.info(
        `   Tokens used: ${data.usageMetadata.promptTokenCount} in / ${data.usageMetadata.candidatesTokenCount} out`
      );
    }

    return text.trim();
  }
}
