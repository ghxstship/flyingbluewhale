import { apiOk } from "@/lib/api";

export async function GET() {
  return apiOk({ status: "ok", service: "lost-island-technologies", version: "v1" });
}
