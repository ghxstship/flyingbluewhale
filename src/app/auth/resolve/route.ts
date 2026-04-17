import { NextResponse } from "next/server";
import { getSession, resolveShell } from "@/lib/auth";

async function route(req: Request) {
  const url = new URL(req.url);
  const session = await getSession();
  if (!session) return NextResponse.redirect(new URL("/login", url.origin));

  const shell = resolveShell(session.persona);
  const target =
    shell === "/p"
      ? `/p/${url.searchParams.get("slug") ?? "select"}`
      : shell;

  return NextResponse.redirect(new URL(target, url.origin));
}

export const GET = route;
export const POST = route;
