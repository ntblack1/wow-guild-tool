import { FormEvent, useEffect, useState } from "react";
import { ErrorState } from "../components/ErrorState";
import { Field } from "../components/Field";
import { isSupabaseConfigured } from "../lib/supabase";
import {
  createGuildAccount,
  getCurrentUser,
  isGuildPassphraseCorrect,
  signInWithGuildAccount,
  signOut,
  type GuildSessionUser,
} from "../services/auth";

export function AuthPage() {
  const [currentUser, setCurrentUser] = useState<GuildSessionUser | null>(null);
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

  useEffect(() => {
    getCurrentUser().then(setCurrentUser).catch(() => setCurrentUser(null));
  }, []);

  async function handleLogin(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const user = await signInWithGuildAccount(loginUsername, loginPassword);
      setCurrentUser(user);
      setMessage("登录成功。");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "登录失败，请稍后再试。");
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
      setCurrentUser(user);
      setMessage("账号创建成功，已经自动登录。");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "创建账号失败，请稍后再试。");
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    setCurrentUser(null);
    setPassphrasePassed(false);
    setAnswer("");
    setDisplayName("");
    setNewUsername("");
    setNewPassword("");
    setConfirmPassword("");
    setLoginPassword("");
    setMessage("已退出当前账号。");
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
      {message ? <p className="guild-card text-sm text-emerald-100">{message}</p> : null}

      {currentUser ? (
        <section className="guild-card space-y-4">
          <div>
            <p className="text-sm text-guild-muted">当前账号</p>
            <h2 className="text-xl font-black text-guild-ink">{currentUser.displayName}</h2>
          </div>
          <button className="guild-button-secondary w-full" type="button" onClick={() => void handleSignOut()}>
            退出登录
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
