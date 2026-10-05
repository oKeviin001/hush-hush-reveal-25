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

function cameraBasis(){const forward={x:Math.cos(player.angle),y:Math.sin(player.angle)};const right={x:-forward.y,y:forward.x};return{forward,right}}
function projectWorld(x,y,height=0){const{forward,right}=cameraBasis();const dx=x-player.x,dy=y-player.y;const depth=dx*forward.x+dy*forward.y;const lateral=dx*right.x+dy*right.y;const horizon=innerHeight*.36;const focal=Math.min(innerWidth,innerHeight)*.78;const scale=focal/Math.max(180,depth+520);return{x:innerWidth/2+lateral*scale,y:horizon+innerHeight*.32*(depth/900)-height*scale,scale,depth}}

function drawBackground(t){
 const w=innerWidth,h=innerHeight;const sky=ctx.createLinearGradient(0,0,0,h);sky.addColorStop(0,"#050817");sky.addColorStop(.38,"#172d59");sky.addColorStop(.58,"#263b4b");sky.addColorStop(1,"#090d18");ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
 const glow=ctx.createRadialGradient(w*.5,h*.37,10,w*.5,h*.37,w*.65);glow.addColorStop(0,"rgba(126,184,255,.22)");glow.addColorStop(1,"rgba(70,90,180,0)");ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);
 ctx.fillStyle="#101a2b";ctx.beginPath();ctx.moveTo(0,h*.48);ctx.lineTo(w*.1,h*.36);ctx.lineTo(w*.2,h*.44);ctx.lineTo(w*.34,h*.32);ctx.lineTo(w*.47,h*.43);ctx.lineTo(w*.61,h*.34);ctx.lineTo(w*.75,h*.42);ctx.lineTo(w*.9,h*.31);ctx.lineTo(w,h*.43);ctx.lineTo(w,h*.57);ctx.lineTo(0,h*.57);ctx.closePath();ctx.fill();
 ctx.save();ctx.beginPath();ctx.rect(0,h*.43,w,h*.57);ctx.clip();const{forward,right}=cameraBasis();
 for(let depth=80;depth<2600;depth+=120){const p=projectWorld(player.x+forward.x*depth,player.y+forward.y*depth);ctx.strokeStyle=`rgba(110,151,220,${Math.max(.035,.14-depth/24000)})`;ctx.lineWidth=Math.max(1,2-depth/2200);ctx.beginPath();ctx.moveTo(0,p.y);ctx.lineTo(w,p.y);ctx.stroke()}
 for(let lateral=-2600;lateral<=2600;lateral+=180){const near=projectWorld(player.x+forward.x*80+right.x*lateral,player.y+forward.y*80+right.y*lateral);const far=projectWorld(player.x+forward.x*2600+right.x*lateral,player.y+forward.y*2600+right.y*lateral);ctx.strokeStyle="rgba(105,145,215,.09)";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(near.x,near.y);ctx.lineTo(far.x,far.y);ctx.stroke()}
 const path=[];for(let d=100;d<2500;d+=80)path.push(projectWorld(player.x+forward.x*d,player.y+forward.y*d));ctx.strokeStyle="rgba(113,92,255,.22)";ctx.lineWidth=18;ctx.lineCap="round";ctx.beginPath();path.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();ctx.strokeStyle="rgba(111,186,255,.22)";ctx.lineWidth=3;ctx.beginPath();path.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();ctx.restore();
 const objects=[{x:player.x+right.x*620+forward.x*620,y:player.y+right.y*620+forward.y*620,s:130},{x:player.x-right.x*720+forward.x*760,y:player.y-right.y*720+forward.y*760,s:160},{x:player.x+right.x*880+forward.x*1200,y:player.y+right.y*880+forward.y*1200,s:190},{x:player.x-right.x*900+forward.x*1450,y:player.y-right.y*900+forward.y*1450,s:220}];
 for(const o of objects){const p=projectWorld(o.x,o.y,o.s);if(p.depth<100||p.depth>2800)continue;const sz=o.s*p.scale;ctx.fillStyle="rgba(12,20,35,.9)";ctx.fillRect(p.x-sz*.35,p.y-sz,sz*.7,sz);ctx.strokeStyle="rgba(108,145,220,.22)";ctx.strokeRect(p.x-sz*.35,p.y-sz,sz*.7,sz)}
 const rune=projectWorld(player.x+forward.x*1150,player.y+forward.y*1150);ctx.save();ctx.translate(rune.x,rune.y);ctx.scale(rune.scale*180,rune.scale*180);ctx.rotate(t/6000);ctx.strokeStyle="rgba(105,156,255,.35)";ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,1,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(0,-.8);ctx.lineTo(.7,.4);ctx.lineTo(-.7,.4);ctx.closePath();ctx.stroke();ctx.restore();
}

function drawJugo(t){
 const sx=innerWidth/2,sy=innerHeight*.78,moving=Math.hypot(input.x,input.y)>.08||input.keys.size;ctx.save();ctx.translate(sx,sy);ctx.translate(0,moving?Math.sin(t/75)*2.5:Math.sin(t/900));
 ctx.fillStyle="rgba(0,0,0,.58)";ctx.beginPath();ctx.ellipse(0,25,62,18,0,0,Math.PI*2);ctx.fill();
 for(let i=0;i<6;i++){const a=t/1100+i*Math.PI/3,ox=Math.cos(a)*82,oy=Math.sin(a)*34-35;const g=ctx.createRadialGradient(ox,oy,1,ox,oy,25);g.addColorStop(0,"#b9f5ff");g.addColorStop(.25,"#426dff");g.addColorStop(1,"rgba(105,45,255,0)");ctx.fillStyle=g;ctx.beginPath();ctx.arc(ox,oy,25,0,Math.PI*2);ctx.fill();ctx.fillStyle="#58baff";ctx.beginPath();ctx.arc(ox,oy,9,0,Math.PI*2);ctx.fill()}
 ctx.scale(1.18,1.18);const body=ctx.createLinearGradient(-28,-70,35,65);body.addColorStop(0,"#b59aff");body.addColorStop(.4,"#315bc7");body.addColorStop(1,"#090f2c");ctx.fillStyle=body;ctx.beginPath();ctx.moveTo(0,-92);ctx.lineTo(31,-60);ctx.lineTo(38,18);ctx.lineTo(22,63);ctx.lineTo(8,52);ctx.lineTo(0,86);ctx.lineTo(-10,52);ctx.lineTo(-25,63);ctx.lineTo(-38,18);ctx.lineTo(-31,-60);ctx.closePath();ctx.fill();
 ctx.fillStyle="rgba(151,125,255,.88)";ctx.beginPath();ctx.moveTo(-28,-40);ctx.lineTo(-86,-76);ctx.lineTo(-52,-18);ctx.lineTo(-92,30);ctx.lineTo(-30,8);ctx.closePath();ctx.fill();ctx.beginPath();ctx.moveTo(28,-40);ctx.lineTo(86,-76);ctx.lineTo(52,-18);ctx.lineTo(92,30);ctx.lineTo(30,8);ctx.closePath();ctx.fill();
 ctx.fillStyle="#080f30";ctx.beginPath();ctx.moveTo(0,-116);ctx.lineTo(-33,-86);ctx.lineTo(-20,-51);ctx.lineTo(0,-42);ctx.lineTo(20,-51);ctx.lineTo(33,-86);ctx.closePath();ctx.fill();ctx.fillStyle="#735fff";ctx.beginPath();ctx.moveTo(0,-118);ctx.lineTo(-8,-78);ctx.lineTo(0,-62);ctx.lineTo(8,-78);ctx.closePath();ctx.fill();ctx.fillStyle="#d4f8ff";ctx.beginPath();ctx.arc(0,-82,5,0,Math.PI*2);ctx.fill();
 ctx.save();ctx.rotate(player.angle-.45);ctx.strokeStyle="#8b6eff";ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(30,-5);ctx.lineTo(105,72);ctx.stroke();ctx.fillStyle="#a8edff";ctx.beginPath();ctx.moveTo(104,70);ctx.lineTo(137,48);ctx.lineTo(125,86);ctx.lineTo(98,92);ctx.closePath();ctx.fill();ctx.restore();ctx.restore();
}

function drawProjectiles(){ctx.save();for(const p of projectiles){const q=projectWorld(p.x,p.y,28);if(q.depth<0)continue;const r=Math.max(4,12*q.scale);const g=ctx.createRadialGradient(q.x,q.y,1,q.x,q.y,r*2.8);g.addColorStop(0,"#e9ffff");g.addColorStop(.25,"#61d7ff");g.addColorStop(.6,"#705bff");g.addColorStop(1,"rgba(70,60,255,0)");ctx.fillStyle=g;ctx.beginPath();ctx.arc(q.x,q.y,r*2.8,0,Math.PI*2);ctx.fill();ctx.fillStyle="#e8ffff";ctx.beginPath();ctx.arc(q.x,q.y,r,0,Math.PI*2);ctx.fill()}ctx.restore()}

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
