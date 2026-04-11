import type { LLMProvider } from "./types";
export declare class GeminiProvider implements LLMProvider {
    private readonly apiKey;
    private readonly model;
    readonly name = "Google Gemini";
    constructor(apiKey: string, model: string);
    generate(systemPrompt: string, userPrompt: string): Promise<string>;
}
//# sourceMappingURL=gemini.d.ts.map