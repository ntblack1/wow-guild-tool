import { requireSupabase } from "../lib/supabase";
import type { Report, ReportInput } from "../types";

export async function listReports(limit = 20) {
  const { data, error } = await requireSupabase()
    .from("reports")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<Report[]>();

  if (error) throw error;
  return data ?? [];
}

export async function createReport(userId: string, input: ReportInput) {
  const { data, error } = await requireSupabase()
    .from("reports")
    .insert({ ...input, created_by: userId })
    .select()
    .single<Report>();

  if (error) throw error;
  return data;
}

export async function updateReport(id: string, input: ReportInput) {
  const { data, error } = await requireSupabase()
    .from("reports")
    .update(input)
    .eq("id", id)
    .select()
    .single<Report>();

  if (error) throw error;
  return data;
}

export async function deleteReport(id: string) {
  const { error } = await requireSupabase().from("reports").delete().eq("id", id);
  if (error) throw error;
}

export function latestReportSummary(reports: Report[]) {
  const latest = reports[0];
  return {
    redStar: latest?.red_star?.trim() || "待揭晓",
    blackStar: latest?.black_star?.trim() || "先不点名",
    quote: latest?.quote?.trim() || "再来一把就过。",
  };
}
