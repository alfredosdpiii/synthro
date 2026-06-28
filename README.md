# Synthro

Learn how great engineers think by turning GitHub contribution traces into interactive lessons.

Synthro studies a GitHub user, a contributor inside a repo, or a single PR, then produces a local HTML lesson with roadmaps, diagrams, worked examples, quizzes, code editors, review simulators, and mastery loops. It is built for visual and kinesthetic learning, not passive summaries.

## Why this exists

Most contribution advice is generic. Synthro teaches from evidence:

- What problems an engineer repeatedly solves.
- How they shape PRs, tests, reviews, and tradeoffs.
- What prerequisites a learner needs before contributing similarly.
- Which practice reps will move the learner closer to that style.

The artifact is HTML so it can be interactive. Lavish gives the human-agent review loop. MCP gives Droid, Pi, and other coding agents a shared way to read answers, progress, and synthesize follow-up lessons.

## Quickstart

```bash
npx -y synthro sample --open
```

Open with Lavish:

```bash
npx -y lavish-axi dist/synthro-sample.html
```

Register the local MCP server with Droid:

```bash
droid mcp add synthro "npx -y --package synthro synthro-mcp"
```

## Source modes

```bash
# Learn from a public GitHub user
npx -y synthro github-user mattpocock --out dist/matt.html --open

# Learn how a user contributes inside one repo
npx -y synthro repo-user kunchenguid/lavish-axi bryanwieger --out dist/repo-user.html --open

# Learn from one PR
npx -y synthro pr https://github.com/kunchenguid/lavish-axi/pull/96 --out dist/pr.html --open
```

`GITHUB_TOKEN` is optional for public data, but recommended to avoid low unauthenticated rate limits.

## Interaction gallery

| Interaction | What it trains |
| --- | --- |
| Diagnostic quiz | Finds missing prerequisites before the lesson starts. |
| Worked example lens | Shows the expert move with evidence anchors, solution steps, subgoals, and transfer prompts. |
| Faded example | Removes support gradually until the learner can finish the move. |
| Code editor blanks | Uses syntax-highlighted CodeMirror exercises with judged answers. |
| Parsons reorder | Trains ordering of code, tests, review steps, and release moves. |
| Trace-the-flow | Makes learners predict state, data, or control flow before reveal. |
| Predict failure | Builds debugging instinct from tests, CI, and diff evidence. |
| Review simulator | Practices high-signal review comments and author responses. |
| Contrast cards | Uses interleaving to separate confusable engineering patterns. |
| Transfer mission | Asks the learner to plan a similar contribution in a new context. |
| Spaced review | Revisits weak concepts later until mastery is visible. |

## Learning science

Synthro’s lesson planner uses:

- Active recall and distributed practice, from Dunlosky et al. 2013 and Agarwal et al. 2021.
- Spacing and successive relearning, from Carpenter, Pan, and Butler 2022.
- Worked examples, solution-step learning, and fading, from Atkinson et al. 2000, Hoogerheide et al. 2023, Muldner et al. 2023, and Weinman et al. 2021.
- Generation and self-explanation, from Bertsch et al. 2007, Bisra et al. 2018, and Vihavainen et al. 2015.
- Interleaving for confusable patterns, from Brunmair and Richter 2019.
- Transfer-focused testing, from Pan and Rickard 2018.
- Cognitive-load-aware programming education, from Berssanette and de Francisco 2021.

## Lavish and MCP

Lavish handles the live artifact loop:

- Open the HTML lesson locally.
- Annotate confusing text, code, diagrams, or UI elements.
- Queue feedback to the active agent.
- Surface layout warnings from the real browser render.

The Synthro MCP server handles cross-agent state:

- `synthro_list_lessons`
- `synthro_get_lesson_state`
- `synthro_record_answer`
- `synthro_synthesize_feedback`
- `synthro_next_review_items`

Use both together: Lavish for the human learning surface, MCP for durable answer/progress access across Droid, Pi, or any MCP-capable coding agent.

## Privacy and safety

- Read-only GitHub access.
- Local-first artifacts and progress store.
- Secret-looking values are redacted before rendering.
- Synthro does not execute analyzed repo code.
- Learning claims are anchored to evidence or labeled as inference.
- Contribution counts are not treated as proof of skill.

## Project shape

```text
.factory/skills/synthro/   Factory skill and teaching protocol
scripts/                   CLI, editor bundling, smoke checks
src/collect/               GitHub and local repo collectors
src/analyze/               Evidence and concept extraction
src/plan/                  Interaction planner
src/render/                HTML and interaction runtime renderer
src/judge/                 Deterministic judges and rubric feedback
src/store/                 Local lesson/progress store
src/mcp/                   MCP stdio server
test/                      Node test fixtures
```
