type EmptyStateProps = {
  title: string;
  description: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="guild-card text-center">
      <div className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-[22px] bg-guild-blueSoft text-2xl">✦</div>
      <h3 className="text-base font-black text-guild-ink">{title}</h3>
      <p className="mt-2 text-sm text-guild-muted">{description}</p>
    </div>
  );
}
