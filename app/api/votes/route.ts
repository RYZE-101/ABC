import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomInt, randomUUID } from "node:crypto";
import { supabase } from "../../../lib/supabase";

const SESSION_COOKIE = "drop_rank_session";
const MAX_PICKS_PER_SESSION = 40;

export async function POST(request: Request) {
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  const body = await request.json().catch(() => null);
  const profileId = Number(body?.profileId);
  if (!Number.isInteger(profileId) || profileId < 1 || profileId > 40) return NextResponse.json({ error: "Invalid profileId" }, { status: 400 });

  const cookieStore = await cookies();
  const existingSession = cookieStore.get(SESSION_COOKIE)?.value;
  const sessionId = existingSession || randomUUID();
  const { count, error: countError } = await supabase.from("profile_votes").select("id", { count: "exact", head: true }).eq("session_id", sessionId);
  if (countError) return NextResponse.json({ error: "Vote limit could not be checked" }, { status: 500 });
  if ((count || 0) >= MAX_PICKS_PER_SESSION) return NextResponse.json({ error: "This session has reached its 40 picks" }, { status: 429 });

  const { data: previousVote, error: previousError } = await supabase.from("profile_votes").select("id").eq("session_id", sessionId).eq("profile_id", profileId).maybeSingle();
  if (previousError) return NextResponse.json({ error: "Vote could not be checked" }, { status: 500 });
  if (previousVote) return NextResponse.json({ error: "You already picked this profile" }, { status: 409 });

  const auraPoints = randomInt(98_000, 103_001);
  const { error } = await supabase.from("profile_votes").insert({ profile_id: profileId, session_id: sessionId, aura_points: auraPoints });
  if (error) return NextResponse.json({ error: "Vote could not be saved" }, { status: 500 });
  const response = NextResponse.json({ ok: true, auraPoints, remaining: MAX_PICKS_PER_SESSION - (count || 0) - 1 });
  if (!existingSession) response.cookies.set(SESSION_COOKIE, sessionId, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 365, path: "/" });
  return response;
}

export async function GET() {
  if (!supabase) return NextResponse.json({ aura: {} });
  const { data, error } = await supabase.from("profile_aura_totals").select("profile_id, aura");
  if (error) return NextResponse.json({ error: "Ranking could not be loaded" }, { status: 500 });
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  let picked: number[] = [];
  if (sessionId) {
    const { data: sessionVotes } = await supabase.from("profile_votes").select("profile_id").eq("session_id", sessionId);
    picked = (sessionVotes || []).map(row => row.profile_id);
  }
  return NextResponse.json({ aura: Object.fromEntries((data || []).map(row => [row.profile_id, row.aura])), picked, remaining: MAX_PICKS_PER_SESSION - picked.length });
}
