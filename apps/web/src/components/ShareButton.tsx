import { Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import { sharePage } from "../services/share";

type ShareButtonProps = {
  title: string;
  text?: string;
};

export function ShareButton({ title, text }: ShareButtonProps) {
  const [message, setMessage] = useState("");
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(""), 2500);
    return () => window.clearTimeout(timer);
  }, [message]);

  async function handleShare() {
    if (sharing) return;
    setSharing(true);
    setMessage("");
    try {
      const outcome = await sharePage({ title, text });
      if (outcome === "copied") setMessage("链接已复制");
      if (outcome === "shared") setMessage("已打开分享");
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "分享失败，请使用浏览器菜单分享。");
    } finally {
      setSharing(false);
    }
  }

  return (
    <div className="relative">
      <button className="guild-button-secondary min-h-9 gap-1 px-3 py-1" disabled={sharing} onClick={() => void handleShare()} type="button">
        <Share2 className="h-4 w-4" /> {sharing ? "处理中" : "分享"}
      </button>
      <span aria-live="polite" className={`absolute right-0 top-full z-10 mt-1 whitespace-nowrap rounded-md bg-guild-ink px-2 py-1 text-xs font-bold text-white shadow-soft ${message ? "block" : "hidden"}`}>
        {message}
      </span>
    </div>
  );
}
