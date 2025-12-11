// .github/scripts/build-open-pr-report.js

module.exports = async ({ github, core }) => {
  const org = process.env.ORG_NAME;
  if (!org) {
    core.setFailed("ORG_NAME is not set");
    return;
  }

  core.info(`Building open PR report for org: ${org}`);

  // 1) Get all open PRs across the org via the Search API
  const allPrs = await github.paginate(
    github.rest.search.issuesAndPullRequests,
    {
      q: `is:open is:pr org:${org}`,
      per_page: 100,
    },
  );

  if (!allPrs.length) {
    const msg = `*Daily Open PRs for \`${org}\`*\n\n_No open pull requests._`;
    core.exportVariable("PR_REPORT", msg);
    core.info("No open PRs found.");
    return;
  }

  // 2) Group PRs by repository full name
  const groups = {};
  for (const pr of allPrs) {
    // repository_url looks like: https://api.github.com/repos/org/repo
    const repoFull = pr.repository_url.split("/").slice(-2).join("/");
    if (!groups[repoFull]) groups[repoFull] = [];
    groups[repoFull].push({
      title: pr.title,
      number: pr.number,
      url: pr.html_url,
      author: pr.user?.login ?? "unknown",
    });
  }

  // Helper to pad strings for ASCII columns
  const pad = (str, len) => {
    if (!str) str = "";
    if (str.length > len) return str.slice(0, len - 1) + "…";
    return str + " ".repeat(len - str.length);
  };

  const sortedRepos = Object.keys(groups).sort((a, b) => a.localeCompare(b));

  const lines = [];
  lines.push(`*Daily Open PRs for \`${org}\`*`);
  lines.push("");

  for (const repo of sortedRepos) {
    const prs = groups[repo];

    lines.push(`*Repository:* \`${repo}\``);

    // ASCII table inside a code block so it lines up in Slack
    lines.push("```");
    lines.push(
      "Repository                   | Pull Request                 | Author",
    );
    lines.push(
      "-----------------------------+------------------------------+-----------------",
    );

    for (const pr of prs) {
      const repoCol = pad(repo, 27);
      const linkCol = pad(`<${pr.url}|#${pr.number}>`, 30); // Slack link
      const authorCol = pad(pr.author, 17);
      lines.push(`${repoCol} | ${linkCol} | ${authorCol}`);
    }

    lines.push("```");
    lines.push(""); // blank line between repos
  }

  const report = lines.join("\n");

  // Expose to subsequent steps (act10ns/slack) via env var
  core.exportVariable("PR_REPORT", report);
  core.info("PR report generated and stored in env.PR_REPORT");
};
