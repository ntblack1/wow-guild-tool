# Miniapp Wow UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework the core WeChat mini program pages into the approved high-fantasy guild UI style with project-local Q-version artwork.

**Architecture:** Keep all business APIs and page behaviors unchanged. Add small frontend presentation helpers to compute visual classes, image paths, role needs, and progress values, then consume those fields from existing WXML pages. Store generated artwork under the miniapp asset tree and reference it with static paths.

**Tech Stack:** Native WeChat mini program WXML/WXSS/JS, Node `node:test`, existing npm workspace scripts, built-in image generation for raster assets.

---

### Task 1: Add Presentation Helpers With Tests

**Files:**
- Create: `apps/miniapp/utils/theme.js`
- Create: `apps/miniapp/test/theme.test.js`

- [ ] **Step 1: Write the failing helper tests**

Create `apps/miniapp/test/theme.test.js` with tests for role classes, event images, status classes, signup progress, and role need summaries.

```js
const assert = require("node:assert/strict");
const { test } = require("node:test");

const {
  buildRoleNeeds,
  eventArtwork,
  eventProgress,
  roleClass,
  statusClass
} = require("../utils/theme");

test("maps role types to stable visual classes", () => {
  assert.equal(roleClass("tank"), "role-tank");
  assert.equal(roleClass("healer"), "role-healer");
  assert.equal(roleClass("melee"), "role-melee");
  assert.equal(roleClass("ranged"), "role-ranged");
  assert.equal(roleClass("unknown"), "role-ranged");
});

test("maps event statuses to stable badge classes", () => {
  assert.equal(statusClass("signup_open"), "status-open");
  assert.equal(statusClass("signup_locked"), "status-locked");
  assert.equal(statusClass("finished"), "status-finished");
  assert.equal(statusClass("draft"), "status-draft");
});

test("chooses deterministic raid artwork from raid name", () => {
  assert.equal(eventArtwork({ raidName: "幽暗渊喉" }), "/assets/images/raid-abyss.png");
  assert.equal(eventArtwork({ raidName: "烈焰熔炉" }), "/assets/images/raid-forge.png");
  assert.equal(eventArtwork({ raidName: "风暴王座" }), "/assets/images/raid-storm.png");
  assert.equal(eventArtwork({ raidName: "未知副本" }), "/assets/images/raid-abyss.png");
});

test("calculates capped signup progress percentage", () => {
  assert.equal(eventProgress({ signedCount: 20, maxPlayers: 40 }), 50);
  assert.equal(eventProgress({ signedCount: 60, maxPlayers: 40 }), 100);
  assert.equal(eventProgress({ signedCount: 3, maxPlayers: 0 }), 0);
});

test("builds role need summary for event detail", () => {
  const needs = buildRoleNeeds({
    tankNeed: 2,
    healerNeed: 5,
    meleeNeed: 8,
    rangedNeed: 10
  }, {
    tankSigned: 1,
    healerSigned: 5,
    meleeSigned: 6,
    rangedSigned: 11
  });

  assert.deepEqual(needs, [
    { key: "tank", label: "坦克", current: 1, need: 2, gap: 1, className: "role-tank" },
    { key: "healer", label: "治疗", current: 5, need: 5, gap: 0, className: "role-healer" },
    { key: "melee", label: "近战", current: 6, need: 8, gap: 2, className: "role-melee" },
    { key: "ranged", label: "远程", current: 11, need: 10, gap: 0, className: "role-ranged" }
  ]);
});
```

- [ ] **Step 2: Run tests to verify RED**

Run: `node --test apps/miniapp/test/theme.test.js`

Expected: FAIL with module not found for `../utils/theme`.

- [ ] **Step 3: Implement minimal helper module**

Create `apps/miniapp/utils/theme.js` exporting the tested functions. Keep it dependency-free.

- [ ] **Step 4: Run tests to verify GREEN**

Run: `node --test apps/miniapp/test/theme.test.js`

Expected: PASS.

### Task 2: Generate And Persist Project Artwork

**Files:**
- Create directory: `apps/miniapp/assets/images/`
- Create: `apps/miniapp/assets/images/style-board.png`
- Create: `apps/miniapp/assets/images/hero-guild-hall.png`
- Create: `apps/miniapp/assets/images/raid-abyss.png`
- Create: `apps/miniapp/assets/images/raid-forge.png`
- Create: `apps/miniapp/assets/images/raid-storm.png`
- Create: `apps/miniapp/assets/images/chibi-roles.png`

- [ ] **Step 1: Generate project-bound images**

Use the built-in image generation tool. Prompts must request original high-fantasy art, cute Q-version characters, no logos, no watermark, and no real game characters.

- [ ] **Step 2: Copy selected images into the miniapp assets directory**

Copy the chosen generated PNG files into `apps/miniapp/assets/images/` with the filenames listed above.

- [ ] **Step 3: Inspect image files**

Run: `Get-ChildItem -LiteralPath 'apps\miniapp\assets\images' | Format-Table Name,Length`

Expected: all six image files exist and have non-zero size.

### Task 3: Wire Presentation Data Into Pages

**Files:**
- Modify: `apps/miniapp/pages/index/index.js`
- Modify: `apps/miniapp/pages/event-detail/index.js`
- Modify: `apps/miniapp/pages/my/index.js`

- [ ] **Step 1: Add tests for page presentation mapping**

Extend existing page tests or add focused tests to assert that mapped events/characters include `artwork`, `statusClass`, `progress`, and `roleClassName`.

- [ ] **Step 2: Run tests to verify RED**

Run: `node --test apps/miniapp/test/*.test.js`

Expected: new assertions fail because page data has not been enriched yet.

- [ ] **Step 3: Import helpers and enrich data**

Use `eventArtwork`, `eventProgress`, `statusClass`, `roleClass`, and `buildRoleNeeds` in page JS. Do not change service calls or navigation behavior.

- [ ] **Step 4: Run tests to verify GREEN**

Run: `node --test apps/miniapp/test/*.test.js`

Expected: PASS.

### Task 4: Apply Global Fantasy Theme

**Files:**
- Modify: `apps/miniapp/app.wxss`
- Modify: `apps/miniapp/app.json`

- [ ] **Step 1: Update global styles**

Replace the gray default theme with dark background, gold panels, themed buttons, inputs, badges, role chips, progress bars, and empty states.

- [ ] **Step 2: Update miniapp chrome colors**

Set navigation and tab colors to match the approved dark gold visual direction.

- [ ] **Step 3: Syntax smoke check**

Run: `node --check apps/miniapp/app.js`

Expected: PASS.

### Task 5: Restyle Core Pages

**Files:**
- Modify: `apps/miniapp/pages/index/index.wxml`
- Modify: `apps/miniapp/pages/index/index.wxss`
- Modify: `apps/miniapp/pages/event-detail/index.wxml`
- Modify: `apps/miniapp/pages/event-detail/index.wxss`
- Modify: `apps/miniapp/pages/signup/index.wxml`
- Modify: `apps/miniapp/pages/signup/index.wxss`
- Modify: `apps/miniapp/pages/my/index.wxml`
- Modify: `apps/miniapp/pages/my/index.wxss`

- [ ] **Step 1: Restyle homepage as guild activity hall**

Use hero artwork, event cards, status badges, progress bars, and raid thumbnails.

- [ ] **Step 2: Restyle event detail as raid report**

Use raid hero art, role need chips, signup stats, and themed action buttons.

- [ ] **Step 3: Restyle signup page as sortie selection**

Keep form behavior unchanged; theme member warning, role picker, note field, and submit button.

- [ ] **Step 4: Restyle my page as character roster**

Use character list cards with role chips, item level, main-character marker, and themed edit actions.

- [ ] **Step 5: Run miniapp JS syntax checks**

Run: `node --check apps/miniapp/pages/index/index.js`

Run: `node --check apps/miniapp/pages/event-detail/index.js`

Run: `node --check apps/miniapp/pages/signup/index.js`

Run: `node --check apps/miniapp/pages/my/index.js`

Expected: all PASS.

### Task 6: Document UI Work And Verify

**Files:**
- Modify: `docs/tasks/T016-miniapp-basic-pages.md`

- [ ] **Step 1: Update task documentation**

Add an acceptance note that the core miniapp pages now use the approved fantasy guild theme and project-local Q-version artwork.

- [ ] **Step 2: Run full verification**

Run: `npm run test`

Expected: exit 0.

Run: `npm run build`

Expected: exit 0.

- [ ] **Step 3: Report any environment blockers**

If either command fails due to existing unrelated environment issues, record the exact command and reason in the final response.

---

## Self-Review

- Spec coverage: Tasks cover assets, helper data, global theme, homepage, event detail, signup, my page, docs, tests, and build.
- Placeholder scan: No `TBD`, `TODO`, or undefined follow-up steps remain.
- Scope check: No backend, Prisma, login, payment, permission, ranking, or poster work is included.
