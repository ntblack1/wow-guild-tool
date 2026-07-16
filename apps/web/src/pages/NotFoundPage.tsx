import { CalendarDays, Home, MessageCircle, SearchX } from "lucide-react";
import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <section className="mx-auto max-w-lg py-8 text-center sm:py-14">
      <div className="guild-card px-5 py-8 sm:px-8">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-guild bg-guild-blueSoft text-guild-gold">
          <SearchX className="h-7 w-7" />
        </div>
        <p className="mt-5 text-xs font-black tracking-[0.18em] text-guild-gold">LOST PATH</p>
        <h1 className="mt-1 text-2xl font-black text-guild-ink">页面走丢了</h1>
        <p className="mt-3 text-sm leading-6 text-guild-muted">这个链接可能已经失效，或者内容已被移除。可以从下面继续进入工会大厅。</p>
        <div className="mt-6 grid gap-2 sm:grid-cols-3">
          <Link className="guild-button gap-1.5" to="/"><Home className="h-4 w-4" /> 工会大厅</Link>
          <Link className="guild-button-secondary gap-1.5" to="/events"><CalendarDays className="h-4 w-4" /> 活动报名</Link>
          <Link className="guild-button-secondary gap-1.5" to="/forum"><MessageCircle className="h-4 w-4" /> 工会论坛</Link>
        </div>
      </div>
    </section>
  );
}
