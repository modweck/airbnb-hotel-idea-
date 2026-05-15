<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Collaboration rules

This is a two-person repo (`ikkidev` + `modweck`). Agents working in
this repo **must** follow these rules:

- **Never commit or push directly to `main`.** Always create a feature
  branch (`feat/`, `fix/`, `chore/`, or `docs/` prefix) and open a PR.
- **One PR per logical change**, merged exactly once via squash-merge.
- **Always link the related issue** in the PR body (`Closes #N`).
- **Match the existing style** — don't reformat unrelated code.
- **Run locally before pushing**: `npm run lint`, `npx tsc --noEmit`,
  `npm test`, `npm run build`. CI runs the same four checks; all must
  pass before the PR can merge.
- **Commit subject is single-line, imperative, ≤72 chars.** No body.
  Context belongs in the PR description.
- **Don't add `Co-authored-by: Copilot` or similar trailers.**
- **Never commit secrets** — `.env.local`, API keys, tokens. They are
  gitignored; keep it that way.

See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for the full workflow
including the recovery recipes ("oops I committed to main", merge
conflict survival, etc.) and the GitHub-Project-based sprint tracking.