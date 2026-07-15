import { FormEvent, useEffect, useState } from "react";
import { ImagePlus } from "lucide-react";
import { CharacterAvatar } from "../components/CharacterAvatar";
import { EmptyState } from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";
import { Field } from "../components/Field";
import { LoadingState } from "../components/LoadingState";
import { isSupabaseConfigured } from "../lib/supabase";
import { getCurrentUser } from "../services/auth";
import { createCharacter, deleteCharacter, listCharacters, updateCharacter, uploadCharacterAvatar } from "../services/characters";
import { combatRoles, type CharacterInput, type GuildCharacter } from "../types";

const initialInput: CharacterInput = {
  name: "",
  class_name: "",
  spec: "",
  combat_role: "DPS",
  item_level: null,
  note: "",
  avatar_url: null,
};

export function CharactersPage() {
  const [userId, setUserId] = useState("");
  const [characters, setCharacters] = useState<GuildCharacter[]>([]);
  const [input, setInput] = useState<CharacterInput>(initialInput);
  const [editingId, setEditingId] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
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

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreview("");
      return;
    }
    const preview = URL.createObjectURL(avatarFile);
    setAvatarPreview(preview);
    return () => URL.revokeObjectURL(preview);
  }, [avatarFile]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!userId || saving) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      let saved: GuildCharacter;
      if (editingId) {
        saved = await updateCharacter(editingId, input);
      } else {
        saved = await createCharacter(userId, input);
      }
      if (avatarFile) {
        const avatar_url = await uploadCharacterAvatar(userId, saved.id, avatarFile);
        await updateCharacter(saved.id, { ...input, avatar_url });
      }
      setInput(initialInput);
      setEditingId("");
      setAvatarFile(null);
      setMessage(editingId ? "角色已更新。" : "角色已创建，可以直接报名了。");
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "保存角色失败");
    } finally {
      setSaving(false);
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
      {message ? <p className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-700">{message}</p> : null}
      <form className="guild-card grid gap-3" onSubmit={handleSubmit}>
        <div className="flex items-center gap-3 rounded-md border border-guild-line bg-white/60 p-3">
          <CharacterAvatar avatarUrl={avatarPreview || input.avatar_url} className="h-14 w-14" name={input.name || "角"} />
          <label className="min-w-0 flex-1 cursor-pointer">
            <span className="inline-flex items-center gap-2 text-sm font-black text-guild-ink"><ImagePlus className="h-4 w-4 text-guild-gold" /> 角色头像（选填）</span>
            <span className="mt-1 block text-xs text-guild-muted">从手机相册选择 JPG、PNG 或 WebP，最大 2MB</span>
            <input
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(event) => setAvatarFile(event.target.files?.[0] ?? null)}
              type="file"
            />
          </label>
        </div>
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
          <button className="guild-button flex-1" disabled={!userId || saving}>{saving ? "保存中" : editingId ? "保存修改" : "保存角色"}</button>
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
            <div className="flex items-start gap-3">
              <CharacterAvatar avatarUrl={character.avatar_url} name={character.name} />
              <div className="min-w-0 flex-1">
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
                      avatar_url: character.avatar_url,
                    });
                    setAvatarFile(null);
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
