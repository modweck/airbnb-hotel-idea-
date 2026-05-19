# Contributing

Welcome. This repo is a two-person project (`ikkidev` + `modweck`),
and one of us is newer to git. The rules here keep us from stepping on
each other's toes and make sure nothing accidentally lands on `main`
without a review pass through CI.

If you're vibe-coding in VS Code + Claude / Copilot, **read this file
first.** Most of the time you can copy-paste the snippets below.

---

## TL;DR — the loop

For every change, no matter how small:

```bash
# 1. Start from an up-to-date main
git switch main
git pull --ff-only

# 2. Make a branch for your work
git switch -c feat/<short-description>          # or fix/, chore/, docs/

# 3. Work, commit, push
git add -A
git commit -m "Short imperative subject"
git push -u origin HEAD

# 4. Open a Pull Request (PR) on GitHub
gh pr create --fill --web
# (or click the link GitHub prints after the push)

# 5. Wait for CI to go green, then click "Squash and merge".
#    GitHub deletes the branch automatically.
```

That's it. Never commit directly to `main`.

---

## Branch naming

| Kind of change | Prefix | Example |
|---|---|---|
| New feature | `feat/` | `feat/per-person-budget` |
| Bug fix | `fix/` | `fix/results-page-crash` |
| Chore (deps, config, tooling) | `chore/` | `chore/upgrade-expo` |
| Docs only | `docs/` | `docs/contributing-cleanup` |

Keep the description short, lowercase, hyphenated, English. If there's
an issue number, put it in: `feat/12-per-person-budget`.

---

## Commit messages

- One-line subject, imperative mood ("Add X", not "Added X").
- Keep it under ~72 characters.
- Body is optional and rare — the PR description carries the context.

```
Add per-person budget filter to results page
```

We squash-merge PRs, so the merge commit on `main` will be your PR
title. Make PR titles match the same rule.

---

## Opening a PR

Use the GitHub UI or `gh`:

```bash
gh pr create --fill --web
```

The PR template prompts you for:

- **What** — one or two sentences.
- **Why** — link the issue with `Closes #123` so it auto-closes on merge.
- **How it was tested** — tick the boxes you actually ran.
- **Screenshots** — drag-and-drop for UI changes.

CI runs four jobs: `lint`, `typecheck`, `test`, `build`. All four must
pass before "Squash and merge" unlocks. If something is red, click
the job name to see the log; fix locally, push again — the PR
re-runs automatically.

---

## Keeping your branch up to date with `main`

If `main` has moved while you were working:

```bash
git fetch origin
git rebase origin/main
# resolve conflicts in VS Code, then:
git add -A
git rebase --continue
git push --force-with-lease
```

`--force-with-lease` is the safe force-push — it refuses if someone
else pushed to your branch in the meantime.

---

## Recovering from common mistakes

### "Oops, I committed straight to main"

```bash
# You're on main with a commit that should have been a PR.
git switch -c feat/whatever-i-was-doing    # move the commit to a branch
git switch main
git reset --hard origin/main               # rewind local main
git switch feat/whatever-i-was-doing
git push -u origin HEAD                    # now open a PR
```

### "I committed something I didn't mean to (wrong file, secret, etc.)"

If you haven't pushed yet:

```bash
git reset --soft HEAD~1     # undo the commit, keep changes staged
# fix things, re-stage, recommit
```

If you already pushed and it's a **secret**: stop, tell the other
partner, rotate the secret immediately. The git history can be
cleaned but the secret must be treated as compromised.

### "Merge conflict and I have no idea what's going on"

Don't panic, don't `git reset --hard` — that throws away your work.

```bash
git status     # tells you which files conflict
```

Open each conflicted file in VS Code — it shows
`<<<<<<<`/`=======`/`>>>>>>>` markers and gives buttons "Accept
Current", "Accept Incoming", "Accept Both". Pick one per chunk, save,
then:

```bash
git add <file>
git rebase --continue    # or `git merge --continue`
```

If totally stuck: `git rebase --abort` returns you to where you
started.

---

## Using GitHub for sprint / feature planning

We track work on a **GitHub Project** ("Airbnb Hotel — Roadmap"). The
board has four columns: **Todo**, **In Progress**, **In Review**,
**Done**.

Workflow for picking up work:

1. Look at the **Todo** column on the project board.
2. Open an issue, click "Assignees" → yourself.
3. Drag the card to **In Progress** (or just open a PR — it auto-moves).
4. When CI passes and you mark "Ready for review", it moves to **In
   Review**.
5. When the PR merges, it moves to **Done**.

**No Notion.** All planning lives in GitHub Issues + the Project.

---

## Local auth: working on this repo AND work repos in parallel

If you also use git/`gh` for other repos under a different GitHub
account (e.g. work), see the
[auth setup section in the plan](../.copilot/session-state) — short
version: install `direnv` and use a per-directory `GH_CONFIG_DIR` so
each directory tree authenticates as the right user automatically. No
`gh auth switch` needed.

---

## Local development

```bash
nvm use 20
npm install
cp .env.local.example .env.local
# fill in EXPO_PUBLIC_SUPABASE_*, ANTHROPIC_API_KEY, SERPAPI_KEY, etc.
npm run web                 # web dev server (Metro)
# or `npm run ios` / `npm run android`
```

Open <http://localhost:8081>.

Before opening a PR, locally:

```bash
npm run lint
npx tsc --noEmit
npm test
npm run build:web
```

All four must pass — CI runs the same commands.

---

## Releasing

Releases trigger a production deploy to Netlify and create a GitHub
Release page with auto-generated notes.

**Beginner-friendly (browser):**

1. Make sure `main` is green (CI passing).
2. Go to **Releases → Draft a new release** on GitHub.
3. **Choose a tag**: type `v0.2.0` (or whatever the next version is).
4. **Target**: `main`.
5. Click **Generate release notes**.
6. Click **Publish release**.

The `Release` workflow then runs (`.github/workflows/release.yml`),
re-verifies the build, and triggers Netlify.

**Command-line:**

```bash
git switch main
git pull --ff-only
git tag v0.2.0
git push origin v0.2.0
```

### One-time release setup

This needs to be done once by an admin (currently `modweck`):

1. In **Netlify** → Site settings → Build & deploy → Build hooks →
   click "Add build hook". Name it "Production release", branch
   `main`. Copy the URL.
2. In **GitHub** → Settings → Secrets and variables → Actions → click
   "New repository secret". Name `NETLIFY_BUILD_HOOK_URL`, value =
   the URL from step 1.

After that, every release tag auto-deploys to Netlify production.

### Versioning

We use simple semver-ish tags:

- Bug fix / small UI change → bump patch: `v0.2.0` → `v0.2.1`.
- New feature → bump minor: `v0.2.1` → `v0.3.0`.
- Big breaking change → bump major: `v0.3.0` → `v1.0.0`.

Don't overthink it — when in doubt, bump minor.

### iOS / App Store (future)

The release workflow has a commented-out `deploy-ios` job slot. When
we decide to publish to the App Store, we fill it in (likely via
Fastlane or EAS Submit) without restructuring the rest of the
release flow.

---

## Questions?

- For open-ended discussion → GitHub Discussions on this repo.
- For a specific bug or feature → open an Issue.
- For something off-the-record → text each other.
