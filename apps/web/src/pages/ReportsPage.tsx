import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Pencil, Plus, Quote, ScrollText, Sparkles, Trash2, Trophy, X } from "lucide-react";
import { EmptyState } from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";
import { Field } from "../components/Field";
import { GuildCard } from "../components/GuildCard";
import { LoadingState } from "../components/LoadingState";
import { SectionTitle } from "../components/SectionTitle";
import { isSupabaseConfigured } from "../lib/supabase";
import { getCurrentUser } from "../services/auth";
import { friendlyError } from "../services/errors";
import { formatDateTime } from "../services/format";
import { getProfile } from "../services/profiles";
import { createReport, deleteReport, latestReportSummary, listReports, updateReport } from "../services/reports";
import type { Profile, Report, ReportInput } from "../types";

const initialInput: ReportInput = {
  title: "",
  content: "",
  event_id: null,
  red_star: "",
  black_star: "",
  quote: "",
};

export function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userId, setUserId] = useState("");
  const [input, setInput] = useState<ReportInput>(initialInput);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [expandedReportId, setExpandedReportId] = useState("");
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const editorRef = useRef<HTMLFormElement>(null);
  const canManage = profile?.role === "admin" || profile?.role === "leader";
  const summary = useMemo(() => latestReportSummary(reports), [reports]);

  async function refresh() {
    const [rows, user] = await Promise.all([listReports(12), getCurrentUser()]);
    setReports(rows);
    setUserId(user?.id ?? "");
    setLoading(false);
    if (!user) {
      setProfile(null);
      return;
    }
    setProfile(await getProfile(user.id).catch(() => null));
  }

  async function retryRefresh() {
    setError("");
    try {
      await refresh();
    } catch (caught) {
      setError(friendlyError(caught, "读取战报失败，请稍后重试。"));
    }
  }

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    refresh()
      .catch((caught) => setError(friendlyError(caught, "读取战报失败，请稍后重试。")))
      .finally(() => setLoading(false));
  }, []);

  function closeEditor() {
    setEditorOpen(false);
    setEditingId("");
    setInput(initialInput);
  }

  function startEditing(report: Report) {
    setInput({
      title: report.title,
      content: report.content,
      event_id: report.event_id,
      red_star: report.red_star,
      black_star: report.black_star,
      quote: report.quote,
    });
    setEditingId(report.id);
    setDeletingId("");
    setEditorOpen(true);
    requestAnimationFrame(() => editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canManage || !userId || saving) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const payload = {
        ...input,
        title: input.title.trim(),
        content: input.content.trim(),
        red_star: input.red_star?.trim() || null,
        black_star: input.black_star?.trim() || null,
        quote: input.quote?.trim() || null,
      };
      if (editingId) await updateReport(editingId, payload);
      else await createReport(userId, payload);
      const successMessage = editingId ? "战报已更新。" : "战报已发布。";
      closeEditor();
      setMessage(successMessage);
      await refresh();
    } catch (caught) {
      setError(friendlyError(caught, "保存战报失败，请稍后重试。"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(report: Report) {
    if (!canManage || saving) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await deleteReport(report.id);
      setDeletingId("");
      if (editingId === report.id) closeEditor();
      setMessage("战报已删除。");
      await refresh();
    } catch (caught) {
      setError(friendlyError(caught, "删除战报失败，请稍后重试。"));
    } finally {
      setSaving(false);
    }
  }

  if (!isSupabaseConfigured) return <ErrorState message="请先配置 Supabase 环境变量。" />;
  if (loading) return <LoadingState />;

  return (
    <section className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-guild-muted">副本记录室</p>
          <h1 className="text-3xl font-black text-guild-ink">副本战报</h1>
        </div>
        {canManage ? (
          <button className="guild-button shrink-0 gap-1.5 px-3 sm:px-4" onClick={() => editorOpen ? closeEditor() : setEditorOpen(true)} type="button">
            {editorOpen ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {editorOpen ? "收起" : "发布战报"}
          </button>
        ) : null}
      </div>

      {error ? <ErrorState message={error} onRetry={retryRefresh} /> : null}
      {message ? <p className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-700">{message}</p> : null}

      <div className="grid gap-3 md:grid-cols-3">
        <GuildCard className="bg-guild-panelSoft/85">
          <Trophy className="h-6 w-6 text-guild-gold" />
          <p className="mt-3 text-xs font-bold text-guild-muted">最新红手</p>
          <h2 className="mt-1 text-xl font-black text-guild-ink">{summary.redStar}</h2>
        </GuildCard>
        <GuildCard>
          <Sparkles className="h-6 w-6 text-guild-mint" />
          <p className="mt-3 text-xs font-bold text-guild-muted">最新黑手</p>
          <h2 className="mt-1 text-xl font-black text-guild-ink">{summary.blackStar}</h2>
        </GuildCard>
        <GuildCard className="bg-guild-blueSoft/70">
          <Quote className="h-6 w-6 text-guild-ink" />
          <p className="mt-3 text-xs font-bold text-guild-muted">最新金句</p>
          <h2 className="mt-1 text-lg font-black text-guild-ink">“{summary.quote}”</h2>
        </GuildCard>
      </div>

      {editorOpen && canManage ? (
        <form className="guild-card grid scroll-mt-24 gap-3" onSubmit={handleSubmit} ref={editorRef}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-guild-gold">RAID REPORT</p>
              <h2 className="font-black text-guild-ink">{editingId ? "编辑战报" : "发布战报"}</h2>
            </div>
            <button className="inline-flex items-center gap-1 text-xs font-bold text-guild-muted" onClick={closeEditor} type="button"><X className="h-3.5 w-3.5" /> 取消</button>
          </div>
          <Field label="标题"><input className="guild-input" maxLength={60} onChange={(event) => setInput({ ...input, title: event.target.value })} placeholder="例如：TOC 全通战报" required value={input.title} /></Field>
          <Field label="战报正文"><textarea className="guild-input" maxLength={3000} onChange={(event) => setInput({ ...input, content: event.target.value })} placeholder="记录进度、掉落和名场面" required rows={6} value={input.content} /></Field>
          <details className="rounded-md border border-guild-line bg-white/60 p-3">
            <summary className="cursor-pointer text-sm font-bold text-guild-muted">红手、黑手和金句（选填）</summary>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="红手"><input className="guild-input" maxLength={30} onChange={(event) => setInput({ ...input, red_star: event.target.value })} value={input.red_star ?? ""} /></Field>
              <Field label="黑手"><input className="guild-input" maxLength={30} onChange={(event) => setInput({ ...input, black_star: event.target.value })} value={input.black_star ?? ""} /></Field>
            </div>
            <div className="mt-3"><Field label="今日金句"><input className="guild-input" maxLength={80} onChange={(event) => setInput({ ...input, quote: event.target.value })} value={input.quote ?? ""} /></Field></div>
          </details>
          <button className="guild-button" disabled={saving || !input.title.trim() || !input.content.trim()}>{saving ? "保存中" : editingId ? "保存修改" : "发布战报"}</button>
        </form>
      ) : null}

      <section className="space-y-3">
        <SectionTitle eyebrow="Reports" title="历史战报" />
        {reports.length ? reports.map((report) => (
          <GuildCard key={report.id}>
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-guild-panelSoft text-guild-gold"><ScrollText className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1">
                <h2 className="font-black text-guild-ink">{report.title}</h2>
                <p className="mt-1 text-xs text-guild-muted">{formatDateTime(report.created_at)}</p>
                <p className={`mt-3 whitespace-pre-wrap text-sm leading-6 text-guild-muted ${expandedReportId === report.id ? "" : "line-clamp-4"}`}>{report.content}</p>
                {report.content.length > 180 ? (
                  <button className="mt-2 text-xs font-bold text-guild-gold" onClick={() => setExpandedReportId((current) => current === report.id ? "" : report.id)} type="button">
                    {expandedReportId === report.id ? "收起全文" : "展开全文"}
                  </button>
                ) : null}
                {report.red_star || report.black_star || report.quote ? (
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
                    {report.red_star ? <span className="guild-pill">红手：{report.red_star}</span> : null}
                    {report.black_star ? <span className="guild-pill">黑手：{report.black_star}</span> : null}
                    {report.quote ? <span className="guild-pill">金句：{report.quote}</span> : null}
                  </div>
                ) : null}
                {canManage ? (
                  <div className="mt-4 flex flex-wrap gap-2 border-t border-guild-line pt-3">
                    <button className="guild-button-secondary min-h-9 gap-1 px-3 py-1" onClick={() => startEditing(report)} type="button"><Pencil className="h-3.5 w-3.5" /> 编辑</button>
                    {deletingId === report.id ? (
                      <>
                        <button className="guild-button min-h-9 bg-rose-500 px-3 py-1 hover:bg-rose-600" disabled={saving} onClick={() => void handleDelete(report)} type="button">确认删除</button>
                        <button className="guild-button-secondary min-h-9 px-3 py-1" onClick={() => setDeletingId("")} type="button">取消</button>
                      </>
                    ) : <button className="guild-button-secondary min-h-9 gap-1 px-3 py-1 text-rose-500" onClick={() => setDeletingId(report.id)} type="button"><Trash2 className="h-3.5 w-3.5" /> 删除</button>}
                  </div>
                ) : null}
              </div>
            </div>
          </GuildCard>
        )) : <EmptyState title="暂无战报" description="第一场活动结束后，团长可以在这里发布战报。" />}
      </section>
    </section>
  );
}
