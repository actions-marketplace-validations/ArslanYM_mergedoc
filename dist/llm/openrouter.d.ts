import type { LLMProvider } from "./types";
export declare class OpenRouterProvider implements LLMProvider {
    private readonly apiKey;
    private readonly model;
    readonly name = "OpenRouter";
    constructor(apiKey: string, model: string);
    generate(systemPrompt: string, userPrompt: string): Promise<string>;
}
//# sourceMappingURL=openrouter.d.ts.map