import "server-only";
import { createClient } from "@/lib/supabase/server";

export type AnnotationKind = "flag" | "note" | "comment" | "tag";
export type AnnotationSeverity = "info" | "warning" | "critical";
export type AnnotationStatus = "open" | "acknowledged" | "resolved" | "dismissed";

export type Annotation = {
  id: string;
  org_id: string;
  project_id: string | null;
  target_table: string;
  target_id: string;
  parent_id: string | null;
  kind: AnnotationKind;
  severity: AnnotationSeverity;
  status: AnnotationStatus;
  title: string | null;
  body: string;
  tags: string[];
  confirmation_required: boolean;
  confirmed_by: string | null;
  confirmed_at: string | null;
  due_at: string | null;
  assigned_to: string | null;
  linked_task_id: string | null;
  metadata: Record<string, unknown>;
  created_by: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  resolution_note: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateAnnotationInput = {
  orgId: string;
  projectId?: string | null;
  targetTable: string;
  targetId: string;
  kind?: AnnotationKind;
  severity?: AnnotationSeverity;
  title?: string | null;
  body: string;
  tags?: string[];
  assignedTo?: string | null;
  dueAt?: string | null;
  confirmationRequired?: boolean;
  parentId?: string | null;
  createdBy: string;
};

export async function listAnnotations(filters: {
  orgId: string;
  projectId?: string;
  targetTable?: string;
  targetId?: string;
  status?: AnnotationStatus | AnnotationStatus[];
  assignedTo?: string;
  parentId?: string | null;
}): Promise<Annotation[]> {
  // Empty orgId — guest / unscoped session. Return empty rather than letting
  // PostgREST submit `org_id=eq.` and trigger 22P02 invalid uuid syntax.
  if (!filters.orgId) return [];

  const supabase = await createClient();
  let q = supabase
    .from("annotations")
    .select("*")
    .eq("org_id", filters.orgId)
    .is("deleted_at", null)
    .order("severity", { ascending: false })
    .order("created_at", { ascending: false });

  if (filters.projectId) q = q.eq("project_id", filters.projectId);
  if (filters.targetTable) q = q.eq("target_table", filters.targetTable);
  if (filters.targetId) q = q.eq("target_id", filters.targetId);
  if (filters.assignedTo) q = q.eq("assigned_to", filters.assignedTo);
  if (filters.parentId === null) q = q.is("parent_id", null);
  else if (filters.parentId) q = q.eq("parent_id", filters.parentId);
  if (filters.status) {
    if (Array.isArray(filters.status)) q = q.in("status", filters.status);
    else q = q.eq("status", filters.status);
  }

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Annotation[];
}

export async function createAnnotation(input: CreateAnnotationInput): Promise<Annotation> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("annotations")
    .insert({
      org_id: input.orgId,
      project_id: input.projectId ?? null,
      target_table: input.targetTable,
      target_id: input.targetId,
      parent_id: input.parentId ?? null,
      kind: input.kind ?? "flag",
      severity: input.severity ?? "info",
      title: input.title ?? null,
      body: input.body,
      tags: input.tags ?? [],
      assigned_to: input.assignedTo ?? null,
      due_at: input.dueAt ?? null,
      confirmation_required: input.confirmationRequired ?? false,
      created_by: input.createdBy,
    })
    .select()
    .single();
  if (error) throw error;
  return data as unknown as Annotation;
}

export async function acknowledgeAnnotation(id: string, orgId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("annotations")
    .update({ status: "acknowledged" })
    .eq("id", id)
    .eq("org_id", orgId);
  if (error) throw error;
}

export async function resolveAnnotation(
  id: string,
  orgId: string,
  resolvedBy: string,
  resolutionNote?: string,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("annotations")
    .update({
      status: "resolved",
      resolved_by: resolvedBy,
      resolved_at: new Date().toISOString(),
      resolution_note: resolutionNote ?? null,
    })
    .eq("id", id)
    .eq("org_id", orgId);
  if (error) throw error;
}

export async function dismissAnnotation(
  id: string,
  orgId: string,
  resolvedBy: string,
  resolutionNote?: string,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("annotations")
    .update({
      status: "dismissed",
      resolved_by: resolvedBy,
      resolved_at: new Date().toISOString(),
      resolution_note: resolutionNote ?? null,
    })
    .eq("id", id)
    .eq("org_id", orgId);
  if (error) throw error;
}

export async function confirmAnnotation(id: string, orgId: string, confirmedBy: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("annotations")
    .update({
      confirmed_by: confirmedBy,
      confirmed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("org_id", orgId);
  if (error) throw error;
}

export async function replyToAnnotation(input: {
  parentId: string;
  orgId: string;
  body: string;
  createdBy: string;
}): Promise<Annotation> {
  const supabase = await createClient();
  // Pin org_id when reading the parent — without it, replying could
  // inherit org/project from a foreign annotation and write into another
  // org's thread.
  const { data: parent, error: parentErr } = await supabase
    .from("annotations")
    .select("org_id, project_id, target_table, target_id")
    .eq("id", input.parentId)
    .eq("org_id", input.orgId)
    .single();
  if (parentErr) throw parentErr;
  return createAnnotation({
    orgId: parent.org_id,
    projectId: parent.project_id,
    targetTable: parent.target_table,
    targetId: parent.target_id,
    parentId: input.parentId,
    kind: "comment",
    severity: "info",
    body: input.body,
    createdBy: input.createdBy,
  });
}

export async function watchAnnotation(annotationId: string, userId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("annotation_watchers")
    .upsert({ annotation_id: annotationId, user_id: userId }, { onConflict: "annotation_id,user_id" });
  if (error) throw error;
}

export async function unwatchAnnotation(annotationId: string, userId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("annotation_watchers")
    .delete()
    .eq("annotation_id", annotationId)
    .eq("user_id", userId);
  if (error) throw error;
}
