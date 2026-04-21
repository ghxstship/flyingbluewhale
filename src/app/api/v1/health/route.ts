import { apiOk } from "@/lib/api";

export async function GET() {
  return apiOk({ status: "ok", service: "second-star-technologies", version: "v1" });
}
