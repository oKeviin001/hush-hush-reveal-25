import "./style.css";

const app = document.querySelector("#app");

app.innerHTML = `
  <main class="game-shell">
    <canvas id="game" aria-label="Mapa do Jugo"></canvas>

    <div class="hud">
      <div class="brand">
        <span class="brand-mark">✦</span>
        <span>JUGO</span>
      </div>
      <div class="status">PROTÓTIPO</div>
    </div>

    <div class="controls">
      <div class="joystick" id="joystick">
        <div class="joystick-ring"></div>
        <div class="joystick-knob" id="joystickKnob"></div>
      </div>

      <div class="skill-row">
        <button class="skill skill-a" data-skill="A" aria-label="Habilidade A">A</button>
        <button class="skill skill-b" data-skill="B" aria-label="Habilidade B">B</button>
        <button class="skill skill-c" data-skill="C" aria-label="Habilidade C">C</button>
      </div>
    </div>

    <div class="hint">JUGO • movimente-se pelo mapa</div>
  </main>
`;

const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const joystick = document.querySelector("#joystick");
const knob = document.querySelector("#joystickKnob");

const world = { width: 4200, height: 3000 };
const player = { x: world.width / 2, y: world.height / 2, speed: 4.6, angle: 0 };
const input = { x: 0, y: 0, keys: new Set() };
let camera = { x: player.x, y: player.y };
let joystickPointer = null;

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(innerWidth * dpr);
  canvas.height = Math.floor(innerHeight * dpr);
  canvas.style.width = innerWidth + "px";
  canvas.style.height = innerHeight + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
addEventListener("resize", resize);
resize();

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

function setJoystick(clientX, clientY) {
  const r = joystick.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  const max = r.width * 0.32;
  let dx = clientX - cx;
  let dy = clientY - cy;
  const len = Math.hypot(dx, dy) || 1;
  const limited = Math.min(len, max);
  dx = dx / len * limited;
  dy = dy / len * limited;
  input.x = dx / max;
  input.y = dy / max;
  knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
}

function resetJoystick() {
  input.x = 0; input.y = 0; joystickPointer = null;
  knob.style.transform = "translate(-50%, -50%)";
}

joystick.addEventListener("pointerdown", e => {
  joystickPointer = e.pointerId;
  joystick.setPointerCapture(e.pointerId);
  setJoystick(e.clientX, e.clientY);
});
joystick.addEventListener("pointermove", e => {
  if (e.pointerId === joystickPointer) setJoystick(e.clientX, e.clientY);
});
joystick.addEventListener("pointerup", resetJoystick);
joystick.addEventListener("pointercancel", resetJoystick);

addEventListener("keydown", e => input.keys.add(e.key.toLowerCase()));
addEventListener("keyup", e => input.keys.delete(e.key.toLowerCase()));

document.querySelectorAll(".skill").forEach(btn => {
  btn.addEventListener("pointerdown", () => btn.classList.add("pressed"));
  btn.addEventListener("pointerup", () => btn.classList.remove("pressed"));
  btn.addEventListener("pointercancel", () => btn.classList.remove("pressed"));
});

function drawBackground(t) {
  const w = innerWidth, h = innerHeight;
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, "#070b20");
  grad.addColorStop(0.5, "#101a3d");
  grad.addColorStop(1, "#050713");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  ctx.translate(-camera.x + w/2, -camera.y + h/2);

  // arena floor
  ctx.fillStyle = "#111a2b";
  ctx.fillRect(0, 0, world.width, world.height);

  // large magical lanes / tiles
  const grid = 180;
  ctx.lineWidth = 2;
  for (let x = 0; x <= world.width; x += grid) {
    ctx.strokeStyle = "rgba(91,120,190,.11)";
    ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,world.height); ctx.stroke();
  }
  for (let y = 0; y <= world.height; y += grid) {
    ctx.strokeStyle = "rgba(91,120,190,.11)";
    ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(world.width,y); ctx.stroke();
  }

  // ruins / rocks
  const stones = [
    [480,560,150,70],[900,370,120,55],[3300,520,190,80],[3550,1300,120,160],
    [640,2450,190,70],[3240,2450,160,90],[2050,530,240,80],[1900,2460,210,70]
  ];
  for (const [x,y,rx,ry] of stones) {
    ctx.fillStyle = "#17213a";
    ctx.beginPath(); ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle = "rgba(114,146,220,.18)";
    ctx.stroke();
  }

  // energy veins
  ctx.lineWidth = 4;
  ctx.strokeStyle = "rgba(104,92,255,.18)";
  for (let i=0;i<5;i++) {
    ctx.beginPath();
    ctx.moveTo(0, 500+i*500);
    ctx.bezierCurveTo(900, 300+i*480, 1700, 800+i*380, world.width, 420+i*500);
    ctx.stroke();
  }

  // center rune
  const pulse = 1 + Math.sin(t/700)*.04;
  ctx.save();
  ctx.translate(world.width/2, world.height/2);
  ctx.scale(pulse,pulse);
  ctx.strokeStyle = "rgba(105,156,255,.25)";
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(0,0,260,0,Math.PI*2); ctx.stroke();
  ctx.beginPath(); ctx.arc(0,0,185,0,Math.PI*2); ctx.stroke();
  ctx.rotate(t/6000);
  ctx.beginPath(); ctx.moveTo(0,-230); ctx.lineTo(199,115); ctx.lineTo(-199,115); ctx.closePath(); ctx.stroke();
  ctx.restore();

  ctx.restore();
}

function drawJugo(t) {
  const w = innerWidth, h = innerHeight;
  const sx = player.x - camera.x + w/2;
  const sy = player.y - camera.y + h/2;
  const moving = Math.hypot(input.x,input.y) > .08 || input.keys.size;
  player.angle = moving ? Math.atan2(input.y || 0, input.x || 1) : player.angle;

  ctx.save();
  ctx.translate(sx, sy);

  // shadow
  ctx.fillStyle = "rgba(0,0,0,.48)";
  ctx.beginPath(); ctx.ellipse(0,42,52,17,0,0,Math.PI*2); ctx.fill();

  // six orbiting spheres
  for (let i=0;i<6;i++) {
    const a = t/1100 + i*Math.PI/3;
    const ox = Math.cos(a)*78;
    const oy = Math.sin(a)*42;
    const r = 9;
    const glow = ctx.createRadialGradient(ox,oy,1,ox,oy,22);
    glow.addColorStop(0,"#8feaff");
    glow.addColorStop(.25,"#426dff");
    glow.addColorStop(1,"rgba(105,45,255,0)");
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(ox,oy,22,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = "#58baff";
    ctx.beginPath(); ctx.arc(ox,oy,r,0,Math.PI*2); ctx.fill();
  }

  // stylized Jugo silhouette, inspired by the supplied concept
  const body = ctx.createLinearGradient(-28,-70,35,65);
  body.addColorStop(0,"#9e7cff"); body.addColorStop(.4,"#254dba"); body.addColorStop(1,"#0a122f");
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(0,-92); ctx.lineTo(31,-60); ctx.lineTo(38,18); ctx.lineTo(22,63);
  ctx.lineTo(8,52); ctx.lineTo(0,86); ctx.lineTo(-10,52); ctx.lineTo(-25,63);
  ctx.lineTo(-38,18); ctx.lineTo(-31,-60); ctx.closePath(); ctx.fill();

  // wing / energy shards
  ctx.fillStyle = "rgba(151,125,255,.82)";
  ctx.beginPath(); ctx.moveTo(-28,-40); ctx.lineTo(-86,-76); ctx.lineTo(-52,-18); ctx.lineTo(-92,30); ctx.lineTo(-30,8); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(28,-40); ctx.lineTo(86,-76); ctx.lineTo(52,-18); ctx.lineTo(92,30); ctx.lineTo(30,8); ctx.closePath(); ctx.fill();

  // head / Zhask-like crown
  ctx.fillStyle = "#0a1231";
  ctx.beginPath();
  ctx.moveTo(0,-116); ctx.lineTo(-33,-86); ctx.lineTo(-20,-51); ctx.lineTo(0,-42);
  ctx.lineTo(20,-51); ctx.lineTo(33,-86); ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#6f5fff";
  ctx.beginPath(); ctx.moveTo(0,-118); ctx.lineTo(-8,-78); ctx.lineTo(0,-62); ctx.lineTo(8,-78); ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#c5f2ff";
  ctx.beginPath(); ctx.arc(0,-82,5,0,Math.PI*2); ctx.fill();

  // weapon, angled with movement
  ctx.save();
  ctx.rotate(moving ? player.angle*.08 : -.45);
  ctx.strokeStyle = "#8b6eff";
  ctx.lineWidth = 7;
  ctx.beginPath(); ctx.moveTo(30,-5); ctx.lineTo(105,72); ctx.stroke();
  ctx.fillStyle = "#a8edff";
  ctx.beginPath(); ctx.moveTo(104,70); ctx.lineTo(137,48); ctx.lineTo(125,86); ctx.lineTo(98,92); ctx.closePath(); ctx.fill();
  ctx.restore();

  ctx.restore();
}

function update(dt) {
  let x = input.x, y = input.y;
  if (input.keys.has("w") || input.keys.has("arrowup")) y -= 1;
  if (input.keys.has("s") || input.keys.has("arrowdown")) y += 1;
  if (input.keys.has("a") || input.keys.has("arrowleft")) x -= 1;
  if (input.keys.has("d") || input.keys.has("arrowright")) x += 1;
  const len = Math.hypot(x,y);
  if (len > 1) { x/=len; y/=len; }
  player.x = clamp(player.x + x * player.speed * dt/16, 90, world.width-90);
  player.y = clamp(player.y + y * player.speed * dt/16, 90, world.height-90);
  camera.x += (player.x-camera.x)*0.09;
  camera.y += (player.y-camera.y)*0.09;
}

let last=performance.now();
function loop(now) {
  const dt=Math.min(40,now-last); last=now;
  update(dt);
  drawBackground(now);
  drawJugo(now);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
