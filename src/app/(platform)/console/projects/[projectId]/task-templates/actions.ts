"use server";

import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  projectId: z.string().uuid(),
  templateKey: z.enum(["concert", "festival", "corporate", "sport", "broadcast", "touring"]),
  offsetDays: z.coerce.number().int().min(-60).max(0).default(0),
});

type TaskTemplate = {
  title: string;
  description: string;
  role: string;
  daysOffset: number; // days before event (negative = before, 0 = event day)
  priority: "low" | "medium" | "high" | "critical";
};

const TEMPLATES: Record<string, TaskTemplate[]> = {
  concert: [
    { title: "Advance production rider", description: "Collect and review artist production rider", role: "Production Manager", daysOffset: -30, priority: "high" },
    { title: "Stage plot review", description: "Confirm stage plot with AV team and venue", role: "Stage Manager", daysOffset: -21, priority: "high" },
    { title: "Ground transport booking", description: "Book ground transport for artist and crew", role: "Tour Manager", daysOffset: -14, priority: "medium" },
    { title: "Catering order — artist hospitality", description: "Submit artist hospitality requirements to catering", role: "Hospitality Lead", daysOffset: -14, priority: "medium" },
    { title: "Backline confirmation", description: "Confirm backline spec with venue / rental house", role: "Production Manager", daysOffset: -10, priority: "high" },
    { title: "Accreditation list finalization", description: "Submit final accreditation list to venue", role: "Accreditation Coordinator", daysOffset: -7, priority: "high" },
    { title: "AV tech check", description: "Line-check all AV systems against rider", role: "AV Tech", daysOffset: -1, priority: "critical" },
    { title: "Load-in coordination brief", description: "Brief all crew on load-in schedule and zones", role: "Stage Manager", daysOffset: -1, priority: "high" },
    { title: "Sound check sign-off", description: "Artist and FOH sign off on sound check", role: "FOH Engineer", daysOffset: 0, priority: "critical" },
    { title: "Show file backup", description: "Back up all show files (lighting, audio, video)", role: "AV Tech", daysOffset: 0, priority: "high" },
    { title: "Load-out debrief", description: "Post-show debrief with crew leads", role: "Production Manager", daysOffset: 0, priority: "medium" },
  ],
  festival: [
    { title: "Master site plan approval", description: "Get site plan signed off by venue and fire marshal", role: "Site Manager", daysOffset: -60, priority: "critical" },
    { title: "Vendor onboarding packets", description: "Send onboarding packets to all confirmed vendors", role: "Procurement Lead", daysOffset: -30, priority: "high" },
    { title: "Stage manager assignments", description: "Assign stage managers to each stage", role: "Production Manager", daysOffset: -21, priority: "high" },
    { title: "Catering plan — multi-stage", description: "Submit multi-stage catering plan", role: "Hospitality Lead", daysOffset: -21, priority: "high" },
    { title: "Radio frequency coordination", description: "Coordinate RF with venue and competing stages", role: "RF Coordinator", daysOffset: -14, priority: "critical" },
    { title: "Medical post placement plan", description: "Confirm medical post locations with safety team", role: "Medical Lead", daysOffset: -14, priority: "high" },
    { title: "Artist accreditation list", description: "Collect and process all artist accreditation lists", role: "Accreditation Coordinator", daysOffset: -10, priority: "high" },
    { title: "Incident command briefing", description: "Brief all department heads on incident command protocol", role: "Safety Manager", daysOffset: -3, priority: "critical" },
    { title: "All-hands crew briefing", description: "Site-wide safety and ops briefing for all crew", role: "Stage Manager", daysOffset: -1, priority: "critical" },
    { title: "AV line-check — all stages", description: "Sequential line-check across all stages", role: "AV Tech", daysOffset: -1, priority: "critical" },
    { title: "Post-festival waste report", description: "Compile waste and sustainability metrics", role: "Sustainability Lead", daysOffset: 0, priority: "low" },
    { title: "Vendor settlement processing", description: "Initiate vendor settlement with finance", role: "Finance Manager", daysOffset: 0, priority: "high" },
  ],
  corporate: [
    { title: "Venue walk-through", description: "Walk venue with client and AV team", role: "Event Manager", daysOffset: -14, priority: "high" },
    { title: "Run-of-show draft", description: "Draft minute-by-minute run of show", role: "Event Manager", daysOffset: -10, priority: "critical" },
    { title: "Speaker briefing packets", description: "Send briefing packets to all speakers", role: "Talent Manager", daysOffset: -7, priority: "high" },
    { title: "AV rehearsal", description: "Full AV rehearsal with speakers and presenters", role: "AV Tech", daysOffset: -1, priority: "critical" },
    { title: "Delegate registration setup", description: "Set up on-site registration desks", role: "Registration Lead", daysOffset: -1, priority: "high" },
    { title: "Post-event survey deploy", description: "Deploy delegate satisfaction survey", role: "Event Manager", daysOffset: 0, priority: "medium" },
  ],
  sport: [
    { title: "Athlete accreditation processing", description: "Process all athlete and delegation accreditation", role: "Accreditation Coordinator", daysOffset: -21, priority: "critical" },
    { title: "Anti-doping coordination", description: "Coordinate with anti-doping authority on sample collection", role: "Medical Lead", daysOffset: -14, priority: "critical" },
    { title: "Venue overlay plan sign-off", description: "Get venue overlay approved by federation", role: "Venue Manager", daysOffset: -14, priority: "high" },
    { title: "Broadcast compound setup", description: "Set up broadcast compound and fiber runs", role: "Broadcast Manager", daysOffset: -3, priority: "critical" },
    { title: "Protocol briefing", description: "Brief VIP protection and protocol teams", role: "Protocol Manager", daysOffset: -1, priority: "high" },
    { title: "Results management test", description: "Full end-to-end results management system test", role: "Technology Manager", daysOffset: -1, priority: "critical" },
    { title: "Medal ceremony run-through", description: "Run through medal ceremony with all parties", role: "Ceremonies Manager", daysOffset: -1, priority: "high" },
    { title: "Post-event athlete debrief", description: "Athlete liaison debrief with delegation heads", role: "Athlete Services Lead", daysOffset: 0, priority: "medium" },
  ],
  broadcast: [
    { title: "Signal flow diagram review", description: "Review and approve signal flow diagram with client", role: "Broadcast Manager", daysOffset: -21, priority: "critical" },
    { title: "Fiber and comms infrastructure", description: "Install fiber, IFB, and comm infrastructure", role: "Comms Tech", daysOffset: -7, priority: "critical" },
    { title: "Camera placement plan", description: "Confirm camera positions with director", role: "Camera Supervisor", daysOffset: -7, priority: "high" },
    { title: "Transmission test", description: "Full transmission test with network/OTT", role: "Broadcast Manager", daysOffset: -3, priority: "critical" },
    { title: "Graphics package delivery", description: "Deliver broadcast graphics package to production", role: "Graphics Lead", daysOffset: -2, priority: "high" },
    { title: "On-air talent briefing", description: "Brief all on-air talent on format and cues", role: "Producer", daysOffset: -1, priority: "high" },
    { title: "Archive and delivery", description: "Archive master files and deliver to client", role: "Post Supervisor", daysOffset: 0, priority: "high" },
  ],
  touring: [
    { title: "Tour routing optimization", description: "Confirm tour routing with agent and promoters", role: "Tour Manager", daysOffset: -30, priority: "critical" },
    { title: "Production advance — all dates", description: "Advance all production requirements with each venue", role: "Production Advance", daysOffset: -21, priority: "critical" },
    { title: "Radius clause check", description: "Run radius clause check against existing bookings", role: "Booking Manager", daysOffset: -21, priority: "high" },
    { title: "Per diem and travel budget", description: "Finalize per diem rates and travel budget", role: "Tour Manager", daysOffset: -14, priority: "high" },
    { title: "Bus / truck logistics", description: "Confirm bus, truck, and freight routing", role: "Logistics Manager", daysOffset: -14, priority: "high" },
    { title: "First show production meeting", description: "Pre-tour production meeting with all departments", role: "Production Manager", daysOffset: -7, priority: "critical" },
    { title: "Settlement template setup", description: "Set up settlement templates for each venue", role: "Finance Manager", daysOffset: -7, priority: "high" },
  ],
};

export type BulkCreateState = { success?: boolean; count?: number; error?: string } | null;

export async function bulkCreateTasksFromTemplate(
  _prev: BulkCreateState,
  formData: FormData,
): Promise<BulkCreateState> {
  const raw = {
    projectId: formData.get("projectId"),
    templateKey: formData.get("templateKey"),
    offsetDays: formData.get("offsetDays"),
  };

  const parsed = Schema.safeParse(raw);
  if (!parsed.success) return { error: "Invalid input" };

  const { projectId, templateKey, offsetDays } = parsed.data;
  const session = await requireSession();
  const supabase = await createClient();

  // Verify project ownership
  const { data: project } = await supabase
    .from("projects")
    .select("id, name, start_date")
    .eq("id", projectId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!project) return { error: "Project not found" };

  const templates = TEMPLATES[templateKey] ?? [];
  if (templates.length === 0) return { error: "No templates for event type" };

  // Calculate due dates relative to project start_date + user offset
  const eventDate = project.start_date
    ? new Date(project.start_date)
    : new Date(Date.now() + Math.abs(offsetDays) * 24 * 60 * 60 * 1000);

  const rows = templates.map((t) => {
    const due = new Date(eventDate);
    due.setDate(due.getDate() + t.daysOffset);
    return {
      org_id: session.orgId,
      project_id: projectId,
      title: t.title,
      description: t.description,
      assigned_role: t.role,
      priority: t.priority,
      due_date: due.toISOString().slice(0, 10),
      created_by: session.userId,
    };
  });

  const { error } = await supabase.from("tasks").insert(rows);
  if (error) return { error: error.message };

  return { success: true, count: rows.length };
}
