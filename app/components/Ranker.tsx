"use client";

import { useEffect, useMemo, useState } from "react";
import { profiles, type Profile } from "../data/profiles";

export function Ranker() {
  const [auraScores, setAuraScores] = useState<Record<number, number>>({});
  const [pair, setPair] = useState<[Profile, Profile]>([profiles[0], profiles[1]]);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [picked, setPicked] = useState<number[]>([]);
  const [remaining, setRemaining] = useState(40);
  useEffect(() => {
    fetch("/api/votes").then(response => response.json()).then(data => { setAuraScores(data.aura || {}); setPicked(data.picked || []); setRemaining(data.remaining ?? 40); }).finally(() => setReady(true));
  }, []);
  const nextPair = (previous?: number, excluded = picked) => {
    const available = profiles.filter(profile => !excluded.includes(profile.id) && profile.id !== previous);
    if (available.length < 2) return;
    const first = available[Math.floor(Math.random() * available.length)];
    const rest = available.filter(profile => profile.id !== first.id);
    const second = rest[Math.floor(Math.random() * rest.length)];
    setPair([first, second]);
  };
  const vote = async (id: number) => {
    if (saving) return;
    setSaving(true);
    setMessage(null);
    const response = await fetch("/api/votes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ profileId: id }) });
    if (response.ok) {
      const data = await response.json();
      setAuraScores(current => ({ ...current, [id]: (current[id] || 0) + (data.auraPoints || 0) }));
      setPicked(current => [...current, id]);
      setRemaining(data.remaining ?? remaining - 1);
      nextPair(id, [...picked, id]);
    }
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      if (response.status === 409) { const updatedPicked = [...new Set([...picked, id])]; setPicked(updatedPicked); setMessage(null); nextPair(id, updatedPicked); }
      else { setMessage(data.error || "Vote konnte nicht gespeichert werden"); if (response.status === 429) setRemaining(0); }
    }
    setSaving(false);
  };
  const aura = (id: number) => auraScores[id] || 0;
  const leaderboard = useMemo(() => [...profiles].sort((a, b) => aura(b.id) - aura(a.id)).slice(0, 5), [auraScores]);
  if (!ready) return <div className="rank-loading">LOAD RANKING...</div>;
  const card = (profile: Profile, number: string) => <article className="profile-card" style={{ backgroundColor: profile.color }}><div className="test-photo" aria-hidden="true"><span>TEST<br />PHOTO</span></div><div className="profile-overlay"><span>AURA {aura(profile.id).toLocaleString("de-DE")}</span><h2>{profile.name}</h2><p>{profile.subject}</p><div><b>LEHRKRAFT</b><b>TESTDATEN</b></div></div><button aria-label={`Vote for ${profile.name}`} onClick={() => vote(profile.id)} disabled={saving}>PICK <strong>{number}</strong></button></article>;
  return <main className="rank-page"><section className="rank-head"><div><p className="eyebrow">02 / PEOPLE&apos;S CHOICE</p><h1>WHO&apos;S<br /><em>YOUR PICK?</em></h1></div><p>Waehle die Lehrkraft mit der staerksten Aura. Deine Stimme fliesst in das oeffentliche Schul-Ranking ein.</p></section><section className="match">{message && <p className="vote-message">{message}</p>}{remaining === 0 ? <div className="vote-finished"><h2>SESSION COMPLETE</h2><p>Du hast alle 40 Picks verwendet.</p></div> : <>{card(pair[0], "01")} <div className="versus">VS</div>{card(pair[1], "02")}</>}</section><section className="leaderboard"><div><p className="eyebrow">LIVE PUBLIC BOARD</p><h2>TOP FIVE</h2></div><ol>{leaderboard.map((p, index) => <li key={p.id}><span>0{index + 1}</span><i className="rank-swatch" style={{ backgroundColor: p.color }} /><b>{p.name}</b><small>{p.subject} · AURA {aura(p.id).toLocaleString("de-DE")}</small><em>LIVE</em></li>)}</ol></section></main>;
}
