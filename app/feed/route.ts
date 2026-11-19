import { NextResponse } from "next/server";
import db from "@/lib/db";
import { profiles } from "@/lib/profiles";

export const runtime = "nodejs";
export async function GET() {
  const seen = new Set((db.prepare("SELECT profile_id FROM swipes").all() as { profile_id: number }[]).map(x => x.profile_id));
  // Deliberately omit incoming-like state: one-sided likes are private.
  const feed = profiles.filter(p => !seen.has(p.id));
  return NextResponse.json({ profiles: feed });
}
