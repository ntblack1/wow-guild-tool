import { ClipboardCopy } from "lucide-react";
import { useEffect, useState } from "react";
import { buildRosterShareText } from "../services/format";
import { copyTextToClipboard } from "../services/share";
import type { GuildEvent, Signup } from "../types";

type RosterCopyButtonProps = {
  event: GuildEvent;
  signups: Signup[];
};

export function RosterCopyButton({ event, signups }: RosterCopyButtonProps) {
  const [copying, setCopying] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(""), 2500);
    return () => window.clearTimeout(timer);
  }, [message]);

  async function handleCopy() {
    if (copying) return;
    setCopying(true);
    setMessage("");
    try {
      await copyTextToClipboard(buildRosterShareText(event, signups, window.location.href));
      setMessage("阵容已复制");
    } catch {
      setMessage("复制失败，请稍后重试");
    } finally {
      setCopying(false);
    }
  }

  return (
    <div className="relative">
      <button className="guild-button-secondary min-h-9 gap-1 px-3 py-1" disabled={copying} onClick={() => void handleCopy()} type="button">
        <ClipboardCopy className="h-4 w-4" /> {copying ? "复制中" : "复制阵容"}
      </button>
      <span aria-live="polite" className={`absolute right-0 top-full z-10 mt-1 whitespace-nowrap rounded-md bg-guild-ink px-2 py-1 text-xs font-bold text-white shadow-soft ${message ? "block" : "hidden"}`}>
        {message}
      </span>
    </div>
  );
}
