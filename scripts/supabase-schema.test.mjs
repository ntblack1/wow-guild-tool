import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const schemaUrl = new URL("../supabase/schema.sql", import.meta.url);
const schema = await readFile(schemaUrl, "utf8");

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
