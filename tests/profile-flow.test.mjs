import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const source = (path) => readFile(new URL(path, root), "utf8");

test("shares one profile state across onboarding and dashboard", async () => {
  const [layout, onboarding, profileHook] = await Promise.all([
    source("app/layout.tsx"),
    source("app/onboarding/page.tsx"),
    source("hooks/use-profile.ts"),
  ]);

  assert.match(layout, /<ProfileProvider>/);
  assert.match(profileHook, /createContext<ProfileContextValue/);
  assert.match(onboarding, /await refresh\(\);router\.replace\("\/dashboard"\)/);
});

test("finishes the account before marking onboarding complete", async () => {
  const onboarding = await source("app/onboarding/page.tsx");
  const submitStart = onboarding.indexOf("const submit=");
  const createIndex = onboarding.indexOf("await createAccount", submitStart);
  const profileIndex = onboarding.indexOf("await saveOnboarding", submitStart);

  assert.ok(createIndex > submitStart);
  assert.ok(profileIndex > createIndex);
});

test("shows portfolio navigation only for position workflows", async () => {
  const shell = await source("components/dashboard-shell.tsx");
  assert.match(shell, /style === "Investor" \|\| style === "Position trader"/);
  assert.match(shell, /visibleLinks = links\.filter/);
  assert.match(shell, /item\.href !== "\/dashboard\/portfolio" \|\| hasPositionWorkflow/);
});

test("opens the trade modal from the global new-trade link", async () => {
  const trades = await source("app/dashboard/trades/page.tsx");
  assert.match(trades, /searchParams\.get\("new"\) === "1"/);
  assert.match(trades, /setModal\(true\)/);
  assert.match(trades, /router\.replace\("\/dashboard\/trades"\)/);
});
