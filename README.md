<div align="center">

# 📝 MergeDoc

**AI-powered release documentation for GitHub.**

Automatically generates categorized, beautifully formatted changelog entries from merged PR diffs — powered by Gemini *(free)*, Claude, or GPT.

[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)
[![GitHub Action](https://img.shields.io/badge/GitHub-Action-2088FF?logo=github-actions&logoColor=white)](action.yml)

</div>

---

## How It Works

```
PR Merged → CI Passes → MergeDoc Triggers → LLM Analyzes Diff → CHANGELOG.md Updated
```

MergeDoc runs **after** your CI pipeline succeeds on a merge to `main`. It:

1. 🔍 **Discovers** the merged PR from the merge commit SHA
2. 📦 **Fetches & filters** the diff (excludes lockfiles, binaries, generated code)
3. 📐 **Chunks** large diffs to fit within the LLM context window
4. 🤖 **Generates** categorized release notes (Features, Fixes, Chores)
5. 📝 **Updates** your `CHANGELOG.md` with a beautifully formatted entry
6. 🚀 **Commits & pushes** the changelog back to `main`

---

## Quick Start

### 1. Add your LLM API key as a repository secret

Go to **Settings → Secrets and variables → Actions → New repository secret**:
- Name: `LLM_API_KEY`
- Value: Your API key

> **🆓 Free option:** Get a Gemini API key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey) — no credit card required. Gemini 2.0 Flash is completely free with generous rate limits (15 req/min, 1M tokens/min).

### 2. Ensure your CI workflow is named "CI"

Your existing CI workflow file (e.g., `.github/workflows/ci.yml`) must have:

```yaml
name: "CI"   # ← MergeDoc triggers on this exact name
```

### 3. Create the release notes workflow

Create `.github/workflows/release-notes.yml`:

```yaml
name: "📝 Release Notes"

on:
  workflow_run:
    workflows: ["CI"]
    types: [completed]
    branches: [main]

jobs:
  generate-release-notes:
    name: Generate Release Notes
    runs-on: ubuntu-latest
    if: >-
      github.event.workflow_run.conclusion == 'success' &&
      github.event.workflow_run.event == 'push'
    permissions:
      contents: write
      pull-requests: read

    steps:
      - uses: actions/checkout@v4
        with:
          ref: main
          fetch-depth: 0

      - uses: ArslanYM/mergedoc@v1
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          llm_api_key: ${{ secrets.LLM_API_KEY }}
          # Defaults to Gemini (free). For paid providers:
          # llm_provider: "anthropic"
          # llm_provider: "openai"
```

### 4. Merge a PR and watch it work! 🎉

---

## Configuration

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `github_token` | ✅ | — | GitHub token with `contents: write` and `pull-requests: read` |
| `llm_api_key` | ✅ | — | API key for the LLM provider |
| `llm_provider` | ❌ | `gemini` | `gemini` *(free)*, `anthropic`, or `openai` |
| `model_name` | ❌ | Auto | `gemini-2.0-flash` (Gemini), `claude-sonnet-4-20250514` (Anthropic), `gpt-4o` (OpenAI) |
| `max_diff_tokens` | ❌ | `80000` | Max token budget for diff context |
| `changelog_path` | ❌ | `CHANGELOG.md` | Path to your changelog file |
| `excluded_files` | ❌ | See below | Comma-separated glob patterns to exclude |

### Default Excluded Files

The following are always excluded from analysis:
- **Lockfiles**: `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`
- **Generated**: `*.generated.*`, `*.min.js`, `*.min.css`
- **Binary/Media**: Images, fonts, videos, PDFs, WASM
- **Build Output**: `dist/**`

You can add additional patterns via the `excluded_files` input.

---

## Outputs

| Output | Description |
|--------|-------------|
| `release_notes` | The generated release notes markdown |
| `changelog_updated` | `true` if the changelog was modified |
| `files_analyzed` | Number of files sent to the LLM |

### Using Outputs

```yaml
- uses: ArslanYM/mergedoc@v1
  id: mergedoc
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
    llm_api_key: ${{ secrets.LLM_API_KEY }}

- name: Post to Slack
  if: steps.mergedoc.outputs.changelog_updated == 'true'
  run: echo "${{ steps.mergedoc.outputs.release_notes }}"
```

---

## Changelog Output Format

MergeDoc generates entries following [Keep a Changelog](https://keepachangelog.com/) conventions:

```markdown
## [2026-04-11] — PR #42: Add user authentication

> Authored by [@developer](https://github.com/developer)

### 🚀 Features
- Add OAuth2 login flow with Google and GitHub providers (#42)
- Implement session persistence using HTTP-only cookies (#42)

### 🐛 Bug Fixes
- Fix race condition in token refresh logic that caused intermittent 401s (#42)

### 🔧 Chores & Maintenance
- Upgrade `jsonwebtoken` from 8.x to 9.x (#42)
- Add integration tests for the auth middleware (#42)

---
```

---

## How the Trigger Works

MergeDoc uses GitHub's `workflow_run` event for reliable post-CI triggering:

```
┌─────────────────┐     ┌──────────────┐     ┌───────────────────┐
│  PR Merged      │────▶│  CI Workflow  │────▶│  MergeDoc         │
│  (push to main) │     │  (build/test) │     │  (workflow_run)   │
└─────────────────┘     └──────────────┘     └───────────────────┘
                              │                       │
                         Must pass ✅            Only runs if
                                              conclusion == 'success'
```

**Why not `pull_request: closed`?** That event fires immediately when a PR is merged — before CI has finished running. If CI fails, you'd still generate release notes for broken code.

**Why `workflow_run`?** It waits for your CI workflow to complete and lets you check the conclusion before proceeding. This guarantees release notes are only generated for green builds.

> **Note:** The `[skip ci]` tag in MergeDoc's commit message prevents the CI → MergeDoc → CI → MergeDoc infinite loop.

---

## Large Diff Handling

MergeDoc intelligently handles large PRs that exceed the LLM context window:

1. **Filter** — Excludes lockfiles, binaries, and generated code
2. **Rank** — Prioritizes source code files over configs and docs
3. **Pack** — Greedily packs files into token-budget chunks
4. **Map-Reduce** — If multiple chunks are needed:
   - Each chunk is independently summarized
   - Summaries are synthesized into the final release notes

This ensures even 100+ file PRs produce coherent, complete release notes.

---

## Permissions

### Required Workflow Permissions

```yaml
permissions:
  contents: write        # Push the changelog commit
  pull-requests: read    # Read PR metadata and diffs
```

### Repository Settings

Go to **Settings → Actions → General → Workflow permissions** and ensure **"Read and write permissions"** is selected.

### Branch Protection

If `main` has branch protection rules, you must either:
1. Allow `github-actions[bot]` to bypass protection rules, or
2. Use a Personal Access Token (PAT) instead of `GITHUB_TOKEN`

---

## Development

```bash
# Install dependencies
npm install

# Type-check
npm run lint

# Build (development — with source maps)
npm run build

# Build (production — minified)
npm run package

# Run tests
npm test
```

### Project Structure

```
src/
├── index.ts                  # Entry point — orchestrator
├── config.ts                 # Input parsing & validation
├── github/
│   ├── client.ts             # Octokit client factory
│   ├── pr.ts                 # PR metadata & diff fetching
│   └── commit.ts             # Git commit & push logic
├── llm/
│   ├── types.ts              # Provider-agnostic interfaces
│   ├── provider.ts           # Provider factory
│   ├── gemini.ts             # Google Gemini provider (free tier)
│   ├── anthropic.ts          # Anthropic (Claude) provider
│   ├── openai.ts             # OpenAI (GPT) provider
│   └── prompt.ts             # System & user prompt templates
├── diff/
│   ├── chunker.ts            # Token-safe diff chunking
│   ├── filter.ts             # File exclusion & ranking
│   └── tokenizer.ts          # Lightweight token estimator
└── changelog/
    ├── formatter.ts          # Markdown formatting
    └── writer.ts             # File read/write/merge logic
```

---

## License

[MIT](LICENSE) © Arsalan Yaqoob Malik
