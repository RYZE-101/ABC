import { Nav } from "./components/Nav";
import { PlinkoBoard } from "./components/PlinkoBoard";
import Link from "next/link";

export default function Home() {
  return <><Nav active="play" /><main className="play-page"><section className="play-intro"><p className="eyebrow">01 / LUCK ENGINE</p><h1>MAKE<br />IT <em>DROP.</em></h1><p className="intro-copy">A small dose of chance. One chip, seven paths. Let the board decide where it lands.</p><div className="stats"><span><b>2,841</b> DROPS TODAY</span><span><b>8X</b> TOP POCKET</span></div></section><PlinkoBoard /></main><footer><span>DROP / RANK &copy; 2025</span><Link href="/rank">RANK THE BOARD <b>→</b></Link></footer></>;
}
