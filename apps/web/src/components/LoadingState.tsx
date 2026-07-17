type LoadingStateProps = {
  label?: string;
  compact?: boolean;
};

export function LoadingState({ label = "正在整理工会小纸条...", compact = false }: LoadingStateProps) {
  if (compact) {
    return <p aria-live="polite" className="py-4 text-center text-sm text-guild-muted" role="status">{label}</p>;
  }

  return (
    <div aria-live="polite" className="space-y-3" role="status">
      <p className="py-2 text-center text-sm text-guild-muted">{label}</p>
      <div aria-hidden="true" className="guild-card animate-pulse space-y-4 motion-reduce:animate-none">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="h-3 w-20 rounded-full bg-guild-line/70" />
            <div className="h-6 w-36 rounded-md bg-guild-line/80" />
          </div>
          <div className="h-7 w-16 rounded-full bg-guild-line/60" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-48 max-w-full rounded-full bg-guild-line/65" />
          <div className="h-3 w-40 max-w-[85%] rounded-full bg-guild-line/65" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="h-10 rounded-md bg-guild-blueSoft/70" />
          <div className="h-10 rounded-md bg-emerald-100/70" />
          <div className="h-10 rounded-md bg-rose-100/70" />
        </div>
      </div>
    </div>
  );
}
