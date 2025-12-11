// .github/scripts/build-open-pr-report.js

// Repositories we care about (just names; org is in ORG_NAME)
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
  if (!org) {
    core.setFailed("ORG_NAME is not set");
    return;
  }

  core.info(`Building open PR report for org: ${org}`);

  // Helper to pad strings for ASCII columns
  const pad = (str, len) => {
    if (!str) str = "";
    if (str.length > len) return str.slice(0, len - 1) + "…";
    return str + " ".repeat(len - str.length);
  };

  const lines = [];

  // We let the Slack config handle the main heading / title.
  // Here we just output repo sections.
  for (const repoName of TARGET_REPOSITORIES) {
    core.info(`Fetching open PRs for ${org}/${repoName} ...`);

    const prs = await github.paginate(github.rest.pulls.list, {
      owner: org,
      repo: repoName,
      state: "open",
      per_page: 100,
    });

    if (!prs.length) {
      // Skip repos with no open PRs to keep the message shorter.
      continue;
    }

    const repoFull = `${org}/${repoName}`;
    lines.push(`*Repository:* ${repoFull}`);

    // ASCII table inside a code block so it lines up in Slack
    lines.push("```");
    lines.push(
      "Repository             | Pull Request                      | Author",
    );
    lines.push(
      "-----------------------+-----------------------------------+-----------------",
    );

    for (const pr of prs) {
      const repoCol = pad(repoName, 23);
      const linkCol = pad(`<${pr.html_url}|#${pr.number}>`, 35); // Slack link
      const author = pr.user?.login ?? "unknown";
      const authorCol = pad(author, 17);
      lines.push(`${repoCol} | ${linkCol} | ${authorCol}`);
    }

    lines.push("```");
    lines.push(""); // blank line between repos
  }

  if (!lines.length) {
    const msg = `No open pull requests found in the monitored repositories for ${org}.`;
    core.exportVariable("PR_REPORT", msg);
    core.info("No open PRs in target repositories.");
    return;
  }

  const report = lines.join("\n");

  // NOTE: Slack’s hard limit per text block is ~3–4k characters.
  // With a limited repo set and skipping empty repos, this should
  // stay under that in practice. If it ever grows too long, you
  // can split by repo and send multiple messages.
  core.exportVariable("PR_REPORT", report);
  core.info("PR report generated and stored in env.PR_REPORT");
};
