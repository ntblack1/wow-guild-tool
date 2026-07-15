import { UserRound } from "lucide-react";

type CharacterAvatarProps = {
  name: string;
  avatarUrl?: string | null;
  className?: string;
};

export function CharacterAvatar({ name, avatarUrl, className = "h-10 w-10" }: CharacterAvatarProps) {
  if (avatarUrl) {
    return (
      <img
        alt={`${name} 的头像`}
        className={`${className} shrink-0 rounded-full border border-white/80 object-cover shadow-sm`}
        src={avatarUrl}
      />
    );
  }

  return (
    <span className={`${className} grid shrink-0 place-items-center rounded-full bg-guild-blueSoft text-sm font-black text-guild-ink shadow-sm`}>
      {name ? name.slice(0, 1) : <UserRound className="h-4 w-4" />}
    </span>
  );
}
