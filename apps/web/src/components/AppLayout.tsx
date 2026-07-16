import { CalendarDays, Home, MessageCircle, ScrollText, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { isSupabaseConfigured } from "../lib/supabase";
import { getCurrentUser, subscribeToAuthChanges, type GuildSessionUser } from "../services/auth";
import { OfflineBanner } from "./OfflineBanner";

const navItems = [
  { to: "/", label: "大厅", icon: Home },
  { to: "/events", label: "活动", icon: CalendarDays },
  { to: "/forum", label: "论坛", icon: MessageCircle },
  { to: "/reports", label: "战报", icon: ScrollText },
  { to: "/characters", label: "角色", icon: UserRound },
];

export function AppLayout() {
  const [currentUser, setCurrentUser] = useState<GuildSessionUser | null>(null);
  const location = useLocation();

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    getCurrentUser().then(setCurrentUser).catch(() => setCurrentUser(null));
    return subscribeToAuthChanges(setCurrentUser);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
    const path = location.pathname;
    const pageName = path.startsWith("/events/") ? "活动详情"
      : path === "/events" ? "活动报名"
        : path.startsWith("/forum/") ? "帖子详情"
          : path === "/forum" ? "工会论坛"
            : path === "/characters" ? "我的角色"
              : path === "/reports" ? "副本战报"
                : path === "/auth" ? "账号中心"
                  : path === "/" ? "工会大厅"
                    : "页面不存在";
    document.title = `${pageName}｜八块腹肌工会`;
  }, [location.pathname]);

  return (
    <div className="min-h-screen pb-24 text-guild-ink md:pb-0">
      <a className="fixed left-3 top-2 z-50 -translate-y-20 rounded-md bg-guild-ink px-3 py-2 text-sm font-bold text-white shadow-soft transition focus:translate-y-0" href="#main-content">
        跳到主要内容
      </a>
      <header className="sticky top-0 z-10 border-b border-guild-line/70 bg-guild-bg/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <NavLink to="/" className="text-lg font-black text-guild-gold">
            八块腹肌大厅
          </NavLink>
          <NavLink
            to="/auth"
            className="guild-button-secondary min-h-9 max-w-40 truncate px-3 py-1 text-xs"
            title={currentUser?.displayName ?? "登录"}
          >
            {currentUser?.displayName ?? "登录"}
          </NavLink>
        </div>
        <nav aria-label="主要导航" className="mx-auto hidden max-w-5xl grid-cols-5 gap-1 px-2 pb-2 text-center text-sm md:grid">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-2xl px-2 py-2 transition ${
                  isActive ? "bg-white text-guild-gold shadow-sm" : "text-guild-muted hover:bg-white/60"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <OfflineBanner />
      <main className="mx-auto max-w-5xl px-4 py-5" id="main-content" tabIndex={-1}>
        <Outlet />
      </main>
      <nav aria-label="手机主要导航" className="fixed inset-x-3 bottom-3 z-20 grid grid-cols-5 gap-1 rounded-[24px] border border-white/70 bg-white/85 p-2 shadow-glow backdrop-blur-xl md:hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-semibold transition ${
                  isActive ? "bg-guild-gold text-white shadow-soft" : "text-guild-muted"
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
