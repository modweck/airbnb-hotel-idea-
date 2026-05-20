<!-- BEGIN:expo-agent-rules -->
# Universal Expo Router codebase (iOS / Android / web)

One tree, three targets -- `app/` is Expo Router file-based routing with
`web.output: "server"`. API routes live at `app/**/+api.ts`. UI is
React Native + react-native-web, styled with **NativeWind 4 on Tailwind
v3** (do NOT bump to Tailwind v4 until NativeWind 5 ships). Web deploys
to Netlify via `expo-server/adapter/netlify`. Native runs in Expo Go
and EAS Build.

When working on UI, consult `node_modules/expo-router/build/**/*.d.ts`
for routing typings and <https://nativewind.dev> for styling. There is
NO Next.js in this repo anymore -- `src/app/`, `next.config.ts`, `next`
deps were all deleted in Phase 11.

**`src/server/**` is a hard ESLint boundary** -- only `app/api/**+api.ts`
and other `src/server/**` modules may import from it (type-only imports
are allowed elsewhere via `import type`).
<!-- END:expo-agent-rules -->

# Collaboration rules

This is a two-person repo (`ikkidev` + `modweck`), worked on from
several workstations + agents. Agents working in this repo **must**
follow these rules:

## MUST: Every PR links its issue

**Every PR body MUST contain `Closes #N` (or `Fixes #N` / `Resolves #N`)
on its own line.** This is what links the PR to the issue and to the
sprint-board card. CI enforces it (`pr-link-check` job) -- PRs without a
linkage will fail and cannot merge.

If the work genuinely has no tracking issue:
1. **Prefer:** create the issue first (one-liner is fine), then link it.
2. **Fallback:** add the `no-issue` label to the PR. Only acceptable for
   repo-meta changes (README typo, CI tweak, etc.). Never for product code.

**Why this is non-negotiable:** without `Closes #N` the sprint board
card stays unlinked, reviewers can't see the spec, and a future agent
on a different workstation has no way to reconstruct what the PR was for.

## MUST: No emojis or exotic unicode in repo artifacts

**AI agents working in this repo must write plain ASCII** in every
artifact that lands in the repo or in GitHub metadata:

- Source code, scripts, configs, JSON/YAML, SQL.
- Commit messages.
- PR titles and bodies.
- Issue titles and bodies.
- In-repo docs (`docs/**`, `README.md`, `AGENTS.md`, `CONTRIBUTING.md`).

Banned: emojis, smart quotes (`“ ” ‘ ’`), en/em dashes (`– —`), ellipsis
char (`…`), non-breaking spaces, box-drawing, status glyphs
(`✓ ✗ ⚠ ℹ`), arrows (`→ ←`).

Use the ASCII equivalent: straight quotes `" '`, two hyphens `--`, three
dots `...`, words like `OK`, `ERROR:`, `WARNING:`, `NOTE:`, `->`, `<-`.

**Why:** these characters render as tofu on hosts without the right
fonts, cause `UnicodeEncodeError` in CI when stdout is ASCII-only, and
produce diff noise when an agent silently swaps `"` for `“` mid-edit.

Chat output that an agent shows directly to a human in their terminal
is unaffected by this rule -- only artifacts that get committed,
pushed, or posted on GitHub.

## Other rules

- **Never commit or push directly to `main`.** Always create a feature
  branch (`feat/`, `fix/`, `chore/`, or `docs/` prefix) and open a PR.
- **One PR per logical change**, merged exactly once via squash-merge.
- **Match the existing style** -- don't reformat unrelated code.
- **Run locally before pushing**: `npm run lint`, `npx tsc --noEmit`,
  `npm test`, `npm run build:web`. CI runs the same four checks; all must
  pass before the PR can merge.
- **Commit subject is single-line, imperative, <=72 chars.** No body.
  Context belongs in the PR description.
- **Don't add `Co-authored-by: Copilot` or similar trailers.**
- **Never commit secrets** -- `.env.local`, API keys, tokens. They are
  gitignored; keep it that way.

See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for the full workflow
including the recovery recipes ("oops I committed to main", merge
conflict survival, etc.) and the GitHub-Project-based sprint tracking.