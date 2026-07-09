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
