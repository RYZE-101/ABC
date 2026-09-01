"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d-compat";

const pockets = ["0.2x", "0.5x", "1x", "5x", "1x", "0.5x", "0.2x"];
const multipliers = [0.2, 0.5, 1, 5, 1, 0.5, 0.2];
const RAIN_BALLS = 40;

type ActiveBall = { body: RAPIER.RigidBody; mesh: THREE.Mesh; bet: number };

export function PlinkoBoard() {
  const host = useRef<HTMLDivElement>(null);
  const dropRef = useRef<((count: number) => void) | null>(null);
  const [bet, setBet] = useState(10);
  const [risk, setRisk] = useState("MEDIUM");
  const [auto, setAuto] = useState(false);
  const [balance, setBalance] = useState(1000);
  const [result, setResult] = useState<string | null>(null);
  const betValue = useRef(bet);
  const autoValue = useRef(auto);
  const balanceValue = useRef(balance);
  betValue.current = bet;
  autoValue.current = auto;
  balanceValue.current = balance;

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
      renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
      renderer.setSize(container.clientWidth, container.clientHeight);
      container.appendChild(renderer.domElement);
      scene.add(new THREE.AmbientLight(0x9bbdc1, 1.8));
      const key = new THREE.PointLight(0x28dfc9, 55, 24); key.position.set(-6, 8, 10); scene.add(key);
      const fill = new THREE.PointLight(0xff4d83, 35, 20); fill.position.set(7, -3, 8); scene.add(fill);

      const world = new RAPIER.World({ x: 0, y: -16, z: 0 });
      world.integrationParameters.dt = 1 / 60;
      world.integrationParameters.numSolverIterations = 12;
      world.integrationParameters.numInternalPgsIterations = 4;
      const pegMat = new THREE.MeshStandardMaterial({ color: 0x71e9d8, emissive: 0x064e50, metalness: .8, roughness: .2 });
      const pegGeo = new THREE.SphereGeometry(.16, 18, 18);
      const ballRadius = .225;
      for (let row = 0; row < 10; row++) for (let col = 0; col < row + 3; col++) {
        const x = (col - (row + 2) / 2) * .82;
        const y = 4.65 - row * .78;
        const mesh = new THREE.Mesh(pegGeo, pegMat); mesh.position.set(x, y, 0); scene.add(mesh);
        world.createCollider(RAPIER.ColliderDesc.ball(.18).setTranslation(x, y, 0));
      }
      const wallMat = new THREE.MeshStandardMaterial({ color: 0x263f49, metalness: .65, roughness: .3 });
      [-4.9, 4.9].forEach(x => {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(.22, 8, .8), wallMat); mesh.position.set(x, .5, 0); scene.add(mesh);
        world.createCollider(RAPIER.ColliderDesc.cuboid(.11, 4, .4).setTranslation(x, .5, 0));
      });
      for (let i = 0; i < 8; i++) {
        const x = -4.3 + i * 1.23;
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(.08, 1.2, .8), wallMat); mesh.position.set(x, -3.4, 0); scene.add(mesh);
        world.createCollider(RAPIER.ColliderDesc.cuboid(.04, .6, .4).setTranslation(x, -3.4, 0));
      }
      const base = new THREE.Mesh(new THREE.BoxGeometry(9.8, .18, .9), wallMat); base.position.set(0, -4.02, 0); scene.add(base);
      world.createCollider(RAPIER.ColliderDesc.cuboid(4.9, .09, .45).setTranslation(0, -4.02, 0));

      const ballGeo = new THREE.SphereGeometry(ballRadius, 20, 20);
      const ballMat = new THREE.MeshStandardMaterial({ color: 0xffd35c, emissive: 0x884b00, metalness: .6, roughness: .16 });
      const activeBalls: ActiveBall[] = [];
      let frame = 0;
      dropRef.current = (count) => {
        const currentBet = betValue.current;
        const actualCount = Math.min(count, Math.floor(balanceValue.current / currentBet), RAIN_BALLS);
        if (actualCount < 1) return;
        const cost = currentBet * actualCount;
        balanceValue.current -= cost;
        setBalance(balanceValue.current);
        setResult(null);
        for (let i = 0; i < actualCount; i++) {
          const mesh = new THREE.Mesh(ballGeo, ballMat);
          scene.add(mesh);
          const desc = RAPIER.RigidBodyDesc.dynamic().setTranslation((Math.random() - .5) * .65, 5.85 + i * .035, 0).setLinvel((Math.random() - .5) * .35, 0, 0);
          desc.setCcdEnabled(true).setCanSleep(false).setLinearDamping(.08);
          const body = world.createRigidBody(desc);
          body.setEnabledTranslations(true, true, false, true);
          body.lockRotations(true, true);
          world.createCollider(RAPIER.ColliderDesc.ball(ballRadius).setRestitution(.76).setFriction(.18).setDensity(1.2), body);
          activeBalls.push({ body, mesh, bet: currentBet });
        }
      };
      let lastTime = performance.now();
      const tick = (now = performance.now()) => {
        const elapsed = Math.min((now - lastTime) / 1000, .05); lastTime = now;
        const steps = Math.max(1, Math.min(4, Math.ceil(elapsed / (1 / 60))));
        for (let step = 0; step < steps; step++) world.step();
        let payout = 0;
        for (let i = activeBalls.length - 1; i >= 0; i--) {
          const current = activeBalls[i]; const p = current.body.translation();
          current.mesh.position.set(p.x, p.y, p.z);
          if (p.y < -3.7) {
            const index = Math.max(0, Math.min(6, Math.floor((p.x + 4.9) / 1.4)));
            payout += Math.round(current.bet * multipliers[index]);
            scene.remove(current.mesh); world.removeRigidBody(current.body); activeBalls.splice(i, 1);
            setResult(`${activeBalls.length + 1} BALL${activeBalls.length ? "S" : ""} LANDED`);
          }
        }
        if (payout) { balanceValue.current += payout; setBalance(balanceValue.current); }
        if (activeBalls.length === 0 && autoValue.current) window.setTimeout(() => dropRef.current?.(1), 450);
        renderer.render(scene, camera); frame = requestAnimationFrame(tick);
      };
      tick();
      const resize = () => { camera.aspect = container.clientWidth / container.clientHeight; camera.updateProjectionMatrix(); renderer.setSize(container.clientWidth, container.clientHeight); };
      window.addEventListener("resize", resize);
      cleanup = () => { cancelAnimationFrame(frame); window.removeEventListener("resize", resize); renderer.dispose(); world.free(); if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement); };
    });
    return () => { disposed = true; cleanup(); };
  }, []);

  return <section className="casino-machine"><div className="machine-top"><div><p className="machine-label">PLINKO / 3D ENGINE</p><h2>DROP TABLE <span>LIVE</span></h2></div><div className="balance"><small>BALANCE</small><b>{balance.toLocaleString("de-DE")} <i>CR</i></b></div></div><div className="board-shell"><div ref={host} className="plinko-canvas" /><div className="prizes">{pockets.map((p, i) => <span className={i === 3 ? "jackpot" : ""} key={i}>{p}</span>)}</div>{result && <div className="win-toast">RESULT <strong>{result}</strong></div>}</div><div className="casino-controls"><label>BET AMOUNT <input type="number" min="1" max="1000" value={bet} onChange={e => setBet(Math.max(1, Number(e.target.value)))} /><span>CR</span></label><div className="risk"><small>RISK</small>{["LOW", "MEDIUM", "HIGH"].map(item => <button className={risk === item ? "selected" : ""} onClick={() => setRisk(item)} key={item}>{item}</button>)}</div><button className={`auto ${auto ? "on" : ""}`} onClick={() => setAuto(v => !v)}><i /> AUTOPLAY</button><button className="rain-button" onClick={() => dropRef.current?.(RAIN_BALLS)}>BALL RAIN <b>×{RAIN_BALLS}</b></button><button className="drop-button" onClick={() => dropRef.current?.(1)}>DROP CHIP <b>↗</b></button></div><p className="demo-note">DEMO CREDITS ONLY · NO REAL MONEY · {risk} RISK</p></section>;
}
