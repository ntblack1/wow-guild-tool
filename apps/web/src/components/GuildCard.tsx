import type { ReactNode } from "react";

type GuildCardProps = {
  children: ReactNode;
  className?: string;
};

export function GuildCard({ children, className = "" }: GuildCardProps) {
  return <div className={`guild-card ${className}`}>{children}</div>;
}
