"use client";

import { useEffect, useMemo, useState } from "react";
import { profiles, type Profile } from "../data/profiles";

type Answers = { productivity: number; atmosphere: number; digital: number; serious: number };
const questions: { key: keyof Answers; label: string; aside: string }[] = [
  { key: "productivity", label: "Wie produktiv ist der Unterricht?", aside: "Kommt ihr gut voran oder zieht sich jede Minute?" },
  { key: "atmosphere", label: "Wie lustig und angenehm ist die Lehrkraft?", aside: "Gute Stimmung, ohne dass der Unterricht kippt." },
  { key: "digital", label: "Wie streng ist die Lehrkraft bei Digitalisierung / iPads?", aside: "Locker bei Technik oder eher iPad-Polizei?" },
  { key: "serious", label: "Wie ernst ist die Lehrkraft?", aside: "Komplett fokussiert oder darf auch mal gelacht werden?" },
];

export function Ranker() {
  const [scores, setScores] = useState<Record<number, number>>({});
  const [ratedToday, setRatedToday] = useState<number[]>([]);
  const [selected, setSelected] = useState<Profile | null>(null);
  const [answers, setAnswers] = useState<Answers>({ productivity: 0, atmosphere: 0, digital: 0, serious: 0 });
  const [view, setView] = useState<"grid" | "list">("grid");
  const [query, setQuery] = useState("");
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = () => fetch("/api/votes").then(response => response.json()).then(data => { setScores(data.scores || {}); setRatedToday(data.ratedToday || []); }).finally(() => setReady(true));
  useEffect(() => { load(); }, []);
  const score = (id: number) => scores[id] || 0;
  const filtered = useMemo(() => profiles.filter(profile => `${profile.name} ${profile.subject}`.toLowerCase().includes(query.toLowerCase())), [query]);
  const leaderboard = useMemo(() => [...profiles].sort((a, b) => score(b.id) - score(a.id)), [scores]);
  const openProfile = (profile: Profile) => { setSelected(profile); setMessage(null); setAnswers({ productivity: 0, atmosphere: 0, digital: 0, serious: 0 }); };
  const submit = async () => {
    if (!selected || Object.values(answers).some(value => value === 0)) { setMessage("Bitte alle drei Fragen beantworten."); return; }
    setSaving(true); setMessage(null);
    const response = await fetch("/api/votes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ profileId: selected.id, ...answers }) });
    const data = await response.json().catch(() => ({}));
    if (response.ok) { setSelected(null); await load(); }
    else setMessage(data.error || "Bewertung konnte nicht gespeichert werden.");
    setSaving(false);
  };
  if (!ready) return <div className="rank-loading">LOAD LIVE RANKING...</div>;
  return <main className="rank-page">
    <section className="rank-head"><div><p className="eyebrow">02 / SCHOOL BOARD</p><h1>TEACHER<br /><em>AURA RANK</em></h1></div><p>Oeffne ein Profil und bewerte den Unterricht. Jede Lehrkraft kann einmal pro Tag neu bewertet werden.</p></section>
    <section className="directory-bar"><div><b>40</b> LEHRKRAEFTE <span>/</span> LIVE RANKING</div><input aria-label="Lehrkraefte suchen" placeholder="SEARCH TEACHER..." value={query} onChange={event => setQuery(event.target.value)} /><div className="view-switch"><button className={view === "grid" ? "selected" : ""} onClick={() => setView("grid")}>GRID</button><button className={view === "list" ? "selected" : ""} onClick={() => setView("list")}>LIST</button></div></section>
    <section className={`teacher-directory ${view}`}>{filtered.map(profile => { const rank = leaderboard.findIndex(item => item.id === profile.id) + 1; const rated = ratedToday.includes(profile.id); return <button className="teacher-tile" key={profile.id} onClick={() => openProfile(profile)}><span className="teacher-art" style={{ backgroundColor: profile.color }}><i>{String(rank).padStart(2, "0")}</i><b>TEST<br />PHOTO</b>{rated && <em>✓</em>}</span><span className="teacher-copy"><strong>{profile.name}</strong><small>{profile.subject}</small><label>AURA {score(profile.id).toLocaleString("de-DE")}</label></span></button>; })}</section>
    <section className="live-board"><div><p className="eyebrow">LIVE SCOREBOARD</p><h2>ALL TEACHERS</h2></div><ol>{leaderboard.map((profile, index) => <li key={profile.id}><span>{String(index + 1).padStart(2, "0")}</span><i style={{ backgroundColor: profile.color }} /><b>{profile.name}</b><small>{profile.subject}</small><strong>{score(profile.id).toLocaleString("de-DE")} AURA</strong></li>)}</ol></section>
    {selected && <div className="survey-backdrop" role="dialog" aria-modal="true"><section className="survey"><button className="close-survey" onClick={() => setSelected(null)} aria-label="Profil schliessen">×</button><div className="survey-hero" style={{ backgroundColor: selected.color }}><span>TEACHER PROFILE</span><b>TEST IMAGE 2:3</b></div><p className="eyebrow">RATE / {selected.subject.toUpperCase()}</p><h2>{selected.name}</h2><p className="survey-sub">Deine Bewertung wird zu einem Score von 0 bis 1.000.000 verrechnet.</p>{questions.map(question => <fieldset key={question.key}><legend>{question.label}</legend><p className="question-aside">{question.aside}</p><div className="rating-options">{[1, 2, 3, 4, 5].map(value => <button className={answers[question.key] === value ? "selected" : ""} key={value} onClick={() => setAnswers(current => ({ ...current, [question.key]: value }))}>{value}</button>)}</div><small>1 = niedrig · 5 = sehr hoch</small></fieldset>)}{message && <p className="survey-message">{message}</p>}<button className="submit-rating" disabled={saving} onClick={submit}>{saving ? "SAVING..." : ratedToday.includes(selected.id) ? "UPDATE TODAY'S RATING" : "SUBMIT RATING"} <b>→</b></button></section></div>}
  </main>;
}
