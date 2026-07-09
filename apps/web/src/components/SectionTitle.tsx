import type { ReactNode } from "react";

type SectionTitleProps = {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
};

export function SectionTitle({ eyebrow, title, action }: SectionTitleProps) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div>
        {eyebrow ? <p className="text-xs font-bold uppercase tracking-[0.18em] text-guild-gold">{eyebrow}</p> : null}
        <h2 className="mt-1 text-xl font-black text-guild-ink">{title}</h2>
      </div>
      {action}
    </div>
  );
}
