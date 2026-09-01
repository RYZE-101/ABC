import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";

export async function POST(request: Request) {
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  const body = await request.json().catch(() => null);
  const profileId = Number(body?.profileId);
  if (!Number.isInteger(profileId) || profileId < 1 || profileId > 40) return NextResponse.json({ error: "Invalid profileId" }, { status: 400 });
  const { error } = await supabase.from("profile_votes").insert({ profile_id: profileId });
  if (error) return NextResponse.json({ error: "Vote could not be saved" }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function GET() {
  if (!supabase) return NextResponse.json({ votes: {} });
  const { data, error } = await supabase.from("profile_vote_totals").select("profile_id, total_votes");
  if (error) return NextResponse.json({ error: "Ranking could not be loaded" }, { status: 500 });
  const votes = Object.fromEntries((data || []).map(row => [row.profile_id, row.total_votes]));
  return NextResponse.json({ votes });
}
