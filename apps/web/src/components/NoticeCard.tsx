import { Megaphone } from "lucide-react";
import { Link } from "react-router-dom";
import type { Post } from "../types";
import { GuildCard } from "./GuildCard";

type NoticeCardProps = {
  post: Post | null;
};

export function NoticeCard({ post }: NoticeCardProps) {
  return (
    <GuildCard className="bg-guild-panelSoft/85">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-white text-guild-gold shadow-sm">
          <Megaphone className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-guild-muted">工会公告</p>
          {post ? (
            <Link className="block" to={`/forum/${post.id}`}>
              <h3 className="mt-1 line-clamp-2 font-black text-guild-ink">{post.title}</h3>
              <p className="mt-2 line-clamp-2 text-sm text-guild-muted">{post.body}</p>
              <span className="mt-3 inline-flex text-xs font-bold text-guild-gold">查看公告 →</span>
            </Link>
          ) : (
            <>
              <h3 className="mt-1 font-black text-guild-ink">暂无工会公告</h3>
              <Link className="mt-3 inline-flex text-xs font-bold text-guild-gold" to="/forum">前往论坛 →</Link>
            </>
          )}
        </div>
      </div>
    </GuildCard>
  );
}
