import type { InspectorReport, Submission } from "../types";
import { cloudConfigHint, getPublicSiteKey, getSupabase, isCloudConfigured } from "./supabase";

export interface SubmissionSaveResult {
  localSaved: boolean;
  cloudConfigured: boolean;
  cloudSaved: boolean;
  error?: string;
}

export interface CloudLoadResult {
  submissions: Submission[];
  remote: boolean;
  error?: string;
}

function readableError(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    const message = String((error as { message?: unknown }).message ?? "");
    if (message) return message;
  }
  return "تعذّر الاتصال بقاعدة البيانات المركزية.";
}

function normalizedSubmission(submission: Submission): Submission {
  return {
    ...submission,
    dataSource: submission.dataSource ?? "real",
    demo: false,
    isDemo: false,
    attendanceStatus: submission.attendanceStatus ?? "present",
    assessmentStatus: submission.assessmentStatus ?? "completed",
    assessmentType: submission.assessmentType ?? "diagnostic",
  };
}

/**
 * يرسل نتيجة التلميذ عبر RPC كتابة فقط إلى جدول لا يملك الجمهور صلاحية قراءته.
 * القراءة للأستاذ المصادق عليه وحده. لا نرسل نتائج Demo إلى قاعدة البيانات.
 */
export async function saveCloudSubmission(submission: Submission): Promise<void> {
  const client = getSupabase();
  const siteKey = getPublicSiteKey();
  if (!client || !siteKey) throw new Error(cloudConfigHint());
  const value = normalizedSubmission(submission);
  // Anonymous students call a SECURITY DEFINER RPC. They never receive a
  // table INSERT/SELECT path and the RPC resolves the teacher from the key.
  const { error } = await client.rpc("submit_assessment_result", {
    p_site_key: siteKey,
    p_submission: value,
  });
  if (error) throw new Error(readableError(error));
}

/** يجلب نتائج الأستاذ من المصدر المركزي فقط؛ لا نخلطها بنتائج جهاز آخر محليًا. */
export async function loadCloudSubmissions(): Promise<CloudLoadResult> {
  const client = getSupabase();
  if (!client) return { submissions: [], remote: false, error: cloudConfigHint() };
  const { data, error } = await client
    .from("student_submissions")
    .select("payload")
    .order("submitted_at", { ascending: false })
    .limit(10000);
  if (error) return { submissions: [], remote: true, error: readableError(error) };
  const submissions = (data ?? [])
    .map((row) => (row as { payload?: unknown }).payload)
    .filter((payload): payload is Submission => Boolean(payload && typeof payload === "object" && "id" in payload))
    .map((payload) => normalizedSubmission(payload));
  return { submissions, remote: true };
}

export interface CloudReportResult {
  reports: InspectorReport[];
  error?: string;
}

function reportFromRow(row: { payload?: unknown; html_snapshot?: string | null; updated_at?: string | null }): InspectorReport | null {
  if (!row.payload || typeof row.payload !== "object") return null;
  const payload = row.payload as InspectorReport;
  if (typeof payload.id !== "string") return null;
  return {
    ...payload,
    htmlSnapshot: row.html_snapshot ?? payload.htmlSnapshot,
    updatedAt: row.updated_at ?? payload.updatedAt,
  };
}

function reportRow(report: InspectorReport, ownerId: string) {
  return {
    id: report.id,
    owner_id: ownerId,
    institution: report.institution,
    academy: report.academy,
    directorate: report.directorate,
    class_name: report.className,
    level: report.level,
    subject: report.subject,
    school_year: report.schoolYear,
    assessment_type: report.assessmentType,
    status: report.status,
    created_at: report.createdAt,
    updated_at: report.updatedAt,
    submission_ids: report.submissionIds,
    html_snapshot: report.htmlSnapshot ?? null,
    payload: report,
  };
}

async function currentUserId(): Promise<string> {
  const client = getSupabase();
  if (!client) throw new Error(cloudConfigHint());
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) throw new Error("يجب تسجيل دخول الأستاذ قبل حفظ التقرير.");
  return data.user.id;
}

/** يحفظ لقطة التقرير في قاعدة البيانات مع ربطها بالمستخدم المصادق عليه. */
export async function saveInspectorReport(report: InspectorReport): Promise<InspectorReport> {
  const client = getSupabase();
  if (!client) throw new Error(cloudConfigHint());
  const ownerId = report.teacherId ?? await currentUserId();
  const value = { ...report, teacherId: ownerId };
  const { data, error } = await client
    .from("inspector_reports")
    .upsert(reportRow(value, ownerId), { onConflict: "id" })
    .select("payload, html_snapshot, updated_at")
    .single();
  if (error) throw new Error(readableError(error));
  return reportFromRow(data as { payload?: unknown; html_snapshot?: string | null; updated_at?: string | null }) ?? value;
}

/** لا تعيد هذه الدالة أي تقرير إلا للمستخدم المصادق عليه (تفرضه RLS أيضًا). */
export async function loadInspectorReports(): Promise<CloudReportResult> {
  const client = getSupabase();
  if (!client) return { reports: [], error: cloudConfigHint() };
  const { data, error } = await client
    .from("inspector_reports")
    .select("payload, html_snapshot, updated_at")
    .order("updated_at", { ascending: false })
    .limit(200);
  if (error) return { reports: [], error: readableError(error) };
  return {
    reports: (data ?? [])
      .map((row) => reportFromRow(row as { payload?: unknown; html_snapshot?: string | null; updated_at?: string | null }))
      .filter((report): report is InspectorReport => report !== null),
  };
}

export async function deleteInspectorReport(id: string): Promise<void> {
  const client = getSupabase();
  if (!client) throw new Error(cloudConfigHint());
  const { error } = await client.from("inspector_reports").delete().eq("id", id);
  if (error) throw new Error(readableError(error));
}

export async function deleteAllCloudSubmissions(): Promise<void> {
  const client = getSupabase();
  if (!client) throw new Error(cloudConfigHint());
  const { error } = await client.from("student_submissions").delete().neq("id", "");
  if (error) throw new Error(readableError(error));
}

export async function signInTeacher(email: string, password: string): Promise<{ ok: boolean; error?: string }> {
  const client = getSupabase();
  if (!client) return { ok: false, error: cloudConfigHint() };
  const { error } = await client.auth.signInWithPassword({ email, password });
  return error ? { ok: false, error: readableError(error) } : { ok: true };
}

export async function signOutTeacher(): Promise<void> {
  const client = getSupabase();
  if (client) await client.auth.signOut();
}

export async function updateTeacherCredentials(nextEmail: string, nextPassword: string): Promise<{ ok: boolean; error?: string }> {
  const client = getSupabase();
  if (!client) return { ok: false, error: cloudConfigHint() };
  const update: { email?: string; password?: string } = { password: nextPassword };
  if (nextEmail.includes("@")) update.email = nextEmail;
  const { error } = await client.auth.updateUser(update);
  return error ? { ok: false, error: readableError(error) } : { ok: true };
}

export function centralStorageEnabled(): boolean {
  return isCloudConfigured();
}
