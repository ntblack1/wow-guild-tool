import { Link } from "react-router-dom";
import { Sparkles, Swords } from "lucide-react";
import heroImage from "../assets/guild-hero.jpg";

export function HeroBanner() {
  return (
    <section className="relative min-h-[230px] overflow-hidden rounded-guild border border-white/70 shadow-glow sm:min-h-[280px]">
      <img
        alt="原创轻奇幻工会大厅接待官"
        className="absolute inset-0 h-full w-full object-cover object-center"
        decoding="async"
        loading="lazy"
        src={heroImage}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/80 to-white/5" />
      <div className="relative flex min-h-[230px] max-w-xl flex-col justify-center px-5 py-6 sm:min-h-[280px] sm:px-8">
        <span className="guild-pill w-fit">
          <Sparkles className="h-3.5 w-3.5 text-guild-gold" />
          工会大厅
        </span>
        <h1 className="mt-3 text-3xl font-black leading-tight text-guild-ink sm:text-5xl">八块腹肌工会</h1>
        <p className="mt-2 text-sm font-semibold text-guild-muted sm:text-base">集合、开荒、吹水，都在大厅见。</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link className="guild-button" to="/events">
            <Swords className="mr-2 h-4 w-4" /> 活动报名
          </Link>
          <Link className="guild-button-secondary" to="/forum">工会论坛</Link>
        </div>
      </div>
    </section>
  );
}
