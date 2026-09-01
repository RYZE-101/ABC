"use client";

import { useEffect, useMemo, useState } from "react";
import { profiles, type Profile } from "../data/profiles";

export function Ranker() {
  const [votes, setVotes] = useState<Record<number, number>>({});
  const [pair, setPair] = useState<[Profile, Profile]>([profiles[0], profiles[1]]);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    fetch("/api/votes").then(response => response.json()).then(data => setVotes(data.votes || {})).finally(() => setReady(true));
  }, []);
  const nextPair = (previous?: number) => {
    const first = profiles[Math.floor(Math.random() * profiles.length)];
    let second = profiles[Math.floor(Math.random() * profiles.length)];
    while (second.id === first.id || second.id === previous) second = profiles[Math.floor(Math.random() * profiles.length)];
    setPair([first, second]);
  };
  const vote = async (id: number) => {
    if (saving) return;
    setSaving(true);
    const response = await fetch("/api/votes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ profileId: id }) });
    if (response.ok) setVotes(current => ({ ...current, [id]: (current[id] || 0) + 1 }));
    setSaving(false);
    nextPair(id);
  };
  const aura = (id: number) => (votes[id] || 0) * 1000000 - 100000;
  const leaderboard = useMemo(() => [...profiles].sort((a, b) => (votes[b.id] || 0) - (votes[a.id] || 0)).slice(0, 5), [votes]);
  if (!ready) return <div className="rank-loading">LOAD RANKING...</div>;
  const card = (profile: Profile, number: string) => <article className="profile-card" style={{ backgroundColor: profile.color }}><div className="test-photo" aria-hidden="true"><span>TEST<br />PHOTO</span></div><div className="profile-overlay"><span>AURA {aura(profile.id).toLocaleString("de-DE")}</span><h2>{profile.name}</h2><p>{profile.subject}</p><div><b>LEHRKRAFT</b><b>TESTDATEN</b></div></div><button aria-label={`Vote for ${profile.name}`} onClick={() => vote(profile.id)} disabled={saving}>PICK <strong>{number}</strong></button></article>;
  return <main className="rank-page"><section className="rank-head"><div><p className="eyebrow">02 / PEOPLE&apos;S CHOICE</p><h1>WHO&apos;S<br /><em>YOUR PICK?</em></h1></div><p>Waehle die Lehrkraft mit der staerksten Aura. Deine Stimme fliesst in das oeffentliche Schul-Ranking ein.</p></section><section className="match">{card(pair[0], "01")}<div className="versus">VS</div>{card(pair[1], "02")}</section><section className="leaderboard"><div><p className="eyebrow">LIVE PUBLIC BOARD</p><h2>TOP FIVE</h2></div><ol>{leaderboard.map((p, index) => <li key={p.id}><span>0{index + 1}</span><i className="rank-swatch" style={{ backgroundColor: p.color }} /><b>{p.name}</b><small>{p.subject} · AURA {aura(p.id).toLocaleString("de-DE")}</small><em>{votes[p.id] || 0} PICKS</em></li>)}</ol></section></main>;
}
