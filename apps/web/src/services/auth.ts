import type { User } from "@supabase/supabase-js";
import { requireSupabase } from "../lib/supabase";

const guildPassphrase = "说这些";
const guildAccountEmailDomain = "members.8pack-guild.app";
const usernamePattern = /^[a-z0-9_]{3,20}$/;

export type GuildSessionUser = {
  id: string;
  displayName: string;
  username: string;
};

export function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

export function accountEmail(username: string) {
  return `${normalizeUsername(username)}@${guildAccountEmailDomain}`;
}

export function safeAuthNextPath(value: string | null) {
  if (!value || value.startsWith("//")) return "";
  const allowedRoots = ["/events", "/forum", "/characters", "/reports"];
  return allowedRoots.some((root) => value === root || value.startsWith(`${root}/`) || value.startsWith(`${root}?`))
    ? value
    : "";
}

export function authPath(nextPath = "") {
  const safeNextPath = safeAuthNextPath(nextPath);
  return safeNextPath ? `/auth?next=${encodeURIComponent(safeNextPath)}` : "/auth";
}

function sessionUser(user: User): GuildSessionUser {
  const displayName = user.user_metadata?.display_name;
  const username = user.user_metadata?.username;
  const emailUsername = user.email?.endsWith(`@${guildAccountEmailDomain}`) ? user.email.split("@")[0] : "";

  return {
    id: user.id,
    displayName:
      (typeof displayName === "string" && displayName.trim()) ||
      (typeof username === "string" && username.trim()) ||
      "八块腹肌成员",
    username: (typeof username === "string" && username.trim()) || emailUsername || "",
  };
}

function friendlyAuthError(message: string, action: "login" | "signup") {
  if (/already registered|already exists|user_already_exists/i.test(message)) {
    return new Error("这个账号已经被注册了，换一个试试。");
  }

  if (/invalid login credentials|invalid credentials/i.test(message)) {
    return new Error("账号或密码不正确。");
  }

  if (/password/i.test(message)) {
    return new Error("密码至少需要 6 位。");
  }

  if (/rate limit|too many requests/i.test(message)) {
    return new Error("操作太频繁了，请稍等一会再试。");
  }

  return new Error(action === "signup" ? "创建账号失败，请稍后再试。" : "登录失败，请稍后再试。");
}

function validateAccountInput(usernameInput: string, password: string) {
  const username = normalizeUsername(usernameInput);
  if (!usernamePattern.test(username)) {
    throw new Error("账号需要 3-20 位，只能使用小写字母、数字和下划线。");
  }
  if (password.length < 6) throw new Error("密码至少需要 6 位。");
  return username;
}

export async function getCurrentUser() {
  const { data, error } = await requireSupabase().auth.getSession();
  if (error) throw friendlyAuthError(error.message, "login");
  return data.session ? sessionUser(data.session.user) : null;
}

export function subscribeToAuthChanges(callback: (user: GuildSessionUser | null) => void) {
  const { data } = requireSupabase().auth.onAuthStateChange((_event, session) => {
    callback(session ? sessionUser(session.user) : null);
  });
  return () => data.subscription.unsubscribe();
}

export function isGuildPassphraseCorrect(answer: string) {
  return answer.trim() === guildPassphrase;
}

export async function createGuildAccount(input: {
  username: string;
  password: string;
  displayName: string;
}) {
  const username = validateAccountInput(input.username, input.password);
  const displayName = input.displayName.trim();
  if (!displayName) throw new Error("请填写工会昵称。");

  const { data, error } = await requireSupabase().auth.signUp({
    email: accountEmail(username),
    password: input.password,
    options: {
      data: {
        display_name: displayName,
        username,
      },
    },
  });

  if (error) throw friendlyAuthError(error.message, "signup");
  if (!data.user) throw new Error("创建账号失败，请稍后再试。");
  if (!data.session) {
    throw new Error("账号已创建，但未能自动登录。请在 Supabase 中关闭邮箱确认后再创建账号。");
  }

  return sessionUser(data.user);
}

export async function signInWithGuildAccount(usernameInput: string, password: string) {
  const username = validateAccountInput(usernameInput, password);
  const { data, error } = await requireSupabase().auth.signInWithPassword({
    email: accountEmail(username),
    password,
  });

  if (error) throw friendlyAuthError(error.message, "login");
  return sessionUser(data.user);
}

export async function updateGuildDisplayName(displayNameInput: string) {
  const displayName = displayNameInput.trim();
  if (!displayName) throw new Error("请填写工会昵称。");
  if (displayName.length > 20) throw new Error("工会昵称最多 20 个字。");

  const client = requireSupabase();
  const { data, error } = await client.auth.updateUser({ data: { display_name: displayName } });
  if (error) throw friendlyAuthError(error.message, "login");

  const { error: profileError } = await client
    .from("profiles")
    .update({ display_name: displayName })
    .eq("id", data.user.id);
  if (profileError) throw new Error("昵称保存失败，请稍后再试。");

  return sessionUser(data.user);
}

export async function updateGuildPassword(password: string) {
  if (password.length < 6) throw new Error("密码至少需要 6 位。");
  const { error } = await requireSupabase().auth.updateUser({ password });
  if (error) {
    if (/same password|different from.*old|new password should be different/i.test(error.message)) {
      throw new Error("新密码不能和原密码相同。");
    }
    throw friendlyAuthError(error.message, "login");
  }
}

export async function signOut() {
  const { error } = await requireSupabase().auth.signOut();
  if (error) throw friendlyAuthError(error.message, "login");
}
