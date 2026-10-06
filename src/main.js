import "./style.css";

/* =========================================================
   JUGO — protótipo jogável (pseudo-3D em canvas 2D)
   Terceira pessoa • joystick • câmera manual • A/B com mira • C ultimate
   ========================================================= */

const app = document.querySelector("#app");

const skillAimStyle = document.createElement("style");
skillAimStyle.textContent = `
  .skill.aiming{z-index:8;box-shadow:0 0 0 3px #9fe6ff,0 0 30px #58c8ff;animation:pulse .8s infinite}
  .skill.aim-stick{position:absolute;left:50%;top:50%;width:128%;height:128%;transform:translate(-50%,-50%);border-radius:50%;border:2px solid rgba(159,230,255,.72);background:radial-gradient(circle,rgba(88,200,255,.16),rgba(35,58,130,.22) 48%,rgba(8,12,36,.08) 72%,transparent 73%);box-shadow:inset 0 0 18px rgba(100,210,255,.2),0 0 22px rgba(88,200,255,.28);opacity:0;pointer-events:none;transition:opacity .08s,transform .12s}
  .skill.aiming .aim-stick{opacity:1;transform:translate(-50%,-50%) scale(1.08)}
  .skill.aim-knob{position:absolute;left:50%;top:50%;width:34%;height:34%;border-radius:50%;transform:translate(-50%,-50%);background:radial-gradient(circle at 35% 30%,#b9efff,#4b8ff0 48%,#162054 100%);border:2px solid rgba(220,245,255,.8);box-shadow:0 0 16px rgba(88,200,255,.7),inset 0 0 10px rgba(255,255,255,.2)}
`;
document.head.appendChild(skillAimStyle);
app.innerHTML = `
  <main class="game-shell">
    <canvas id="game" aria-label="Mapa do Jugo"></canvas>

    <div class="hud">
      <div class="hud-left">
        <div class="brand"><span class="brand-mark">✦</span><span>JUGO</span></div>
        <div class="hp">
          <div class="hp-label"><span>JUGO</span><span id="hpText">920 / 920</span></div>
          <div class="hp-bar"><div class="hp-fill" id="hpFill"></div></div>
        </div>
      </div>
      <div class="hud-right">
        <div class="score">ABATES<b id="score">0</b></div>
        <div class="status" id="status">EXPLORANDO</div>
      </div>
    </div>

    <div class="aim-hint" id="aimHint"></div>

    <div class="controls">
      <div class="joystick" id="joystick">
        <div class="joystick-ring"></div>
        <div class="joystick-knob" id="joystickKnob"></div>
      </div>
      <div class="skill-row">
        <button class="skill skill-a" data-skill="A" aria-label="Habilidade A — Criatura"><span class="key">A</span><span class="lbl">CRIATURA</span><span class="cd"></span><span class="cdt"></span><span class="aim-stick" aria-hidden="true"><span class="aim-knob"></span></span></button>
        <button class="skill skill-b" data-skill="B" aria-label="Habilidade B — Esferas"><span class="key">B</span><span class="lbl">ESFERAS</span><span class="cd"></span><span class="cdt"></span><span class="aim-stick" aria-hidden="true"><span class="aim-knob"></span></span></button>
        <button class="skill skill-c" data-skill="C" aria-label="Ultimate"><span class="key">C</span><span class="lbl">ULTIMATE</span><span class="cd"></span><span class="cdt"></span></button>
      </div>
    </div>

    <div class="overlay hidden" id="overlay"><h1>JUGO CAIU</h1><p>TOQUE PARA VOLTAR</p></div>
    <div class="hint">JOYSTICK / WASD mover • A/B: segure e arraste para mirar • solte para lançar • C ultimate</div>
  </main>
`;

const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const joystick = document.querySelector("#joystick");
const knob = document.querySelector("#joystickKnob");
const $hpFill = document.querySelector("#hpFill");
const $hpText = document.querySelector("#hpText");
const $score = document.querySelector("#score");
const $status = document.querySelector("#status");
const $aimHint = document.querySelector("#aimHint");
const $overlay = document.querySelector("#overlay");
const btn = {};
document.querySelectorAll(".skill").forEach(b => (btn[b.dataset.skill] = b));

/* ---------------- utils ---------------- */
const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const damp = (k, dt) => 1 - Math.exp(-k * dt);
const wrap = a => { while (a > Math.PI) a -= TAU; while (a < -Math.PI) a += TAU; return a; };
const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
function mulberry(seed) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function hash(a, b) { let h = (a * 374761393 + b * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }
const rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const mix = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

/* ---------------- sprites (arte oficial do Jugo) ---------------- */
import jugoSideUrl from "./assets/jugo-side.png";
import jugoBackUrl from "./assets/jugo-back.png";
import jugoUltUrl from "./assets/jugo-ult.png";
import knightUrl from "./assets/knight.png";
import archerUrl from "./assets/archer.png";
import creatureUrl from "./assets/creature.png";
const loadImg = src => { const i = new Image(); i.src = src; return i; };
const IMG = { side: loadImg(jugoSideUrl), back: loadImg(jugoBackUrl), ult: loadImg(jugoUltUrl), knight: loadImg(knightUrl), archer: loadImg(archerUrl), creature: loadImg(creatureUrl) };
function sprite(img, h, flip = 1) {
  if (!img.complete || !img.naturalWidth) return false;
  const w = h * img.naturalWidth / img.naturalHeight;
  ctx.save(); ctx.scale(flip, 1); ctx.drawImage(img, -w / 2, -h, w, h); ctx.restore();
  return true;
}

/* ---------------- canvas ---------------- */
let W = 0, H = 0;
function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  W = innerWidth; H = innerHeight;
  canvas.width = Math.floor(W * dpr); canvas.height = Math.floor(H * dpr);
  canvas.style.width = W + "px"; canvas.style.height = H + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
addEventListener("resize", resize);
resize();

/* ---------------- world ---------------- */
const WORLD_R = 62;
const FOG = [16, 12, 38];
const rand = mulberry(1337);
const props = [];
const decals = [];
const lights = [];
function freeSpot(minR = 7, maxR = WORLD_R - 4, pad = 2) {
  for (let i = 0; i < 40; i++) {
    const a = rand() * TAU, r = minR + rand() * (maxR - minR);
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (props.every(p => Math.hypot(p.x - x, p.z - z) > (p.r || 0.5) + pad)) return { x, z };
  }
  return { x: (rand() - .5) * 80, z: (rand() - .5) * 80 };
}
const BLOCK_COLORS = [[52, 66, 140], [184, 142, 62], [104, 74, 182], [46, 104, 170], [150, 64, 104]];
props.push({ type: "sign", x: -3.5, z: 8, r: 0.8 });
props.push({ type: "gate", x: 0, z: 30, r: 0, w: 7 });
for (let i = 0; i < 34; i++) { const s = freeSpot(); const size = 1.1 + rand() * 1.5; props.push({ type: "block", ...s, size, r: size * 0.75, rot: rand() * TAU, color: BLOCK_COLORS[(rand() * 5) | 0], letter: "JUGO"[(rand() * 4) | 0], stack: rand() < 0.3 }); }
for (let i = 0; i < 8; i++) props.push({ type: "slide", ...freeSpot(10), r: 1.6 });
for (let i = 0; i < 7; i++) props.push({ type: "swing", ...freeSpot(10), r: 1.4, ph: rand() * TAU });
for (let i = 0; i < 6; i++) props.push({ type: "teddy", ...freeSpot(9), r: 0.9, ph: rand() });
for (let i = 0; i < 8; i++) props.push({ type: "duck", ...freeSpot(8), r: 0.6, s: 0.8 + rand() * 0.8 });
for (let i = 0; i < 22; i++) props.push({ type: "tree", ...freeSpot(14), r: 0.8, s: 0.8 + rand() * 0.7, seed: rand() });
for (let i = 0; i < 44; i++) { const a = (i / 44) * TAU; props.push({ type: "tree", x: Math.cos(a) * (WORLD_R + 2 + rand() * 3), z: Math.sin(a) * (WORLD_R + 2 + rand() * 3), r: 1, s: 1 + rand() * 0.8, seed: rand() }); }
for (let i = 0; i < 30; i++) { const s = freeSpot(5, WORLD_R - 3, 1); const hue = rand() < 0.5 ? [150, 90, 255] : [80, 170, 255]; props.push({ type: "shroom", ...s, r: 0, s: 0.4 + rand() * 0.6, hue, ph: rand() * TAU }); lights.push({ x: s.x, z: s.z, r: 2.4, c: hue }); }
for (let i = 0; i < 380; i++) { const a = rand() * TAU, r = Math.sqrt(rand()) * WORLD_R; decals.push({ x: Math.cos(a) * r, z: Math.sin(a) * r, s: 0.15 + rand() * 0.5, kind: rand() < 0.6 ? 0 : rand() < 0.5 ? 1 : 2, rot: rand() * TAU }); }
const solids = props.filter(p => p.r > 0);

// distant skyline (angles around the horizon)
const skyline = [];
for (let i = 0; i < 26; i++) skyline.push({ a: rand() * TAU, type: ["ferris", "tower", "slide", "tree", "tree"][(rand() * 5) | 0], s: 0.6 + rand() * 0.9, seed: rand() });

/* ---------------- state ---------------- */
const MAX_HP = 920;
let player, cam, enemies, arrows, orbs, pending, particles, rings, texts, creature, cds, aiming, aimPoint, score, spawnTimer, time, hurtFlash, shake;
const CD = { A: 6, B: 7, C: 20 };
function reset() {
  player = { x: 0, z: 0, vx: 0, vz: 0, facing: 0, hp: MAX_HP, walk: 0, ult: 0, ultAnim: 0, dash: null, atkCd: 0, slash: 0, spin: 0, hurt: 0, alive: true, flip: 1, scale: 1, dustT: 0 };
  cam = { x: 0, z: 0, yaw: 0, dist: 9 };
  enemies = []; arrows = []; orbs = []; pending = []; particles = []; rings = []; texts = [];
  creature = null; cds = { A: 0, B: 0, C: 4 }; aiming = null; aimPoint = null; score = 0; spawnTimer = 1.2; hurtFlash = 0; shake = 0;
  $overlay.classList.add("hidden");
}
time = 0;
reset();

/* ---------------- input ---------------- */
const input = { x: 0, y: 0, keys: new Set() };
let joyId = null;
function setJoystick(cx0, cy0) {
  const r = joystick.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2, max = r.width * 0.32;
  let dx = cx0 - cx, dy = cy0 - cy; const len = Math.hypot(dx, dy) || 1; const l = Math.min(len, max);
  dx = dx / len * l; dy = dy / len * l;
  input.x = dx / max; input.y = dy / max;
  knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
}
function resetJoystick() { input.x = 0; input.y = 0; joyId = null; knob.style.transform = "translate(-50%, -50%)"; }
joystick.addEventListener("pointerdown", e => { joyId = e.pointerId; joystick.setPointerCapture(e.pointerId); setJoystick(e.clientX, e.clientY); });
joystick.addEventListener("pointermove", e => { if (e.pointerId === joyId) setJoystick(e.clientX, e.clientY); });
joystick.addEventListener("pointerup", resetJoystick);
joystick.addEventListener("pointercancel", resetJoystick);

addEventListener("keydown", e => {
  const k = e.key.toLowerCase(); input.keys.add(k);
  if (e.repeat) return;
  if (k === "j" || k === "1") pressSkill("A");
  if (k === "k" || k === "2") pressSkill("B");
  if (k === "l" || k === "3") pressSkill("C");
  if (k === "escape") aiming = null;
});
addEventListener("keyup", e => input.keys.delete(e.key.toLowerCase()));

let skillAimPtr = null;
let skillAimKey = null;

// Câmera manual no lado direito: somente a faixa central/direita da tela
// recebe o gesto de rotação. A área dos botões continua reservada às skills.
let cameraPtr = null;
let cameraLastX = 0;
const cameraZone = {
  // Faixa grande no lado direito: começa no meio da tela
  // e ocupa cerca de 30% da metade direita, deixando a área
  // dos botões de habilidade livre.
  minX: 0.50,
  maxX: 1.00,
  minY: 0.30,
  maxY: 0.62
};
function inCameraZone(x, y) {
  return x >= innerWidth * cameraZone.minX &&
    x <= innerWidth * cameraZone.maxX &&
    y >= innerHeight * cameraZone.minY &&
    y <= innerHeight * cameraZone.maxY;
}
function beginCameraDrag(e) {
  if (cameraPtr !== null || skillAimPtr !== null || joyId !== null || !player.alive) return;
  if (!inCameraZone(e.clientX, e.clientY)) return;
  cameraPtr = e.pointerId;
  cameraLastX = e.clientX;
  canvas.setPointerCapture?.(e.pointerId);
}
function moveCameraDrag(e) {
  if (cameraPtr !== e.pointerId) return;
  const dx = e.clientX - cameraLastX;
  cameraLastX = e.clientX;
  // Somente o deslocamento horizontal controla a câmera.
  // Arrastar para cima/baixo não altera o ângulo.
  cam.yaw = wrap(cam.yaw - dx * 0.014);
}
function endCameraDrag(e) {
  if (cameraPtr !== e.pointerId) return;
  cameraPtr = null;
}
canvas.addEventListener("pointerdown", beginCameraDrag);
canvas.addEventListener("pointermove", moveCameraDrag);
canvas.addEventListener("pointerup", endCameraDrag);
canvas.addEventListener("pointercancel", endCameraDrag);
canvas.addEventListener("lostpointercapture", e => {
  if (cameraPtr === e.pointerId) cameraPtr = null;
});

function updateSkillAim(k, clientX, clientY) {
  const b = btn[k];
  if (!b) return;
  const r = b.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  const max = Math.max(22, Math.min(40, r.width * 0.48));
  let dx = clientX - cx;
  let dy = clientY - cy;
  const len = Math.hypot(dx, dy);
  const l = Math.min(len, max);
  if (len > 0.001) {
    dx = dx / len * l;
    dy = dy / len * l;
  }

  const knobEl = b.querySelector(".aim-knob");
  if (knobEl) knobEl.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;

  // O mini-joystick controla direção e distância.
  // Centro = perto de Jugo; borda = alcance máximo.
  const R = { x: Math.cos(cam.yaw), z: -Math.sin(cam.yaw) };
  const F = { x: Math.sin(cam.yaw), z: Math.cos(cam.yaw) };
  const sx = max > 0 ? dx / max : 0;
  const sy = max > 0 ? dy / max : 0;
  const mag = clamp(Math.hypot(sx, sy), 0, 1);
  const wx = R.x * sx - F.x * sy;
  const wz = R.z * sx - F.z * sy;
  const wl = Math.hypot(wx, wz) || 1;
  const maxRange = k === "A" ? rangeA() : 13;
  const minRange = k === "A" ? 1.25 : 2.5;
  const range = minRange + (maxRange - minRange) * mag;

  if (mag > 0.02) {
    aimPoint = {
      x: player.x + wx / wl * range,
      z: player.z + wz / wl * range
    };
    player.facing = Math.atan2(wx / wl, wz / wl);
  } else {
    const f = facingVec();
    aimPoint = {
      x: player.x + f.x * minRange,
      z: player.z + f.z * minRange
    };
  }
}
function resetSkillAimVisual(k) {
  const b = btn[k];
  if (!b) return;
  const knobEl = b.querySelector(".aim-knob");
  if (knobEl) knobEl.style.transform = "translate(-50%, -50%)";
  b.classList.remove("pressed");
}

function beginSkillAim(k, e) {
  if (!player.alive) return;
  if (cds[k] > 0) { deny(k); return; }
  if (k === "B" && player.ult > 0) {
    castSpin();
    return;
  }

  skillAimPtr = e.pointerId;
  skillAimKey = k;
  btn[k].setPointerCapture?.(e.pointerId);
  btn[k].classList.add("pressed");
  aiming = k;

  const f = facingVec();
  const range = k === "A" ? rangeA() : 13;
  aimPoint = { x: player.x + f.x * range, z: player.z + f.z * range };
  updateSkillAim(k, e.clientX, e.clientY);
}

function finishSkillAim(e, cancelled = false) {
  if (skillAimPtr !== e.pointerId) return;
  const k = skillAimKey;
  skillAimPtr = null;
  skillAimKey = null;
  if (k) {
    if (!cancelled && player.alive) cast(k);
    resetSkillAimVisual(k);
  }
  aiming = null;
}

Object.entries(btn).forEach(([k, b]) => {
  b.addEventListener("pointerdown", e => {
    e.preventDefault();
    if (k === "C") {
      b.classList.add("pressed");
      pressSkill(k);
      return;
    }
    beginSkillAim(k, e);
  });
  b.addEventListener("pointermove", e => {
    if (skillAimPtr === e.pointerId && skillAimKey === k) {
      e.preventDefault();
      updateSkillAim(k, e.clientX, e.clientY);
    }
  });
  b.addEventListener("pointerup", e => {
    if (k === "C") { b.classList.remove("pressed"); return; }
    finishSkillAim(e);
  });
  b.addEventListener("pointercancel", e => {
    if (k === "C") { b.classList.remove("pressed"); return; }
    finishSkillAim(e, true);
  });
  b.addEventListener("lostpointercapture", e => {
    if (k !== "C" && skillAimPtr === e.pointerId) finishSkillAim(e, true);
  });
});

canvas.addEventListener("pointerdown", e => {
  if (!player.alive) { reset(); return; }
});

$overlay.addEventListener("pointerdown", () => reset());

function deny(k) { btn[k].classList.remove("denied"); void btn[k].offsetWidth; btn[k].classList.add("denied"); }

function pressSkill(k) {
  if (!player.alive) return;
  if (k === "C") { castUlt(); return; }
  if (cds[k] > 0) { deny(k); return; }
  if (k === "B" && player.ult > 0) { castSpin(); aiming = null; return; }
  aiming = k;
  const f = facingVec();
  const range = k === "A" ? rangeA() : 13;
  aimPoint = { x: player.x + f.x * range, z: player.z + f.z * range };
}

/* ---------------- camera / projection ---------------- */
const view = { cx: 0, cy: 0, focal: 1, camX: 0, camY: 5, camZ: 0, F: { x: 0, z: 1 }, R: { x: 1, z: 0 }, cp: 1, sp: 0, sx: 0, sy: 0 };
const PITCH = 0.36;
function setupView() {
  view.focal = Math.max(Math.min(W * 0.62, H * 1.25), H * 0.5);
  view.cx = W / 2; view.cy = H * (W > H ? 0.42 : 0.46);
  const ult = player.ult > 0 ? 1 : 0;
  view.F = { x: Math.sin(cam.yaw), z: Math.cos(cam.yaw) };
  view.R = { x: Math.cos(cam.yaw), z: -Math.sin(cam.yaw) };
  view.camX = cam.x - view.F.x * cam.dist; view.camZ = cam.z - view.F.z * cam.dist;
  view.camY = 5 + ult * 1.2;
  view.cp = Math.cos(PITCH); view.sp = Math.sin(PITCH);
  view.sx = (Math.random() - .5) * shake * 14; view.sy = (Math.random() - .5) * shake * 14;
}
function proj(x, y, z) {
  const dx = x - view.camX, dy = y - view.camY, dz = z - view.camZ;
  const r = dx * view.R.x + dz * view.R.z, f = dx * view.F.x + dz * view.F.z;
  const d = f * view.cp - dy * view.sp, u = f * view.sp + dy * view.cp;
  if (d < 0.35) return null;
  const k = view.focal / d;
  return { x: view.cx + r * k + view.sx, y: view.cy - u * k + view.sy, k, d };
}
function unproject(sx, sy) {
  const rx = (sx - view.cx) / view.focal, uy = (view.cy - sy) / view.focal;
  const c = { x: view.F.x * view.cp, y: -view.sp, z: view.F.z * view.cp };
  const u = { x: view.F.x * view.sp, y: view.cp, z: view.F.z * view.sp };
  const d = { x: c.x + view.R.x * rx + u.x * uy, y: c.y + u.y * uy, z: c.z + view.R.z * rx + u.z * uy };
  if (d.y > -0.02) d.y = -0.02;
  const t = -view.camY / d.y;
  return { x: view.camX + d.x * t, z: view.camZ + d.z * t };
}
const fogOf = d => clamp((d - 16) / 46, 0, 0.88);

/* ---------------- spawning ---------------- */
function spawnEnemy(type) {
  for (let i = 0; i < 20; i++) {
    const a = Math.random() * TAU, r = 20 + Math.random() * 10;
    const x = clamp(player.x + Math.cos(a) * r, -WORLD_R + 4, WORLD_R - 4), z = clamp(player.z + Math.sin(a) * r, -WORLD_R + 4, WORLD_R - 4);
    if (Math.hypot(x - player.x, z - player.z) < 14) continue;
    if (solids.some(p => Math.hypot(p.x - x, p.z - z) < p.r + 1)) continue;
    const knight = type === "knight";
    enemies.push({ type, x, z, vx: 0, vz: 0, kx: 0, kz: 0, hp: knight ? 260 : 170, max: knight ? 260 : 170, state: "move", t: 0, cd: 1 + Math.random(), walk: Math.random() * 6, flash: 0, slow: 0, dead: 0, spawn: 0, flip: 1, aimX: 0, aimZ: 0, strafe: Math.random() < 0.5 ? 1 : -1, keyRot: 0 });
    burst(x, 0.8, z, [150, 90, 255], 22, 4);
    rings.push({ x, z, r: 0.2, max: 2.2, life: 0.6, t: 0, c: [150, 90, 255] });
    return;
  }
}

/* ---------------- effects ---------------- */
function burst(x, y, z, c, n, sp = 3, size = 0.09, up = 2) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * TAU, s = Math.random() * sp;
    particles.push({ x, y, z, vx: Math.cos(a) * s, vy: Math.random() * up + 0.5, vz: Math.sin(a) * s, life: 0.4 + Math.random() * 0.5, max: 0.9, c, size: size * (0.6 + Math.random()), g: 6 });
  }
}
function floatText(x, z, txt, c, y = 2) { texts.push({ x, z, y, txt, c, life: 0.9 }); }

function damageEnemy(e, dmg, kx = 0, kz = 0) {
  if (e.dead) return;
  e.hp -= dmg; e.flash = 0.12; e.kx += kx; e.kz += kz;
  floatText(e.x, e.z, Math.round(dmg), [255, 236, 170], 2.2);
  burst(e.x, 1.1, e.z, [200, 220, 255], 6, 2.5, 0.06);
  if (e.hp <= 0) {
    e.dead = 0.001; score++;
    burst(e.x, 1, e.z, [140, 120, 255], 30, 5, 0.1, 3);
    burst(e.x, 0.6, e.z, [200, 200, 220], 14, 3, 0.12);
    if (e.state === "windup" || e.state === "aim") e.state = "move";
  }
}
function damagePlayer(dmg) {
  if (!player.alive) return;
  const d = player.ult > 0 ? dmg * 0.55 : dmg;
  player.hp -= d; player.hurt = 0.25; hurtFlash = 0.5; shake = Math.max(shake, 0.35);
  floatText(player.x, player.z, "-" + Math.round(d), [255, 110, 110], 2.4);
  burst(player.x, 1, player.z, [255, 90, 90], 10, 3, 0.07);
  if (player.hp <= 0) { player.hp = 0; player.alive = false; aiming = null; $overlay.classList.remove("hidden"); }
}

/* ---------------- skills ---------------- */
function facingVec() { return { x: Math.sin(player.facing), z: Math.cos(player.facing) }; }
function aimTarget(range) {
  let p = aimPoint;
  if (!p) { const f = facingVec(); p = { x: player.x + f.x * range * 0.7, z: player.z + f.z * range * 0.7 }; }
  const dx = p.x - player.x, dz = p.z - player.z, l = Math.hypot(dx, dz) || 1;
  const L = Math.min(l, range);
  return { x: player.x + dx / l * L, z: player.z + dz / l * L, dx: dx / l, dz: dz / l };
}
const rangeA = () => (player.ult > 0 ? 17 : 9);

function cast(k) {
  if (k === "A") {
    const t = aimTarget(rangeA());
    const big = player.ult > 0;
    creature = { x: t.x, z: t.z, hp: big ? 1500 : 900, max: big ? 1500 : 900, life: big ? 5 : 3, t: 0, big, hit: 0, out: 0 };
    rings.push({ x: t.x, z: t.z, r: 0.2, max: big ? 6 : 2.6, life: 0.7, t: 0, c: big ? [255, 200, 120] : [110, 210, 255], w: 4 });
    burst(t.x, 0.3, t.z, big ? [255, 210, 140] : [120, 220, 255], big ? 50 : 26, big ? 7 : 4, 0.09, 4);
    if (big) {
      shake = Math.max(shake, 0.4);
      for (const e of enemies) if (!e.dead && Math.hypot(e.x - t.x, e.z - t.z) < 6) { damageEnemy(e, 80); e.slow = 2.5; }
    }
    player.facing = Math.atan2(t.dx, t.dz);
    cds.A = CD.A;
  } else if (k === "B") {
    const t = aimTarget(13);
    player.facing = Math.atan2(t.dx, t.dz);
    const px = -t.dz, pz = t.dx;
    let n = 0;
    for (let g = 0; g < 7; g++) for (let j = 0; j < 3; j++) {
      if (n++ >= 20) break;
      const along = 3 + g * 1.5 + Math.random() * 0.6, side = (j - 1) * (1 + g * 0.08) + (Math.random() - .5) * 0.5;
      pending.push({ delay: g * 0.085, tx: player.x + t.dx * along + px * side, tz: player.z + t.dz * along + pz * side });
    }
    player.slash = 0.25;
    cds.B = CD.B;
  }
}
function castSpin() {
  player.spin = 0.55; cds.B = 2.6; shake = Math.max(shake, 0.6);
  rings.push({ x: player.x, z: player.z, r: 0.5, max: 6.5, life: 0.5, t: 0, c: [255, 210, 140], w: 6 });
  rings.push({ x: player.x, z: player.z, r: 0.3, max: 4.6, life: 0.35, t: 0, c: [160, 200, 255], w: 3 });
  for (const e of enemies) {
    if (e.dead) continue;
    const dx = e.x - player.x, dz = e.z - player.z, d = Math.hypot(dx, dz);
    if (d < 4.8) { const l = d || 1; damageEnemy(e, 220, dx / l * 17, dz / l * 17); e.state = "move"; e.t = 0; e.stun = 0.6; }
  }
  for (let i = 0; i < 40; i++) {
    const a = Math.random() * TAU, r = 1 + Math.random() * 3.5;
    particles.push({ x: player.x + Math.cos(a) * r, y: 0.8 + Math.random(), z: player.z + Math.sin(a) * r, vx: -Math.sin(a) * 6, vy: 1, vz: Math.cos(a) * 6, life: 0.6, max: 0.6, c: Math.random() < .5 ? [255, 210, 140] : [150, 200, 255], size: 0.1, g: 2 });
  }
}
function castUlt() {
  if (player.ult > 0) return;
  if (cds.C > 0) { deny("C"); return; }
  aiming = null;
  if (creature && !creature.out && dist(player, creature) < 30) {
    player.dash = { fx: player.x, fz: player.z, tx: creature.x, tz: creature.z, t: 0, dur: 0.28 };
    player.facing = Math.atan2(creature.x - player.x, creature.z - player.z);
  } else transform();
}
function transform() {
  player.ult = 10; player.ultAnim = 0.8; cds.C = CD.C + 10; shake = 0.8;
  rings.push({ x: player.x, z: player.z, r: 0.3, max: 9, life: 0.8, t: 0, c: [255, 200, 120], w: 7 });
  rings.push({ x: player.x, z: player.z, r: 0.3, max: 5, life: 0.5, t: 0, c: [170, 140, 255], w: 4 });
  burst(player.x, 1.2, player.z, [255, 210, 140], 70, 8, 0.12, 6);
  for (const e of enemies) {
    if (e.dead) continue;
    const dx = e.x - player.x, dz = e.z - player.z, d = Math.hypot(dx, dz) || 1;
    if (d < 6) damageEnemy(e, 60, dx / d * 10, dz / d * 10);
  }
}

/* ---------------- collisions ---------------- */
function resolve(o, rad) {
  for (const p of solids) {
    const dx = o.x - p.x, dz = o.z - p.z, d = Math.hypot(dx, dz), m = p.r + rad;
    if (d < m && d > 0.0001) { o.x = p.x + dx / d * m; o.z = p.z + dz / d * m; }
  }
  const r = Math.hypot(o.x, o.z);
  if (r > WORLD_R - 2) { o.x *= (WORLD_R - 2) / r; o.z *= (WORLD_R - 2) / r; }
}

/* ---------------- update ---------------- */
function update(dt) {
  time += dt;
  shake = Math.max(0, shake - dt * 1.8);
  hurtFlash = Math.max(0, hurtFlash - dt * 1.5);
  for (const k in cds) cds[k] = Math.max(0, cds[k] - dt);

  // ---- player movement ----
  let ix = input.x, iy = input.y;
  if (input.keys.has("w") || input.keys.has("arrowup")) iy -= 1;
  if (input.keys.has("s") || input.keys.has("arrowdown")) iy += 1;
  if (input.keys.has("a") || input.keys.has("arrowleft")) ix -= 1;
  if (input.keys.has("d") || input.keys.has("arrowright")) ix += 1;
  let il = Math.hypot(ix, iy); if (il > 1) { ix /= il; iy /= il; il = 1; }
  if (il < 0.12) { ix = 0; iy = 0; il = 0; }
  const R = { x: Math.cos(cam.yaw), z: -Math.sin(cam.yaw) }, F = { x: Math.sin(cam.yaw), z: Math.cos(cam.yaw) };
  const ult = player.ult > 0;
  const maxSpd = (ult ? 6.8 : 6.2) * (player.alive ? 1 : 0);
  const tvx = (R.x * ix - F.x * iy) * maxSpd, tvz = (R.z * ix - F.z * iy) * maxSpd;

  if (player.dash) {
    const d = player.dash; d.t += dt; const k = clamp(d.t / d.dur, 0, 1), e = 1 - Math.pow(1 - k, 3);
    player.x = lerp(d.fx, d.tx, e); player.z = lerp(d.fz, d.tz, e);
    particles.push({ x: player.x, y: 0.9, z: player.z, vx: 0, vy: 0.3, vz: 0, life: 0.35, max: 0.35, c: [180, 160, 255], size: 0.25, g: 0 });
    if (k >= 1) { player.dash = null; if (creature) creature.out = 0.4; transform(); }
  } else {
    const acc = il > 0 ? 9 : 7;
    player.vx += (tvx - player.vx) * damp(acc, dt);
    player.vz += (tvz - player.vz) * damp(acc, dt);
    player.x += player.vx * dt; player.z += player.vz * dt;
    resolve(player, 0.45);
  }
  const spd = Math.hypot(player.vx, player.vz);
  if (spd > 0.4 && !player.slash) {
    const target = Math.atan2(player.vx, player.vz);
    player.facing += wrap(target - player.facing) * damp(12, dt);
  }
  player.walk += spd * dt * 2.4;
  player.scale = lerp(player.scale, ult ? 1.6 : 1, damp(6, dt));
  player.dustT -= dt;
  if (spd > 3 && player.dustT <= 0 && player.alive) {
    player.dustT = 0.09;
    particles.push({ x: player.x + (Math.random() - .5) * .4, y: 0.05, z: player.z + (Math.random() - .5) * .4, vx: -player.vx * 0.1, vy: 0.4, vz: -player.vz * 0.1, life: 0.6, max: 0.6, c: [120, 110, 150], size: 0.18, g: 0, dust: 1 });
  }
  if (ult) {
    player.ult -= dt;
    if (Math.random() < 0.6) particles.push({ x: player.x + (Math.random() - .5) * 1.6, y: Math.random() * 2, z: player.z + (Math.random() - .5) * 1.6, vx: 0, vy: 1.5 + Math.random(), vz: 0, life: 0.8, max: 0.8, c: Math.random() < 0.5 ? [255, 210, 140] : [170, 150, 255], size: 0.07, g: -0.5 });
    if (player.ult <= 0) { player.ult = 0; rings.push({ x: player.x, z: player.z, r: 0.3, max: 3, life: 0.5, t: 0, c: [170, 150, 255] }); burst(player.x, 1.2, player.z, [170, 150, 255], 30, 4); }
  }
  player.ultAnim = Math.max(0, player.ultAnim - dt);
  player.slash = Math.max(0, player.slash - dt);
  player.spin = Math.max(0, player.spin - dt);
  player.hurt = Math.max(0, player.hurt - dt);

  // auto attack
  player.atkCd -= dt;
  if (player.alive && player.atkCd <= 0 && !player.dash) {
    const reach = ult ? 3.4 : 2.3;
    let best = null, bd = reach;
    for (const e of enemies) { if (e.dead) continue; const d = dist(e, player); if (d < bd) { bd = d; best = e; } }
    if (best) {
      player.atkCd = ult ? 0.55 : 0.7; player.slash = 0.28;
      const dx = best.x - player.x, dz = best.z - player.z, l = Math.hypot(dx, dz) || 1;
      player.facing = Math.atan2(dx, dz);
      damageEnemy(best, ult ? 120 : 45, dx / l * (ult ? 8 : 3), dz / l * (ult ? 8 : 3));
      if (ult) shake = Math.max(shake, 0.25);
    }
  }

  // ---- camera ----
  // A rotação agora é 100% manual pelo gesto na faixa direita da tela.
  // Não acompanha mais automaticamente a direção de Jugo.
  cam.x += (player.x + player.vx * 0.22 - cam.x) * damp(6, dt);
  cam.z += (player.z + player.vz * 0.22 - cam.z) * damp(6, dt);
  cam.dist = lerp(cam.dist, 8.6 + spd * 0.22 + (ult ? 3 : 0), damp(3, dt));

  // ---- creature ----
  if (creature) {
    const c = creature;
    c.t += dt; c.hit = Math.max(0, c.hit - dt);
    if (c.out) { c.out += dt; if (c.out > 0.8) creature = null; }
    else { c.life -= dt; if (c.life <= 0 || c.hp <= 0) { c.out = 0.001; burst(c.x, 0.6, c.z, [130, 220, 255], 24, 3); } }
  }

  // ---- orbs ----
  for (let i = pending.length - 1; i >= 0; i--) {
    const p = pending[i]; p.delay -= dt;
    if (p.delay <= 0) {
      pending.splice(i, 1);
      const f = facingVec();
      orbs.push({ sx: player.x + f.x * 0.5, sz: player.z + f.z * 0.5, x: player.x, z: player.z, y: 1.1, tx: p.tx, tz: p.tz, t: 0, fly: 0.42 + Math.random() * 0.1, life: 7, landed: false, tick: 0 });
    }
  }
  for (let i = orbs.length - 1; i >= 0; i--) {
    const o = orbs[i];
    if (!o.landed) {
      o.t += dt; const k = clamp(o.t / o.fly, 0, 1);
      o.x = lerp(o.sx, o.tx, k); o.z = lerp(o.sz, o.tz, k); o.y = lerp(1.1, 0.2, k) + Math.sin(k * Math.PI) * 1.6;
      if (k >= 1) { o.landed = true; o.y = 0.2; burst(o.x, 0.2, o.z, [110, 200, 255], 7, 2, 0.06, 1.5); rings.push({ x: o.x, z: o.z, r: 0.1, max: 0.9, life: 0.35, t: 0, c: [110, 200, 255] }); }
    } else {
      o.life -= dt; o.tick -= dt;
      if (o.life <= 0) { orbs.splice(i, 1); continue; }
      for (const e of enemies) {
        if (e.dead) continue;
        if (Math.hypot(e.x - o.x, e.z - o.z) < 0.9) {
          e.slow = Math.max(e.slow, 0.5);
          if (o.tick <= 0) { damageEnemy(e, 9); o.tick = 0.45; }
        }
      }
    }
  }

  // ---- enemies ----
  spawnTimer -= dt;
  const alive = enemies.filter(e => !e.dead).length;
  const want = Math.min(4 + Math.floor(score / 4), 11);
  if (spawnTimer <= 0 && alive < want && player.alive) {
    const archers = enemies.filter(e => !e.dead && e.type === "archer").length;
    spawnEnemy(archers < Math.ceil(want * 0.4) ? "archer" : "knight");
    spawnTimer = 1.4;
  }
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    e.flash = Math.max(0, e.flash - dt); e.spawn = Math.min(1, e.spawn + dt * 2); e.keyRot += dt * 4;
    e.stun = Math.max(0, (e.stun || 0) - dt);
    if (e.dead) { e.dead += dt; e.x += e.kx * dt; e.z += e.kz * dt; e.kx *= Math.exp(-5 * dt); e.kz *= Math.exp(-5 * dt); if (e.dead > 1) enemies.splice(i, 1); continue; }
    const slowMul = e.slow > 0 ? 0.45 : 1; e.slow = Math.max(0, e.slow - dt);
    const tgt = creature && !creature.out && dist(e, creature) < 16 ? creature : player;
    const dx = tgt.x - e.x, dz = tgt.z - e.z, d = Math.hypot(dx, dz) || 1;
    let mvx = 0, mvz = 0;
    e.t += dt; e.cd -= dt;
    if (e.stun > 0) { /* staggered */ }
    else if (e.type === "knight") {
      if (e.state === "move") {
        mvx = dx / d * 3.4; mvz = dz / d * 3.4;
        if (d < 1.8 && e.cd <= 0) { e.state = "windup"; e.t = 0; e.aimX = dx / d; e.aimZ = dz / d; }
      } else if (e.state === "windup") {
        if (e.t > 0.55) {
          e.state = "strike"; e.t = 0;
          const hx = e.x + e.aimX * 1.2, hz = e.z + e.aimZ * 1.2;
          if (Math.hypot(player.x - hx, player.z - hz) < 1.35) damagePlayer(75);
          if (creature && !creature.out && Math.hypot(creature.x - hx, creature.z - hz) < 1.5) { creature.hp -= 130; creature.hit = 0.2; floatText(creature.x, creature.z, "-130", [140, 220, 255], 1.6); }
          burst(hx, 0.4, hz, [255, 160, 100], 8, 3, 0.06);
        }
      } else if (e.state === "strike") { if (e.t > 0.45) { e.state = "move"; e.cd = 0.8; } }
    } else {
      if (e.state === "move") {
        const want = d < 9 ? -1 : d > 15 ? 1 : 0;
        mvx = (dx / d * want + -dz / d * e.strafe * 0.7) * 2.8; mvz = (dz / d * want + dx / d * e.strafe * 0.7) * 2.8;
        if (Math.random() < dt * 0.4) e.strafe *= -1;
        if (e.cd <= 0 && d < 19) { e.state = "aim"; e.t = 0; }
      } else if (e.state === "aim") {
        if (e.t < 0.65) { e.aimX = tgt.x; e.aimZ = tgt.z; }
        if (e.t > 0.95) {
          const ax = e.aimX - e.x, az = e.aimZ - e.z, al = Math.hypot(ax, az) || 1, sp = 21, ft = al / sp;
          arrows.push({ x: e.x + ax / al * 0.5, y: 1.3, z: e.z + az / al * 0.5, vx: ax / al * sp, vy: (-1.3 + 0.5 * 9 * ft * ft) / ft, vz: az / al * sp, life: 3, stuck: 0, trail: [], sdx: 0, sdy: -1, sdz: 0 });
          e.state = "recover"; e.t = 0;
        }
      } else if (e.state === "recover") { if (e.t > 0.45) { e.state = "move"; e.cd = 1.4 + Math.random() * 0.8; } }
    }
    // separation
    for (const o of enemies) { if (o === e || o.dead) continue; const sx = e.x - o.x, sz = e.z - o.z, sd = Math.hypot(sx, sz); if (sd < 1.2 && sd > 0.01) { mvx += sx / sd * 2; mvz += sz / sd * 2; } }
    e.vx += (mvx * slowMul - e.vx) * damp(8, dt); e.vz += (mvz * slowMul - e.vz) * damp(8, dt);
    e.x += (e.vx + e.kx) * dt; e.z += (e.vz + e.kz) * dt;
    e.kx *= Math.exp(-5 * dt); e.kz *= Math.exp(-5 * dt);
    resolve(e, 0.5);
    e.walk += Math.hypot(e.vx, e.vz) * dt * 2.2;
    e.face = Math.atan2(dx, dz);
    if (e.slow > 0 && Math.random() < dt * 8) particles.push({ x: e.x + (Math.random() - .5) * .6, y: 0.2, z: e.z + (Math.random() - .5) * .6, vx: 0, vy: 0.8, vz: 0, life: 0.5, max: 0.5, c: [120, 210, 255], size: 0.06, g: 0 });
  }

  // ---- arrows ----
  for (let i = arrows.length - 1; i >= 0; i--) {
    const a = arrows[i];
    if (a.stuck) { a.stuck -= dt; if (a.stuck <= 0) arrows.splice(i, 1); continue; }
    a.trail.push({ x: a.x, y: a.y, z: a.z }); if (a.trail.length > 7) a.trail.shift();
    a.vy -= 9 * dt; a.x += a.vx * dt; a.y += a.vy * dt; a.z += a.vz * dt; a.life -= dt;
    if (player.alive && Math.hypot(a.x - player.x, a.z - player.z) < 0.6 * player.scale && a.y < 1.8 * player.scale) { damagePlayer(55); burst(a.x, a.y, a.z, [255, 140, 120], 12, 3); arrows.splice(i, 1); continue; }
    if (creature && !creature.out && Math.hypot(a.x - creature.x, a.z - creature.z) < 0.9 && a.y < 1.4) { creature.hp -= 90; creature.hit = 0.2; floatText(creature.x, creature.z, "-90", [140, 220, 255], 1.6); burst(a.x, a.y, a.z, [140, 220, 255], 10, 3); arrows.splice(i, 1); continue; }
    if (a.y <= 0.05) { a.y = 0.05; a.stuck = 1.4; burst(a.x, 0.1, a.z, [170, 150, 140], 8, 2, 0.06, 1.2); continue; }
    if (a.life <= 0) arrows.splice(i, 1);
  }

  if (Math.random() < dt * 14) { const a = Math.random() * TAU, r = 3 + Math.random() * 18; particles.push({ x: player.x + Math.cos(a) * r, y: 0.2 + Math.random() * 2.5, z: player.z + Math.sin(a) * r, vx: (Math.random() - .5) * 0.3, vy: 0.25 + Math.random() * 0.3, vz: (Math.random() - .5) * 0.3, life: 2.5, max: 2.5, c: Math.random() < 0.7 ? [120, 150, 255] : [230, 190, 110], size: 0.035, g: 0 }); }
  // ---- particles / rings / texts ----
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]; p.life -= dt; if (p.life <= 0) { particles.splice(i, 1); continue; }
    p.vy -= p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
    if (p.y < 0.02) { p.y = 0.02; p.vy *= -0.3; p.vx *= 0.7; p.vz *= 0.7; }
  }
  if (particles.length > 900) particles.splice(0, particles.length - 900);
  for (let i = rings.length - 1; i >= 0; i--) { const r = rings[i]; r.t += dt; if (r.t >= r.life) rings.splice(i, 1); }
  for (let i = texts.length - 1; i >= 0; i--) { const t = texts[i]; t.life -= dt; t.y += dt * 1.4; if (t.life <= 0) texts.splice(i, 1); }
}

/* =========================================================
   RENDER
   ========================================================= */
function drawSky() {
  const hy = view.cy - view.focal * view.sp / view.cp + view.sy;
  const g = ctx.createLinearGradient(0, 0, 0, hy + 10);
  g.addColorStop(0, "#05041a"); g.addColorStop(0.55, "#1a1145"); g.addColorStop(1, "#3a2468");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, Math.max(0, hy + 40));
  // moon
  const ma = wrap(2.2 - cam.yaw);
  if (Math.abs(ma) < 1.3) {
    const mx = view.cx + Math.tan(ma) * view.focal, my = hy - H * 0.28;
    const mg = ctx.createRadialGradient(mx, my, 4, mx, my, 120);
    mg.addColorStop(0, "rgba(220,215,255,.9)"); mg.addColorStop(0.15, "rgba(170,150,255,.35)"); mg.addColorStop(1, "rgba(80,60,180,0)");
    ctx.fillStyle = mg; ctx.beginPath(); ctx.arc(mx, my, 120, 0, TAU); ctx.fill();
    ctx.fillStyle = "#e7e3ff"; ctx.beginPath(); ctx.arc(mx, my, 20, 0, TAU); ctx.fill();
  }
  // stars
  ctx.fillStyle = "rgba(200,210,255,.6)";
  for (let i = 0; i < 70; i++) {
    const a = wrap(hash(i, 3) * TAU - cam.yaw); if (Math.abs(a) > 1.4) continue;
    const x = view.cx + Math.tan(a) * view.focal, y = hy * hash(i, 9) * 0.85;
    ctx.globalAlpha = 0.3 + 0.5 * Math.abs(Math.sin(time * 1.5 + i)); ctx.fillRect(x, y, 1.6, 1.6);
  }
  ctx.globalAlpha = 1;
  // far skyline silhouettes
  for (const s of skyline) {
    const a = wrap(s.a - cam.yaw); if (Math.abs(a) > 1.35) continue;
    const x = view.cx + Math.tan(a) * view.focal, sc = s.s * H * 0.12;
    ctx.save(); ctx.translate(x, hy + 2); ctx.fillStyle = "#1b1240"; ctx.strokeStyle = "#1b1240";
    if (s.type === "ferris") {
      ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, -sc * 1.3, sc, 0, TAU); ctx.stroke();
      for (let i = 0; i < 8; i++) { const q = i / 8 * TAU + time * 0.05; ctx.beginPath(); ctx.moveTo(0, -sc * 1.3); ctx.lineTo(Math.cos(q) * sc, -sc * 1.3 + Math.sin(q) * sc); ctx.stroke(); ctx.fillStyle = i % 3 ? "#1b1240" : "rgba(160,120,255,.7)"; ctx.fillRect(Math.cos(q) * sc - 3, -sc * 1.3 + Math.sin(q) * sc - 3, 6, 6); }
      ctx.fillStyle = "#1b1240"; ctx.beginPath(); ctx.moveTo(-sc * .6, 0); ctx.lineTo(0, -sc * 1.3); ctx.lineTo(sc * .6, 0); ctx.fill();
    } else if (s.type === "tower") {
      ctx.fillRect(-sc * .18, -sc * 2, sc * .36, sc * 2); ctx.beginPath(); ctx.moveTo(-sc * .3, -sc * 2); ctx.lineTo(0, -sc * 2.6); ctx.lineTo(sc * .3, -sc * 2); ctx.fill();
      ctx.fillStyle = "rgba(120,170,255,.6)"; ctx.fillRect(-2, -sc * 1.6, 4, 4);
    } else if (s.type === "slide") {
      ctx.fillRect(-sc * .5, -sc * 1.4, sc * .12, sc * 1.4); ctx.beginPath(); ctx.moveTo(-sc * .45, -sc * 1.4); ctx.quadraticCurveTo(sc * .2, -sc * .9, sc * .9, 0); ctx.lineTo(sc * .7, 0); ctx.quadraticCurveTo(sc * .1, -sc * .7, -sc * .45, -sc * 1.15); ctx.fill();
    } else {
      ctx.beginPath(); ctx.moveTo(-sc * .1, 0); ctx.lineTo(-sc * .05, -sc); ctx.lineTo(-sc * .5, -sc * 1.6); ctx.lineTo(0, -sc * 1.2); ctx.lineTo(sc * .45, -sc * 1.8); ctx.lineTo(sc * .08, -sc); ctx.lineTo(sc * .12, 0); ctx.fill();
    }
    ctx.restore();
  }
  // horizon haze
  const hz = ctx.createLinearGradient(0, hy - 60, 0, hy + 30);
  hz.addColorStop(0, "rgba(60,40,120,0)"); hz.addColorStop(1, "rgba(40,28,84,.85)");
  ctx.fillStyle = hz; ctx.fillRect(0, hy - 60, W, 90);
  return hy;
}

function tileColor(gx, gz) {
  const h = hash(gx, gz);
  const zone = hash(Math.floor(gx / 3), Math.floor(gz / 3));
  let c;
  if (zone < 0.18) c = mix(BLOCK_COLORS[(zone * 27 | 0) % 5], [40, 36, 60], 0.62 + h * 0.12); // faded play-mat
  else if (zone > 0.86) c = [62 + h * 10, 52 + h * 8, 58]; // sand pit
  else c = [30 + h * 8, 30 + h * 8, 50 + h * 10]; // rubber asphalt
  return c;
}
function drawGround(hy) {
  ctx.fillStyle = rgb(FOG); ctx.fillRect(0, hy, W, H - hy + 20);
  const T = 3, range = 48;
  const gx0 = Math.floor((cam.x - range) / T), gx1 = Math.floor((cam.x + range) / T);
  const gz0 = Math.floor((cam.z - range) / T), gz1 = Math.floor((cam.z + range) / T);
  const tiles = [];
  for (let gx = gx0; gx <= gx1; gx++) for (let gz = gz0; gz <= gz1; gz++) {
    const cx = gx * T + T / 2, cz = gz * T + T / 2;
    if (Math.hypot(cx, cz) > WORLD_R + 8) continue;
    const f = (cx - view.camX) * view.F.x + (cz - view.camZ) * view.F.z;
    if (f < -1) continue;
    tiles.push([gx, gz, f]);
  }
  tiles.sort((a, b) => b[2] - a[2]);
  ctx.lineWidth = 1;
  for (const [gx, gz] of tiles) {
    const x0 = gx * T, z0 = gz * T;
    const a = proj(x0, 0, z0), b = proj(x0 + T, 0, z0), c = proj(x0 + T, 0, z0 + T), d = proj(x0, 0, z0 + T);
    if (!a || !b || !c || !d) continue;
    const md = (a.d + c.d) / 2;
    const pd = Math.hypot(x0 + T / 2 - player.x, z0 + T / 2 - player.z);
    let col = tileColor(gx, gz);
    const glow = Math.exp(-pd * pd / 50) * 0.55 + (player.ult > 0 ? Math.exp(-pd * pd / 30) * 0.4 : 0);
    col = mix(col, player.ult > 0 ? [120, 90, 70] : [70, 90, 170], glow * 0.5);
    if (Math.hypot(x0, z0) > WORLD_R) col = mix(col, [12, 8, 22], 0.6);
    col = mix(col, FOG, fogOf(md));
    ctx.fillStyle = rgb(col);
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(c.x, c.y); ctx.lineTo(d.x, d.y); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = `rgba(110,120,200,${0.09 * (1 - fogOf(md))})`; ctx.stroke();
  }
  // ground decals (leaves, cracks, pebbles)
  for (const dc of decals) {
    if (Math.abs(dc.x - cam.x) > 40 || Math.abs(dc.z - cam.z) > 40) continue;
    const p = proj(dc.x, 0.01, dc.z); if (!p || p.d > 45) continue;
    const a = 1 - fogOf(p.d);
    ctx.globalAlpha = a;
    if (dc.kind === 0) { ctx.fillStyle = "rgba(120,70,60,.55)"; ctx.beginPath(); ctx.ellipse(p.x, p.y, dc.s * p.k * 0.5, dc.s * p.k * 0.18, dc.rot, 0, TAU); ctx.fill(); }
    else if (dc.kind === 1) { ctx.strokeStyle = "rgba(10,8,20,.6)"; ctx.lineWidth = Math.max(1, p.k * 0.03); ctx.beginPath(); ctx.moveTo(p.x - dc.s * p.k, p.y); ctx.lineTo(p.x, p.y - dc.s * p.k * 0.12); ctx.lineTo(p.x + dc.s * p.k * 0.8, p.y + dc.s * p.k * 0.1); ctx.stroke(); }
    else { ctx.fillStyle = "rgba(150,160,210,.25)"; ctx.beginPath(); ctx.ellipse(p.x, p.y, dc.s * p.k * 0.2, dc.s * p.k * 0.08, 0, 0, TAU); ctx.fill(); }
  }
  ctx.globalAlpha = 1;
  // light pools
  ctx.globalCompositeOperation = "lighter";
  for (const l of lights) {
    if (Math.abs(l.x - cam.x) > 45 || Math.abs(l.z - cam.z) > 45) continue;
    const p = proj(l.x, 0, l.z); if (!p) continue;
    const r = l.r * p.k, a = 0.22 * (1 - fogOf(p.d)) * (0.8 + 0.2 * Math.sin(time * 2 + l.x));
    const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
    g.addColorStop(0, rgb(l.c, a)); g.addColorStop(1, rgb(l.c, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(p.x, p.y, r, r * 0.38, 0, 0, TAU); ctx.fill();
  }
  // Jugo's light
  const pp = proj(player.x, 0, player.z);
  if (pp) {
    const r = (player.ult > 0 ? 5 : 3) * pp.k, c = player.ult > 0 ? [255, 180, 100] : [90, 140, 255];
    const g = ctx.createRadialGradient(pp.x, pp.y, 0, pp.x, pp.y, r);
    g.addColorStop(0, rgb(c, 0.28)); g.addColorStop(1, rgb(c, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(pp.x, pp.y, r, r * 0.4, 0, 0, TAU); ctx.fill();
  }
  ctx.globalCompositeOperation = "source-over";
}

function groundPath(pts) {
  let started = false; ctx.beginPath();
  for (const [x, z] of pts) { const p = proj(x, 0.03, z); if (!p) continue; if (!started) { ctx.moveTo(p.x, p.y); started = true; } else ctx.lineTo(p.x, p.y); }
  return started;
}
function groundCircle(x, z, r, n = 32) {
  const pts = []; for (let i = 0; i < n; i++) { const a = i / n * TAU; pts.push([x + Math.cos(a) * r, z + Math.sin(a) * r]); }
  const ok = groundPath(pts); if (ok) ctx.closePath(); return ok;
}
function shadow(x, z, r, a = 0.45) {
  const p = proj(x, 0, z); if (!p) return;
  ctx.fillStyle = `rgba(0,0,0,${a * (1 - fogOf(p.d))})`; ctx.beginPath(); ctx.ellipse(p.x, p.y, r * p.k, r * p.k * 0.36, 0, 0, TAU); ctx.fill();
}

function drawGroundFX() {
  // rings
  for (const r of rings) {
    const k = r.t / r.life, rad = lerp(r.r, r.max, 1 - Math.pow(1 - k, 2));
    if (groundCircle(r.x, r.z, rad)) {
      const p = proj(r.x, 0, r.z);
      ctx.strokeStyle = rgb(r.c, 1 - k); ctx.lineWidth = (r.w || 3) * (p ? clamp(p.k / 40, 0.4, 2) : 1); ctx.stroke();
      ctx.fillStyle = rgb(r.c, (1 - k) * 0.12); ctx.fill();
    }
  }
  // landed orbs: danger zone glow
  ctx.globalCompositeOperation = "lighter";
  for (const o of orbs) {
    if (!o.landed) continue;
    const fade = Math.min(1, o.life / 1);
    if (groundCircle(o.x, o.z, 0.9, 16)) { ctx.fillStyle = `rgba(60,140,255,${0.12 * fade})`; ctx.fill(); ctx.strokeStyle = `rgba(130,210,255,${(0.35 + 0.2 * Math.sin(time * 6 + o.x)) * fade})`; ctx.lineWidth = 1.5; ctx.stroke(); }
  }
  ctx.globalCompositeOperation = "source-over";
  // knight telegraphs & archer aim lines
  for (const e of enemies) {
    if (e.dead) continue;
    if (e.type === "knight" && e.state === "windup") {
      const k = e.t / 0.55, base = Math.atan2(e.aimX, e.aimZ), pts = [[e.x, e.z]];
      for (let i = 0; i <= 10; i++) { const a = base - 0.9 + i / 10 * 1.8; pts.push([e.x + Math.sin(a) * 2.3, e.z + Math.cos(a) * 2.3]); }
      if (groundPath(pts)) { ctx.closePath(); ctx.fillStyle = `rgba(255,70,60,${0.15 + k * 0.3})`; ctx.fill(); ctx.strokeStyle = `rgba(255,120,90,${0.5 + k * 0.5})`; ctx.lineWidth = 2; ctx.stroke(); }
    }
    if (e.type === "archer" && e.state === "aim") {
      const k = clamp(e.t / 0.95, 0, 1);
      const a = proj(e.x, 0.05, e.z), b = proj(lerp(e.x, e.aimX, 1), 0.05, lerp(e.z, e.aimZ, 1));
      if (a && b) {
        ctx.strokeStyle = `rgba(255,${e.t > 0.65 ? 60 : 160},80,${0.25 + k * 0.6})`; ctx.lineWidth = 1 + k * 3; ctx.setLineDash(e.t > 0.65 ? [] : [8, 8]);
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); ctx.setLineDash([]);
        if (groundCircle(e.aimX, e.aimZ, 0.7 - k * 0.3, 16)) { ctx.strokeStyle = `rgba(255,90,70,${0.4 + k * 0.6})`; ctx.stroke(); }
      }
    }
  }
  // aiming
  if (aiming && player.alive) {
    const isA = aiming === "A", range = isA ? rangeA() : 13;
    if (groundCircle(player.x, player.z, range, 48)) { ctx.strokeStyle = "rgba(140,200,255,.35)"; ctx.lineWidth = 2; ctx.setLineDash([10, 8]); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = "rgba(90,150,255,.05)"; ctx.fill(); }
    const t = aimTarget(range);
    if (isA) {
      const r = player.ult > 0 ? 1.6 : 1;
      if (groundCircle(t.x, t.z, r + Math.sin(time * 8) * 0.08)) { ctx.fillStyle = player.ult > 0 ? "rgba(255,200,120,.25)" : "rgba(110,210,255,.25)"; ctx.fill(); ctx.strokeStyle = player.ult > 0 ? "#ffd38a" : "#8fe6ff"; ctx.lineWidth = 3; ctx.stroke(); }
      for (let i = 1; i < 10; i++) { const q = i / 10, p = proj(lerp(player.x, t.x, q), 0.05 + Math.sin(q * Math.PI) * 1.5, lerp(player.z, t.z, q)); if (p) { ctx.fillStyle = "rgba(160,220,255,.8)"; ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(1.5, p.k * 0.06), 0, TAU); ctx.fill(); } }
    } else {
      const px = -t.dz, pz = t.dx, pts = [];
      const L = 13.5;
      pts.push([player.x + px * 0.8, player.z + pz * 0.8], [player.x + t.dx * L + px * 2.2, player.z + t.dz * L + pz * 2.2], [player.x + t.dx * L - px * 2.2, player.z + t.dz * L - pz * 2.2], [player.x - px * 0.8, player.z - pz * 0.8]);
      if (groundPath(pts)) { ctx.closePath(); ctx.fillStyle = "rgba(90,170,255,.18)"; ctx.fill(); ctx.strokeStyle = "rgba(150,220,255,.8)"; ctx.lineWidth = 2; ctx.stroke(); }
      const ar = proj(player.x + t.dx * L, 0.05, player.z + t.dz * L);
      if (ar) { ctx.fillStyle = "#bfeaff"; ctx.beginPath(); ctx.arc(ar.x, ar.y, 5, 0, TAU); ctx.fill(); }
    }
  }
}

/* ---------------- props ---------------- */
function drawBlock(b) {
  const s = b.size, h = s, c = Math.cos(b.rot), sn = Math.sin(b.rot), hs = s / 2;
  const levels = b.stack ? 2 : 1;
  for (let lv = 0; lv < levels; lv++) {
    const y0 = lv * h, rot = lv ? 0.5 : 0, cc = Math.cos(b.rot + rot), ss = Math.sin(b.rot + rot), sz = lv ? hs * 0.8 : hs;
    const corner = (i, y) => { const ox = [-1, 1, 1, -1][i] * sz, oz = [-1, -1, 1, 1][i] * sz; return [b.x + ox * cc - oz * ss, y, b.z + ox * ss + oz * cc]; };
    const top = lv ? y0 + sz * 2 : y0 + h;
    const faces = [];
    for (let i = 0; i < 4; i++) {
      const A = corner(i, y0), B = corner((i + 1) % 4, y0), C = corner((i + 1) % 4, top), D = corner(i, top);
      const mx = (A[0] + B[0]) / 2, mz = (A[2] + B[2]) / 2;
      const nx = mx - b.x, nz = mz - b.z;
      if (nx * (view.camX - mx) + nz * (view.camZ - mz) <= 0) continue;
      faces.push({ pts: [A, B, C, D], shade: 0.55 + 0.35 * Math.abs(Math.sin(Math.atan2(nx, nz) - 0.7)), mid: [mx, (y0 + top) / 2, mz] });
    }
    const topPts = [0, 1, 2, 3].map(i => corner(i, top));
    const draw = (pts, col) => { const P = pts.map(q => proj(q[0], q[1], q[2])); if (P.some(q => !q)) return null; ctx.fillStyle = col; ctx.beginPath(); P.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y))); ctx.closePath(); ctx.fill(); ctx.strokeStyle = "rgba(0,0,0,.35)"; ctx.lineWidth = 1; ctx.stroke(); return P; };
    const cp = proj(b.x, y0 + h / 2, b.z); if (!cp) return;
    const fog = fogOf(cp.d);
    for (const f of faces) {
      const col = mix(mix(b.color, [30, 26, 50], 0.35), [0, 0, 0], 1 - f.shade);
      draw(f.pts, rgb(mix(col, FOG, fog)));
      const m = proj(f.mid[0], f.mid[1], f.mid[2]);
      if (m && m.k > 8) {
        ctx.fillStyle = rgb(mix([235, 220, 180], FOG, fog), 0.85); ctx.font = `900 ${Math.round(sz * 1.2 * m.k)}px Georgia,serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(lv ? "★" : b.letter, m.x, m.y);
      }
    }
    draw(topPts, rgb(mix(mix(b.color, [200, 190, 220], 0.15), FOG, fog)));
  }
}
function billboard(x, z, fn, extraAlpha = 1) {
  const p = proj(x, 0, z); if (!p) return;
  ctx.save(); ctx.globalAlpha = (1 - fogOf(p.d) * 0.9) * extraAlpha; ctx.translate(p.x, p.y); ctx.scale(p.k, p.k); fn(p); ctx.restore();
}
function drawProp(o) {
  switch (o.type) {
    case "block": drawBlock(o); break;
    case "tree": billboard(o.x, o.z, () => {
      const s = o.s * 2.2; ctx.scale(s, s);
      ctx.fillStyle = "#120c26"; ctx.strokeStyle = "#120c26"; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(-0.25, 0); ctx.quadraticCurveTo(-0.05, -1, -0.12, -2); ctx.lineTo(0.12, -2); ctx.quadraticCurveTo(0.1, -1, 0.25, 0); ctx.fill();
      ctx.lineWidth = 0.08;
      const br = [[-0.1, -1.6, -0.9, -2.4], [0.05, -1.8, 0.8, -2.7], [0, -2, -0.3, -3], [0.05, -1.3, 0.7, -1.7], [-0.05, -2.2, 0.35, -3.1]];
      for (const [a, b, c2, d] of br) { ctx.beginPath(); ctx.moveTo(a, b); ctx.quadraticCurveTo((a + c2) / 2 + 0.2 * (o.seed - .5), (b + d) / 2, c2, d); ctx.stroke(); }
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < 4; i++) { const q = br[i]; ctx.fillStyle = `rgba(150,100,255,${0.3 + 0.3 * Math.sin(time * 2 + i + o.seed * 9)})`; ctx.beginPath(); ctx.arc(q[2], q[3], 0.06, 0, TAU); ctx.fill(); }
      ctx.globalCompositeOperation = "source-over";
    }); break;
    case "slide": billboard(o.x, o.z, () => {
      ctx.lineCap = "round";
      ctx.strokeStyle = "#3a3a52"; ctx.lineWidth = 0.1;
      ctx.beginPath(); ctx.moveTo(-1.2, 0); ctx.lineTo(-1.2, -2.6); ctx.moveTo(-0.7, 0); ctx.lineTo(-0.7, -2.6); ctx.stroke();
      ctx.lineWidth = 0.05; for (let i = 1; i < 6; i++) { ctx.beginPath(); ctx.moveTo(-1.2, -i * 0.45); ctx.lineTo(-0.7, -i * 0.45); ctx.stroke(); }
      const g = ctx.createLinearGradient(-1, -2.6, 1.6, 0); g.addColorStop(0, "#3c5ea8"); g.addColorStop(1, "#1b2752");
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-0.75, -2.65); ctx.quadraticCurveTo(0.4, -1.9, 1.8, -0.15); ctx.lineTo(1.8, 0.02); ctx.quadraticCurveTo(0.3, -1.5, -0.75, -2.3); ctx.fill();
      ctx.strokeStyle = "#c79a3a"; ctx.lineWidth = 0.06; ctx.beginPath(); ctx.moveTo(-0.75, -2.65); ctx.quadraticCurveTo(0.4, -1.9, 1.8, -0.15); ctx.stroke();
      ctx.strokeStyle = "#1a1030"; ctx.lineWidth = 0.035;
      for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(-1.2, -0.3 - i * 0.5); ctx.lineTo(-1.45, -0.4 - i * 0.5); ctx.lineTo(-1.32, -0.55 - i * 0.5); ctx.stroke(); }
      ctx.fillStyle = "#28224a"; ctx.fillRect(-1.3, -2.75, 0.7, 0.12);
    }); break;
    case "swing": billboard(o.x, o.z, () => {
      ctx.strokeStyle = "#2c2a44"; ctx.lineWidth = 0.1; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(-1.5, 0); ctx.lineTo(-1.1, -2.5); ctx.lineTo(-0.7, 0); ctx.moveTo(1.5, 0); ctx.lineTo(1.1, -2.5); ctx.lineTo(0.7, 0); ctx.moveTo(-1.15, -2.45); ctx.lineTo(1.15, -2.45); ctx.stroke();
      for (const sx of [-0.45, 0.45]) {
        const a = Math.sin(time * 1.1 + o.ph + sx) * 0.35;
        ctx.save(); ctx.translate(sx, -2.45); ctx.rotate(a);
        ctx.strokeStyle = "#5a5870"; ctx.lineWidth = 0.025; ctx.beginPath(); ctx.moveTo(-0.2, 0); ctx.lineTo(-0.2, 1.8); ctx.moveTo(0.2, 0); ctx.lineTo(0.2, 1.8); ctx.stroke();
        ctx.fillStyle = "#6b3a2a"; ctx.fillRect(-0.28, 1.78, 0.56, 0.08); ctx.restore();
      }
    }); break;
    case "teddy": billboard(o.x, o.z, () => {
      ctx.fillStyle = "#4a3326";
      ctx.beginPath(); ctx.ellipse(0, -0.55, 0.55, 0.55, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(0, -1.3, 0.38, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(-0.3, -1.6, 0.14, 0, TAU); ctx.arc(0.3, -1.6, 0.14, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.ellipse(-0.5, -0.1, 0.22, 0.15, 0, 0, TAU); ctx.ellipse(0.5, -0.1, 0.22, 0.15, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = "#6e5140"; ctx.beginPath(); ctx.ellipse(0, -1.22, 0.16, 0.12, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = "#1a0f0a"; ctx.lineWidth = 0.03; ctx.beginPath(); ctx.moveTo(-0.12, -1.42); ctx.lineTo(-0.02, -1.32); ctx.moveTo(-0.02, -1.42); ctx.lineTo(-0.12, -1.32); ctx.moveTo(0, -0.9); ctx.lineTo(0, -0.2); ctx.stroke();
      ctx.fillStyle = `rgba(120,200,255,${0.7 + 0.3 * Math.sin(time * 3 + o.ph * 9)})`; ctx.beginPath(); ctx.arc(0.13, -1.37, 0.055, 0, TAU); ctx.fill();
    }); break;
    case "duck": billboard(o.x, o.z, () => {
      const s = o.s; ctx.scale(s, s);
      ctx.fillStyle = "#b8962e"; ctx.beginPath(); ctx.ellipse(0, -0.3, 0.45, 0.3, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(0.25, -0.7, 0.22, 0, TAU); ctx.fill();
      ctx.fillStyle = "#b45a26"; ctx.beginPath(); ctx.moveTo(0.42, -0.72); ctx.lineTo(0.62, -0.66); ctx.lineTo(0.42, -0.62); ctx.fill();
      ctx.fillStyle = "#111"; ctx.beginPath(); ctx.arc(0.3, -0.76, 0.035, 0, TAU); ctx.fill();
    }); break;
    case "shroom": billboard(o.x, o.z, () => {
      const s = o.s; ctx.scale(s, s);
      const pulse = 0.7 + 0.3 * Math.sin(time * 2 + o.ph);
      ctx.fillStyle = "#2a2240"; ctx.fillRect(-0.06, -0.5, 0.12, 0.5);
      ctx.globalCompositeOperation = "lighter";
      const g = ctx.createRadialGradient(0, -0.55, 0, 0, -0.55, 0.8); g.addColorStop(0, rgb(o.hue, 0.5 * pulse)); g.addColorStop(1, rgb(o.hue, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, -0.55, 0.8, 0, TAU); ctx.fill();
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = rgb(mix(o.hue, [255, 255, 255], 0.25)); ctx.beginPath(); ctx.ellipse(0, -0.52, 0.32, 0.18, 0, Math.PI, TAU); ctx.fill();
    }); break;
    case "sign": billboard(o.x, o.z, () => {
      ctx.fillStyle = "#2a1c14"; ctx.fillRect(-0.08, -2, 0.16, 2); ctx.save(); ctx.rotate(-0.06);
      ctx.fillStyle = "#3a281c"; ctx.fillRect(-1.2, -2.6, 2.4, 1.1); ctx.strokeStyle = "#1a100a"; ctx.lineWidth = 0.05; ctx.strokeRect(-1.2, -2.6, 2.4, 1.1);
      ctx.fillStyle = "#d9cdb4"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.font = "900 0.42px Georgia,serif"; ctx.fillText("JUGO", 0, -2.25);
      ctx.font = "700 0.24px Georgia,serif"; ctx.fillText("PLAYGROUND", 0, -1.9); ctx.fillStyle = "#a33"; ctx.font = "700 0.11px sans-serif"; ctx.fillText("SETOR SOMBRIO • ÁREA RESTRITA", 0, -1.66); ctx.restore();
    }); break;
    case "gate": billboard(o.x, o.z, () => {
      ctx.fillStyle = "#1c1430"; ctx.fillRect(-3.6, -5, 0.7, 5); ctx.fillRect(2.9, -5, 0.7, 5);
      ctx.beginPath(); ctx.moveTo(-3.8, -5); ctx.quadraticCurveTo(0, -7.2, 3.8, -5); ctx.lineTo(3.8, -4.4); ctx.quadraticCurveTo(0, -6.4, -3.8, -4.4); ctx.fill();
      ctx.fillStyle = `rgba(140,190,255,${0.7 + 0.3 * Math.sin(time * 2)})`; ctx.font = "900 0.9px Georgia,serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("J U G O", 0, -5.35);
      ctx.strokeStyle = "#120a22"; ctx.lineWidth = 0.08; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(-3.3 + (i % 2) * 6.6, -1 - i * 0.6); ctx.lineTo(-3.3 + (i % 2) * 6.6 + (i % 2 ? 0.6 : -0.6), -1.4 - i * 0.6); ctx.stroke(); }
    }); break;
  }
}

/* ---------------- characters ---------------- */
function hpBar(x, y, z, frac, col, w = 1) {
  const p = proj(x, y, z); if (!p) return;
  const bw = clamp(p.k * 1.0 * w, 24, 90), bh = clamp(p.k * 0.09, 3, 7);
  ctx.fillStyle = "rgba(5,6,20,.75)"; ctx.fillRect(p.x - bw / 2 - 1, p.y - 1, bw + 2, bh + 2);
  ctx.fillStyle = col; ctx.fillRect(p.x - bw / 2, p.y, bw * clamp(frac, 0, 1), bh);
}

function drawJugo() {
  const p = proj(player.x, 0, player.z); if (!p) return;
  const u = player.ult > 0 ? 1 : 0, sc = player.scale;
  const spd = Math.hypot(player.vx, player.vz), moving = clamp(spd / 5, 0, 1);
  const side = Math.sin(player.facing) * view.R.x + Math.cos(player.facing) * view.R.z;
  if (side > 0.2) player.flip = 1; else if (side < -0.2) player.flip = -1;
  ctx.save();
  ctx.translate(p.x, p.y); ctx.scale(p.k * sc, p.k * sc);
  // aura
  if (u || player.ultAnim) {
    ctx.globalCompositeOperation = "lighter";
    const g = ctx.createRadialGradient(0, -1, 0.1, 0, -1, 1.6);
    g.addColorStop(0, `rgba(255,200,120,${0.35 + 0.15 * Math.sin(time * 8)})`); g.addColorStop(1, "rgba(160,90,255,0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, -1, 1.6, 0, TAU); ctx.fill();
    ctx.globalCompositeOperation = "source-over";
  }
  if (player.ultAnim > 0) {
    const k = player.ultAnim / 0.8;
    ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = `rgba(255,240,210,${k * 0.8})`;
    ctx.fillRect(-0.15 - k * 0.2, -6, 0.3 + k * 0.4, 6); ctx.globalCompositeOperation = "source-over";
  }
  // reflexo de energia no chão sob Jugo
  const away = Math.sin(player.facing) * view.F.x + Math.cos(player.facing) * view.F.z;
  const back = away > 0.6 && moving > 0.2;
  const bob = -Math.abs(Math.sin(player.walk)) * 0.07 * moving, lean = moving * 0.1 * (back ? 0 : 1);
  ctx.translate(0, bob); ctx.rotate(lean * player.flip);
  // squash & stretch nos passos + respiração parada
  const breathe = 1 + Math.sin(time * 2.4) * 0.012 * (1 - moving);
  const step = 1 + Math.abs(Math.cos(player.walk)) * 0.03 * moving;
  ctx.scale(1 / step, step * breathe);
  if (player.slash > 0) { const k = 1 - player.slash / 0.28; ctx.rotate(Math.sin(k * Math.PI) * 0.22 * player.flip); ctx.translate(Math.sin(k * Math.PI) * 0.12 * player.flip, 0); }
  if (player.hurt > 0) ctx.filter = "brightness(2) saturate(.5)";
  const img = u ? IMG.ult : back ? IMG.back : IMG.side;
  sprite(img, u ? 1.95 : 1.7, back ? 1 : player.flip);
  // rim light / brilho dos cristais
  ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = 0.18 + 0.08 * Math.sin(time * 3);
  sprite(img, u ? 1.95 : 1.7, back ? 1 : player.flip);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
  ctx.filter = "none";
  ctx.restore();
  // slash arc
  if (player.slash > 0) {
    const k = 1 - player.slash / 0.28, f = facingVec(), r = (u ? 2.6 : 1.7);
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = u ? `rgba(255,210,140,${1 - k})` : `rgba(150,200,255,${1 - k})`; ctx.lineWidth = clamp(p.k * 0.12, 2, 10);
    ctx.beginPath(); let st = false;
    for (let i = 0; i <= 12; i++) { const ang = Math.atan2(f.x, f.z) - 1.1 + (i / 12) * 2.2 * k; const q = proj(player.x + Math.sin(ang) * r, 0.9 * sc, player.z + Math.cos(ang) * r); if (!q) continue; st ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y); st = true; }
    ctx.stroke(); ctx.globalCompositeOperation = "source-over";
  }
  // spin trail
  if (player.spin > 0) {
    const k = 1 - player.spin / 0.55;
    ctx.globalCompositeOperation = "lighter";
    for (let ring = 0; ring < 3; ring++) {
      const r = 2.2 + ring * 1.1 + k * 0.8;
      ctx.strokeStyle = ring === 1 ? `rgba(160,200,255,${(1 - k) * 0.8})` : `rgba(255,200,130,${(1 - k) * 0.9})`;
      ctx.lineWidth = clamp(p.k * (0.3 - ring * 0.06), 2, 22);
      ctx.beginPath(); let st = false;
      const start = k * TAU * 2.2;
      for (let i = 0; i <= 26; i++) { const ang = start + i / 26 * 4.2; const q = proj(player.x + Math.sin(ang) * r, 0.9 + ring * 0.15, player.z + Math.cos(ang) * r); if (!q) continue; st ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y); st = true; }
      ctx.stroke();
    }
    ctx.globalCompositeOperation = "source-over";
  }
}
function drawOrbit(o) {
  const p = proj(o.x, o.y, o.z); if (!p) return;
  const u = player.ult > 0, r = Math.max(2, p.k * 0.11);
  ctx.globalCompositeOperation = "lighter";
  const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 3);
  g.addColorStop(0, u ? "rgba(255,230,180,.95)" : "rgba(170,240,255,.95)"); g.addColorStop(0.35, u ? "rgba(255,150,70,.6)" : "rgba(70,110,255,.6)"); g.addColorStop(1, "rgba(100,50,255,0)");
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, r * 3, 0, TAU); ctx.fill();
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "#0b1030"; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, TAU); ctx.fill();
  ctx.fillStyle = u ? "#ffd38a" : "#58baff"; ctx.beginPath(); ctx.arc(p.x, p.y, r * 0.55, 0, TAU); ctx.fill();
}

function drawKnight(e) {
  const p = proj(e.x, 0, e.z); if (!p) return;
  const moving = clamp(Math.hypot(e.vx, e.vz) / 3, 0, 1);
  const side = Math.sin(e.face) * view.R.x + Math.cos(e.face) * view.R.z;
  if (side > 0.15) e.flip = 1; else if (side < -0.15) e.flip = -1;
  ctx.save(); ctx.translate(p.x, p.y);
  const dk = e.dead ? clamp(e.dead / 0.6, 0, 1) : 0;
  ctx.globalAlpha = (1 - fogOf(p.d) * 0.85) * (1 - Math.max(0, e.dead - 0.5) * 2) * e.spawn;
  ctx.scale(p.k, p.k); ctx.scale(e.flip, 1); ctx.rotate(dk * 1.4);
  if (e.flash > 0) ctx.filter = "brightness(3)";
  const bob = -Math.abs(Math.sin(e.walk)) * 0.06 * moving;
  ctx.translate(0, bob); ctx.rotate(Math.sin(e.walk) * 0.06 * moving);
  if (e.state === "windup") { const k = clamp(e.t / 0.55, 0, 1); ctx.rotate(-0.18 * k); if (!e.flash) ctx.filter = `sepia(${k * 0.5}) saturate(${1 + k * 2}) hue-rotate(-30deg) brightness(${1 + k * 0.35})`; }
  if (e.state === "strike") { const k = clamp(e.t / 0.15, 0, 1); ctx.rotate(lerp(-0.18, 0.22, k)); ctx.translate(0.15 * k, 0); }
  sprite(IMG.knight, 1.95);
  if (e.state === "strike" && e.t < 0.2) {
    ctx.globalCompositeOperation = "lighter"; ctx.strokeStyle = `rgba(255,190,140,${1 - e.t / 0.2})`; ctx.lineWidth = 0.08;
    ctx.beginPath(); ctx.arc(0.2, -1.0, 0.95, -1.6, 0.9); ctx.stroke(); ctx.globalCompositeOperation = "source-over";
  }
  ctx.filter = "none"; ctx.restore();
  if (!e.dead) hpBar(e.x, 2.3, e.z, e.hp / e.max, "#ff6a5a");
}
function drawArcher(e) {
  const p = proj(e.x, 0, e.z); if (!p) return;
  const moving = clamp(Math.hypot(e.vx, e.vz) / 2.5, 0, 1);
  const side = Math.sin(e.face) * view.R.x + Math.cos(e.face) * view.R.z;
  if (side > 0.15) e.flip = 1; else if (side < -0.15) e.flip = -1;
  ctx.save(); ctx.translate(p.x, p.y);
  const dk = e.dead ? clamp(e.dead / 0.6, 0, 1) : 0;
  ctx.globalAlpha = (1 - fogOf(p.d) * 0.85) * (1 - Math.max(0, e.dead - 0.5) * 2) * e.spawn;
  ctx.scale(p.k, p.k); ctx.scale(e.flip, 1); ctx.rotate(-dk * 1.4);
  if (e.flash > 0) ctx.filter = "brightness(3)";
  ctx.translate(0, -Math.abs(Math.sin(e.walk)) * 0.05 * moving);
  ctx.rotate(Math.sin(e.walk) * 0.05 * moving);
  const aimK = e.state === "aim" ? clamp(e.t / 0.6, 0, 1) : 0;
  if (e.state === "recover") ctx.translate(-0.08 * (1 - e.t / 0.45), 0);
  sprite(IMG.archer, 1.75);
  if (aimK > 0) {
    ctx.globalCompositeOperation = "lighter";
    const tip = ctx.createRadialGradient(0.62, -1.18, 0, 0.62, -1.18, 0.12 + aimK * 0.12);
    tip.addColorStop(0, `rgba(255,170,90,${aimK})`); tip.addColorStop(1, "rgba(255,80,40,0)");
    ctx.fillStyle = tip; ctx.beginPath(); ctx.arc(0.62, -1.18, 0.24, 0, TAU); ctx.fill();
    ctx.globalCompositeOperation = "source-over";
  }
  ctx.filter = "none"; ctx.restore();
  if (!e.dead) hpBar(e.x, 2.15, e.z, e.hp / e.max, "#ffa24a", 0.85);
}
function drawCreature(c) {
  const p = proj(c.x, 0, c.z); if (!p) return;
  const big = c.big ? 1.6 : 1;
  const sp = Math.min(1, c.t / 0.35), out = c.out ? clamp(1 - c.out / 0.8, 0, 1) : 1;
  const s = (1 - Math.pow(1 - sp, 3) * 1) * big * (c.out ? out : 1) * (1 + (sp < 1 ? Math.sin(sp * Math.PI) * 0.3 : 0));
  ctx.save(); ctx.translate(p.x + (c.hit ? (Math.random() - .5) * 6 : 0), p.y); ctx.scale(p.k * s, p.k * s);
  ctx.globalAlpha = out;
  const bob = Math.sin(time * 6) * 0.06;
  const col = c.big ? [255, 200, 120] : [110, 210, 255];
  ctx.globalCompositeOperation = "lighter";
  const g = ctx.createRadialGradient(0, -0.5 + bob, 0, 0, -0.5 + bob, 1.1);
  g.addColorStop(0, rgb(col, 0.5)); g.addColorStop(1, rgb(col, 0));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, -0.5 + bob, 1.1, 0, TAU); ctx.fill();
  ctx.globalCompositeOperation = "source-over";
  ctx.translate(0, bob);
  if (c.hit) ctx.filter = "brightness(2.4)";
  else if (c.big) ctx.filter = "sepia(.6) saturate(2.2) hue-rotate(-10deg) brightness(1.15)";
  const cf = Math.sin(Math.atan2(player.x - c.x, player.z - c.z)) * view.R.x + Math.cos(Math.atan2(player.x - c.x, player.z - c.z)) * view.R.z;
  sprite(IMG.creature, 1.0, cf < 0 ? -1 : 1);
  ctx.filter = "none";
  ctx.restore();
  if (!c.out) {
    hpBar(c.x, 1.5 * big, c.z, c.hp / c.max, c.big ? "#ffd38a" : "#6fe3ff", 0.9);
    const q = proj(c.x, 1.5 * big, c.z);
    if (q) { ctx.fillStyle = "rgba(220,240,255,.85)"; ctx.font = `700 ${clamp(q.k * 0.16, 8, 12)}px sans-serif`; ctx.textAlign = "center"; ctx.fillText(`${Math.max(0, Math.ceil(c.hp))} • ${c.life.toFixed(1)}s`, q.x, q.y - 4); }
  }
}
function drawFlyingOrb(o) {
  const p = proj(o.x, o.y, o.z); if (!p) return;
  const r = Math.max(2, p.k * 0.13), fade = o.landed ? Math.min(1, o.life) : 1;
  const pulse = o.landed ? 0.8 + 0.2 * Math.sin(time * 6 + o.x * 3) : 1;
  ctx.globalCompositeOperation = "lighter";
  const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 3.2);
  g.addColorStop(0, `rgba(200,245,255,${0.95 * fade})`); g.addColorStop(0.3, `rgba(70,140,255,${0.6 * fade * pulse})`); g.addColorStop(1, "rgba(60,60,255,0)");
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, r * 3.2, 0, TAU); ctx.fill();
  if (!o.landed) { const q = proj(lerp(o.sx, o.x, 0.85), o.y + 0.2, lerp(o.sz, o.z, 0.85)); if (q) { ctx.strokeStyle = "rgba(120,190,255,.5)"; ctx.lineWidth = r; ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(p.x, p.y); ctx.stroke(); } }
  ctx.globalCompositeOperation = "source-over";
}
function drawArrow(a) {
  const head = proj(a.x, a.y, a.z); if (!head) return;
  const l = Math.hypot(a.vx, a.vy, a.vz) || 1;
  const dx = a.stuck ? a.sdx : a.vx / l, dy = a.stuck ? a.sdy : a.vy / l, dz = a.stuck ? a.sdz : a.vz / l;
  if (!a.stuck) { a.sdx = dx; a.sdy = dy; a.sdz = dz; }
  const tail = proj(a.x - dx * 0.9, a.y - dy * 0.9, a.z - dz * 0.9); if (!tail) return;
  if (!a.stuck && a.trail.length > 1) {
    ctx.globalCompositeOperation = "lighter";
    ctx.beginPath(); let st = false;
    for (const t of a.trail) { const q = proj(t.x, t.y, t.z); if (!q) continue; st ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y); st = true; }
    ctx.lineTo(head.x, head.y); ctx.strokeStyle = "rgba(255,120,80,.45)"; ctx.lineWidth = Math.max(2, head.k * 0.08); ctx.stroke();
    ctx.globalCompositeOperation = "source-over";
  }
  ctx.strokeStyle = "#3a2618"; ctx.lineWidth = Math.max(1.5, head.k * 0.035); ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(tail.x, tail.y); ctx.lineTo(head.x, head.y); ctx.stroke();
  ctx.fillStyle = "#e6e6f0"; ctx.beginPath(); ctx.arc(head.x, head.y, Math.max(1.5, head.k * 0.05), 0, TAU); ctx.fill();
  ctx.fillStyle = "#a07cff"; ctx.beginPath(); ctx.arc(tail.x, tail.y, Math.max(1.5, head.k * 0.06), 0, TAU); ctx.fill();
}

/* ---------------- frame ---------------- */
function render() {
  setupView();
  const hy = drawSky();
  drawGround(hy);
  drawGroundFX();

  // shadows
  shadow(player.x, player.z, 0.55 * player.scale);
  for (const e of enemies) shadow(e.x, e.z, 0.5, e.dead ? 0.2 : 0.45);
  if (creature) shadow(creature.x, creature.z, 0.4 * (creature.big ? 1.6 : 1), 0.35);
  for (const o of orbs) if (!o.landed) shadow(o.x, o.z, 0.15, 0.3);

  // depth-sorted drawables
  const list = [];
  const push = (x, y, z, fn) => { const dx = x - view.camX, dz = z - view.camZ; const f = dx * view.F.x + dz * view.F.z; if (f < -2) return; list.push({ f, fn }); };
  for (const o of props) { if (Math.abs(o.x - cam.x) > 55 || Math.abs(o.z - cam.z) > 55) continue; push(o.x, 0, o.z, () => drawProp(o)); }
  push(player.x, 0, player.z, drawJugo);
  // 6 orbiting spheres (true 3D orbit)
  const u = player.ult > 0;
  for (let i = 0; i < 6; i++) {
    const a = time * (u ? 2.2 : 1.3) + i * TAU / 6, r = (u ? 1.5 : 0.95) * (1 + 0.05 * Math.sin(time * 3 + i));
    const o = { x: player.x + Math.cos(a) * r, y: (1 + Math.sin(time * 2 + i * 1.7) * 0.18) * player.scale, z: player.z + Math.sin(a) * r };
    push(o.x, o.y, o.z, () => drawOrbit(o));
  }
  for (const e of enemies) push(e.x, 0, e.z, () => (e.type === "knight" ? drawKnight(e) : drawArcher(e)));
  if (creature) push(creature.x, 0, creature.z, () => drawCreature(creature));
  for (const o of orbs) push(o.x, o.y, o.z, () => drawFlyingOrb(o));
  for (const a of arrows) push(a.x, a.y, a.z, () => drawArrow(a));
  list.sort((a, b) => b.f - a.f);
  for (const d of list) d.fn();

  // particles
  ctx.globalCompositeOperation = "lighter";
  for (const p of particles) {
    const q = proj(p.x, p.y, p.z); if (!q) continue;
    const k = p.life / p.max, r = Math.max(1, p.size * q.k * (p.dust ? 2 - k : 1));
    ctx.fillStyle = rgb(p.c, (p.dust ? 0.25 : 0.9) * k);
    ctx.beginPath(); ctx.arc(q.x, q.y, r, 0, TAU); ctx.fill();
  }
  ctx.globalCompositeOperation = "source-over";
  // floating numbers
  ctx.textAlign = "center";
  for (const t of texts) {
    const q = proj(t.x, t.y, t.z); if (!q) continue;
    ctx.globalAlpha = clamp(t.life * 1.5, 0, 1); ctx.fillStyle = rgb(t.c); ctx.font = `900 ${clamp(q.k * 0.32, 11, 22)}px sans-serif`;
    ctx.strokeStyle = "rgba(0,0,0,.6)"; ctx.lineWidth = 3; ctx.strokeText(t.txt, q.x, q.y); ctx.fillText(t.txt, q.x, q.y);
  }
  ctx.globalAlpha = 1;

  // vignette + hurt + ult tint
  const v = ctx.createRadialGradient(W / 2, H * 0.55, Math.min(W, H) * 0.3, W / 2, H * 0.55, Math.max(W, H) * 0.75);
  v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, hurtFlash > 0 ? `rgba(120,0,10,${0.4 + hurtFlash * 0.5})` : player.ult > 0 ? "rgba(60,30,0,.5)" : "rgba(0,0,8,.55)");
  ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  if (player.ultAnim > 0) { ctx.fillStyle = `rgba(255,230,190,${(player.ultAnim / 0.8) * 0.35})`; ctx.fillRect(0, 0, W, H); }
}

function updateHud() {
  $hpFill.style.width = (player.hp / MAX_HP * 100) + "%";
  $hpText.textContent = `${Math.ceil(player.hp)} / ${MAX_HP}`;
  $score.textContent = score;
  const u = player.ult > 0;
  $status.textContent = u ? `FORMA ULTIMATE ${player.ult.toFixed(1)}s` : aiming ? "MIRANDO" : enemies.some(e => !e.dead && dist(e, player) < 12) ? "EM COMBATE" : "EXPLORANDO";
  $status.classList.toggle("ult", u);
  for (const k of ["A", "B", "C"]) {
    const max = k === "B" && u ? 2.6 : k === "C" ? CD.C + 10 : CD[k];
    const left = cds[k];
    btn[k].querySelector(".cd").style.setProperty("--cd", clamp(left / max, 0, 1));
    btn[k].querySelector(".cdt").textContent = left > 0 && !(k === "C" && u) ? Math.ceil(left) : "";
    btn[k].classList.toggle("aiming", aiming === k);
  }
  btn.C.classList.toggle("ready-ult", cds.C <= 0 && !u);
  btn.B.querySelector(".lbl").textContent = u ? "GIRO" : "ESFERAS";
  btn.A.querySelector(".lbl").textContent = u ? "CRIATURA+" : "CRIATURA";
  $aimHint.classList.toggle("on", !!aiming);
  if (aiming) $aimHint.textContent = `${aiming === "A" ? "CRIATURA" : "ESFERAS"} • SEGURE E ARRASTE NO BOTÃO • SOLTE PARA LANÇAR`;
}

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  update(dt);
  render();
  updateHud();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
