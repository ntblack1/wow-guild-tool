import { FormEvent, useState } from "react";
import { ErrorState } from "../components/ErrorState";
import { Field } from "../components/Field";
import { isSupabaseConfigured } from "../lib/supabase";
import { signInWithEmail, signOut } from "../services/auth";

export function AuthPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await signInWithEmail(email);
      setMessage("登录邮件已发送，请回到邮箱打开链接。");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "登录失败");
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
      <form className="guild-card space-y-4" onSubmit={handleSubmit}>
        <Field label="邮箱">
          <input
            className="guild-input"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@example.com"
            required
          />
        </Field>
        {error ? <ErrorState message={error} /> : null}
        {message ? <p className="text-sm text-emerald-200">{message}</p> : null}
        <div className="flex gap-2">
          <button className="guild-button flex-1" disabled={saving}>
            {saving ? "发送中" : "发送登录邮件"}
          </button>
          <button className="guild-button-secondary" type="button" onClick={() => void signOut()}>
            退出
          </button>
        </div>
      </form>
    </section>
  );
}
