You are writing a high-level summary for the PR description.

Repository: ${{ github.repository }}
PR number:  ${{ github.event.pull_request.number }}

Consider ONLY the changes in this PR.

You may use commands such as:
  git diff --stat ${{ github.event.pull_request.base.sha }}...${{ github.event.pull_request.head.sha }}
  git diff ${{ github.event.pull_request.base.sha }}...${{ github.event.pull_request.head.sha }}

Produce markdown that can be pasted into the PR description under a section "## Summary".

Format:
- A single-paragraph overview (2–4 sentences)
- A bullet list:
  - **Changes** — key user-facing and internal changes
  - **Impact** — behavior changes, migrations, risks
  - **Testing** — what is tested or should be tested

Avoid mentioning that you are an AI or that you are Codex.

Current PR title and body:
----
${{ github.event.pull_request.title }}
${{ github.event.pull_request.body }}
