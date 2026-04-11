import type { LLMProvider } from "./types";
export declare class AnthropicProvider implements LLMProvider {
    private readonly apiKey;
    private readonly model;
    readonly name = "Anthropic";
    constructor(apiKey: string, model: string);
    generate(systemPrompt: string, userPrompt: string): Promise<string>;
}
//# sourceMappingURL=anthropic.d.ts.map