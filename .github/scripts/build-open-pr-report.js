// .github/scripts/build-open-pr-report.js

// Repositories we care about
const TARGET_REPOSITORIES = [
  "trojan-order",
  "trojan-hypersource",
  "go-pay",
  "gotils",
  "safepay-raast",
  "safepay-notify",
  "trojan-user",
  "trojan-client",
  "trojan-auth",
  "safepay-dashboard",
  "safepay-embedded",
  "safepay-atoms",
  "safepay-drops",
  "safepay-skynet",
  "safepay-vasp",
  "librarian",
  "safepay-reporter",
];

module.exports = async ({ github, core }) => {
  const org = process.env.ORG_NAME;
  const repo = process.env.REPO_NAME;

  if (!org) {
    core.setFailed("ORG_NAME is not set");
    return;
  }
  if (!repo) {
    core.setFailed("REPO_NAME is not set");
    return;
  }
  if (!TARGET_REPOSITORIES.includes(repo)) {
    core.warning(
      `REPO_NAME=${repo} is not in TARGET_REPOSITORIES – skipping report generation.`,
    );
    core.exportVariable("HAS_PRS", "false");
    return;
  }

  core.info(`Building open PR report for ${org}/${repo} ...`);

  const prs = await github.paginate(github.rest.pulls.list, {
    owner: org,
    repo,
    state: "open",
    per_page: 100,
  });

  if (!prs.length) {
    core.info(`No open PRs for ${org}/${repo}`);
    core.exportVariable("HAS_PRS", "false");
    core.exportVariable(
      "PR_REPORT",
      `No open pull requests in \`${org}/${repo}\`.`,
    );
    return;
  }

  const lines = [];
  lines.push(`*Repository:* \`${org}/${repo}\``);
  lines.push("");
  lines.push("*Open pull requests:*");
  lines.push("");

  for (const pr of prs) {
    const author = pr.user?.login ?? "unknown";
    const cleanTitle = pr.title.replace(/\s+/g, " ").trim();
    // Bullet with clickable link: <url|#123 – title> — author
    lines.push(`• <${pr.html_url}|#${pr.number} – ${cleanTitle}> — ${author}`);
  }

  const report = lines.join("\n");

  core.exportVariable("PR_REPORT", report);
  core.exportVariable("HAS_PRS", "true");
  core.info(`PR report generated for ${org}/${repo}`);
};
