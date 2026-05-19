# Collab Setup — Remaining TODOs

After PR #3 (`chore/collab-setup`) lands, a few things still need to be
done to lock in the two-person workflow. **modweck (repo owner) must do
steps 1–3** — they require admin access on `modweck/airbnb-hotel-idea-`.
Step 4 is for both of us.

---

## 1. Merge PR #3

**Who:** modweck (or ikkidev — either is fine, no admin needed)

1. Open https://github.com/modweck/airbnb-hotel-idea-/pull/3
2. Confirm all 4 CI checks are green: `lint`, `typecheck`, `test`,
   `build`.
3. Click **Squash and merge** → **Confirm squash and merge**.
4. Click **Delete branch** when prompted.

---

## 2. Protect the `main` branch  (admin only — modweck)

Right now anyone with push access can commit directly to `main`. This
step forces every change to go through a PR with passing CI.

### Step-by-step (GitHub UI)

1. Go to https://github.com/modweck/airbnb-hotel-idea-/settings/branches
2. Under **Branch protection rules**, click **Add branch ruleset**
   (or "Add classic branch protection rule" — either works; instructions
   below are for the modern **Rulesets** UI, which GitHub now defaults
   to).
3. **Ruleset name:** `protect-main`
4. **Enforcement status:** **Active**
5. **Bypass list:** leave empty (don't add yourself — defeats the
   purpose).
6. **Target branches** → **Add target** → **Include default branch**.
   (This targets `main`.)
7. Under **Branch rules**, enable these checkboxes:
   - [x] **Restrict deletions**
   - [x] **Require a pull request before merging**
     - Required approvals: **1**
     - [x] Dismiss stale pull request approvals when new commits are
       pushed
     - [x] Require review from Code Owners
     - [x] Require approval of the most recent reviewable push
   - [x] **Require status checks to pass**
     - [x] Require branches to be up to date before merging
     - Click **Add checks** and add all four:
       - `lint`
       - `typecheck`
       - `test`
       - `build`
       (You may need to type the name and pick the suggestion — they'll
       appear after PR #3 has run CI at least once.)
   - [x] **Block force pushes**
8. Click **Create**.

### Verify

After saving, run locally:

```bash
cd ~/Projects/private/airbnb-hotel-idea-
gh api repos/modweck/airbnb-hotel-idea-/rules/branches/main
```

Should return a JSON list of active rules (not `404`).

Try pushing directly to `main` — it should be rejected:

```bash
git checkout main
git commit --allow-empty -m "test direct push"
git push      # expected: rejected by branch protection
git reset --hard origin/main
```

---

## 3. Add ikkidev as a collaborator with write access  (admin only — modweck)

Required so ikkidev can push branches and open PRs from the same repo
(not a fork).

1. Go to https://github.com/modweck/airbnb-hotel-idea-/settings/access
2. Click **Add people**.
3. Search **`ikkidev`** → select.
4. Role: **Write**.
5. Click **Add ikkidev to this repository**.
6. ikkidev accepts the invite (email or
   https://github.com/notifications).

---

## 4. Onboard modweck to the workflow  (both of us)

modweck reads `CONTRIBUTING.md` and does one practice round end-to-end
to confirm the guardrails work.

### Walkthrough for modweck

```bash
# One-time setup
gh auth login                          # log in as modweck
gh repo clone modweck/airbnb-hotel-idea-
cd airbnb-hotel-idea-
npm install
cp .env.example .env.local             # fill in API keys
npm run dev                            # confirm app boots on :3000
```

### Practice PR

```bash
git checkout main && git pull
git checkout -b chore/practice-pr
echo "" >> README.md                   # trivial change
git add README.md
git commit -m "Practice PR — confirm workflow"
git push -u origin chore/practice-pr
gh pr create --fill
```

Then on github.com:

1. Watch the 4 CI checks run on the PR.
2. Request review from `@ikkidev`.
3. After approval + green checks, click **Squash and merge**.
4. Delete the branch.

If any step fails (push blocked, CI red, can't merge without review)
the guardrails are working.

---

## 5. GitHub Project v2 board — DONE

Board lives at https://github.com/users/ikkidev/projects/1
("Trip Planner — Sprint Board"). 28 issues seeded, lane-split so
ikkidev (Expo port) and modweck (product + vibe-code) don't collide.
See `docs/modweck-onboarding.md` for the working agreement.

Still TODO (modweck-only, requires admin/owner access):

1. **Accept the project invite** so you can see the board on your end.
   ikkidev sends invite from project Settings → Manage access.
2. **Link the project to this repo** so it shows under the repo's
   Projects tab:
   - Open the board → **Settings** (top-right `...`) → **Manage access**
   - Add `modweck/airbnb-hotel-idea-` with **Write** access.

---

## Quick checklist

- [x] PR #3 merged
- [ ] `main` branch protection ruleset active (PR required, 4 checks
      required, force-push blocked) — see issue #30
- [ ] ikkidev added as Write collaborator — see issue #31
- [ ] modweck completed a practice PR end-to-end — see issue #32
- [x] Project v2 board created — https://github.com/users/ikkidev/projects/1
