import type { LLMProvider } from "./types";
export declare class OpenAIProvider implements LLMProvider {
    private readonly apiKey;
    private readonly model;
    readonly name = "OpenAI";
    constructor(apiKey: string, model: string);
    generate(systemPrompt: string, userPrompt: string): Promise<string>;
}
//# sourceMappingURL=openai.d.ts.map