import { FormEvent, useEffect, useState } from "react";
import { CalendarDays, KeyRound, LogOut, Save, ShieldCheck, UserRound } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ErrorState } from "../components/ErrorState";
import { Field } from "../components/Field";
import { isSupabaseConfigured } from "../lib/supabase";
import {
  createGuildAccount,
  getCurrentUser,
  isGuildPassphraseCorrect,
  safeAuthNextPath,
  signInWithGuildAccount,
  signOut,
  updateGuildDisplayName,
  updateGuildPassword,
  type GuildSessionUser,
} from "../services/auth";
import { friendlyError } from "../services/errors";
import { userRoleLabel } from "../services/format";
import { getProfile } from "../services/profiles";
import type { UserRole } from "../types";

export function AuthPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nextPath = safeAuthNextPath(searchParams.get("next"));
  const [currentUser, setCurrentUser] = useState<GuildSessionUser | null>(null);
  const [accountDisplayName, setAccountDisplayName] = useState("");
  const [accountRole, setAccountRole] = useState<UserRole>("member");
  const [accountPassword, setAccountPassword] = useState("");
  const [accountPasswordConfirm, setAccountPasswordConfirm] = useState("");
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [answer, setAnswer] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passphrasePassed, setPassphrasePassed] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function applyCurrentUser(user: GuildSessionUser) {
    setCurrentUser(user);
    setAccountDisplayName(user.displayName);
    const profile = await getProfile(user.id).catch(() => null);
    setAccountRole(profile?.role ?? "member");
  }

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    getCurrentUser()
      .then(async (user) => {
        if (user) await applyCurrentUser(user);
        else {
          setCurrentUser(null);
          setAccountDisplayName("");
          setAccountRole("member");
        }
      })
      .catch(() => setCurrentUser(null));
  }, []);

  async function handleLogin(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const user = await signInWithGuildAccount(loginUsername, loginPassword);
      await applyCurrentUser(user);
      setLoginPassword("");
      setMessage("登录成功。");
      if (nextPath) navigate(nextPath, { replace: true });
    } catch (caught) {
      setError(friendlyError(caught, "登录失败，请稍后再试。"));
    } finally {
      setSaving(false);
    }
  }

  function handlePassphraseSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!isGuildPassphraseCorrect(answer)) {
      setError("口令不对，问问会长再来。");
      return;
    }

    setPassphrasePassed(true);
    setMessage("验证通过，现在设置你的账号和密码。");
  }

  async function handleCreateAccount(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    if (newPassword !== confirmPassword) {
      setError("两次输入的密码不一致。");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");
    try {
      const user = await createGuildAccount({
        username: newUsername,
        password: newPassword,
        displayName,
      });
      await applyCurrentUser(user);
      setMessage("账号创建成功，已经自动登录。");
      if (nextPath) navigate(nextPath, { replace: true });
    } catch (caught) {
      setError(friendlyError(caught, "创建账号失败，请稍后再试。"));
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    if (saving) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await signOut();
      setCurrentUser(null);
      setAccountDisplayName("");
      setAccountRole("member");
      setAccountPassword("");
      setAccountPasswordConfirm("");
      setPassphrasePassed(false);
      setAnswer("");
      setDisplayName("");
      setNewUsername("");
      setNewPassword("");
      setConfirmPassword("");
      setLoginPassword("");
      setMessage("已退出当前账号。");
    } catch (caught) {
      setError(friendlyError(caught, "退出失败，请稍后再试。"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDisplayNameUpdate(event: FormEvent) {
    event.preventDefault();
    if (saving || accountDisplayName.trim() === currentUser?.displayName) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const user = await updateGuildDisplayName(accountDisplayName);
      setCurrentUser(user);
      setAccountDisplayName(user.displayName);
      setMessage("工会昵称已更新。");
    } catch (caught) {
      setError(friendlyError(caught, "昵称保存失败，请稍后再试。"));
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordUpdate(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    if (accountPassword !== accountPasswordConfirm) {
      setError("两次输入的新密码不一致。");
      return;
    }
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await updateGuildPassword(accountPassword);
      setAccountPassword("");
      setAccountPasswordConfirm("");
      setMessage("密码已修改，下次登录请使用新密码。");
    } catch (caught) {
      setError(friendlyError(caught, "密码修改失败，请稍后再试。"));
    } finally {
      setSaving(false);
    }
  }

  if (!isSupabaseConfigured) {
    return <ErrorState message="Supabase 尚未配置，请先在 .env 中填写 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY。" />;
  }

  return (
    <section className="space-y-4">
      <div>
        <p className="text-sm text-guild-muted">工会通行证</p>
        <h1 className="text-2xl font-black text-guild-gold">登录八块腹肌工会</h1>
      </div>

      {error ? <ErrorState message={error} /> : null}
      {message ? <p className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-700">{message}</p> : null}

      {currentUser ? (
        <section className="guild-card space-y-4">
          <div>
            <p className="text-sm text-guild-muted">当前账号</p>
            <h2 className="text-xl font-black text-guild-ink">{currentUser.displayName}</h2>
            {currentUser.username ? <p className="mt-1 text-sm text-guild-muted">登录账号：<strong className="text-guild-ink">{currentUser.username}</strong></p> : null}
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-guild-line bg-guild-panelSoft px-3 py-1 text-xs font-black text-guild-gold">
              <ShieldCheck className="h-3.5 w-3.5" /> {userRoleLabel(accountRole)}
            </p>
            <p className="mt-2 text-sm text-guild-muted">
              {accountRole === "member" ? "可以管理角色、报名活动、发帖和评论。" : "拥有成员功能，并可确认报名、管理活动、置顶帖子和维护战报。"}
            </p>
          </div>
          <form className="grid gap-2" onSubmit={handleDisplayNameUpdate}>
            <Field label="工会昵称">
              <input className="guild-input" maxLength={20} onChange={(event) => setAccountDisplayName(event.target.value)} required value={accountDisplayName} />
            </Field>
            <button className="guild-button-secondary gap-1.5" disabled={saving || !accountDisplayName.trim() || accountDisplayName.trim() === currentUser.displayName}>
              <Save className="h-4 w-4" /> 保存昵称
            </button>
          </form>
          <details className="rounded-md border border-guild-line bg-white/60 p-3">
            <summary className="cursor-pointer list-none font-bold text-guild-ink">
              <span className="inline-flex items-center gap-2"><KeyRound className="h-4 w-4 text-guild-gold" /> 修改登录密码</span>
            </summary>
            <form className="mt-3 grid gap-3" onSubmit={handlePasswordUpdate}>
              <Field label="新密码">
                <input className="guild-input" autoComplete="new-password" minLength={6} onChange={(event) => setAccountPassword(event.target.value)} required type="password" value={accountPassword} />
              </Field>
              <Field label="再次输入新密码">
                <input className="guild-input" autoComplete="new-password" minLength={6} onChange={(event) => setAccountPasswordConfirm(event.target.value)} required type="password" value={accountPasswordConfirm} />
              </Field>
              <button className="guild-button-secondary gap-1.5" disabled={saving || accountPassword.length < 6 || accountPasswordConfirm.length < 6}>
                <KeyRound className="h-4 w-4" /> 保存新密码
              </button>
            </form>
          </details>
          <div className="grid grid-cols-2 gap-2">
            <Link className="guild-button gap-1.5" to="/characters"><UserRound className="h-4 w-4" /> 我的角色</Link>
            <Link className="guild-button-secondary gap-1.5" to="/events"><CalendarDays className="h-4 w-4" /> 活动报名</Link>
          </div>
          <button className="inline-flex min-h-10 items-center justify-center gap-1.5 text-sm font-bold text-rose-500" disabled={saving} type="button" onClick={() => void handleSignOut()}>
            <LogOut className="h-4 w-4" /> 退出登录
          </button>
        </section>
      ) : (
        <>
          <form className="guild-card space-y-4" onSubmit={handleLogin}>
            <h2 className="font-black text-guild-ink">账号密码登录</h2>
            <Field label="账号">
              <input
                className="guild-input"
                autoComplete="username"
                maxLength={20}
                value={loginUsername}
                onChange={(event) => setLoginUsername(event.target.value)}
                placeholder="输入你的账号"
                required
              />
            </Field>
            <Field label="密码">
              <input
                className="guild-input"
                autoComplete="current-password"
                type="password"
                minLength={6}
                value={loginPassword}
                onChange={(event) => setLoginPassword(event.target.value)}
                placeholder="输入密码"
                required
              />
            </Field>
            <button className="guild-button w-full" disabled={saving}>
              {saving ? "处理中" : "登录"}
            </button>
          </form>

          {!passphrasePassed ? (
            <form className="guild-card space-y-4" onSubmit={handlePassphraseSubmit}>
              <h2 className="font-black text-guild-ink">创建新账号</h2>
              <Field label="会长口头禅是什么？">
                <input
                  className="guild-input"
                  maxLength={20}
                  value={answer}
                  onChange={(event) => setAnswer(event.target.value)}
                  placeholder="输入工会口令"
                  required
                />
              </Field>
              <button className="guild-button-secondary w-full">验证口令</button>
            </form>
          ) : (
            <form className="guild-card space-y-4" onSubmit={handleCreateAccount}>
              <h2 className="font-black text-guild-ink">设置账号密码</h2>
              <Field label="工会昵称">
                <input
                  className="guild-input"
                  maxLength={20}
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder="例如：老冻人民"
                  required
                />
              </Field>
              <Field label="账号">
                <input
                  className="guild-input"
                  autoCapitalize="none"
                  autoComplete="username"
                  maxLength={20}
                  value={newUsername}
                  onChange={(event) => setNewUsername(event.target.value)}
                  placeholder="3-20 位字母、数字或下划线"
                  required
                />
              </Field>
              <Field label="密码">
                <input
                  className="guild-input"
                  autoComplete="new-password"
                  type="password"
                  minLength={6}
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="至少 6 位"
                  required
                />
              </Field>
              <Field label="确认密码">
                <input
                  className="guild-input"
                  autoComplete="new-password"
                  type="password"
                  minLength={6}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="再输入一次密码"
                  required
                />
              </Field>
              <button className="guild-button w-full" disabled={saving}>
                {saving ? "创建中" : "创建账号并登录"}
              </button>
            </form>
          )}
        </>
      )}
    </section>
  );
}
