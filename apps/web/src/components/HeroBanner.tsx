import { Link } from "react-router-dom";
import { Sparkles, Swords } from "lucide-react";
import heroImage from "../assets/guild-hero.jpg";

export function HeroBanner() {
  return (
    <section className="overflow-hidden rounded-[28px] border border-white/70 bg-white/70 shadow-glow backdrop-blur">
      <div className="grid gap-2 md:grid-cols-[1fr_1.05fr]">
        <div className="flex flex-col justify-center px-5 py-7 sm:px-8">
          <span className="guild-pill w-fit">
            <Sparkles className="h-3.5 w-3.5 text-guild-gold" />
            轻奇幻工会大厅
          </span>
          <h1 className="mt-4 text-3xl font-black leading-tight text-guild-ink sm:text-5xl">
            八块腹肌工会大厅
          </h1>
          <p className="mt-3 text-lg font-semibold text-guild-gold">一起冒险，一起变强！</p>
          <p className="mt-4 max-w-xl text-sm leading-7 text-guild-muted">
            手机打开就能看今晚活动、登记角色、报名出勤、刷论坛和看战报。每位成员都有训练感，但整体保持清爽可爱。
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link className="guild-button" to="/events">
              <Swords className="mr-2 h-4 w-4" />
              活动报名
            </Link>
            <Link className="guild-button-secondary" to="/forum">
              逛工会论坛
            </Link>
          </div>
        </div>
        <div className="relative min-h-[260px]">
          <img
            className="absolute inset-0 h-full w-full object-cover object-center"
            src={heroImage}
            alt="原创轻奇幻工会接待官"
            decoding="async"
            fetchPriority="high"
          />
        </div>
      </div>
    </section>
  );
}
