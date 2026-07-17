import { Check, HeartPulse, Shield, Swords } from "lucide-react";
import type { CombatRole, GuildCharacter } from "../types";
import { CharacterAvatar } from "./CharacterAvatar";

const roleTitles = { T: "坦克", N: "治疗", DPS: "输出" } as const;
const roleIcons = { T: Shield, N: HeartPulse, DPS: Swords } as const;
const signupRoles: CombatRole[] = ["T", "N", "DPS"];

type SignupEditorProps = {
  characters: GuildCharacter[];
  characterId: string;
  combatRole: CombatRole;
  note: string;
  submitting: boolean;
  submitLabel: string;
  hint: string;
  onCharacterSelect: (character: GuildCharacter) => void;
  onCombatRoleChange: (role: CombatRole) => void;
  onNoteChange: (note: string) => void;
  onSubmit: () => void;
};

export function SignupEditor({
  characters,
  characterId,
  combatRole,
  note,
  submitting,
  submitLabel,
  hint,
  onCharacterSelect,
  onCombatRoleChange,
  onNoteChange,
  onSubmit,
}: SignupEditorProps) {
  return (
    <div className="grid gap-3">
      <div>
        <p className="mb-2 text-sm font-bold text-guild-ink">1. 选择出战角色</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {characters.map((character) => {
            const Icon = roleIcons[character.combat_role];
            const selected = character.id === characterId;
            return (
              <button
                aria-pressed={selected}
                className={`flex min-h-16 items-center gap-3 rounded-md border p-3 text-left transition ${selected ? "border-guild-gold bg-guild-panelSoft" : "border-guild-line bg-white/70"}`}
                key={character.id}
                onClick={() => onCharacterSelect(character)}
                type="button"
              >
                <CharacterAvatar avatarUrl={character.avatar_url} className="h-10 w-10" name={character.name} positionX={character.avatar_position_x} positionY={character.avatar_position_y} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-black text-guild-ink">{character.name}</span>
                  <span className="flex items-center gap-1 truncate text-xs text-guild-muted"><Icon className="h-3.5 w-3.5 text-guild-gold" />{character.class_name} · {character.spec} · {roleTitles[character.combat_role]}</span>
                </span>
                {selected ? <Check className="h-5 w-5 shrink-0 text-emerald-600" /> : null}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <p className="mb-2 text-sm font-bold text-guild-ink">2. 选择本次职责</p>
        <div aria-label="本次活动职责" className="grid grid-cols-3 gap-2" role="group">
          {signupRoles.map((role) => {
            const Icon = roleIcons[role];
            const selected = combatRole === role;
            return (
              <button
                aria-pressed={selected}
                className={`flex min-h-12 items-center justify-center gap-1.5 rounded-md border px-2 text-sm font-black transition ${selected ? "border-guild-gold bg-guild-gold text-white shadow-soft" : "border-guild-line bg-white/70 text-guild-muted"}`}
                key={role}
                onClick={() => onCombatRoleChange(role)}
                type="button"
              >
                <Icon className="h-4 w-4" /> {roleTitles[role]}
              </button>
            );
          })}
        </div>
      </div>
      <details className="rounded-md border border-guild-line bg-white/60 p-3">
        <summary className="cursor-pointer text-sm font-bold text-guild-muted">补充备注（选填）</summary>
        <textarea
          className="guild-input mt-3"
          maxLength={120}
          onChange={(event) => onNoteChange(event.target.value)}
          placeholder="例如：可能晚到 10 分钟、可切治疗"
          rows={2}
          value={note}
        />
      </details>
      <button className="guild-button min-h-14 text-base" disabled={submitting || !characterId} onClick={onSubmit} type="button">
        {submitting ? "处理中" : submitLabel}
      </button>
      <p className="text-center text-xs text-guild-muted">{hint}</p>
    </div>
  );
}
