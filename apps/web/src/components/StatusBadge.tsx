type StatusBadgeProps = {
  children: string;
};

export function StatusBadge({ children }: StatusBadgeProps) {
  return (
    <span className="inline-flex rounded-full border border-guild-line bg-white/80 px-2.5 py-1 text-xs font-semibold text-guild-gold shadow-sm">
      {children}
    </span>
  );
}
