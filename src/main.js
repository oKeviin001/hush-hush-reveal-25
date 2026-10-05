import "./style.css";

const app = document.querySelector("#app");

app.innerHTML = `
  <main class="game-shell" id="gameShell">
    <canvas id="game" aria-label="Mapa do Jugo"></canvas>

    <div class="landscape-lock">
      <div class="rotate-icon">↻</div>
      <strong>GIRE O CELULAR</strong>
      <span>Este jogo foi feito para jogar na horizontal.</span>
    </div>

    <div class="hud">
      <div class="brand"><span class="brand-mark">✦</span><span>JUGO</span></div>
      <div class="status">PROTÓTIPO</div>
    </div>

    <div class="controls">
      <div class="joystick" id="moveJoystick">
        <div class="joystick-ring"></div>
        <div class="joystick-knob" id="moveKnob"></div>
      </div>

      <div class="skill-row">
        <button class="skill skill-a" data-skill="A" aria-label="Ataque A">A</button>
        <button class="skill skill-b" data-skill="B" aria-label="Ataque B">B</button>
        <button class="skill skill-c" data-skill="C" aria-label="Ataque C">C</button>
      </div>

      <div class="aim-joystick" id="aimJoystick" aria-hidden="true">
        <div class="aim-ring"></div>
        <div class="aim-line" id="aimLine"></div>
        <div class="aim-knob" id="aimKnob"></div>
      </div>
    </div>

    <div class="aim-label" id="aimLabel">MIRE E TOQUE NOVAMENTE</div>
    <div class="hint">JUGO • movimente-se pelo mapa</div>
  </main>
`;

const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const moveJoystick = document.querySelector("#moveJoystick");
const moveKnob = document.querySelector("#moveKnob");
const aimJoystick = document.querySelector("#aimJoystick");
const aimKnob = document.querySelector("#aimKnob");
const aimLine = document.querySelector("#aimLine");
const aimLabel = document.querySelector("#aimLabel");
const skills = [...document.querySelectorAll(".skill")];

const world = { width: 4200, height: 3000 };
const player = { x: world.width / 2, y: world.height / 2, speed: 4.8, angle: 0 };
const input = { x: 0, y: 0, keys: new Set() };
const camera = { x: player.x, y: player.y };
const aim = { x: 1, y: 0, active: false, pointer: null };
const projectiles = [];
let movePointer = null;

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function isLandscape() { return innerWidth >= innerHeight; }

function resize() {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.floor(innerWidth * dpr);
  canvas.height = Math.floor(innerHeight * dpr);
  canvas.style.width = innerWidth + "px";
  canvas.style.height = innerHeight + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
addEventListener("resize", resize);
resize();

function setMove(clientX, clientY) {
  const r = moveJoystick.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const max = r.width * .32;
  let dx = clientX - cx, dy = clientY - cy;
  const len = Math.hypot(dx, dy) || 1, limited = Math.min(len, max);
  dx = dx / len * limited; dy = dy / len * limited;
  input.x = dx / max; input.y = dy / max;
  moveKnob.style.transform = `translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px))`;
}

function resetMove() {
  input.x = 0; input.y = 0; movePointer = null;
  moveKnob.style.transform = "translate(-50%,-50%)";
}

moveJoystick.addEventListener("pointerdown", e => {
  movePointer = e.pointerId;
  moveJoystick.setPointerCapture(e.pointerId);
  setMove(e.clientX, e.clientY);
});
moveJoystick.addEventListener("pointermove", e => {
  if (e.pointerId === movePointer) setMove(e.clientX, e.clientY);
});
moveJoystick.addEventListener("pointerup", resetMove);
moveJoystick.addEventListener("pointercancel", resetMove);

function positionAimJoystick() {
  const sx = player.x - camera.x + innerWidth / 2;
  const sy = player.y - camera.y + innerHeight / 2;
  aimJoystick.style.left = `${sx}px`;
  aimJoystick.style.top = `${sy}px`;
}

function setAim(clientX, clientY) {
  const r = aimJoystick.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const max = r.width * .38;
  let dx = clientX - cx, dy = clientY - cy;
  const len = Math.hypot(dx, dy) || 1, limited = Math.min(len, max);
  dx = dx / len * limited; dy = dy / len * limited;
  aim.x = dx / max; aim.y = dy / max;
  const l = Math.hypot(aim.x, aim.y) || 1;
  aim.x /= l; aim.y /= l;
  aimKnob.style.transform = `translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px))`;
  aimLine.style.transform = `translate(-50%,-50%) rotate(${Math.atan2(aim.y,aim.x)}rad)`;
}

function resetAimKnob() {
  aimKnob.style.transform = "translate(-50%,-50%)";
}

function activateAim(skill) {
  if (aim.active && aim.skill === skill) {
    fireBasicAttack(skill);
    return;
  }
  aim.active = true;
  aim.skill = skill;
  aim.x = player.angle ? Math.cos(player.angle) : 1;
  aim.y = player.angle ? Math.sin(player.angle) : 0;
  skills.forEach(b => b.classList.toggle("selected", b.dataset.skill === skill));
  aimJoystick.classList.add("active");
  aimLabel.classList.add("visible");
  positionAimJoystick();
  resetAimKnob();
}

function deactivateAim() {
  aim.active = false;
  aim.pointer = null;
  aimJoystick.classList.remove("active");
  aimLabel.classList.remove("visible");
  skills.forEach(b => b.classList.remove("selected"));
  resetAimKnob();
}

function fireBasicAttack(skill) {
  const dir = Math.hypot(aim.x, aim.y) || 1;
  const dx = aim.x / dir, dy = aim.y / dir;
  projectiles.push({
    x: player.x + dx * 55,
    y: player.y + dy * 55,
    vx: dx * 12,
    vy: dy * 12,
    life: 900,
    skill
  });
  player.angle = Math.atan2(dy, dx);
  deactivateAim();
}

aimJoystick.addEventListener("pointerdown", e => {
  if (!aim.active) return;
  aim.pointer = e.pointerId;
  aimJoystick.setPointerCapture(e.pointerId);
  setAim(e.clientX, e.clientY);
});
aimJoystick.addEventListener("pointermove", e => {
  if (e.pointerId === aim.pointer) setAim(e.clientX, e.clientY);
});
aimJoystick.addEventListener("pointerup", e => {
  if (e.pointerId === aim.pointer) aim.pointer = null;
});
aimJoystick.addEventListener("pointercancel", () => { aim.pointer = null; });

skills.forEach(btn => {
  btn.addEventListener("pointerdown", e => {
    e.preventDefault();
    activateAim(btn.dataset.skill);
  });
});

addEventListener("keydown", e => input.keys.add(e.key.toLowerCase()));
addEventListener("keyup", e => input.keys.delete(e.key.toLowerCase()));

function drawBackground(t) {
  const w = innerWidth, h = innerHeight;
  const grad = ctx.createLinearGradient(0,0,w,h);
  grad.addColorStop(0,"#070b20"); grad.addColorStop(.5,"#101a3d"); grad.addColorStop(1,"#050713");
  ctx.fillStyle = grad; ctx.fillRect(0,0,w,h);

  ctx.save();
  ctx.translate(-camera.x+w/2,-camera.y+h/2);
  ctx.fillStyle="#111a2b"; ctx.fillRect(0,0,world.width,world.height);

  const grid=180;
  ctx.lineWidth=2; ctx.strokeStyle="rgba(91,120,190,.11)";
  for(let x=0;x<=world.width;x+=grid){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,world.height);ctx.stroke();}
  for(let y=0;y<=world.height;y+=grid){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(world.width,y);ctx.stroke();}

  const stones=[[480,560,150,70],[900,370,120,55],[3300,520,190,80],[3550,1300,120,160],[640,2450,190,70],[3240,2450,160,90],[2050,530,240,80],[1900,2460,210,70]];
  for(const [x,y,rx,ry] of stones){
    ctx.fillStyle="#17213a";ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle="rgba(114,146,220,.18)";ctx.stroke();
  }

  ctx.lineWidth=4;ctx.strokeStyle="rgba(104,92,255,.18)";
  for(let i=0;i<5;i++){ctx.beginPath();ctx.moveTo(0,500+i*500);ctx.bezierCurveTo(900,300+i*480,1700,800+i*380,world.width,420+i*500);ctx.stroke();}

  const pulse=1+Math.sin(t/700)*.04;
  ctx.save();ctx.translate(world.width/2,world.height/2);ctx.scale(pulse,pulse);
  ctx.strokeStyle="rgba(105,156,255,.25)";ctx.lineWidth=4;
  ctx.beginPath();ctx.arc(0,0,260,0,Math.PI*2);ctx.stroke();
  ctx.beginPath();ctx.arc(0,0,185,0,Math.PI*2);ctx.stroke();
  ctx.rotate(t/6000);ctx.beginPath();ctx.moveTo(0,-230);ctx.lineTo(199,115);ctx.lineTo(-199,115);ctx.closePath();ctx.stroke();
  ctx.restore();ctx.restore();
}

function drawJugo(t) {
  const sx=player.x-camera.x+innerWidth/2, sy=player.y-camera.y+innerHeight/2;
  ctx.save();ctx.translate(sx,sy);

  ctx.fillStyle="rgba(0,0,0,.48)";ctx.beginPath();ctx.ellipse(0,42,52,17,0,0,Math.PI*2);ctx.fill();

  for(let i=0;i<6;i++){
    const a=t/1100+i*Math.PI/3,ox=Math.cos(a)*78,oy=Math.sin(a)*42;
    const glow=ctx.createRadialGradient(ox,oy,1,ox,oy,22);
    glow.addColorStop(0,"#8feaff");glow.addColorStop(.25,"#426dff");glow.addColorStop(1,"rgba(105,45,255,0)");
    ctx.fillStyle=glow;ctx.beginPath();ctx.arc(ox,oy,22,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#58baff";ctx.beginPath();ctx.arc(ox,oy,9,0,Math.PI*2);ctx.fill();
  }

  const body=ctx.createLinearGradient(-28,-70,35,65);
  body.addColorStop(0,"#9e7cff");body.addColorStop(.4,"#254dba");body.addColorStop(1,"#0a122f");
  ctx.fillStyle=body;ctx.beginPath();
  ctx.moveTo(0,-92);ctx.lineTo(31,-60);ctx.lineTo(38,18);ctx.lineTo(22,63);ctx.lineTo(8,52);ctx.lineTo(0,86);ctx.lineTo(-10,52);ctx.lineTo(-25,63);ctx.lineTo(-38,18);ctx.lineTo(-31,-60);ctx.closePath();ctx.fill();

  ctx.fillStyle="rgba(151,125,255,.82)";
  ctx.beginPath();ctx.moveTo(-28,-40);ctx.lineTo(-86,-76);ctx.lineTo(-52,-18);ctx.lineTo(-92,30);ctx.lineTo(-30,8);ctx.closePath();ctx.fill();
  ctx.beginPath();ctx.moveTo(28,-40);ctx.lineTo(86,-76);ctx.lineTo(52,-18);ctx.lineTo(92,30);ctx.lineTo(30,8);ctx.closePath();ctx.fill();

  ctx.fillStyle="#0a1231";ctx.beginPath();ctx.moveTo(0,-116);ctx.lineTo(-33,-86);ctx.lineTo(-20,-51);ctx.lineTo(0,-42);ctx.lineTo(20,-51);ctx.lineTo(33,-86);ctx.closePath();ctx.fill();
  ctx.fillStyle="#6f5fff";ctx.beginPath();ctx.moveTo(0,-118);ctx.lineTo(-8,-78);ctx.lineTo(0,-62);ctx.lineTo(8,-78);ctx.closePath();ctx.fill();
  ctx.fillStyle="#c5f2ff";ctx.beginPath();ctx.arc(0,-82,5,0,Math.PI*2);ctx.fill();

  ctx.save();ctx.rotate(player.angle||-.45);ctx.strokeStyle="#8b6eff";ctx.lineWidth=7;
  ctx.beginPath();ctx.moveTo(30,-5);ctx.lineTo(105,72);ctx.stroke();
  ctx.fillStyle="#a8edff";ctx.beginPath();ctx.moveTo(104,70);ctx.lineTo(137,48);ctx.lineTo(125,86);ctx.lineTo(98,92);ctx.closePath();ctx.fill();ctx.restore();
  ctx.restore();
}

function drawProjectiles() {
  ctx.save();
  ctx.translate(-camera.x+innerWidth/2,-camera.y+innerHeight/2);
  for(const p of projectiles){
    const g=ctx.createRadialGradient(p.x,p.y,1,p.x,p.y,24);
    g.addColorStop(0,"#d9fbff");g.addColorStop(.25,"#61d7ff");g.addColorStop(.6,"#705bff");g.addColorStop(1,"rgba(70,60,255,0)");
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y,24,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#e8ffff";ctx.beginPath();ctx.arc(p.x,p.y,7,0,Math.PI*2);ctx.fill();
  }
  ctx.restore();
}

function update(dt) {
  let x=input.x,y=input.y;
  if(input.keys.has("w")||input.keys.has("arrowup"))y-=1;
  if(input.keys.has("s")||input.keys.has("arrowdown"))y+=1;
  if(input.keys.has("a")||input.keys.has("arrowleft"))x-=1;
  if(input.keys.has("d")||input.keys.has("arrowright"))x+=1;
  const len=Math.hypot(x,y);
  if(len>1){x/=len;y/=len;}
  if(Math.hypot(x,y)>.08) player.angle=Math.atan2(y,x);
  player.x=clamp(player.x+x*player.speed*dt/16,90,world.width-90);
  player.y=clamp(player.y+y*player.speed*dt/16,90,world.height-90);
  camera.x+=(player.x-camera.x)*.09;camera.y+=(player.y-camera.y)*.09;

  for(let i=projectiles.length-1;i>=0;i--){
    const p=projectiles[i];
    p.x+=p.vx*dt/16;p.y+=p.vy*dt/16;p.life-=dt;
    if(p.life<=0||p.x<0||p.y<0||p.x>world.width||p.y>world.height)projectiles.splice(i,1);
  }
  if(aim.active) positionAimJoystick();
}

let last=performance.now();
function loop(now){
  const dt=Math.min(40,now-last);last=now;
  update(dt);drawBackground(now);drawProjectiles();drawJugo(now);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
