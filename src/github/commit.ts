import * as core from "@actions/core";
import * as exec from "@actions/exec";

// ─────────────────────────────────────────────────────────────────────────────
// Git Commit & Push
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Commits a modified file and pushes to the specified branch.
 *
 * Uses the official github-actions[bot] identity so the commit shows
 * as authored by the GitHub Actions bot in the UI.
 *
 * @returns true if a commit was made, false if there were no changes.
 */
export async function commitAndPush(
  filePath: string,
  prNumber: number,
  branch: string = "main"
): Promise<boolean> {
  core.info("📝 Configuring git identity...");

  await exec.exec("git", [
    "config",
    "--local",
    "user.email",
    "41898282+github-actions[bot]@users.noreply.github.com",
  ]);

  await exec.exec("git", [
    "config",
    "--local",
    "user.name",
    "github-actions[bot]",
  ]);

  // Stage the file
  await exec.exec("git", ["add", filePath]);

  // Check if there are staged changes
  const hasChanges = await exec
    .exec("git", ["diff", "--cached", "--quiet"], {
      ignoreReturnCode: true,
    })
    .then((exitCode) => exitCode !== 0);

  if (!hasChanges) {
    core.info("ℹ️  No changes to commit. CHANGELOG.md is already up to date.");
    return false;
  }

  // Commit with conventional commit message
  const commitMessage = `docs(changelog): auto-generate release notes for PR #${prNumber}\n\n[skip ci]`;

  await exec.exec("git", ["commit", "-m", commitMessage]);

  core.info(`🚀 Pushing to ${branch}...`);
  await exec.exec("git", ["push", "origin", `HEAD:${branch}`]);

  core.info("✅ Changelog committed and pushed successfully.");
  return true;
}
