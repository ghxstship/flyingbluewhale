import { apiOk } from "@/lib/api";

/**
 * Liveness probe. Returns 200 as long as the process is up and able to
 * accept + reply to an HTTP request. No dependencies are checked here;
 * orchestrators (Vercel, k8s, uptime) use this to decide whether to
 * restart the instance. Must stay cheap and allocation-free.
 */
export async function GET() {
  return apiOk({ status: "ok", probe: "liveness" });
}
