import { CalendarDays, Home, MessageCircle, ScrollText, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { isSupabaseConfigured } from "../lib/supabase";
import { getCurrentUser, subscribeToAuthChanges, type GuildSessionUser } from "../services/auth";

const navItems = [
  { to: "/", label: "大厅", icon: Home },
  { to: "/events", label: "活动", icon: CalendarDays },
  { to: "/forum", label: "论坛", icon: MessageCircle },
  { to: "/reports", label: "战报", icon: ScrollText },
  { to: "/characters", label: "角色", icon: UserRound },
];

export function AppLayout() {
  const [currentUser, setCurrentUser] = useState<GuildSessionUser | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    getCurrentUser().then(setCurrentUser).catch(() => setCurrentUser(null));
    return subscribeToAuthChanges(setCurrentUser);
  }, []);

  return (
    <div className="min-h-screen pb-24 text-guild-ink md:pb-0">
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
        <nav className="mx-auto hidden max-w-5xl grid-cols-5 gap-1 px-2 pb-2 text-center text-sm md:grid">
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
      <main className="mx-auto max-w-5xl px-4 py-5">
        <Outlet />
      </main>
      <nav className="fixed inset-x-3 bottom-3 z-20 grid grid-cols-5 gap-1 rounded-[24px] border border-white/70 bg-white/85 p-2 shadow-glow backdrop-blur-xl md:hidden">
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
