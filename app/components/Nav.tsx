import Link from "next/link";

export function Nav({ active }: { active: "play" | "rank" }) {
  return (
    <header className="topbar">
      <Link className="brand" href="/">DROP<span>/</span>RANK</Link>
      <nav aria-label="Hauptnavigation">
        <Link className={active === "play" ? "active" : ""} href="/">Play</Link>
        <Link className={active === "rank" ? "active" : ""} href="/rank">Rank</Link>
      </nav>
      <div className="status"><i /> LIVE BOARD</div>
    </header>
  );
}
