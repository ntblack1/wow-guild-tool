export type ShareOutcome = "shared" | "copied" | "cancelled";

type SharePageInput = {
  title: string;
  text?: string;
  url?: string;
};

function isAbortError(error: unknown) {
  return error instanceof DOMException
    ? error.name === "AbortError"
    : typeof error === "object" && error !== null && "name" in error && error.name === "AbortError";
}

export async function copyTextToClipboard(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  if (!copied) throw new Error("当前浏览器无法自动复制，请更新微信或浏览器后重试。");
}

export async function sharePage({ title, text, url = window.location.href }: SharePageInput): Promise<ShareOutcome> {
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return "shared";
    } catch (error) {
      if (isAbortError(error)) return "cancelled";
    }
  }

  await copyTextToClipboard(url);
  return "copied";
}
