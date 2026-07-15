import { ImagePlus } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import fireMage from "../assets/member-fire-mage.jpg";
import paladin from "../assets/member-paladin.jpg";
import priest from "../assets/member-priest.jpg";
import { getCurrentUser } from "../services/auth";
import { getProfile, listShowcaseProfiles, updateShowcaseProfile, uploadShowcaseImage } from "../services/profiles";
import type { Profile } from "../types";
import { ErrorState } from "./ErrorState";
import { Field } from "./Field";
import { SectionTitle } from "./SectionTitle";

const defaultMembers = [
  { id: "fire-mage", name: "火的很蒂法", caption: "侏儒法师 · 火焰 / 爆发", image: fireMage, x: 50, y: 18 },
  { id: "paladin", name: "灰烬之心", caption: "圣骑士 · 防护 / 神圣", image: paladin, x: 58, y: 10 },
  { id: "priest", name: "清风袭人", caption: "牧师 · 治疗 / 信仰", image: priest, x: 54, y: 14 },
];

export function GuildMemberShowcase() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [positionX, setPositionX] = useState(50);
  const [positionY, setPositionY] = useState(50);
  const [caption, setCaption] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function refresh() {
    const rows = await listShowcaseProfiles(12);
    setProfiles(rows);
    const user = await getCurrentUser();
    if (!user) return;
    const profile = await getProfile(user.id);
    setCurrentProfile(profile);
    setPositionX(profile?.showcase_position_x ?? 50);
    setPositionY(profile?.showcase_position_y ?? 50);
    setCaption(profile?.showcase_caption ?? "");
  }

  useEffect(() => {
    refresh().catch(() => setProfiles([]));
  }, []);

  useEffect(() => {
    if (!file) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    if (!currentProfile || saving) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const showcase_image_url = file
        ? await uploadShowcaseImage(currentProfile.id, file)
        : currentProfile.showcase_image_url;
      if (!showcase_image_url) throw new Error("请先选择一张展示图片。");
      await updateShowcaseProfile(currentProfile.id, {
        showcase_image_url,
        showcase_position_x: positionX,
        showcase_position_y: positionY,
        showcase_caption: caption.trim(),
      });
      setFile(null);
      setMessage("成员展示图已更新。");
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "上传失败，请稍后再试。");
    } finally {
      setSaving(false);
    }
  }

  const uploadedMembers = profiles.map((profile) => ({
    id: profile.id,
    name: profile.display_name,
    caption: profile.showcase_caption || "八块腹肌工会成员",
    image: profile.showcase_image_url!,
    x: profile.showcase_position_x ?? 50,
    y: profile.showcase_position_y ?? 50,
  }));
  const members = [...uploadedMembers, ...defaultMembers];
  const previewImage = preview || currentProfile?.showcase_image_url || "";

  return (
    <section className="space-y-3">
      <SectionTitle eyebrow="Members" title="工会成员展示" />
      {currentProfile ? (
        <details className="guild-card">
          <summary className="cursor-pointer list-none font-black text-guild-ink">
            <span className="inline-flex items-center gap-2"><ImagePlus className="h-4 w-4 text-guild-gold" /> 上传我的展示图</span>
          </summary>
          <form className="mt-4 grid gap-3 md:grid-cols-[160px_1fr]" onSubmit={handleSave}>
            <div className="aspect-[4/5] overflow-hidden rounded-md bg-guild-panelSoft">
              {previewImage ? <img alt="展示图裁切预览" className="h-full w-full object-cover" src={previewImage} style={{ objectPosition: `${positionX}% ${positionY}%` }} /> : <div className="grid h-full place-items-center text-sm text-guild-muted">选择图片预览</div>}
            </div>
            <div className="grid content-start gap-3">
              <label className="guild-button-secondary cursor-pointer">
                选择图片
                <input accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => setFile(event.target.files?.[0] ?? null)} type="file" />
              </label>
              <p className="text-xs text-guild-muted">支持 JPG、PNG、WebP；原图不超过 8MB，上传前自动压缩到 1.5MB 内。</p>
              <Field label={`左右位置 ${positionX}%`}><input className="w-full accent-guild-gold" max={100} min={0} onChange={(event) => setPositionX(Number(event.target.value))} type="range" value={positionX} /></Field>
              <Field label={`上下位置 ${positionY}%`}><input className="w-full accent-guild-gold" max={100} min={0} onChange={(event) => setPositionY(Number(event.target.value))} type="range" value={positionY} /></Field>
              <Field label="展示说明（选填）"><input className="guild-input" maxLength={40} onChange={(event) => setCaption(event.target.value)} placeholder="例如：圣骑士 · 防护" value={caption} /></Field>
              <button className="guild-button" disabled={saving}>{saving ? "处理中" : "保存到成员展示"}</button>
              {message ? <p className="text-sm font-bold text-emerald-700">{message}</p> : null}
              {error ? <ErrorState message={error} /> : null}
            </div>
          </form>
        </details>
      ) : null}
      <div className="overflow-hidden rounded-guild">
        <div className="member-scroll-track flex w-max gap-3 py-1 hover:[animation-play-state:paused]">
          {[...members, ...members].map((member, index) => (
            <article aria-hidden={index >= members.length} className="w-[min(76vw,270px)] shrink-0 overflow-hidden rounded-guild border border-guild-line bg-white/80 shadow-glow" key={`${member.id}-${index}`}>
              <div className="relative aspect-[4/5] overflow-hidden">
                <img alt={index < members.length ? `${member.name} 成员展示` : ""} className="h-full w-full object-cover" decoding="async" loading="lazy" src={member.image} style={{ objectPosition: `${member.x}% ${member.y}%` }} />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-guild-ink/90 via-guild-ink/45 to-transparent p-4 text-white">
                  <h3 className="text-lg font-black">{member.name}</h3>
                  <p className="mt-1 text-xs opacity-85">{member.caption}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
