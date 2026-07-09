import { MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { formatDateTime } from "../services/format";
import type { Post } from "../types";
import { StatusBadge } from "./StatusBadge";

type ForumPostCardProps = {
  post: Post;
};

export function ForumPostCard({ post }: ForumPostCardProps) {
  return (
    <article className="guild-card">
      <Link to={`/forum/${post.id}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-1 text-xs font-bold text-guild-gold">
              <MessageCircle className="h-3.5 w-3.5" />
              {post.category}
            </p>
            <h2 className="mt-1 font-black text-guild-ink">{post.title}</h2>
            <p className="mt-1 line-clamp-2 text-sm text-guild-muted">{post.body}</p>
          </div>
          {post.is_pinned ? <StatusBadge>置顶</StatusBadge> : null}
        </div>
        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-guild-muted">
          <span>{post.author?.display_name ?? "匿名成员"}</span>
          <span>{formatDateTime(post.created_at)}</span>
          <span>{post.comment_count ?? 0} 条评论</span>
        </div>
      </Link>
    </article>
  );
}
