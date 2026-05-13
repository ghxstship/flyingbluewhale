import { apiOk } from "@/lib/api";

export async function GET() {
  return apiOk({ status: "ok", service: "atlvs-technologies", version: "v1" });
}
