import { FormEvent, useEffect, useRef, useState } from "react";
import { ImagePlus, LogIn, Pencil, Trash2, X } from "lucide-react";
import { Link } from "react-router-dom";
import { CharacterAvatar } from "../components/CharacterAvatar";
import { EmptyState } from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";
import { Field } from "../components/Field";
import { LoadingState } from "../components/LoadingState";
import { isSupabaseConfigured } from "../lib/supabase";
import { authPath, getCurrentUser } from "../services/auth";
import { createCharacter, deleteCharacter, listCharacters, updateCharacter, uploadCharacterAvatar } from "../services/characters";
import { friendlyError } from "../services/errors";
import { validateImageFile } from "../services/images";
import { combatRoles, type CharacterInput, type GuildCharacter } from "../types";

const initialInput: CharacterInput = {
  name: "",
  class_name: "",
  spec: "",
  combat_role: "DPS",
  item_level: null,
  note: "",
  avatar_url: null,
  avatar_position_x: 50,
  avatar_position_y: 50,
};

const classNames = ["战士", "圣骑士", "猎人", "潜行者", "牧师", "死亡骑士", "萨满祭司", "法师", "术士", "武僧", "德鲁伊", "恶魔猎手", "唤魔师"];
const roleLabels = { T: "坦克", N: "治疗", DPS: "输出" } as const;

export function CharactersPage() {
  const [userId, setUserId] = useState("");
  const [characters, setCharacters] = useState<GuildCharacter[]>([]);
  const [input, setInput] = useState<CharacterInput>(initialInput);
  const [editingId, setEditingId] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  function resetForm() {
    setInput(initialInput);
    setEditingId("");
    setAvatarFile(null);
  }

  function handleAvatarSelection(file: File | null) {
    setError("");
    if (!file) {
      setAvatarFile(null);
      return;
    }
    try {
      validateImageFile(file);
      setAvatarFile(file);
    } catch (caught) {
      setAvatarFile(null);
      setError(friendlyError(caught, "图片无法使用。"));
    }
  }

  function startEditing(character: GuildCharacter) {
    setEditingId(character.id);
    setDeletingId("");
    setInput({
      name: character.name,
      class_name: character.class_name,
      spec: character.spec,
      combat_role: character.combat_role,
      item_level: character.item_level,
      note: character.note,
      avatar_url: character.avatar_url,
      avatar_position_x: character.avatar_position_x,
      avatar_position_y: character.avatar_position_y,
    });
    setAvatarFile(null);
    requestAnimationFrame(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

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

  async function retryRefresh() {
    setError("");
    try {
      await refresh();
    } catch (caught) {
      setError(friendlyError(caught, "读取角色失败，请稍后重试。"));
    }
  }

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    refresh()
      .catch((caught) => setError(friendlyError(caught, "读取角色失败，请稍后重试。")))
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
    const wasEditing = Boolean(editingId);
    try {
      let saved: GuildCharacter;
      if (editingId) {
        saved = await updateCharacter(editingId, input);
      } else {
        saved = await createCharacter(userId, input);
      }
      if (avatarFile) {
        try {
          const avatar_url = await uploadCharacterAvatar(userId, saved.id, avatarFile);
          await updateCharacter(saved.id, { ...input, avatar_url });
        } catch (caught) {
          resetForm();
          setError(`角色资料已保存，但头像上传失败：${friendlyError(caught, "请稍后重试。")}`);
          await refresh();
          return;
        }
      }
      resetForm();
      setMessage(wasEditing ? "角色已更新。" : "角色已创建，可以直接报名了。");
      await refresh();
    } catch (caught) {
      setError(friendlyError(caught, "保存角色失败，请稍后重试。"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(character: GuildCharacter) {
    if (saving) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await deleteCharacter(character.id, userId, character.avatar_url);
      if (editingId === character.id) resetForm();
      setDeletingId("");
      setMessage("角色已删除，相关活动报名也已移除。");
      await refresh();
    } catch (caught) {
      setError(friendlyError(caught, "删除角色失败，请稍后重试。"));
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
      {error ? <ErrorState message={error} onRetry={retryRefresh} /> : null}
      {message ? <p className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-700">{message}</p> : null}
      {!userId ? (
        <section className="guild-card grid gap-3 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-guild-panelSoft text-guild-gold">
            <LogIn className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-black text-guild-ink">登录后登记角色</h2>
            <p className="mt-1 text-sm text-guild-muted">角色只会保存在你的账号下，报名时可以直接选择。</p>
          </div>
          <Link className="guild-button" to={authPath("/characters")}>去登录或创建账号</Link>
        </section>
      ) : (
      <>
      <form className="guild-card grid scroll-mt-24 gap-3" onSubmit={handleSubmit} ref={formRef}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-black text-guild-ink">{editingId ? "编辑角色" : "登记新角色"}</h2>
          {editingId ? <button className="inline-flex items-center gap-1 text-xs font-bold text-guild-muted" onClick={resetForm} type="button"><X className="h-3.5 w-3.5" /> 取消编辑</button> : null}
        </div>
        <div className="flex items-center gap-3 rounded-md border border-guild-line bg-white/60 p-3">
          <CharacterAvatar avatarUrl={avatarPreview || input.avatar_url} className="h-14 w-14" name={input.name || "角"} positionX={input.avatar_position_x} positionY={input.avatar_position_y} />
          <label className="min-w-0 flex-1 cursor-pointer">
            <span className="inline-flex items-center gap-2 text-sm font-black text-guild-ink"><ImagePlus className="h-4 w-4 text-guild-gold" /> 角色头像（选填）</span>
            <span className="mt-1 block text-xs text-guild-muted">原图最大 8MB，上传前会自动压缩到 1.5MB 内</span>
            <input
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(event) => handleAvatarSelection(event.target.files?.[0] ?? null)}
              type="file"
            />
          </label>
        </div>
        {avatarPreview || input.avatar_url ? (
          <div className="grid gap-3 rounded-md border border-guild-line bg-white/55 p-3 sm:grid-cols-[128px_1fr]">
            <div className="grid place-items-center rounded-md bg-guild-panelSoft p-2">
              <CharacterAvatar avatarUrl={avatarPreview || input.avatar_url} className="h-28 w-28" name={input.name || "角"} positionX={input.avatar_position_x} positionY={input.avatar_position_y} />
            </div>
            <div className="grid content-center gap-3">
              <Field label={`头像左右位置 ${input.avatar_position_x}%`}>
                <input className="w-full accent-guild-gold" max={100} min={0} onChange={(event) => setInput({ ...input, avatar_position_x: Number(event.target.value) })} type="range" value={input.avatar_position_x} />
              </Field>
              <Field label={`头像上下位置 ${input.avatar_position_y}%`}>
                <input className="w-full accent-guild-gold" max={100} min={0} onChange={(event) => setInput({ ...input, avatar_position_y: Number(event.target.value) })} type="range" value={input.avatar_position_y} />
              </Field>
            </div>
          </div>
        ) : null}
        <Field label="角色名">
          <input className="guild-input" maxLength={20} value={input.name} onChange={(e) => setInput({ ...input, name: e.target.value })} required />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="职业">
            <select className="guild-input" value={input.class_name} onChange={(e) => setInput({ ...input, class_name: e.target.value })} required>
              <option disabled value="">选择职业</option>
              {input.class_name && !classNames.includes(input.class_name) ? <option>{input.class_name}</option> : null}
              {classNames.map((className) => <option key={className}>{className}</option>)}
            </select>
          </Field>
          <Field label="天赋">
            <input className="guild-input" maxLength={20} placeholder="例如：冰霜、防护" value={input.spec} onChange={(e) => setInput({ ...input, spec: e.target.value })} required />
          </Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="职责">
            <select className="guild-input" value={input.combat_role} onChange={(e) => setInput({ ...input, combat_role: e.target.value as CharacterInput["combat_role"] })}>
              {combatRoles.map((role) => <option key={role} value={role}>{roleLabels[role]}</option>)}
            </select>
          </Field>
          <Field label="装等">
            <input className="guild-input" max={999} min={0} type="number" value={input.item_level ?? ""} onChange={(e) => setInput({ ...input, item_level: e.target.value ? Number(e.target.value) : null })} />
          </Field>
        </div>
        <Field label="备注">
          <textarea className="guild-input" maxLength={120} value={input.note ?? ""} onChange={(e) => setInput({ ...input, note: e.target.value })} rows={2} />
        </Field>
        <div className="flex gap-2">
          <button className="guild-button flex-1" disabled={!userId || saving}>{saving ? "保存中" : editingId ? "保存修改" : "保存角色"}</button>
          {editingId ? <button className="guild-button-secondary" type="button" onClick={resetForm}>取消</button> : null}
        </div>
      </form>
      <div className="space-y-3">
        {characters.length ? characters.map((character) => (
          <article className="guild-card" key={character.id}>
            <div className="flex items-start gap-3">
              <CharacterAvatar avatarUrl={character.avatar_url} name={character.name} positionX={character.avatar_position_x} positionY={character.avatar_position_y} />
              <div className="min-w-0 flex-1">
                <h2 className="font-black text-guild-ink">{character.name}</h2>
                <p className="mt-1 text-sm text-guild-muted">
                  {character.class_name} · {character.spec} · {roleLabels[character.combat_role]}
                  {character.item_level ? ` · ${character.item_level}` : ""}
                </p>
                {character.note ? <p className="mt-2 text-sm">{character.note}</p> : null}
              </div>
              <div className="flex shrink-0 flex-col gap-2">
                <button
                  className="guild-button-secondary min-h-9"
                  onClick={() => startEditing(character)}
                  type="button"
                >
                  <Pencil className="h-3.5 w-3.5" /> 编辑
                </button>
                {deletingId === character.id ? (
                  <div className="grid gap-1 rounded-md border border-rose-200 bg-rose-50 p-2 text-center">
                    <p className="text-[11px] font-bold text-rose-600">会同时移除相关报名</p>
                    <button className="min-h-8 text-xs font-black text-rose-600" disabled={saving} onClick={() => void handleDelete(character)} type="button">确认删除</button>
                    <button className="min-h-8 text-xs font-bold text-guild-muted" onClick={() => setDeletingId("")} type="button">取消</button>
                  </div>
                ) : (
                  <button className="guild-button-secondary min-h-9 gap-1 text-rose-500" onClick={() => setDeletingId(character.id)} type="button"><Trash2 className="h-3.5 w-3.5" /> 删除</button>
                )}
              </div>
              </div>
          </article>
        )) : <EmptyState title="还没有角色" description="先登记一个常用角色，报名时就能直接选择。" />}
      </div>
      </>
      )}
    </section>
  );
}
