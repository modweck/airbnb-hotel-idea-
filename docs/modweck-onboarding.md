# Modweck Onboarding

Hey modweck. This doc explains how we split work so we don't step on
each other's toes while ikkidev does the Expo Router port and you ramp
up on product + light coding.

The full task board lives here:
**https://github.com/users/ikkidev/projects/1**

(You'll need to be invited to the project — ask ikkidev. The board is
owned by his account, not the repo, so it won't appear under the repo's
Projects tab until you link it from your side.)

---

## The two-lane working agreement

The repo is in the middle of a big rewrite (Next.js → Expo Router). To
avoid merge hell, we split into two lanes:

| | **ikkidev lane (Expo port)** | **modweck lane (product + vibe-code)** |
|---|---|---|
| Branch base | `feat/ios-mobile-port` | `main` |
| Owns | Rewriting the app to Expo | Product, research, marketing, light utilities |
| Issues labelled | `lane:expo` | `lane:product` |

The Expo port lane is one long branch that will eventually merge to
`main` as a single big PR. Until then, ikkidev rebases it on `main`
periodically to absorb your changes.

---

## Stay out of these paths

These are mid-rewrite. Touching them will collide with the port and
cause painful merge conflicts. **Do not edit:**

- `app/**`
- `src/components/**`
- `src/app/**`
- `src/lib/**` — **existing** files (you can ADD new files here, see
  "vibe-code zone" below)
- `next.config.ts`, `netlify.toml`, `tsconfig.json`,
  `eslint.config.mjs`, `vitest.config.ts`, `postcss.config.mjs`
- `package.json` / `package-lock.json` (ask before adding deps)

If an issue you pick up needs a change in one of these, **stop and
comment on the issue** — ikkidev will either do it on the port branch
or unblock you.

---

## Where you CAN work freely

- **`docs/**`** — all research, marketing notes, brand docs, pricing
  research, user interview write-ups. Anything you write here is pure
  signal for the team and never conflicts with code.
- **`README.md`** — the README rewrite issue is yours. The "what is
  this product" framing is a sales/marketing call, which is your
  wheelhouse.
- **`src/lib/**` — NEW files only** — the "vibe-code zone". See below.

---

## The vibe-code zone (`src/lib/**`)

Every issue labelled `lane:product` with a `Vibe-code prompt:` block is
a safe coding task. The rules:

1. Create a **new** file in `src/lib/`. Never edit an existing one.
2. Pure utility — input → output, no DOM, no React, no network.
3. Also create a sibling test file (`*.test.ts`). Vitest is already
   wired up — run `npm test` to verify.
4. Copy the "Vibe-code prompt" block from the issue verbatim into your
   AI tool (Claude, Cursor, Copilot, ChatGPT, paper.design — whatever).
5. When tests pass and `npm run lint` is clean, push and open a PR.

These functions are designed to survive the Expo port unchanged because
they have zero dependencies on the rendering layer. So your work won't
get thrown away.

**First three to consider, pick by appetite:**

- `currency.ts` — easiest, ~15 lines (issue #25)
- `duration.ts` — date math, ~25 lines (issue #26)
- `split.ts` — bill splitting, ~30 lines (issue #27)

---

## Workflow per task

1. **Pick an issue** from the board column **Todo** with label
   `lane:product` and owner `modweck` or `either`.
2. **Comment on the issue** "I'm taking this" so we don't double up.
3. **Move it to In Progress** on the board.
4. **Branch off `main`** — see `CONTRIBUTING.md` for the exact
   commands. Branch naming: `feat/<short>`, `docs/<short>`, etc.
5. **Work locally.** For vibe-code issues, paste the prompt into your
   AI tool. For doc issues, just write.
6. **Commit + push** — single short imperative subject line, no body.
7. **Open a PR.** `gh pr create --fill --web` works. Request review
   from `@ikkidev`.
8. **Wait for CI** (4 checks). If red, click the failing check, paste
   the error into your AI tool, ask it to fix, push again.
9. **After approval, squash-merge.** Delete the branch when prompted.
10. **Move the card to Done.**

---

## When you get stuck

**Before pushing broken code**, comment on the issue with:

- What you tried
- The error message (paste the full thing)
- What your AI tool suggested

ikkidev will reply when he sees it. This is way faster than ten
review cycles.

---

## Using AI to vibe-code (you're not alone)

Each `lane:product` coding issue has a literal copy-pasteable prompt.
You don't need to know TypeScript syntax — you need to:

1. Read the prompt to understand what the function is supposed to do.
2. Paste it into your AI tool.
3. Save the file the AI gives you to the exact path the issue lists.
4. Run `npm test` and `npm run lint`. If green, push.
5. If red, paste the error back to the AI and ask it to fix.

The issue's acceptance criteria tell you when you're done.

---

## What ikkidev is doing (so you know)

He's on branch `feat/ios-mobile-port` doing issues #5 through #18 in roughly
that order. You'll see commits land on that branch but **don't pull or
merge from it** — it's a moving target until the final PR. Stay on
`main`-derived branches.

Read `docs/superpowers/specs/2026-05-18-expo-router-port-design.md` if
you're curious about the why; `docs/superpowers/plans/2026-05-18-expo-
router-port.md` for the how. (Both files are on `feat/ios-mobile-port`.)

---

## Questions

Open an issue with label `question`, or just comment on whatever issue
is closest. Ping on whatever channel we usually chat — same timezone so
real-time is fine when we're both around.
