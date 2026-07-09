type CharacterChipProps = {
  name: string;
  role: string;
};

export function CharacterChip({ name, role }: CharacterChipProps) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-white/75 px-3 py-1.5 text-sm font-semibold text-guild-ink shadow-sm">
      <span className="grid h-7 w-7 place-items-center rounded-full bg-guild-blueSoft text-xs">{name.slice(0, 1)}</span>
      {name}
      <span className="rounded-full bg-guild-panelSoft px-2 py-0.5 text-xs text-guild-muted">{role}</span>
    </span>
  );
}
