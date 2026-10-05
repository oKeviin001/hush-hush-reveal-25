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

    <div class="aim-label" id="aimLabel">MIRE E TOQUE NOVAMENTE</div><div class="hp-ui"><span>JUGO</span><div><i id="hpFill"></i></div><b id="hpText">3000 / 3000</b></div>
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
const hpFill=document.querySelector("#hpFill"),hpText=document.querySelector("#hpText");

const world = { width: 4200, height: 3000 };
const player = { x: world.width / 2, y: world.height / 2, speed: 4.8, angle: 0 };
const input = { x: 0, y: 0, keys: new Set() };
const camera = { x: player.x, y: player.y };
const aim = { x: 1, y: 0, active: false, pointer: null };
const projectiles=[];
const enemies=[
  {x:world.width/2+360,y:world.height/2+40,hp:180,maxHp:180,hit:0,type:"knight",speed:1.05,attackCd:0,attackRange:72,damage:55},
  {x:world.width/2+520,y:world.height/2-170,hp:180,maxHp:180,hit:0,type:"knight",speed:1.0,attackCd:0,attackRange:72,damage:55},
  {x:world.width/2-390,y:world.height/2+120,hp:180,maxHp:180,hit:0,type:"knight",speed:1.1,attackCd:0,attackRange:72,damage:55},
  {x:world.width/2+760,y:world.height/2-430,hp:120,maxHp:120,hit:0,type:"archer",speed:.48,attackCd:900,attackRange:900,damage:38},
  {x:world.width/2-820,y:world.height/2-330,hp:120,maxHp:120,hit:0,type:"archer",speed:.5,attackCd:1350,attackRange:950,damage:42}
];
const traps=[],summons=[],enemyProjectiles=[];
const playerStats={hp:3000,maxHp:3000,ultimate:false,ultimateTime:0};
let movePointer=null;

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

function summonDistraction(){const d=Math.hypot(aim.x,aim.y)||1,dx=aim.x/d,dy=aim.y/d;summons.push({x:player.x+dx*190,y:player.y+dy*190,hp:900,maxHp:900,life:3000,attackCd:0});player.angle=Math.atan2(dy,dx)}
function castBlobField(){const d=Math.hypot(aim.x,aim.y)||1,dx=aim.x/d,dy=aim.y/d,px=-dy,py=dx;const n=playerStats.ultimate?30:20;for(let i=0;i<n;i++){const row=Math.floor(i/3),col=i%3-1,dist=100+row*105;traps.push({x:player.x+dx*dist+px*col*58,y:player.y+dy*dist+py*col*58,life:6000,damage:playerStats.ultimate?16:4,slow:playerStats.ultimate?.45:.28})}player.angle=Math.atan2(dy,dx)}
function ultimateSpin(){enemies.forEach(e=>{const dx=e.x-player.x,dy=e.y-player.y,d=Math.hypot(dx,dy);if(d<230){e.hp-=120;e.x+=dx/(d||1)*150;e.y+=dy/(d||1)*150;e.hit=180}})}
function activateUltimate(){if(!playerStats.ultimate){const p=summons[summons.length-1];if(p&&p.life>0){player.x=p.x;player.y=p.y}playerStats.ultimate=true;playerStats.ultimateTime=6500;skills.forEach(b=>b.classList.add("ultimate"))}else{playerStats.ultimate=false;playerStats.ultimateTime=0;skills.forEach(b=>b.classList.remove("ultimate"))}deactivateAim()}
function activateAim(skill){if(skill==="C"){activateUltimate();return}if(aim.active&&aim.skill===skill){if(playerStats.ultimate){if(skill==="A")castBlobField();else ultimateSpin()}else{if(skill==="A")summonDistraction();else castBlobField()}deactivateAim();return}aim.active=true;aim.skill=skill;aim.x=player.angle?Math.cos(player.angle):1;aim.y=player.angle?Math.sin(player.angle):0;skills.forEach(x=>x.classList.toggle("selected",x.dataset.skill===skill));aimJoystick.classList.add("active");aimLabel.classList.add("visible");positionAimJoystick();resetAimKnob()}

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
 const w=innerWidth,h=innerHeight;const sky=ctx.createLinearGradient(0,0,0,h);sky.addColorStop(0,"#7fc9ed");sky.addColorStop(.38,"#bfe4d1");sky.addColorStop(.58,"#e8d49c");sky.addColorStop(1,"#7aa889");ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
 const glow=ctx.createRadialGradient(w*.5,h*.37,10,w*.5,h*.37,w*.65);glow.addColorStop(0,"rgba(126,184,255,.22)");glow.addColorStop(1,"rgba(70,90,180,0)");ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);
 ctx.fillStyle="#101a2b";ctx.beginPath();ctx.moveTo(0,h*.48);ctx.lineTo(w*.1,h*.36);ctx.lineTo(w*.2,h*.44);ctx.lineTo(w*.34,h*.32);ctx.lineTo(w*.47,h*.43);ctx.lineTo(w*.61,h*.34);ctx.lineTo(w*.75,h*.42);ctx.lineTo(w*.9,h*.31);ctx.lineTo(w,h*.43);ctx.lineTo(w,h*.57);ctx.lineTo(0,h*.57);ctx.closePath();ctx.fill();
 ctx.save();ctx.beginPath();ctx.rect(0,h*.43,w,h*.57);ctx.clip();const{forward,right}=cameraBasis();
 for(let depth=80;depth<2600;depth+=120){const p=projectWorld(player.x+forward.x*depth,player.y+forward.y*depth);ctx.strokeStyle=`rgba(110,151,220,${Math.max(.035,.14-depth/24000)})`;ctx.lineWidth=Math.max(1,2-depth/2200);ctx.beginPath();ctx.moveTo(0,p.y);ctx.lineTo(w,p.y);ctx.stroke()}
 for(let lateral=-2600;lateral<=2600;lateral+=180){const near=projectWorld(player.x+forward.x*80+right.x*lateral,player.y+forward.y*80+right.y*lateral);const far=projectWorld(player.x+forward.x*2600+right.x*lateral,player.y+forward.y*2600+right.y*lateral);ctx.strokeStyle="rgba(105,145,215,.09)";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(near.x,near.y);ctx.lineTo(far.x,far.y);ctx.stroke()}
 const path=[];for(let d=100;d<2500;d+=80)path.push(projectWorld(player.x+forward.x*d,player.y+forward.y*d));ctx.strokeStyle="rgba(113,92,255,.22)";ctx.lineWidth=18;ctx.lineCap="round";ctx.beginPath();path.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();ctx.strokeStyle="rgba(111,186,255,.22)";ctx.lineWidth=3;ctx.beginPath();path.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();ctx.restore();
 const objects=[{x:player.x+right.x*620+forward.x*620,y:player.y+right.y*620+forward.y*620,s:130},{x:player.x-right.x*720+forward.x*760,y:player.y-right.y*720+forward.y*760,s:160},{x:player.x+right.x*880+forward.x*1200,y:player.y+right.y*880+forward.y*1200,s:190},{x:player.x-right.x*900+forward.x*1450,y:player.y-right.y*900+forward.y*1450,s:220}];
 for(const o of objects){const p=projectWorld(o.x,o.y,o.s);if(p.depth<100||p.depth>2800)continue;const sz=o.s*p.scale;ctx.fillStyle="rgba(12,20,35,.9)";ctx.fillRect(p.x-sz*.35,p.y-sz,sz*.7,sz);ctx.strokeStyle="rgba(108,145,220,.22)";ctx.strokeRect(p.x-sz*.35,p.y-sz,sz*.7,sz)}
 const rune=projectWorld(player.x+forward.x*1150,player.y+forward.y*1150);ctx.save();ctx.translate(rune.x,rune.y);ctx.scale(rune.scale*180,rune.scale*180);ctx.rotate(t/6000);ctx.strokeStyle="rgba(105,156,255,.35)";ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,1,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(0,-.8);ctx.lineTo(.7,.4);ctx.lineTo(-.7,.4);ctx.closePath();ctx.stroke();ctx.restore();
 const toys=[[-620,720,"#f0a8b8",170],[650,820,"#79b9d4",190],[-760,1250,"#f1c86d",220],[780,1500,"#8bc481",180]];for(const[oLat,oDep,c,z0]of toys){const p=projectWorld(player.x+right.x*oLat+forward.x*oDep,player.y+right.y*oLat+forward.y*oDep,z0);if(p.depth<100||p.depth>2700)continue;const z=z0*p.scale;ctx.fillStyle=c;ctx.fillRect(p.x-z*.4,p.y-z*.75,z*.8,z*.75);ctx.fillStyle="rgba(255,255,255,.3)";ctx.fillRect(p.x-z*.3,p.y-z*.65,z*.6,z*.1)}
}

function drawJugo(t){
 const sx=innerWidth/2,sy=innerHeight*.78,moving=Math.hypot(input.x,input.y)>.08||input.keys.size;ctx.save();ctx.translate(sx,sy);if(playerStats.ultimate){ctx.shadowBlur=38;ctx.shadowColor="#ff9a4d";ctx.scale(1.5,1.5);ctx.rotate(Math.sin(t/100)*.025)}ctx.translate(0,moving?Math.sin(t/75)*2.5:Math.sin(t/900));
 ctx.fillStyle="rgba(0,0,0,.58)";ctx.beginPath();ctx.ellipse(0,25,62,18,0,0,Math.PI*2);ctx.fill();
 for(let i=0;i<6;i++){const a=t/1100+i*Math.PI/3,ox=Math.cos(a)*82,oy=Math.sin(a)*34-35;const g=ctx.createRadialGradient(ox,oy,1,ox,oy,25);g.addColorStop(0,"#b9f5ff");g.addColorStop(.25,"#426dff");g.addColorStop(1,"rgba(105,45,255,0)");ctx.fillStyle=g;ctx.beginPath();ctx.arc(ox,oy,25,0,Math.PI*2);ctx.fill();ctx.fillStyle="#58baff";ctx.beginPath();ctx.arc(ox,oy,9,0,Math.PI*2);ctx.fill()}
 ctx.scale(1.18,1.18);const body=ctx.createLinearGradient(-28,-70,35,65);body.addColorStop(0,"#b59aff");body.addColorStop(.4,"#315bc7");body.addColorStop(1,"#090f2c");ctx.fillStyle=body;ctx.beginPath();ctx.moveTo(0,-92);ctx.lineTo(31,-60);ctx.lineTo(38,18);ctx.lineTo(22,63);ctx.lineTo(8,52);ctx.lineTo(0,86);ctx.lineTo(-10,52);ctx.lineTo(-25,63);ctx.lineTo(-38,18);ctx.lineTo(-31,-60);ctx.closePath();ctx.fill();
 ctx.fillStyle="rgba(151,125,255,.88)";ctx.beginPath();ctx.moveTo(-28,-40);ctx.lineTo(-86,-76);ctx.lineTo(-52,-18);ctx.lineTo(-92,30);ctx.lineTo(-30,8);ctx.closePath();ctx.fill();ctx.beginPath();ctx.moveTo(28,-40);ctx.lineTo(86,-76);ctx.lineTo(52,-18);ctx.lineTo(92,30);ctx.lineTo(30,8);ctx.closePath();ctx.fill();
 ctx.fillStyle="#080f30";ctx.beginPath();ctx.moveTo(0,-116);ctx.lineTo(-33,-86);ctx.lineTo(-20,-51);ctx.lineTo(0,-42);ctx.lineTo(20,-51);ctx.lineTo(33,-86);ctx.closePath();ctx.fill();ctx.fillStyle="#735fff";ctx.beginPath();ctx.moveTo(0,-118);ctx.lineTo(-8,-78);ctx.lineTo(0,-62);ctx.lineTo(8,-78);ctx.closePath();ctx.fill();ctx.fillStyle="#d4f8ff";ctx.beginPath();ctx.arc(0,-82,5,0,Math.PI*2);ctx.fill();
 ctx.save();ctx.rotate(player.angle-.45);ctx.strokeStyle="#8b6eff";ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(30,-5);ctx.lineTo(105,72);ctx.stroke();ctx.fillStyle="#a8edff";ctx.beginPath();ctx.moveTo(104,70);ctx.lineTo(137,48);ctx.lineTo(125,86);ctx.lineTo(98,92);ctx.closePath();ctx.fill();ctx.restore();ctx.restore();
}

function drawWorldEntities(){
for(const q of traps){const p=projectWorld(q.x,q.y,3);if(p.depth<0)continue;const r=Math.max(5,20*p.scale);ctx.fillStyle="rgba(101,91,255,.2)";ctx.beginPath();ctx.ellipse(p.x,p.y,r*1.7,r*.7,0,0,Math.PI*2);ctx.fill();ctx.fillStyle="#72d9ff";ctx.beginPath();ctx.arc(p.x,p.y,r*.45,0,Math.PI*2);ctx.fill()}for(const q of summons){const p=projectWorld(q.x,q.y,65);if(p.depth<0)continue;const z=Math.max(15,50*p.scale);ctx.fillStyle="#efbd6b";ctx.beginPath();ctx.arc(p.x,p.y-z*.5,32*p.scale,0,Math.PI*2);ctx.fill();ctx.fillStyle="#63df83";ctx.fillRect(p.x-40*p.scale,p.y-z*.5-48*p.scale,80*p.scale*(q.hp/q.maxHp),6)}for(const e of enemies){
  const p=projectWorld(e.x,e.y,e.type==="archer"?72:70);
  if(p.depth<0)continue;
  const z=Math.max(15,(e.type==="archer"?52:62)*p.scale);
  ctx.save();
  ctx.translate(p.x,p.y);
  if(e.hit>0){ctx.shadowBlur=18;ctx.shadowColor="#fff"}
  if(e.type==="knight"){
    ctx.fillStyle=e.hit>0?"#fff":"#46526f";
    ctx.beginPath();ctx.ellipse(0,-z*.55,z*.58,z*.78,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#7d8ba8";ctx.fillRect(-z*.42,-z*.82,z*.84,z*.55);
    ctx.fillStyle="#252d43";ctx.fillRect(-z*.28,-z*.58,z*.56,z*.35);
    ctx.fillStyle="#dce8ff";ctx.fillRect(-z*.18,-z*.52,z*.36,z*.06);
    ctx.strokeStyle="#d7e1f5";ctx.lineWidth=Math.max(2,z*.08);ctx.beginPath();ctx.moveTo(z*.38,-z*.35);ctx.lineTo(z*.9,z*.85);ctx.stroke();
    ctx.fillStyle="#9eabc4";ctx.beginPath();ctx.arc(-z*.65,-z*.25,z*.32,0,Math.PI*2);ctx.fill();
  }else{
    ctx.fillStyle=e.hit>0?"#fff":"#6a4e4a";ctx.beginPath();ctx.ellipse(0,-z*.58,z*.45,z*.65,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#c69a72";ctx.beginPath();ctx.arc(0,-z*1.08,z*.28,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle="#6f3d25";ctx.lineWidth=Math.max(2,z*.06);ctx.beginPath();ctx.arc(0,-z*.58,z*.72,-1.1,1.1);ctx.stroke();
    ctx.strokeStyle="#d6b07a";ctx.lineWidth=Math.max(2,z*.045);ctx.beginPath();ctx.moveTo(z*.55,-z*.9);ctx.lineTo(z*.95,-z*.05);ctx.stroke();
  }
  ctx.restore();
  ctx.fillStyle="#61df83";ctx.fillRect(p.x-z,p.y-z*.02,z*2*Math.max(0,e.hp/e.maxHp),5);
}
function drawProjectiles(){
ctx.save();
for(const p of projectiles){const q=projectWorld(p.x,p.y,28);if(q.depth<0)continue;const r=Math.max(4,12*q.scale);const g=ctx.createRadialGradient(q.x,q.y,1,q.x,q.y,r*2.8);g.addColorStop(0,"#e9ffff");g.addColorStop(.25,"#61d7ff");g.addColorStop(.6,"#705bff");g.addColorStop(1,"rgba(70,60,255,0)");ctx.fillStyle=g;ctx.beginPath();ctx.arc(q.x,q.y,r*2.8,0,Math.PI*2);ctx.fill();ctx.fillStyle="#e8ffff";ctx.beginPath();ctx.arc(q.x,q.y,r,0,Math.PI*2);ctx.fill()}for(const a of enemyProjectiles){
  const q=projectWorld(a.x,a.y,30);
  if(q.depth<0)continue;
  const r=Math.max(3,7*q.scale);
  ctx.strokeStyle="#f5d39b";ctx.lineWidth=Math.max(2,3*q.scale);
  ctx.beginPath();ctx.moveTo(q.x-r*3,q.y+r*1.5);ctx.lineTo(q.x+r*3,q.y-r*1.5);ctx.stroke();
  ctx.fillStyle="#fff1c2";ctx.beginPath();ctx.arc(q.x,q.y,r,0,Math.PI*2);ctx.fill();
}
ctx.restore()}

function update(dt){let x=input.x,y=input.y;if(playerStats.ultimate){playerStats.ultimateTime-=dt;if(playerStats.ultimateTime<=0){playerStats.ultimate=false;skills.forEach(b=>b.classList.remove("ultimate"))}}if(input.keys.has("w")||input.keys.has("arrowup"))y-=1;if(input.keys.has("s")||input.keys.has("arrowdown"))y+=1;if(input.keys.has("a")||input.keys.has("arrowleft"))x-=1;if(input.keys.has("d")||input.keys.has("arrowright"))x+=1;const l=Math.hypot(x,y);if(l>1){x/=l;y/=l}if(Math.hypot(x,y)>.08)player.angle=Math.atan2(y,x);player.x=clamp(player.x+x*player.speed*(playerStats.ultimate?1.12:1)*dt/16,90,world.width-90);player.y=clamp(player.y+y*player.speed*(playerStats.ultimate?1.12:1)*dt/16,90,world.height-90);camera.x+=(player.x-camera.x)*.09;camera.y+=(player.y-camera.y)*.09;for(const e of enemies){
  e.hit=Math.max(0,e.hit-dt);
  e.slow=Math.max(0,(e.slow||0)-dt/1000);
  e.attackCd-=dt;
  const q=summons.find(x=>x.life>0);
  const target=q && Math.hypot(q.x-e.x,q.y-e.y)<560 ? q : player;
  const dx=target.x-e.x,dy=target.y-e.y,d=Math.hypot(dx,dy)||1;
  const slowFactor=1-e.slow;
  if(e.type==="knight"){
    if(d>e.attackRange){e.x+=dx/d*e.speed*slowFactor*dt/16;e.y+=dy/d*e.speed*slowFactor*dt/16}
    else if(e.attackCd<=0){e.attackCd=1050;if(target===player)playerStats.hp=Math.max(0,playerStats.hp-e.damage);else target.hp=Math.max(0,target.hp-e.damage*.55)}
  }else{
    if(d<330){e.x-=dx/d*e.speed*slowFactor*dt/16;e.y-=dy/d*e.speed*slowFactor*dt/16}
    if(d<=e.attackRange && e.attackCd<=0){
      e.attackCd=1050+Math.random()*550;
      const fast=Math.random()<.35;
      const speed=fast?15:10;
      enemyProjectiles.push({x:e.x,y:e.y,vx:dx/d*speed,vy:dy/d*speed,life:fast?1050:1500,damage:fast?52:e.damage});
    }
  }
  for(const t of traps)if(Math.hypot(t.x-e.x,t.y-e.y)<42){e.hp-=t.damage*dt/1000;e.slow=t.slow}
}for(let i=summons.length-1;i>=0;i--){const q=summons[i];q.life-=dt;q.attackCd-=dt;if(q.attackCd<=0){q.attackCd=420;for(const e of enemies)if(Math.hypot(e.x-q.x,e.y-q.y)<230)e.hp-=7}if(q.hp<=0||q.life<=0)summons.splice(i,1)}for(let i=traps.length-1;i>=0;i--)if((traps[i].life-=dt)<=0)traps.splice(i,1);for(let i=enemyProjectiles.length-1;i>=0;i--){
  const a=enemyProjectiles[i];
  a.x+=a.vx*dt/16;a.y+=a.vy*dt/16;a.life-=dt;
  if(Math.hypot(a.x-player.x,a.y-player.y)<55){playerStats.hp=Math.max(0,playerStats.hp-a.damage);a.life=0}
  if(a.life<=0||a.x<0||a.y<0||a.x>world.width||a.y>world.height)enemyProjectiles.splice(i,1);
}
for(let i=projectiles.length-1;i>=0;i--){const p=projectiles[i];p.x+=p.vx*dt/16;p.y+=p.vy*dt/16;p.life-=dt;if(p.life<=0||p.x<0||p.y<0||p.x>world.width||p.y>world.height)projectiles.splice(i,1)}for(const e of enemies)if(e.hp<=0){
  e.hp=e.maxHp;
  e.attackCd=e.type==="archer"?1200:0;
  e.x=world.width/2+(Math.random()-.5)*1500;
  e.y=world.height/2+(Math.random()-.5)*1100;
}if(aim.active)positionAimJoystick();hpFill.style.width=`${Math.max(0,playerStats.hp/playerStats.maxHp)*100}%`;hpText.textContent=`${Math.ceil(playerStats.hp)} / 3000`}
let last=performance.now();
function loop(now){
  const dt=Math.min(40,now-last);last=now;
  update(dt);drawBackground(now);drawWorldEntities();drawProjectiles();drawJugo(now);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
