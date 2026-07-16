function readErrorMessage(caught: unknown) {
  if (typeof caught === "string") return caught.trim();
  if (caught instanceof Error) return caught.message.trim();
  if (caught && typeof caught === "object" && "message" in caught && typeof caught.message === "string") {
    return caught.message.trim();
  }
  return "";
}

export function friendlyError(caught: unknown, fallback: string) {
  const message = readErrorMessage(caught);
  if (!message) return fallback;
  if (/[\u3400-\u9fff]/.test(message)) return message;

  if (/invalid login credentials/i.test(message)) return "账号或密码不正确。";
  if (/user already registered|already been registered/i.test(message)) return "这个账号已经注册，请直接登录。";
  if (/password.*(least|short|weak)|weak password/i.test(message)) return "密码强度不足，请至少使用 6 个字符。";
  if (/signup.*disabled|signups not allowed/i.test(message)) return "当前暂时不能创建新账号，请联系会长。";
  if (/email.*not confirmed/i.test(message)) return "账号还没有完成验证，请联系会长处理。";
  if (/rate limit|too many requests|429/i.test(message)) return "操作太频繁，请稍等一会再试。";
  if (/auth session missing|invalid refresh token|jwt.*(expired|invalid)|not authenticated/i.test(message)) return "登录状态已过期，请重新登录。";
  if (/row-level security|permission denied|insufficient privilege|42501|not authorized/i.test(message)) return "当前账号没有执行这个操作的权限。";
  if (/duplicate key|unique constraint|23505/i.test(message)) return "已经存在相同记录，请不要重复提交。";
  if (/foreign key|23503/i.test(message)) return "关联资料不存在或已被删除，请刷新后重试。";
  if (/pgrst116|no rows|not found/i.test(message)) return "请求的内容不存在或已被删除。";
  if (/payload too large|file.*too large|413/i.test(message)) return "文件太大，请压缩后重新上传。";
  if (/failed to fetch|fetch failed|networkerror|network request failed|load failed/i.test(message)) return "网络连接失败，请检查网络后重试。";
  if (/database error saving new user/i.test(message)) return "账号资料创建失败，请确认数据库已完成初始化。";

  return fallback;
}
