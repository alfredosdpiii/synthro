---
name: synthro
description: Generate interactive HTML lessons from GitHub users, repo contributors, or PRs, then use Lavish and MCP for feedback and synthesis.
---

# Synthro

Use this skill when the user wants to learn from a GitHub engineer, a contributor inside a repo, or a specific PR.

## Inputs

Accept one of:

- `github-user <username>`
- `repo-user <owner/repo> <username>`
- `pr <github-pr-url-or-owner/repo/pull/number>`
- `sample`

## Workflow

1. Run the Synthro CLI for the requested source:
   - `npx -y synthro github-user <username> --open`
   - `npx -y synthro repo-user <owner/repo> <username> --open`
   - `npx -y synthro pr <url> --open`
   - `npx -y synthro sample --open`
2. If `GITHUB_TOKEN` is present, the collector uses it automatically.
3. Open the generated HTML with Lavish when the user wants a review loop:
   - `npx -y lavish-axi <path-to-html>`
4. If the user wants Droid, Pi, or another agent to read learner answers, configure the MCP server:
   - `droid mcp add synthro "npx -y --package synthro synthro-mcp"`
5. Use the teaching protocol in `teach-protocol.md` and the research notes in `research.md` when synthesizing follow-up lessons.

## Teaching contract

Every generated lesson should include:

- Evidence anchors from GitHub data.
- A prerequisite roadmap.
- A worked example from real contribution behavior.
- At least six interaction types.
- Deterministic judging where possible.
- Clear feedback, hints, and remediation.
- A transfer mission that asks the learner to contribute in the style they studied.

## Safety

- Never execute analyzed repo code.
- Redact likely secrets before rendering.
- Treat contribution metrics as weak signals, not proof of mastery.
- Label inferred engineering traits as inferences.
