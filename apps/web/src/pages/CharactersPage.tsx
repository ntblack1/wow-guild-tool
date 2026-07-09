import { FormEvent, useEffect, useState } from "react";
import { EmptyState } from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";
import { Field } from "../components/Field";
import { LoadingState } from "../components/LoadingState";
import { isSupabaseConfigured } from "../lib/supabase";
import { getCurrentUser } from "../services/auth";
import { createCharacter, deleteCharacter, listCharacters, updateCharacter } from "../services/characters";
import { combatRoles, type CharacterInput, type GuildCharacter } from "../types";

const initialInput: CharacterInput = {
  name: "",
  class_name: "",
  spec: "",
  combat_role: "DPS",
  item_level: null,
  note: "",
};

export function CharactersPage() {
  const [userId, setUserId] = useState("");
  const [characters, setCharacters] = useState<GuildCharacter[]>([]);
  const [input, setInput] = useState<CharacterInput>(initialInput);
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState("");

  async function refresh() {
    const user = await getCurrentUser();
    if (!user) {
      setUserId("");
      setCharacters([]);
      return;
    }
    setUserId(user.id);
    setCharacters(await listCharacters(user.id));
  }

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    refresh()
      .catch((caught) => setError(caught instanceof Error ? caught.message : "读取角色失败"))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!userId) return;
    setError("");
    try {
      if (editingId) {
        await updateCharacter(editingId, input);
      } else {
        await createCharacter(userId, input);
      }
      setInput(initialInput);
      setEditingId("");
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "保存角色失败");
    }
  }

  if (!isSupabaseConfigured) return <ErrorState message="请先配置 Supabase 环境变量。" />;
  if (loading) return <LoadingState />;

  return (
    <section className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-guild-muted">角色名册</p>
        <h1 className="text-3xl font-black text-guild-ink">我的角色</h1>
      </div>
      {!userId ? <ErrorState message="请先登录后再管理角色。" /> : null}
      {error ? <ErrorState message={error} /> : null}
      <form className="guild-card grid gap-3" onSubmit={handleSubmit}>
        <Field label="角色名">
          <input className="guild-input" value={input.name} onChange={(e) => setInput({ ...input, name: e.target.value })} required />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="职业">
            <input className="guild-input" value={input.class_name} onChange={(e) => setInput({ ...input, class_name: e.target.value })} required />
          </Field>
          <Field label="天赋">
            <input className="guild-input" value={input.spec} onChange={(e) => setInput({ ...input, spec: e.target.value })} required />
          </Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="职责">
            <select className="guild-input" value={input.combat_role} onChange={(e) => setInput({ ...input, combat_role: e.target.value as CharacterInput["combat_role"] })}>
              {combatRoles.map((role) => <option key={role}>{role}</option>)}
            </select>
          </Field>
          <Field label="装等">
            <input className="guild-input" type="number" value={input.item_level ?? ""} onChange={(e) => setInput({ ...input, item_level: e.target.value ? Number(e.target.value) : null })} />
          </Field>
        </div>
        <Field label="备注">
          <textarea className="guild-input" value={input.note ?? ""} onChange={(e) => setInput({ ...input, note: e.target.value })} rows={3} />
        </Field>
        <div className="flex gap-2">
          <button className="guild-button flex-1" disabled={!userId}>{editingId ? "保存修改" : "保存角色"}</button>
          {editingId ? (
            <button className="guild-button-secondary" type="button" onClick={() => { setEditingId(""); setInput(initialInput); }}>
              取消
            </button>
          ) : null}
        </div>
      </form>
      <div className="space-y-3">
        {characters.length ? characters.map((character) => (
          <article className="guild-card" key={character.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-black text-guild-ink">{character.name}</h2>
                <p className="mt-1 text-sm text-guild-muted">
                  {character.class_name} · {character.spec} · {character.combat_role}
                  {character.item_level ? ` · ${character.item_level}` : ""}
                </p>
                {character.note ? <p className="mt-2 text-sm">{character.note}</p> : null}
              </div>
              <div className="flex shrink-0 flex-col gap-2">
                <button
                  className="guild-button-secondary min-h-9"
                  onClick={() => {
                    setEditingId(character.id);
                    setInput({
                      name: character.name,
                      class_name: character.class_name,
                      spec: character.spec,
                      combat_role: character.combat_role,
                      item_level: character.item_level,
                      note: character.note,
                    });
                  }}
                  type="button"
                >
                  编辑
                </button>
                <button className="guild-button-secondary min-h-9" onClick={() => void deleteCharacter(character.id).then(refresh)}>删除</button>
              </div>
            </div>
          </article>
        )) : <EmptyState title="还没有角色" description="先登记一个常用角色，报名时就能直接选择。" />}
      </div>
    </section>
  );
}
