import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { profiles } from "@/lib/profiles";

export const runtime = "nodejs";
export async function GET() {
  const ids = (db.prepare("SELECT profile_id FROM matches ORDER BY created_at DESC").all() as { profile_id: number }[]).map(x => x.profile_id);
  return NextResponse.json({ matches: profiles.filter(p => ids.includes(p.id)) });
}

export async function DELETE(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const profileId = Number(body?.profileId);
  if (!Number.isInteger(profileId) || !profiles.some(p => p.id === profileId)) {
    return NextResponse.json({ error: "Invalid profile." }, { status: 400 });
  }

  const transaction = db.transaction(() => {
    const result = db.prepare("DELETE FROM matches WHERE profile_id = ?").run(profileId);
    if (result.changes === 0) return false;
    db.prepare("DELETE FROM swipes WHERE profile_id = ? AND direction = 'like'").run(profileId);
    return true;
  });

  if (!transaction()) {
    return NextResponse.json({ error: "This profile is not one of your matches." }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
