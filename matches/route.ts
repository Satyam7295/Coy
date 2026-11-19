import { NextResponse } from "next/server";
import db from "@/lib/db";
import { profiles } from "@/lib/profiles";

export const runtime = "nodejs";
export async function GET() {
  const ids = (db.prepare("SELECT profile_id FROM matches ORDER BY created_at DESC").all() as { profile_id: number }[]).map(x => x.profile_id);
  return NextResponse.json({ matches: profiles.filter(p => ids.includes(p.id)) });
}
