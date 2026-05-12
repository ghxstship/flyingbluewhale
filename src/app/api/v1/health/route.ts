import { apiOk } from "@/lib/api";

export async function GET() {
  return apiOk({ status: "ok", service: "flytehaus-technologies", version: "v1" });
}
