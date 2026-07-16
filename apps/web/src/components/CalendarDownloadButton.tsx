import { CalendarPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { downloadEventCalendar } from "../services/calendar";
import type { GuildEvent } from "../types";

type CalendarDownloadButtonProps = {
  event: GuildEvent;
};

export function CalendarDownloadButton({ event }: CalendarDownloadButtonProps) {
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(""), 2500);
    return () => window.clearTimeout(timer);
  }, [message]);

  function handleDownload() {
    setMessage("");
    try {
      downloadEventCalendar(event);
      setMessage("日历文件已生成");
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "生成失败，请稍后重试");
    }
  }

  return (
    <div className="relative">
      <button className="guild-button-secondary min-h-9 gap-1 px-3 py-1" onClick={handleDownload} type="button">
        <CalendarPlus className="h-4 w-4" /> 加入日历
      </button>
      <span aria-live="polite" className={`absolute right-0 top-full z-10 mt-1 whitespace-nowrap rounded-md bg-guild-ink px-2 py-1 text-xs font-bold text-white shadow-soft ${message ? "block" : "hidden"}`}>
        {message}
      </span>
    </div>
  );
}
