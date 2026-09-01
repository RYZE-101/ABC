import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";
import { supabase } from "../../../lib/supabase";

const SESSION_COOKIE = "drop_rank_session";
const getSession = async () => {
  const store = await cookies();
  return { store, existing: store.get(SESSION_COOKIE)?.value, id: store.get(SESSION_COOKIE)?.value || randomUUID() };
};

function withSession(response: NextResponse, existing: string | undefined, id: string) {
  if (!existing) response.cookies.set(SESSION_COOKIE, id, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 365, path: "/" });
  return response;
}

export async function POST(request: Request) {
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  const body = await request.json().catch(() => null);
  const profileId = Number(body?.profileId);
  const answers = [body?.productivity, body?.atmosphere, body?.digital, body?.serious].map(Number);
  if (!Number.isInteger(profileId) || profileId < 1 || profileId > 40 || answers.some(value => !Number.isInteger(value) || value < 1 || value > 5)) return NextResponse.json({ error: "Ungueltige Bewertung" }, { status: 400 });
  const { existing, id: sessionId } = await getSession();
  const score = Math.round((answers.reduce((sum, value) => sum + value, 0) / 20) * 1_000_000);
  const { error } = await supabase.from("teacher_ratings").upsert({ session_id: sessionId, profile_id: profileId, productivity: answers[0], atmosphere: answers[1], digital: answers[2], serious: answers[3], score, rated_on: new Date().toISOString().slice(0, 10) }, { onConflict: "session_id,profile_id,rated_on" });
  if (error) return withSession(NextResponse.json({ error: "Bewertung konnte nicht gespeichert werden" }, { status: 500 }), existing, sessionId);
  return withSession(NextResponse.json({ ok: true, score }), existing, sessionId);
}

export async function GET() {
  if (!supabase) return NextResponse.json({ scores: {}, ratedToday: [] });
  const { data, error } = await supabase.from("teacher_score_totals").select("profile_id, score");
  if (error) return NextResponse.json({ error: "Ranking konnte nicht geladen werden" }, { status: 500 });
  const { id: sessionId } = await getSession();
  const today = new Date().toISOString().slice(0, 10);
  const { data: rated } = await supabase.from("teacher_ratings").select("profile_id").eq("session_id", sessionId).eq("rated_on", today);
  return NextResponse.json({ scores: Object.fromEntries((data || []).map(row => [row.profile_id, row.score])), ratedToday: (rated || []).map(row => row.profile_id) });
}
