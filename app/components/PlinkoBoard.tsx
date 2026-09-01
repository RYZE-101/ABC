"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d-compat";

const pockets = ["0.2x", "0.5x", "1x", "5x", "1x", "0.5x", "0.2x"];
const multipliers = [0.2, 0.5, 1, 5, 1, 0.5, 0.2];

export function PlinkoBoard() {
  const host = useRef<HTMLDivElement>(null);
  const dropRef = useRef<(() => void) | null>(null);
  const [bet, setBet] = useState(10);
  const [risk, setRisk] = useState("MEDIUM");
  const [auto, setAuto] = useState(false);
  const [balance, setBalance] = useState(1000);
  const [result, setResult] = useState<string | null>(null);
  const betValue = useRef(bet);
  const autoValue = useRef(auto);
  betValue.current = bet;
  autoValue.current = auto;

  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};
    RAPIER.init().then(() => {
      if (disposed || !host.current) return;
      const container = host.current;
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(32, container.clientWidth / container.clientHeight, 0.1, 100);
      camera.position.set(0, 1, 19);
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.setSize(container.clientWidth, container.clientHeight); renderer.shadowMap.enabled = true;
      container.appendChild(renderer.domElement);
      scene.add(new THREE.AmbientLight(0x9bbdc1, 1.8));
      const key = new THREE.PointLight(0x28dfc9, 55, 24); key.position.set(-6, 8, 10); scene.add(key);
      const fill = new THREE.PointLight(0xff4d83, 35, 20); fill.position.set(7, -3, 8); scene.add(fill);
      const pegMat = new THREE.MeshStandardMaterial({ color: 0x71e9d8, emissive: 0x064e50, metalness: .8, roughness: .2 });
      const pegGeo = new THREE.SphereGeometry(.16, 18, 18);
      const pegColliderRadius = .24;
      const ballRadius = .225;
      const world = new RAPIER.World({ x: 0, y: -16, z: 0 });
      world.integrationParameters.dt = 1 / 60;
      const pegs: THREE.Mesh[] = [];
      for (let row = 0; row < 10; row++) for (let col = 0; col < row + 3; col++) {
        const x = (col - (row + 2) / 2) * .82, y = 4.65 - row * .78;
        const mesh = new THREE.Mesh(pegGeo, pegMat); mesh.position.set(x, y, 0); scene.add(mesh); pegs.push(mesh);
        world.createCollider(RAPIER.ColliderDesc.ball(pegColliderRadius).setTranslation(x, y, 0));
      }
      const wallMat = new THREE.MeshStandardMaterial({ color: 0x263f49, metalness: .65, roughness: .3 });
      const wallGeo = new THREE.BoxGeometry(.22, 8, .7);
      [-4.9, 4.9].forEach(x => { const m = new THREE.Mesh(wallGeo, wallMat); m.position.set(x, .5, 0); scene.add(m); world.createCollider(RAPIER.ColliderDesc.cuboid(.11, 4, .35).setTranslation(x, .5, 0)); });
      for (let i = 0; i < 8; i++) { const x = -4.3 + i * 1.23; const m = new THREE.Mesh(new THREE.BoxGeometry(.06, 1.2, .6), wallMat); m.position.set(x, -3.4, 0); scene.add(m); world.createCollider(RAPIER.ColliderDesc.cuboid(.04, .6, .4).setTranslation(x, -3.4, 0)); }
      const ball = new THREE.Mesh(new THREE.SphereGeometry(ballRadius, 24, 24), new THREE.MeshStandardMaterial({ color: 0xffd35c, emissive: 0x884b00, metalness: .6, roughness: .16 })); scene.add(ball); ball.visible = false;
      let body: RAPIER.RigidBody | null = null; let active = false; let frame = 0;
      dropRef.current = () => { if (active || balance < betValue.current) return; const currentBet = betValue.current; setBalance(v => Math.max(0, v - currentBet)); setResult(null); const desc = RAPIER.RigidBodyDesc.dynamic().setTranslation((Math.random() - .5) * .35, 5.8, .2).setLinvel(0, 0, 0); desc.setCcdEnabled(true).setCanSleep(false).setLinearDamping(.08); body = world.createRigidBody(desc); world.createCollider(RAPIER.ColliderDesc.ball(ballRadius).setRestitution(.82).setFriction(.18).setDensity(1.2), body); ball.visible = true; active = true; };
      const tick = () => { world.step(); if (body) { const p = body.translation(); ball.position.set(p.x, p.y, p.z); ball.quaternion.set(body.rotation().x, body.rotation().y, body.rotation().z, body.rotation().w); if (p.y < -3.7) { const index = Math.max(0, Math.min(6, Math.floor((p.x + 4.9) / 1.4))); const win = Math.round(bet * multipliers[index]); setResult(`${pockets[index]}  /  +${win}`); setBalance(v => v + win); world.removeRigidBody(body); body = null; active = false; if (auto) window.setTimeout(() => dropRef.current?.(), 450); } } renderer.render(scene, camera); frame = requestAnimationFrame(tick); };
      tick();
      const resize = () => { camera.aspect = container.clientWidth / container.clientHeight; camera.updateProjectionMatrix(); renderer.setSize(container.clientWidth, container.clientHeight); }; window.addEventListener("resize", resize);
      cleanup = () => { cancelAnimationFrame(frame); window.removeEventListener("resize", resize); renderer.dispose(); world.free(); if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement); };
    });
    return () => { disposed = true; cleanup(); };
  }, [auto, bet]);

  return <section className="casino-machine"><div className="machine-top"><div><p className="machine-label">PLINKO / 3D ENGINE</p><h2>DROP TABLE <span>LIVE</span></h2></div><div className="balance"><small>BALANCE</small><b>{balance.toLocaleString("de-DE")} <i>CR</i></b></div></div><div className="board-shell"><div ref={host} className="plinko-canvas" /><div className="prizes">{pockets.map((p, i) => <span className={i === 3 ? "jackpot" : ""} key={i}>{p}</span>)}</div>{result && <div className="win-toast">RESULT <strong>{result}</strong></div>}</div><div className="casino-controls"><label>BET AMOUNT <input type="number" min="1" max="1000" value={bet} onChange={e => setBet(Math.max(1, Number(e.target.value)))} /><span>CR</span></label><div className="risk"><small>RISK</small>{["LOW", "MEDIUM", "HIGH"].map(item => <button className={risk === item ? "selected" : ""} onClick={() => setRisk(item)} key={item}>{item}</button>)}</div><button className={`auto ${auto ? "on" : ""}`} onClick={() => setAuto(v => !v)}><i /> AUTOPLAY</button><button className="drop-button" onClick={() => dropRef.current?.()}>{result ? "DROP AGAIN" : "DROP CHIP"}<b>↗</b></button></div><p className="demo-note">DEMO CREDITS ONLY · NO REAL MONEY · {risk} RISK</p></section>;
}
