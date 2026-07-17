import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const schemaUrl = new URL("../supabase/schema.sql", import.meta.url);
const schema = await readFile(schemaUrl, "utf8");
const contentMigrationUrl = new URL("../supabase/migrations/20260717_forum_content_management.sql", import.meta.url);
const contentMigration = await readFile(contentMigrationUrl, "utf8");
const signupEditMigrationUrl = new URL("../supabase/migrations/20260718_update_own_signup.sql", import.meta.url);
const signupEditMigration = await readFile(signupEditMigrationUrl, "utf8");

test("Supabase schema delegates credentials to Supabase Auth", () => {
  assert.doesNotMatch(schema, /create table if not exists public\.guild_accounts/i);
  assert.match(schema, /drop table if exists public\.guild_accounts/i);
  assert.match(schema, /after insert on auth\.users/i);
});

test("Supabase schema never grants anonymous writes", () => {
  assert.doesNotMatch(schema, /for\s+(insert|update|delete|all)\s+to\s+anon/i);
  assert.match(schema, /for insert to authenticated[\s\S]*user_id = auth\.uid\(\)/i);
  assert.match(schema, /public\.is_guild_manager\(\)/i);
});

test("signed-in members can create events while management stays restricted", () => {
  assert.match(schema, /create policy "members create events"[\s\S]*created_by = auth\.uid\(\)/i);
  assert.match(schema, /create policy "managers update events"[\s\S]*public\.is_guild_manager\(\)/i);
});

test("every created RLS policy is dropped first so the schema can be rerun", () => {
  const createdPolicies = [...schema.matchAll(/create policy "([^"]+)"/g)].map((match) => match[1]);
  for (const policy of createdPolicies) {
    assert.match(schema, new RegExp(`drop policy if exists "${policy}"`));
  }
});

test("forum reply fields belong to comments in a clean database", () => {
  const postsTable = schema.match(/create table if not exists public\.posts \(([\s\S]*?)\n\);/i)?.[1] ?? "";
  const commentsTable = schema.match(/create table if not exists public\.comments \(([\s\S]*?)\n\);/i)?.[1] ?? "";

  assert.doesNotMatch(postsTable, /\b(parent_id|quoted_text)\b/i);
  assert.match(commentsTable, /parent_id uuid references public\.comments\(id\) on delete set null/i);
  assert.match(commentsTable, /quoted_text text/i);
});

test("one guild member occupies only one signup slot per event", () => {
  for (const sql of [schema, contentMigration]) {
    const cleanupPosition = sql.indexOf("with ranked_event_signups as");
    const indexPosition = sql.indexOf("create unique index if not exists signups_event_user_unique_idx");
    assert.ok(cleanupPosition >= 0 && cleanupPosition < indexPosition);
    assert.match(sql, /partition by event_id, user_id/i);
    assert.match(sql, /when '已确认' then 1/i);
    assert.match(sql, /duplicate_rank > 1/i);
  }
});

test("members cannot confirm their own signup during insertion", () => {
  for (const sql of [schema, contentMigration]) {
    assert.match(sql, /create policy "users create own signups"[\s\S]*status in \('已报名', '替补'\)/i);
    assert.match(sql, /characters\.id = character_id and characters\.user_id = auth\.uid\(\)/i);
    assert.match(sql, /events\.id = event_id and events\.status = 'open'/i);
  }
});

test("only guild managers can delete raid reports", () => {
  assert.match(schema, /create policy "managers delete reports"[\s\S]*for delete to authenticated[\s\S]*public\.is_guild_manager\(\)/i);
});

test("members can edit only safe fields on their own open-event signup", () => {
  for (const sql of [schema, signupEditMigration]) {
    const functionBody = sql.match(/create or replace function public\.update_own_signup[\s\S]*?as \$\$([\s\S]*?)\$\$/i)?.[1] ?? "";
    const assignments = functionBody.match(/update public\.signups as signup\s+set([\s\S]*?)\s+where/i)?.[1] ?? "";

    assert.match(functionBody, /signup\.user_id = auth\.uid\(\)/i);
    assert.match(functionBody, /character\.id = p_character_id and character\.user_id = auth\.uid\(\)/i);
    assert.match(functionBody, /guild_event\.id = signup\.event_id and guild_event\.status = 'open'/i);
    assert.match(assignments, /character_id = p_character_id/i);
    assert.match(assignments, /combat_role = p_combat_role/i);
    assert.match(assignments, /note =/i);
    assert.doesNotMatch(assignments, /\b(status|event_id|user_id)\s*=/i);
    assert.match(sql, /revoke all on function public\.update_own_signup\(uuid, uuid, text, text\) from public/i);
    assert.match(sql, /grant execute on function public\.update_own_signup\(uuid, uuid, text, text\) to authenticated/i);
  }
});
