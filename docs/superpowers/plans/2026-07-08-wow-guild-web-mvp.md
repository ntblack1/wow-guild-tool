# Wow Guild Web MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first React + Vite + Tailwind + Supabase MVP for 八块腹肌工会 activity signup and forum usage.

**Architecture:** Add a new workspace package at `apps/web` and leave existing miniapp/server code untouched. The app uses React Router for pages, Supabase client-side CRUD for auth/data, and Supabase RLS for real permission enforcement.

**Tech Stack:** React, Vite, TypeScript, Tailwind CSS, Supabase JS, Vitest, Testing Library, Cloudflare Pages.

---

## File Structure

- `apps/web/package.json`: web workspace scripts and dependencies.
- `apps/web/index.html`: Vite entry HTML.
- `apps/web/vite.config.ts`: Vite config with React and Vitest.
- `apps/web/tsconfig.json`: web TypeScript config.
- `apps/web/tailwind.config.js`, `apps/web/postcss.config.js`: Tailwind build config.
- `apps/web/src/main.tsx`: React root.
- `apps/web/src/App.tsx`: route shell and layout.
- `apps/web/src/types.ts`: Supabase-facing domain types and literal values.
- `apps/web/src/lib/supabase.ts`: Supabase client and missing-config guard.
- `apps/web/src/services/*.ts`: CRUD service functions.
- `apps/web/src/components/*.tsx`: reusable layout, form, and state components.
- `apps/web/src/pages/*.tsx`: route pages.
- `apps/web/src/test/*.test.ts`: focused service helper tests.
- `supabase/schema.sql`: SQL tables, indexes, triggers, and RLS policies.
- `.env.example`: add Vite Supabase public variables.
- `package.json`: add root web scripts.
- `README.md`: replace old startup guidance with web/Supabase/Cloudflare instructions.

## Task 1: Scaffold Web Package

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/index.html`
- Create: `apps/web/vite.config.ts`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/tailwind.config.js`
- Create: `apps/web/postcss.config.js`
- Create: `apps/web/src/main.tsx`
- Create: `apps/web/src/styles.css`
- Modify: `package.json`
- Modify: `.env.example`

- [ ] **Step 1: Create the web package and build config**

Create a Vite React app package named `@wow-guild-tool/web`, with scripts `dev`, `build`, `preview`, and `test`.

- [ ] **Step 2: Create a minimal root**

Create `src/main.tsx` rendering a temporary `八块腹肌工会` heading and import `styles.css`.

- [ ] **Step 3: Add root scripts**

Add `dev:web`, `build:web`, and `test:web` to root `package.json`. Update root `build` and `test` to include the web app.

- [ ] **Step 4: Verify the scaffold**

Run `npm install` if dependencies are missing, then run `npm run build:web`.

## Task 2: Add Types, Supabase Client, and Tests

**Files:**
- Create: `apps/web/src/types.ts`
- Create: `apps/web/src/lib/supabase.ts`
- Create: `apps/web/src/services/format.ts`
- Create: `apps/web/src/test/format.test.ts`

- [ ] **Step 1: Define literal values and domain types**

Add roles, event statuses, signup statuses, forum categories, combat roles, and table row/input types.

- [ ] **Step 2: Add Supabase client guard**

Create a client only when `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` exist, and export a boolean `isSupabaseConfigured`.

- [ ] **Step 3: Add small deterministic helper tests**

Test date formatting and roster grouping helpers without requiring Supabase credentials.

- [ ] **Step 4: Verify tests**

Run `npm run test:web`.

## Task 3: Implement Layout and Routes

**Files:**
- Create: `apps/web/src/components/AppLayout.tsx`
- Create: `apps/web/src/components/EmptyState.tsx`
- Create: `apps/web/src/components/StatusBadge.tsx`
- Modify: `apps/web/src/App.tsx`
- Create: `apps/web/src/pages/HomePage.tsx`
- Create: `apps/web/src/pages/AuthPage.tsx`
- Create: `apps/web/src/pages/CharactersPage.tsx`
- Create: `apps/web/src/pages/EventsPage.tsx`
- Create: `apps/web/src/pages/EventDetailPage.tsx`
- Create: `apps/web/src/pages/ForumPage.tsx`
- Create: `apps/web/src/pages/PostDetailPage.tsx`

- [ ] **Step 1: Create mobile-first app shell**

Add top navigation, guild hall background, and three primary entries: 活动报名、工会论坛、我的角色.

- [ ] **Step 2: Create placeholder route pages**

Each route renders a title, short empty/config state, and real navigation links.

- [ ] **Step 3: Verify route build**

Run `npm run build:web`.

## Task 4: Implement Supabase CRUD Services

**Files:**
- Create: `apps/web/src/services/auth.ts`
- Create: `apps/web/src/services/profiles.ts`
- Create: `apps/web/src/services/characters.ts`
- Create: `apps/web/src/services/events.ts`
- Create: `apps/web/src/services/signups.ts`
- Create: `apps/web/src/services/posts.ts`
- Create: `apps/web/src/services/comments.ts`

- [ ] **Step 1: Add auth/profile helpers**

Read current session, login by email OTP/password-compatible auth call, logout, and load/upsert profile.

- [ ] **Step 2: Add character CRUD**

List current user's characters, create/update/delete one character.

- [ ] **Step 3: Add event and signup CRUD**

List events, create event for admin/leader UI, fetch event detail, create signup, update signup status.

- [ ] **Step 4: Add forum CRUD**

List posts, create post, fetch post detail, create comment, toggle pin.

- [ ] **Step 5: Verify typecheck**

Run `npm run build:web`.

## Task 5: Wire Pages to CRUD

**Files:**
- Modify: `apps/web/src/pages/*.tsx`
- Create: `apps/web/src/components/Field.tsx`
- Create: `apps/web/src/components/LoadingState.tsx`
- Create: `apps/web/src/components/ErrorState.tsx`

- [ ] **Step 1: Wire auth state**

Show login form when unauthenticated and member actions when authenticated.

- [ ] **Step 2: Wire character management**

Create, edit, delete, and list current user's characters.

- [ ] **Step 3: Wire activity flow**

List events, create events for admin/leader, signup with a selected character, and group roster by T/N/DPS.

- [ ] **Step 4: Wire forum flow**

Create posts, show latest posts, show comments, and add comments.

- [ ] **Step 5: Verify build and tests**

Run `npm run test:web` and `npm run build:web`.

## Task 6: Add Supabase SQL and Documentation

**Files:**
- Create: `supabase/schema.sql`
- Modify: `README.md`

- [ ] **Step 1: Write Supabase SQL**

Create `profiles`, `characters`, `events`, `signups`, `posts`, and `comments` with constraints, indexes, triggers, and RLS policies.

- [ ] **Step 2: Write README**

Document local setup, Supabase project configuration, SQL execution, admin promotion SQL, and Cloudflare Pages deployment settings.

- [ ] **Step 3: Final verification**

Run root `npm run test` and `npm run build`. If legacy workspaces prevent root verification, run and report `npm run test:web` and `npm run build:web`.

## Self-Review

- Spec coverage: app scaffold, routes, Supabase connection, CRUD, SQL, README, mobile guild hall styling, and Cloudflare Pages docs are covered.
- Placeholder scan: no implementation placeholder is intended as final code; steps point to concrete files and verification commands.
- Type consistency: table names and enum-like string values are centralized in `apps/web/src/types.ts`.
