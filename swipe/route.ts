import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { profiles } from "@/lib/profiles";

export const runtime = "nodejs";
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const profileId = Number(body?.profileId);
  const direction = body?.direction;
  if (!Number.isInteger(profileId) || !profiles.some(p => p.id === profileId) || !["like", "pass"].includes(direction)) {
    return NextResponse.json({ error: "Invalid swipe." }, { status: 400 });
  }
  const existing = db.prepare("SELECT direction FROM swipes WHERE profile_id = ?").get(profileId) as { direction: string } | undefined;
  if (existing) return NextResponse.json({ error: "This profile has already been swiped on." }, { status: 409 });

  const transaction = db.transaction(() => {
    db.prepare("INSERT INTO swipes(profile_id, direction) VALUES (?, ?)").run(profileId, direction);
    const mutual = direction === "like" &&
      !!db.prepare("SELECT 1 FROM incoming_likes WHERE profile_id = ?").get(profileId);
    if (mutual) db.prepare("INSERT OR IGNORE INTO matches(profile_id) VALUES (?)").run(profileId);
    return mutual;
  });
  const isMatch = transaction();
  return NextResponse.json({ success: true, matched: isMatch, profile: isMatch ? profiles.find(p => p.id === profileId) : null });
}
