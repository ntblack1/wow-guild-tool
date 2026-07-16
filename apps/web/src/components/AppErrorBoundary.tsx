import { Component, type ErrorInfo, type ReactNode } from "react";

type AppErrorBoundaryProps = {
  children: ReactNode;
};

type AppErrorBoundaryState = {
  failed: boolean;
};

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Guild app render failed", error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;

    return (
      <main className="grid min-h-screen place-items-center px-4 py-10 text-guild-ink">
        <section className="w-full max-w-md rounded-guild border border-guild-line bg-white/90 p-6 text-center shadow-glow">
          <p className="text-sm font-black text-guild-gold">八块腹肌工会大厅</p>
          <h1 className="mt-2 text-2xl font-black">页面暂时没有响应</h1>
          <p className="mt-3 text-sm leading-6 text-guild-muted">可能是网络波动或页面加载异常。刷新后通常就能恢复。</p>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <button className="guild-button" onClick={() => window.location.reload()} type="button">刷新页面</button>
            <a className="guild-button-secondary" href="/">返回大厅</a>
          </div>
        </section>
      </main>
    );
  }
}
