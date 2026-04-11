// ─────────────────────────────────────────────────────────────────────────────
// Prompt Templates
// ─────────────────────────────────────────────────────────────────────────────

/**
 * System prompt that defines the LLM's role and output format.
 */
export const SYSTEM_PROMPT = `You are MergeDoc, an expert technical writer that generates release notes from code diffs.

## Your Task
Analyze the provided pull request diff and produce clean, categorized release notes.

## Output Format
Return ONLY the categorized markdown below — no preamble, no commentary, no wrapping fences.

### 🚀 Features
- Description of new feature in imperative mood (#PR)

### 🐛 Bug Fixes
- Description of fix in imperative mood (#PR)

### 🔧 Chores & Maintenance
- Description of chore in imperative mood (#PR)

## Rules
1. **Imperative mood**: Write "Add dark mode" not "Added dark mode" or "Adds dark mode".
2. **User-facing language**: Describe WHAT changed and WHY it matters, not HOW (no file paths, no function names).
3. **Categorization**:
   - 🚀 Features: New capabilities, new APIs, new UI elements, new integrations.
   - 🐛 Bug Fixes: Corrections to existing behavior, error handling improvements, crash fixes.
   - 🔧 Chores: Dependency updates, refactors, test additions, CI changes, documentation, config changes.
4. **Granularity**: Group related changes into a single bullet. Don't list every file — summarize the intent.
5. **Omit trivial changes**: Skip whitespace-only changes, auto-generated code, and formatting-only diffs.
6. **Empty categories**: If a category has no entries, omit the entire section header.
7. **PR reference**: End each bullet with the PR number in parentheses, e.g., (#42).
8. **Conciseness**: Each bullet should be one sentence, max two.`;

/**
 * Builds the user prompt with PR context and diff content.
 */
export function buildUserPrompt(
  prNumber: number,
  prTitle: string,
  prAuthor: string,
  diffContent: string
): string {
  return `## Pull Request Context
- **PR #${prNumber}**: ${prTitle}
- **Author**: @${prAuthor}

## Diff
\`\`\`diff
${diffContent}
\`\`\`

Generate the release notes for this PR now.`;
}

/**
 * Builds the user prompt for the "map" phase of map-reduce.
 * Used when the diff is too large to fit in a single LLM call.
 */
export function buildChunkSummaryPrompt(
  prNumber: number,
  prTitle: string,
  chunkIndex: number,
  totalChunks: number,
  diffChunk: string
): string {
  return `## Context
This is chunk ${chunkIndex + 1} of ${totalChunks} from PR #${prNumber}: "${prTitle}".

## Diff Chunk
\`\`\`diff
${diffChunk}
\`\`\`

Summarize the changes in this chunk as concise bullet points. Focus on WHAT changed and WHY.
Do NOT format as final release notes — just provide raw bullet summaries.`;
}

/**
 * Builds the "reduce" prompt that combines chunk summaries into final notes.
 */
export function buildReducePrompt(
  prNumber: number,
  prTitle: string,
  prAuthor: string,
  chunkSummaries: string[]
): string {
  const combined = chunkSummaries
    .map((s, i) => `### Chunk ${i + 1} Summary\n${s}`)
    .join("\n\n");

  return `## Pull Request Context
- **PR #${prNumber}**: ${prTitle}
- **Author**: @${prAuthor}

## Change Summaries (from ${chunkSummaries.length} diff chunks)
${combined}

Using the summaries above, generate the final categorized release notes.
De-duplicate and consolidate related items. Follow the output format exactly.`;
}
