import { RotateCw } from "lucide-react";
import { useState } from "react";

type ErrorStateProps = {
  message: string;
  onRetry?: () => Promise<void> | void;
};

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  const [retrying, setRetrying] = useState(false);

  async function handleRetry() {
    if (!onRetry || retrying) return;
    setRetrying(true);
    try {
      await onRetry();
    } catch {
      // The page owns the user-facing retry error state.
    } finally {
      setRetrying(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
      <span>{message}</span>
      {onRetry ? (
        <button className="inline-flex min-h-9 items-center gap-1 rounded-md border border-red-200 bg-white px-3 py-1 text-xs font-black" disabled={retrying} onClick={() => void handleRetry()} type="button">
          <RotateCw className={`h-3.5 w-3.5 ${retrying ? "animate-spin" : ""}`} />
          {retrying ? "正在重试" : "重新读取"}
        </button>
      ) : null}
    </div>
  );
}
