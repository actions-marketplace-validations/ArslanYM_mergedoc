## 🤖 Auto-Detect LLM Provider from API Key

### Problem
Users who set an OpenAI or Anthropic API key but forget to explicitly set `llm_provider` hit a confusing error — their key gets sent to Google Gemini, which rejects it with `API_KEY_INVALID`.

### Solution
The `llm_provider` input now defaults to `"auto"` instead of `"gemini"`. When set to auto, the Action sniffs the API key prefix to detect the correct provider:

| Key prefix | Detected provider |
|---|---|
| `sk-ant-` | **Anthropic** (Claude) |
| `sk-` | **OpenAI** (GPT) |
| Anything else | **Gemini** (free) |

### What Changed
- **`src/config.ts`**: Added `detectProvider()` function and `"auto"` as a valid provider value
- **`action.yml`**: Changed default `llm_provider` from `"gemini"` to `"auto"`, updated description
- **`dist/index.js`**: Rebuilt production bundle

### Result
Users can now just set their API key and the Action works — zero config needed beyond the key itself.
