# Universal Expo Router Port — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Next.js 16 codebase with a single Expo Router project that serves iOS, Android, and web from one tree on branch `feat/expo-port`, without regressing web functionality and preparing the foundation for group-collaboration features.

**Architecture:** Universal Expo Router tree at repo root with `web.output: "server"` globally. API routes ported 1:1 to `+api.ts` files. NativeWind v4 + Tailwind v4 styling. Hard `src/server/**` server-only boundary enforced via ESLint. `searchTrip()` server pipeline extracted from `/results` so both web and native consume `/api/search`. Web deploys to Netlify via `expo-server/adapter/netlify`; native runs in local Expo Go for now.

**Tech Stack:** Expo SDK (latest), Expo Router, React Native + react-native-web, NativeWind v4, Tailwind v4, @supabase/supabase-js, @react-native-async-storage/async-storage, expo-font, Vitest (retained for pure logic), expo-server/adapter/netlify.

**Reference spec:** `docs/superpowers/specs/2026-05-18-expo-router-port-design.md` (committed as `b062296`). Every decision flows from there; if this plan and the spec disagree, the spec wins and this plan is wrong.

**Personal-repo commit convention:** single-line subject only, no body, no `Co-authored-by` trailer, no Jira prefix needed.

---

## Phase guide

| Phase | Title | Status |
|-------|-------|--------|
| 1 | Spike 1 — Netlify + Expo `server` adapter probe | **Done** (deployed to `trip-planner-expo-test.netlify.app`, 2026-05-19) |
| 2 | Spike 2 — Extract `searchTrip()` pipeline | Done |
| 3 | Spike 3 — NativeWind + Tailwind + `trip-form` vertical slice | Done (Tailwind held at v3 for NativeWind 4 compat; `trip-form` ported on MBP) |
| 4 | Spike 4 — Supabase universal client + `kvStore` on iOS | Done (kvStore + supabase client; iOS smoke is Phase 14) |
| 5 | Server-secret ESLint boundary | Done |
| 6 | Port API routes | Done |
| 7 | Universal client wrappers | Done |
| 8 | Port shared helpers (`saved.ts`, analytics, types) | Done |
| 9 | Port remaining components | **Done** (`place-autocomplete`, `listing-card`, `save-button`, `sortable-listings`, `trip-form/**` all RN) |
| 10 | Port pages | **Done** (`index`, `results`, `saved`, `about`, `contact`, `privacy`, `terms`) |
| 11 | Delete Next.js | **Not started** (next dependency cleanup + `src/app/` removal) |
| 12 | Update CI | **Done** (`ci.yml` + `release.yml` rewritten for Expo; Netlify build hook in `release.yml`) |
| 13 | Docs (incl. `docs/mobile-handoff.md`) | In progress (handoff kept current) |
| 14 | Spike 5 — iOS sim smoke (on MacBook Pro) | Not started (MBP) |

> **Pragmatic rule for UI rewrites:** several tasks involve porting components I cannot fully predict line-by-line (Expo + paper.design output is exploratory). For those tasks, the plan specifies the **contract** (RN primitives to use, props/behavior to preserve, validation criteria). Treat them as TDD-by-smoke-test: render the screen with `npx expo start --web`, exercise the behavior, confirm no console errors and visual parity with main.

---

## Phase 1 — Spike 1: Netlify + Expo `server` adapter probe (branch-killer gate)

**Why first:** `expo-server/adapter/netlify` is alpha. If it cannot serve one API route from a Netlify preview, the entire universal-server design fails and we must replan. We risk one day of throwaway scaffolding here to learn that, not three weeks.

**Goal of this phase:** push a minimal Expo Router project (in a scratch directory under `spike/`) that:
1. Builds with `npx expo export --platform web`
2. Deploys to a Netlify preview
3. Has `/api/health` returning JSON from a real Netlify Function

If this fails after a reasonable timebox (~1 day), stop and revisit the spec. Do not proceed to Phase 2+ until this is green.

### Task 1.1: Create scratch spike directory

**Files:**
- Create: `spike/netlify-probe/` (scratch — gitignored or thrown away at end of phase)

- [ ] **Step 1: Initialize a fresh Expo Router project in spike directory**

```bash
cd /home/maljeffri/Projects/private/airbnb-hotel-idea-
mkdir -p spike
cd spike
npx create-expo-app@latest netlify-probe --template tabs
cd netlify-probe
```

- [ ] **Step 2: Add server adapter and switch web output to server mode**

Edit `spike/netlify-probe/app.json`. Under `expo.web`, set:

```json
"web": {
  "bundler": "metro",
  "output": "server"
}
```

Install adapter:

```bash
npm install expo-server
```

- [ ] **Step 3: Add `/api/health` route**

Create `spike/netlify-probe/app/api/health+api.ts`:

```ts
export async function GET() {
  return Response.json({ status: "ok", ts: Date.now() });
}
```

- [ ] **Step 4: Add Netlify config**

Create `spike/netlify-probe/netlify.toml`:

```toml
[build]
  command = "npx expo export --platform web"
  publish = "dist/client"
  functions = "netlify/functions"

[functions]
  included_files = ["dist/server/**/*"]

[[redirects]]
  from = "/*"
  to = "/.netlify/functions/server"
  status = 200
```

Create `spike/netlify-probe/netlify/functions/server.ts`:

```ts
import { createRequestHandler } from "expo-server/adapter/netlify";
export default createRequestHandler({ build: "./dist/server" });
```

- [ ] **Step 5: Local build smoke**

Run: `cd spike/netlify-probe && npx expo export --platform web`
Expected: `dist/client/` and `dist/server/` exist, no fatal errors.

- [ ] **Step 6: Deploy preview via Netlify CLI**

```bash
cd spike/netlify-probe
npx netlify deploy --build
```

Expected: deploy URL printed. `curl https://<preview>/api/health` returns `{"status":"ok",...}`.

- [ ] **Step 7: Decision gate**

If step 6 fails (function 404, build error, crash):
- Investigate up to ~1 day total wallclock.
- Try `@netlify/plugin-nextjs` parity tricks documented in `expo-server` README.
- If still failing, STOP. Open an issue in `docs/superpowers/specs/` documenting the blocker, and revisit the spec (likely flip to `output: "static"` + separate Functions repo, or move web off Netlify).

If step 6 succeeds:

- [ ] **Step 8: Record outcome and commit a marker**

Create `docs/superpowers/notes/2026-05-18-spike1-netlify-server-adapter.md` with: working versions of `expo`, `expo-server`, `@netlify/plugin-*`, the exact `netlify.toml` and `server.ts` contents that worked, and the deploy URL.

```bash
git add docs/superpowers/notes/2026-05-18-spike1-netlify-server-adapter.md
git commit -m "Record Spike 1 outcome: Expo server adapter on Netlify works"
```

- [ ] **Step 9: Add `spike/` to .gitignore**

```bash
echo "spike/" >> .gitignore
git add .gitignore
git commit -m "Ignore spike scratch directories"
```

---

## Phase 2 — Spike 2: Extract `searchTrip()` pipeline

**Why now:** `src/app/results/page.tsx` lines 61–117 runs the full search pipeline inline as a Next Server Component. `/api/search` does *less*. For the port, both web and native must hit one HTTP endpoint that does the full pipeline. This refactor is valuable on `main` regardless of the port outcome.

### Task 2.1: Move pipeline behind a server module

**Files:**
- Create: `src/server/search/pipeline.ts`
- Modify: `src/app/results/page.tsx`
- Modify: `src/app/api/search/route.ts`
- Test: `src/server/search/pipeline.test.ts` (Vitest)

- [ ] **Step 1: Read the current inline pipeline**

Read `src/app/results/page.tsx` lines 1–150. Enumerate exact imports (`getListingProvider`, `geocodePlace`, `distanceMiles`, `findNightlifeHotspots`, `applyVibeToListings`, `applyBudgetFilter`) and the input shape from `searchParams`.

- [ ] **Step 2: Write a failing test for `searchTrip()`**

Create `src/server/search/pipeline.test.ts`:

```ts
import { describe, it, expect, vi } from "vitest";
import { searchTrip } from "./pipeline";

vi.mock("@/lib/listing-provider", () => ({
  getListingProvider: () => ({
    searchListings: vi.fn(async () => ({ listings: [], cursor: null })),
  }),
}));
vi.mock("@/lib/geocode", () => ({
  geocodePlace: vi.fn(async () => ({ lat: 0, lng: 0 })),
  distanceMiles: vi.fn(() => 0),
}));
vi.mock("@/lib/vibe", () => ({
  findNightlifeHotspots: vi.fn(async () => []),
  applyVibeToListings: (xs: unknown[]) => xs,
}));

describe("searchTrip", () => {
  it("returns an empty result set when the provider returns nothing", async () => {
    const out = await searchTrip({
      destination: "Lisbon",
      checkIn: "2026-06-01",
      checkOut: "2026-06-05",
      guests: 2,
      budgetTotal: 1000,
    });
    expect(out.listings).toEqual([]);
    expect(out.meta.destination).toBe("Lisbon");
  });
});
```

- [ ] **Step 3: Run the test, verify it fails**

Run: `npx vitest run src/server/search/pipeline.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 4: Create `searchTrip()` by lifting the existing inline code**

Create `src/server/search/pipeline.ts`. Function signature:

```ts
import { getListingProvider } from "@/lib/listing-provider";
import { geocodePlace, distanceMiles } from "@/lib/geocode";
import { findNightlifeHotspots, applyVibeToListings } from "@/lib/vibe";
import { applyBudgetFilter } from "@/lib/budget";

export type SearchTripInput = {
  destination: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  budgetTotal: number;
  vibe?: string;
  sortBy?: string;
};

export type SearchTripResult = {
  listings: ReturnType<typeof applyVibeToListings>;
  meta: {
    destination: string;
    nights: number;
    rawCount: number;
    filteredCount: number;
  };
};

export async function searchTrip(input: SearchTripInput): Promise<SearchTripResult> {
  // Paste lines 61–117 of src/app/results/page.tsx here, adapted to take `input` instead of searchParams.
  // Preserve exact ordering: provider.searchListings → geocodePlace → distance enrichment →
  // findNightlifeHotspots → applyVibeToListings → applyBudgetFilter.
  // Return `{ listings, meta }`.
}
```

The agent MUST copy the real code from `results/page.tsx` lines 61–117 verbatim — do not paraphrase. The point is byte-equivalent behavior.

- [ ] **Step 5: Run the test, verify it passes**

Run: `npx vitest run src/server/search/pipeline.test.ts`
Expected: PASS.

- [ ] **Step 6: Update `/api/search/route.ts` to delegate**

Modify `src/app/api/search/route.ts`:
1. Parse query/body to `SearchTripInput`
2. Call `searchTrip(input)`
3. Return `Response.json(result)`

Delete the inline `searchListings()` call.

- [ ] **Step 7: Update `src/app/results/page.tsx` to call `searchTrip()`**

Replace lines 61–117 with `const { listings, meta } = await searchTrip(input);` where `input` is built from `searchParams`. Keeps results as a Server Component while Next is still alive. After the port, results becomes a client component.

- [ ] **Step 8: Manual smoke**

```bash
npm run dev
# Visit http://localhost:3000/results?destination=Lisbon&checkIn=2026-06-01&checkOut=2026-06-05&guests=2&budgetTotal=1000
```

Expected: identical results to `main`.

- [ ] **Step 9: Commit**

```bash
git add src/server/search src/app/results/page.tsx src/app/api/search/route.ts
git commit -m "Extract searchTrip() pipeline behind src/server/search"
```

---

## Phase 3 — Spike 3: NativeWind v4 + Tailwind v4 + `trip-form` vertical slice

**Why now:** `trip-form.tsx` is 37 KB — the largest port unit. Validating the styling stack and paper.design → RN translation on this one component de-risks everything downstream.

### Task 3.1: Scaffold Expo Router project at repo root

**Files:**
- Create: `app/_layout.tsx`, `app/index.tsx`
- Create: `app.json`, `metro.config.js`, `babel.config.js`
- Create: `tailwind.config.js`, `global.css`, `nativewind-env.d.ts`
- Modify: `package.json` (add Expo + RN + NativeWind deps; keep Next deps for now)
- Modify: `tsconfig.json` (extend `expo/tsconfig.base`)

- [ ] **Step 1: Install Expo + Router + NativeWind**

```bash
cd /home/maljeffri/Projects/private/airbnb-hotel-idea-
npm install expo expo-router react-native react-native-web react-dom react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar
npm install nativewind tailwindcss@^4 react-native-reanimated
npm install --save-dev @babel/core
```

- [ ] **Step 2: Configure `app.json`**

Create or merge:

```json
{
  "expo": {
    "name": "trip-planner",
    "slug": "trip-planner",
    "scheme": "tripplanner",
    "version": "0.1.0",
    "orientation": "portrait",
    "userInterfaceStyle": "automatic",
    "ios": { "supportsTablet": true, "bundleIdentifier": "com.ikkidev.tripplanner" },
    "android": { "package": "com.ikkidev.tripplanner" },
    "web": { "bundler": "metro", "output": "server" },
    "plugins": ["expo-router"],
    "experiments": { "typedRoutes": true }
  }
}
```

- [ ] **Step 3: Babel + Metro for NativeWind**

`babel.config.js`:

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [["babel-preset-expo", { jsxImportSource: "nativewind" }], "nativewind/babel"],
  };
};
```

`metro.config.js`:

```js
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);
module.exports = withNativeWind(config, { input: "./global.css" });
```

- [ ] **Step 4: Tailwind config + global.css**

`tailwind.config.js`:

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: { extend: {} },
  plugins: [],
};
```

`global.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

`nativewind-env.d.ts`:

```ts
/// <reference types="nativewind/types" />
```

- [ ] **Step 5: Minimal root layout and index**

`app/_layout.tsx`:

```tsx
import "../global.css";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaProvider>
  );
}
```

`app/index.tsx`:

```tsx
import { Text, View } from "react-native";

export default function Home() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-2xl font-bold">Trip planner — Expo port</Text>
    </View>
  );
}
```

- [ ] **Step 6: Verify web start**

Run: `npx expo start --web --port 8081`
Expected: browser opens to "Trip planner — Expo port" centered, Tailwind classes applied.

If NativeWind v4 + Tailwind v4 fails: STOP. Pin to `tailwindcss@^3.4` and update `tailwind.config.js`. Document in `docs/superpowers/notes/2026-05-18-nativewind-fallback.md`.

- [ ] **Step 7: Commit**

```bash
git add app/ global.css nativewind-env.d.ts tailwind.config.js metro.config.js babel.config.js app.json package.json package-lock.json tsconfig.json
git commit -m "Scaffold Expo Router + NativeWind alongside Next.js"
```

### Task 3.2: Port `trip-form.tsx` as vertical slice

**Files:**
- Modify: `src/components/trip-form.tsx` (full rewrite)
- Create: `docs/superpowers/notes/2026-05-18-trip-form-inventory.md`

- [ ] **Step 1: Read existing `src/components/trip-form.tsx` in chunks**

File is 37 KB. Read in three passes (1–500, 500–1000, 1000+). Enumerate:
- Every DOM element (`<input>`, `<button>`, `<form>`, `<select>`, etc.)
- Every event handler (`onChange`, `onSubmit`, etc.)
- Every browser-only API (`window`, `document`, `localStorage`)
- State shape and submit flow

Write the inventory to `docs/superpowers/notes/2026-05-18-trip-form-inventory.md`. **Do not skip** — without it the rewrite silently loses behavior.

- [ ] **Step 2: Translate paper.design export (if available) or hand-translate**

If a paper.design export exists, paste HTML+CSS into the notes file. Map class by class to NativeWind. Otherwise translate by hand.

- [ ] **Step 3: Rewrite as RN component**

Contract:
- Props: same as before (`onSubmit?: (input: ParsedTrip) => void`, plus defaults)
- Primitives: `View`, `Text`, `TextInput`, `Pressable`, `ScrollView`. No `div`, `input`, `button`, `form`.
- Styling: `className` (NativeWind). No inline `style={{}}` except for transient measurements.
- Place autocomplete: import from `src/components/place-autocomplete.tsx` (ported Phase 9 — for now stub with plain `TextInput` + `// TODO Phase 9` comment).
- Trip parsing: call `parseTrip()` from `src/client/trip.ts` (created Phase 7 — for now inline `fetch("/api/parse-trip", …)` + `// TODO Phase 7` comment).
- No direct `localStorage`; use `useSaved()` from `src/lib/saved.ts` once Phase 8 migrates it. For now, stub.

Single commit — do not split.

- [ ] **Step 4: Wire into `app/index.tsx`**

```tsx
import { ScrollView } from "react-native";
import { TripForm } from "@/components/trip-form";

export default function Home() {
  return (
    <ScrollView className="flex-1 bg-white">
      <TripForm />
    </ScrollView>
  );
}
```

(`@/` resolves to `src/` — confirm `tsconfig.json` paths.)

- [ ] **Step 5: Smoke test on web**

Run: `npx expo start --web`
Expected: form renders without console errors; fields tappable/typeable. Submit hits `/api/parse-trip` — it'll 404 since the route hasn't been ported yet. That's fine.

- [ ] **Step 6: Commit**

```bash
git add src/components/trip-form.tsx app/index.tsx docs/superpowers/notes/2026-05-18-trip-form-inventory.md
git commit -m "Port trip-form to React Native + NativeWind"
```

---

## Phase 4 — Spike 4: Supabase universal client + `kvStore` adapter

### Task 4.1: Build `kvStore` abstraction

**Files:**
- Create: `src/lib/kv-store.ts`, `src/lib/kv-store.native.ts`, `src/lib/kv-store.web.ts`
- Test: `src/lib/kv-store.test.ts`

- [ ] **Step 1: Install AsyncStorage**

```bash
npm install @react-native-async-storage/async-storage
```

- [ ] **Step 2: Failing test (web impl)**

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { kvStore } from "./kv-store.web";

beforeEach(() => localStorage.clear());

describe("kvStore (web)", () => {
  it("round-trips a string value", async () => {
    await kvStore.setItem("k", "v");
    expect(await kvStore.getItem("k")).toBe("v");
  });
  it("returns null for missing key", async () => {
    expect(await kvStore.getItem("missing")).toBeNull();
  });
  it("removes a value", async () => {
    await kvStore.setItem("k", "v");
    await kvStore.removeItem("k");
    expect(await kvStore.getItem("k")).toBeNull();
  });
});
```

- [ ] **Step 3: Interface in `kv-store.ts`**

```ts
export interface KvStore {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}
export { kvStore } from "./kv-store.web"; // Metro picks .native.ts on native
```

Metro resolves `kv-store.native.ts` on iOS/Android and `kv-store.web.ts` on web via platform extension convention. The re-export is a type-time fallback for tsc.

- [ ] **Step 4: `kv-store.web.ts`**

```ts
import type { KvStore } from "./kv-store";

export const kvStore: KvStore = {
  async getItem(key) {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(key);
  },
  async setItem(key, value) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, value);
  },
  async removeItem(key) {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(key);
  },
};
```

- [ ] **Step 5: `kv-store.native.ts`**

```ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { KvStore } from "./kv-store";

export const kvStore: KvStore = {
  getItem: (k) => AsyncStorage.getItem(k),
  setItem: (k, v) => AsyncStorage.setItem(k, v),
  removeItem: (k) => AsyncStorage.removeItem(k),
};
```

- [ ] **Step 6: Run test**

Run: `npx vitest run src/lib/kv-store.test.ts`
Expected: PASS (3/3).

- [ ] **Step 7: Commit**

```bash
git add src/lib/kv-store.ts src/lib/kv-store.web.ts src/lib/kv-store.native.ts src/lib/kv-store.test.ts package.json package-lock.json
git commit -m "Add universal kvStore with web and native impls"
```

### Task 4.2: Universal Supabase client

**Files:**
- Create: `src/lib/supabase.ts`
- Modify: `.env.example`

- [ ] **Step 1: Install supabase-js**

```bash
npm install @supabase/supabase-js
```

Keep `@supabase/ssr` in package.json for now — Phase 11 removes it.

- [ ] **Step 2: Create universal client**

```ts
import { createClient } from "@supabase/supabase-js";
import { kvStore } from "./kv-store";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anon) {
  throw new Error("Supabase env vars missing: EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY");
}

export const supabase = createClient(url, anon, {
  auth: {
    storage: {
      getItem: (k) => kvStore.getItem(k),
      setItem: (k, v) => kvStore.setItem(k, v),
      removeItem: (k) => kvStore.removeItem(k),
    },
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: typeof window !== "undefined", // web only
  },
});
```

- [ ] **Step 3: Smoke test on web**

Temporary screen `app/_supabase-smoke.tsx`:

```tsx
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { supabase } from "@/lib/supabase";

export default function Smoke() {
  const [out, setOut] = useState("loading...");
  useEffect(() => {
    supabase.auth.getSession().then(({ data, error }) => {
      setOut(error ? `error: ${error.message}` : `session: ${data.session ? "yes" : "none"}`);
    });
  }, []);
  return <View className="p-8"><Text>{out}</Text></View>;
}
```

Run: `npx expo start --web`, visit `/_supabase-smoke`. Expected: "session: none", no errors.

- [ ] **Step 4: Update env documentation**

Modify `.env.example`. Add:

```bash
# Public (client-bundled; safe to expose)
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=

# Server-only (used inside app/api/**+api.ts; never bundled)
SERPAPI_KEY=
GOOGLE_PLACES_API_KEY=
ANTHROPIC_API_KEY=
APIFY_TOKEN=
SUPABASE_SERVICE_ROLE_KEY=
```

- [ ] **Step 5: Delete smoke screen and commit**

```bash
rm app/_supabase-smoke.tsx
git add src/lib/supabase.ts .env.example package.json package-lock.json
git commit -m "Add universal Supabase client with kvStore-backed auth storage"
```

iOS verification deferred to Spike 5 (handoff doc).

---

## Phase 5 — Server-secret ESLint boundary

### Task 5.1: ESLint `no-restricted-imports`

**Files:**
- Modify: `eslint.config.mjs` (or `.eslintrc.*` — check)

- [ ] **Step 1: Inspect current config**

```bash
ls -la eslint.config.* .eslintrc.* 2>/dev/null
```

- [ ] **Step 2: Add rule**

```js
"no-restricted-imports": ["error", {
  patterns: [
    {
      group: ["@/server/*", "**/src/server/*"],
      message: "src/server/** is server-only. Import only from app/api/**+api.ts.",
    },
  ],
}],
```

Override for API routes:

```js
{
  files: ["app/api/**/*.ts"],
  rules: { "no-restricted-imports": "off" },
}
```

- [ ] **Step 3: Verify rule fires**

Temporary `src/components/_leak-test.tsx`:

```tsx
import { searchTrip } from "@/server/search/pipeline";
export function Leak() { return null; }
```

Run: `npx eslint src/components/_leak-test.tsx`
Expected: error about `src/server/**` server-only.

Delete file:

```bash
rm src/components/_leak-test.tsx
```

- [ ] **Step 4: Lint whole repo**

Run: `npx eslint .`
Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add eslint.config.* .eslintrc.* 2>/dev/null
git commit -m "Enforce src/server/** server-only boundary via ESLint"
```

---

## Phase 6 — Port API routes

### Task 6.1: `/api/health` (sanity)

**Files:** Create `app/api/health+api.ts`

- [ ] **Step 1: Create route**

```ts
export async function GET() {
  return Response.json({ status: "ok", ts: Date.now() });
}
```

- [ ] **Step 2: Smoke**: `curl http://localhost:8081/api/health` → JSON.
- [ ] **Step 3: Commit**: `git commit -m "Add /api/health on Expo Router"`

### Task 6.2: `/api/parse-trip`

**Files:** Create `app/api/parse-trip+api.ts`. Reference: `src/app/api/parse-trip/route.ts`.

- [ ] **Step 1: Read existing route fully** — Anthropic SDK call, zod schema, prompt.
- [ ] **Step 2: Create new route**

```ts
export async function POST(request: Request) {
  // copy existing body verbatim
}
```

Read `ANTHROPIC_API_KEY` from `process.env`. Do not re-export anywhere.

- [ ] **Step 3: Smoke**

```bash
curl -X POST http://localhost:8081/api/parse-trip \
  -H "content-type: application/json" \
  -d '{"text":"Lisbon June 1 to 5 two people budget 1500"}'
```

Expected: same JSON shape as `main`.

- [ ] **Step 4: Commit**: `git commit -m "Port /api/parse-trip to Expo Router"`

### Task 6.3: `/api/places-autocomplete` (fix debug leak)

**Files:** Create `app/api/places-autocomplete+api.ts`. Reference: `src/app/api/places-autocomplete/route.ts:11-13` (the debug leak).

- [ ] **Step 1: Read existing route**
- [ ] **Step 2: Create new route, fix the leak**

```ts
const key = process.env.GOOGLE_PLACES_API_KEY;
if (!key) {
  // Was: return Response.json({ debug: Object.keys(process.env)... })
  // Now: silent empty result
  return Response.json({ predictions: [] });
}
```

Port remaining logic verbatim.

- [ ] **Step 3: Smoke**: with key → predictions; without key → `{"predictions":[]}` (NOT env names).
- [ ] **Step 4: Commit**: `git commit -m "Port /api/places-autocomplete and remove env-key debug leak"`

### Task 6.4: `/api/search` (thin handler over `searchTrip()`)

**Files:** Create `app/api/search+api.ts`.

- [ ] **Step 1: Create route**

```ts
import { searchTrip, type SearchTripInput } from "@/server/search/pipeline";

export async function POST(request: Request) {
  const input = (await request.json()) as SearchTripInput;
  const result = await searchTrip(input);
  return Response.json(result);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const input: SearchTripInput = {
    destination: url.searchParams.get("destination") ?? "",
    checkIn: url.searchParams.get("checkIn") ?? "",
    checkOut: url.searchParams.get("checkOut") ?? "",
    guests: Number(url.searchParams.get("guests") ?? 2),
    budgetTotal: Number(url.searchParams.get("budgetTotal") ?? 0),
    vibe: url.searchParams.get("vibe") ?? undefined,
    sortBy: url.searchParams.get("sortBy") ?? undefined,
  };
  return Response.json(await searchTrip(input));
}
```

- [ ] **Step 2: Smoke**: `curl "http://localhost:8081/api/search?destination=Lisbon&..."` returns full pipeline result.
- [ ] **Step 3: Commit**: `git commit -m "Port /api/search as thin handler over searchTrip()"`

---

## Phase 7 — Universal client wrappers

### Task 7.1: `apiBase()` helper

**Files:** Create `src/client/_base.ts`.

- [ ] **Step 1: Create**

```ts
export function apiBase(): string {
  if (typeof window !== "undefined") return ""; // web: relative is fine
  const base = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (!base) throw new Error("EXPO_PUBLIC_API_BASE_URL is required on native");
  return base.replace(/\/$/, "");
}
```

- [ ] **Step 2: Document env var in `.env.example`**

```bash
# Required on native builds; absolute URL of the deployed web app (which hosts API routes).
EXPO_PUBLIC_API_BASE_URL=https://<your-netlify-site>.netlify.app
```

- [ ] **Step 3: Commit**: `git commit -m "Add apiBase() helper for universal API origin"`

### Task 7.2: `src/client/trip.ts`

- [ ] **Step 1: Create**

```ts
import { apiBase } from "./_base";
import type { ParsedTrip } from "@/lib/trip-schema";

export async function parseTrip(text: string): Promise<ParsedTrip> {
  const res = await fetch(`${apiBase()}/api/parse-trip`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error(`parseTrip ${res.status}`);
  return res.json();
}
```

- [ ] **Step 2: Commit**: `git commit -m "Add typed parseTrip() client"`

### Task 7.3: `src/client/search.ts`

- [ ] **Step 1: Create**

```ts
import { apiBase } from "./_base";
import type { SearchTripInput, SearchTripResult } from "@/server/search/pipeline";
// Type-only import from @/server is allowed; configure ESLint with allowTypeImports if needed.

export async function searchTripApi(input: SearchTripInput): Promise<SearchTripResult> {
  const res = await fetch(`${apiBase()}/api/search`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`search ${res.status}`);
  return res.json();
}
```

If ESLint blocks the type-only import: update the rule with `allowTypeImports: true` for `@/server/*`, re-run lint.

- [ ] **Step 2: Commit**: `git commit -m "Add searchTripApi() client wrapper"`

### Task 7.4: `src/client/places.ts`

- [ ] **Step 1: Create**

```ts
import { apiBase } from "./_base";

export type Prediction = { description: string; place_id: string };

export async function autocompletePlaces(query: string): Promise<Prediction[]> {
  if (!query.trim()) return [];
  const res = await fetch(`${apiBase()}/api/places-autocomplete?q=${encodeURIComponent(query)}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.predictions ?? [];
}
```

- [ ] **Step 2: Commit**: `git commit -m "Add autocompletePlaces() client wrapper"`

---

## Phase 8 — Port shared helpers

### Task 8.1: Migrate `lib/saved.ts` to `kvStore`

**Files:** Modify `src/lib/saved.ts`.

- [ ] **Step 1: Read existing.** Identify public API (`useSaved`, `saveListing`, `unsaveListing`, etc.) and the `useSyncExternalStore` pattern.
- [ ] **Step 2: Replace `localStorage` with `kvStore` via in-memory mirror**

```ts
import { useSyncExternalStore } from "react";
import { kvStore } from "./kv-store";

const KEY = "saved-listings";
let mem: string[] = [];
const listeners = new Set<() => void>();

async function hydrate() {
  const raw = await kvStore.getItem(KEY);
  mem = raw ? JSON.parse(raw) : [];
  listeners.forEach((l) => l());
}
void hydrate();

function subscribe(l: () => void) {
  listeners.add(l);
  return () => { listeners.delete(l); };
}
function getSnapshot() { return mem; }
function getServerSnapshot() { return [] as string[]; }

export function useSaved() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export async function saveListing(id: string) {
  if (mem.includes(id)) return;
  mem = [...mem, id];
  await kvStore.setItem(KEY, JSON.stringify(mem));
  listeners.forEach((l) => l());
}

export async function unsaveListing(id: string) {
  mem = mem.filter((x) => x !== id);
  await kvStore.setItem(KEY, JSON.stringify(mem));
  listeners.forEach((l) => l());
}
```

Preserve any additional exports.

- [ ] **Step 3: Smoke**: tap save in any page; list updates; reload preserves.
- [ ] **Step 4: Commit**: `git commit -m "Migrate saved.ts to kvStore"`

### Task 8.2: Web-only analytics safety

- [ ] **Step 1: Find the file**: `grep -rn "gtag\|G-J7ZYR8D7LY" src/`
- [ ] **Step 2: Guard with Platform**

```ts
import { Platform } from "react-native";

export function track(event: string, params?: Record<string, unknown>) {
  if (Platform.OS !== "web") return;
  if (typeof window === "undefined") return;
  // @ts-expect-error gtag injected by app/+html.tsx
  window.gtag?.("event", event, params);
}
```

- [ ] **Step 3: Commit**: `git commit -m "Make analytics web-only safe"`

### Task 8.3: Audit pure helpers

**Files:** `src/lib/budget.ts`, `budget.test.ts`, `types.ts`, `sleep-rules.ts`, `trip-schema.ts`.

- [ ] **Step 1: Quick audit**

```bash
grep -nE "window|document|next/|@next" src/lib/budget.ts src/lib/types.ts src/lib/sleep-rules.ts src/lib/trip-schema.ts
```

Expected: no matches.

- [ ] **Step 2: Run Vitest**: `npx vitest run` — existing tests PASS.
- [ ] **Step 3:** No commit needed if nothing changed.

---

## Phase 9 — Port remaining components

Contract per component: RN primitives only, NativeWind `className`, no DOM/browser APIs, public props unchanged unless prop encodes DOM (`onClick` → `onPress`). One component per commit.

### Task 9.1: Port `place-autocomplete.tsx`

- [ ] **Step 1**: read existing component
- [ ] **Step 2**: rewrite — `<input>` → `<TextInput>`; dropdown `<ul>` → `<FlatList>` or `<ScrollView>`; replace inline fetch with `autocompletePlaces()` from `src/client/places.ts`; replace `document.addEventListener("mousedown", …)` outside-click with a transparent `<Pressable>` overlay
- [ ] **Step 3**: smoke — type "Lis", see suggestions, tap one, value populates
- [ ] **Step 4**: `git commit -m "Port place-autocomplete to React Native"`

### Task 9.2: Port `listing-card.tsx`

- [ ] **Step 1**: read existing
- [ ] **Step 2**: rewrite — `<a>` → `<Link>` from `expo-router` (or `Pressable` + `Linking.openURL` for external); `<img>` → `<Image source={{ uri }} />` with explicit dimensions; hover-only effects → drop on native, keep web-only via `Platform.OS === "web"`
- [ ] **Step 3**: smoke — render in list, tap → navigates to external URL
- [ ] **Step 4**: `git commit -m "Port listing-card to React Native"`

### Task 9.3: Port `save-button.tsx`

- [ ] **Step 1**: read existing
- [ ] **Step 2**: rewrite — `<button>` → `<Pressable>`; calls `saveListing()` / `unsaveListing()`; optimistic UI via local state
- [ ] **Step 3**: smoke — tap heart toggles, persists across reload
- [ ] **Step 4**: `git commit -m "Port save-button to React Native"`

### Task 9.4: Port `sortable-listings.tsx`

- [ ] **Step 1**: read existing
- [ ] **Step 2**: rewrite — replace HTML `<select>` with `<Pressable>` + dropdown sheet (or `@react-native-picker/picker`). On web, optionally render native `<select>` via `react-native-web` for UX parity behind `Platform.OS === "web"`
- [ ] **Step 3**: smoke — sort dropdown changes order
- [ ] **Step 4**: `git commit -m "Port sortable-listings to React Native"`

---

## Phase 10 — Port pages

### Task 10.1: Final root layout + `+html.tsx`

**Files:** Modify `app/_layout.tsx`; create `app/+html.tsx`.

- [ ] **Step 1: Update layout to load fonts**

```bash
npm install @expo-google-fonts/geist expo-font
```

```tsx
import "../global.css";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import { Geist_400Regular, Geist_500Medium, Geist_700Bold } from "@expo-google-fonts/geist";

export default function RootLayout() {
  const [loaded] = useFonts({ Geist_400Regular, Geist_500Medium, Geist_700Bold });
  if (!loaded) return null;
  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaProvider>
  );
}
```

- [ ] **Step 2: Create `app/+html.tsx`**

```tsx
import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <ScrollViewStyleReset />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-J7ZYR8D7LY" />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-J7ZYR8D7LY');`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 3: Commit**: `git commit -m "Wire fonts and GA in Expo root layout"`

### Task 10.2: `app/index.tsx` (home, final)

Already exists from Phase 3 with `TripForm`. Update to import the final, ported `TripForm` from Phase 9 (already done — `place-autocomplete` is real). Add hero/footer sections (preserve `[SITE NAME]` placeholder).

- [ ] **Step 1**: update, smoke, commit `Port home page`.

### Task 10.3: `app/results.tsx`

- [ ] **Step 1: Create as client screen calling `searchTripApi()`**

```tsx
import { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { searchTripApi } from "@/client/search";
import type { SearchTripResult, SearchTripInput } from "@/server/search/pipeline";
import { SortableListings } from "@/components/sortable-listings";
import { Text, View } from "react-native";

export default function Results() {
  const params = useLocalSearchParams();
  const [data, setData] = useState<SearchTripResult | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    const input: SearchTripInput = {
      destination: String(params.destination ?? ""),
      checkIn: String(params.checkIn ?? ""),
      checkOut: String(params.checkOut ?? ""),
      guests: Number(params.guests ?? 2),
      budgetTotal: Number(params.budgetTotal ?? 0),
      vibe: typeof params.vibe === "string" ? params.vibe : undefined,
      sortBy: typeof params.sortBy === "string" ? params.sortBy : undefined,
    };
    searchTripApi(input).then(setData).catch((e) => setErr(String(e)));
  }, [params.destination, params.checkIn, params.checkOut, params.guests, params.budgetTotal, params.vibe, params.sortBy]);
  if (err) return <View className="p-8"><Text>{err}</Text></View>;
  if (!data) return <View className="p-8"><Text>Loading…</Text></View>;
  return <SortableListings listings={data.listings} meta={data.meta} />;
}
```

- [ ] **Step 2**: smoke — navigate from home → results renders.
- [ ] **Step 3**: `git commit -m "Port results page to client-side fetch"`

### Task 10.4: Remaining pages

For each of `saved.tsx`, `about.tsx`, `contact.tsx`, `privacy.tsx`, `terms.tsx`:

- [ ] **Step 1**: read corresponding `src/app/<page>/page.tsx`
- [ ] **Step 2**: rewrite as RN screen with ported components
- [ ] **Step 3**: smoke render
- [ ] **Step 4**: `git commit -m "Port <page> screen"`

One commit per page. Do not batch.

---

## Phase 11 — Delete Next.js

### Task 11.1: Delete Next source

- [ ] **Step 1: Delete**

```bash
git rm -r src/app src/lib/supabase next.config.ts next-env.d.ts postcss.config.mjs
git rm -f src/proxy.ts 2>/dev/null || true
```

- [ ] **Step 2: Verify nothing imports them**

```bash
grep -rn "from \"@/lib/supabase/" src/ app/ ; \
grep -rn "next/" src/ app/
```

Expected: 0 matches.

- [ ] **Step 3: Commit**: `git commit -m "Delete Next.js source tree"`

### Task 11.2: Remove Next deps

- [ ] **Step 1: Audit + uninstall**

```bash
npm pkg get dependencies devDependencies
npm uninstall next @next/eslint-plugin-next @netlify/plugin-nextjs @supabase/ssr autoprefixer postcss
```

Verify each is present before uninstalling.

- [ ] **Step 2: Update `package.json` scripts**

```json
{
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "build:web": "expo export --platform web",
    "test": "vitest",
    "lint": "eslint ."
  }
}
```

Remove `dev`, `build`, `next typegen` if present.

- [ ] **Step 3: Reinstall, run full local CI**

```bash
npm install
npm run lint
npm test
npm run build:web
```

All succeed.

- [ ] **Step 4: Commit**: `git commit -m "Remove Next.js dependencies"`

### Task 11.3: Replace `netlify.toml`

- [ ] **Step 1: Replace contents with validated Spike 1 config**

```toml
[build]
  command = "npx expo export --platform web"
  publish = "dist/client"
  functions = "netlify/functions"

[functions]
  included_files = ["dist/server/**/*"]

[[redirects]]
  from = "/*"
  to = "/.netlify/functions/server"
  status = 200
```

Create `netlify/functions/server.ts`:

```ts
import { createRequestHandler } from "expo-server/adapter/netlify";
export default createRequestHandler({ build: "./dist/server" });
```

- [ ] **Step 2: Trigger Netlify preview**

Push branch / open PR / `netlify deploy --build` locally. Verify: home renders; `/api/health` returns JSON; form → `/api/parse-trip` → `/results?...` renders listings.

- [ ] **Step 3: Commit**: `git commit -m "Switch Netlify config to Expo server adapter"`

---

## Phase 12 — CI

### Task 12.1: Update GitHub Actions

**Files:** Modify `.github/workflows/ci.yml`.

- [ ] **Step 1: Read existing workflow**
- [ ] **Step 2: Replace Next-specific steps**

Remove: `npx next typegen`, `next build`, anything referencing `.next/`. Add/keep:

```yaml
- run: npm ci
- run: npm run lint
- run: npm test
- run: npm run build:web
```

- [ ] **Step 3: Smoke locally**: `npm ci && npm run lint && npm test && npm run build:web` — all pass.
- [ ] **Step 4: Commit and push**

```bash
git add .github/workflows/ci.yml
git commit -m "Update CI for Expo build"
git push origin feat/expo-port
```

- [ ] **Step 5: Confirm GitHub Actions green on the PR**

---

## Phase 13 — Docs

### Task 13.1: `README.md`

- [ ] Replace Next.js setup steps with Expo. Mention `npm run web`, `npm run ios`, `EXPO_PUBLIC_*` env vars.
- [ ] Commit: `Update README for Expo`

### Task 13.2: `AGENTS.md` and `CLAUDE.md`

- [ ] Remove references to reading `node_modules/next/dist/docs/`.
- [ ] Replace with: "When working on UI, read `node_modules/expo-router/build/**/*.d.ts` for routing API; consult NativeWind v4 docs at <https://nativewind.dev>."
- [ ] Note universal codebase (one tree, three targets) and `src/server/**` ESLint gate.
- [ ] Commit: `Update agent docs for Expo`

### Task 13.3: Create `docs/mobile-handoff.md` (Spike 5 brief)

```markdown
# Mobile validation handoff (iOS, MacBook Pro)

This branch (`feat/expo-port`) was developed on WSL where iOS validation
is not possible. Please complete the iOS smoke checklist below before
the PR is merged.

## Setup

1. `git checkout feat/expo-port && git pull`
2. `nvm use` (or Node 20+)
3. `npm ci`
4. Copy `.env.example` to `.env` and fill in keys (ask Ikki).
5. Install Xcode if not present; run `xcode-select --install`.
6. Install Watchman: `brew install watchman`.
7. `npx pod-install` (if pods are needed for any installed module)
8. `npm run ios` → opens the iOS simulator.

## Smoke checklist

- [ ] App boots in iOS simulator, no red-screen errors
- [ ] Home renders trip form, fonts load
- [ ] Place autocomplete: typing "Lis" shows suggestions from Google Places
- [ ] Submit form → results screen loads with listings
- [ ] Tap save (heart) on a listing → state toggles; reload app → still saved (AsyncStorage)
- [ ] Tap a listing card → opens external URL in Safari
- [ ] Sort dropdown changes order
- [ ] Supabase smoke: temporarily add the `/_supabase-smoke` route described in `docs/superpowers/plans/2026-05-18-expo-router-port.md` Task 4.2 Step 3; expect "session: none" with no errors
- [ ] No console errors in Metro logs (warnings okay)

## Known limitations (out of scope)

- No sign-in UI (deferred)
- No push notifications, no deep links beyond basic Expo Router scheme
- Android only verified to build; not visually QA'd

## If something fails

Open a comment on PR `feat/expo-port` with:
- Exact step that failed
- Metro log excerpt
- Screenshot of the simulator
- Output of `npx expo-doctor`
```

- [ ] Commit: `git commit -m "Add iOS smoke handoff doc for MacBook Pro"`

### Task 13.4: `CONTRIBUTING.md`

- [ ] **Step 1**: grep for `next`, `Next.js` in `CONTRIBUTING.md`
- [ ] **Step 2**: replace references; commit if changed.

---

## Phase 14 — Spike 5: iOS sim smoke on MacBook Pro

**This phase runs on Ikki's MacBook Pro, not on WSL.** Hand off cleanly.

- [ ] **Step 1**: Ikki opens PR for `feat/expo-port`, requests review, shares link with Claude-on-MBP.
- [ ] **Step 2**: Claude-on-MBP reads `docs/mobile-handoff.md` and runs the smoke checklist.
- [ ] **Step 3**: Claude-on-MBP reports back in PR comments. Failures → follow-up tasks; all green → approve merge.

---

## Self-review checklist

- [ ] **Spec coverage**: every section of `docs/superpowers/specs/2026-05-18-expo-router-port-design.md` maps to at least one phase.
- [ ] **No placeholders**: search this plan for `TBD`, `TODO:`, `fill in`, `etc.` — none should appear except inside code comments meant to ship (`// TODO Phase 9` stubs are intentional and explicit).
- [ ] **Type consistency**: `SearchTripInput`, `SearchTripResult`, `ParsedTrip`, `KvStore`, `Prediction` defined exactly once.
- [ ] **File-path consistency**: `src/server/search/pipeline.ts`, `src/client/_base.ts`, `src/lib/kv-store.ts` — used identically everywhere.
- [ ] **Commit-message convention**: every commit step is a single-line subject, no body, no `Co-authored-by`.

---

## Execution handoff

Plan complete and saved. Two execution options:

1. **Subagent-Driven (recommended)** — dispatch a fresh subagent per task, review between tasks, fast iteration. Best for the high-risk Phase 1 spike.
2. **Inline Execution** — execute tasks in this session using `executing-plans`, batch with checkpoints for review. Closer to a single linear narrative; less parallelism.

Which approach?
