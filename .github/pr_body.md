## 🚀 MergeDoc AI Updates

This PR brings in several improvements and fixes following the initial implementation:

1. **Free Gemini Provider**: Added support for Google Gemini (`gemini-2.0-flash`) via the Generative Language API. This provides a completely free option (no credit cards required) and is now the default provider.
2. **Standalone Workflow**: Added an alternate `.github/workflows/release-notes-standalone.yml` triggered on `pull_request: closed`. This is for repositories that do not have existing CI pipelines. The README has been clearly restructured to describe both `workflow_run` and standalone options.
3. **Marketplace Naming Fix**: Renamed the Action to **MergeDoc AI** to satisfy GitHub Marketplace uniqueness rules.
4. **Action execution fixes**: Removed the workflow expression (`${{ }}`) syntax in the `action.yml` description that was causing a GitHub Actions initialization failure (unrecognized named-value 'secrets').
