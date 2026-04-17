import { apiOk } from "@/lib/api";

export async function GET() {
  return apiOk({ status: "ok", service: "flyingbluewhale", version: "v1" });
}
