<!-- BEGIN:expo-agent-rules -->
# Universal Expo Router codebase (iOS / Android / web)

One tree, three targets — `app/` is Expo Router file-based routing with
`web.output: "server"`. API routes live at `app/**/+api.ts`. UI is
React Native + react-native-web, styled with **NativeWind 4 on Tailwind
v3** (do NOT bump to Tailwind v4 until NativeWind 5 ships). Web deploys
to Netlify via `expo-server/adapter/netlify`. Native runs in Expo Go
and EAS Build.

When working on UI, consult `node_modules/expo-router/build/**/*.d.ts`
for routing typings and <https://nativewind.dev> for styling. There is
NO Next.js in this repo anymore — `src/app/`, `next.config.ts`, `next`
deps were all deleted in Phase 11.

**`src/server/**` is a hard ESLint boundary** — only `app/api/**+api.ts`
and other `src/server/**` modules may import from it (type-only imports
are allowed elsewhere via `import type`).
<!-- END:expo-agent-rules -->

# Collaboration rules

This is a two-person repo (`ikkidev` + `modweck`). Agents working in
this repo **must** follow these rules:

- **Never commit or push directly to `main`.** Always create a feature
  branch (`feat/`, `fix/`, `chore/`, or `docs/` prefix) and open a PR.
- **One PR per logical change**, merged exactly once via squash-merge.
- **Always link the related issue** in the PR body (`Closes #N`).
- **Match the existing style** — don't reformat unrelated code.
- **Run locally before pushing**: `npm run lint`, `npx tsc --noEmit`,
  `npm test`, `npm run build:web`. CI runs the same four checks; all must
  pass before the PR can merge.
- **Commit subject is single-line, imperative, ≤72 chars.** No body.
  Context belongs in the PR description.
- **Don't add `Co-authored-by: Copilot` or similar trailers.**
- **Never commit secrets** — `.env.local`, API keys, tokens. They are
  gitignored; keep it that way.

See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for the full workflow
including the recovery recipes ("oops I committed to main", merge
conflict survival, etc.) and the GitHub-Project-based sprint tracking.