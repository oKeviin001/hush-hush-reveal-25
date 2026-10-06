import "./style.css";
import jugoSideUrl from "./assets/jugo-side.png";
import jugoUltUrl from "./assets/jugo-ult.png";
import archerUrl from "./assets/archer.png";
import knightUrl from "./assets/knight.png";
import creatureUrl from "./assets/creature.png";

const app = document.querySelector("#app");
app.innerHTML = `
<main class="game-shell fighter-shell">
  <canvas id="game" aria-label="Arena de luta 1 contra 1"></canvas>

  <div class="hud fighter-hud">
    <div class="fighter-card player-card">
      <div class="fighter-name">JUGO</div>
      <div class="hp-track"><div id="playerHp" class="hp-fill"></div></div>
    </div>
    <div class="round-info"><span>1 VS 1</span><b id="roundText">ROUND 1</b></div>
    <div class="fighter-card enemy-card">
      <div class="fighter-name">OPONENTE</div>
      <div class="hp-track"><div id="enemyHp" class="hp-fill"></div></div>
    </div>
  </div>

  <div class="fight-message" id="fightMessage">JUGO</div>

  <div class="orientation-hint" id="orientationHint">RECOMENDADO: JOGUE NA HORIZONTAL<br><span>Você também pode jogar na vertical.</span></div>

  <div class="controls fighter-controls">
    <div class="joystick" id="joystick" aria-label="Movimento">
      <div class="joystick-ring"></div>
      <div class="joystick-knob" id="joystickKnob"></div>
    </div>

    <div class="skill-row" aria-label="Controles de combate">
      <button class="skill skill-a" data-skill="A" aria-label="Habilidade A"><span class="key">A</span><span class="lbl">CRIATURA</span><span class="cd"></span><span class="cdt"></span></button>
      <button class="skill skill-b" data-skill="B" aria-label="Habilidade B"><span class="key">B</span><span class="lbl">ESFERAS</span><span class="cd"></span><span class="cdt"></span></button>
      <button class="skill skill-c" data-skill="C" aria-label="Ultimate"><span class="key">C</span><span class="lbl">ULTIMATE</span><span class="cd"></span><span class="cdt"></span></button>
      <button class="basic-attack" id="basicAttack" aria-label="Ataque básico">
        <svg class="basic-attack-icon" viewBox="0 0 64 64" aria-hidden="true">
          <path d="M32 8v48"/><path d="M28 18C20 12 11 12 5 17v12c7-2 15-1 23 5"/>
          <path d="M36 18C44 12 53 12 59 17v12c-7-2-15-1-23 5"/><path d="M28 18l-5 10M36 18l5 10"/>
        </svg><span class="basic-label">ATAQUE</span><span class="basic-cd"></span>
      </button>
    </div>
  </div>

  <div class="hint fighter-hint">JOYSTICK ← → mover • ↑ pular • ATAQUE para golpear • A/B habilidades • C ultimate</div>
  <div class="overlay hidden" id="overlay"><h1 id="overlayTitle">JUGO VENCEU</h1><p>TOQUE PARA NOVA LUTA</p></div>
</main>`;

const canvas=document.querySelector("#game"),ctx=canvas.getContext("2d");
const joystick=document.querySelector("#joystick"),knob=document.querySelector("#joystickKnob");
const basic=document.querySelector("#basicAttack"),overlay=document.querySelector("#overlay");
const playerHp=document.querySelector("#playerHp"),enemyHp=document.querySelector("#enemyHp");
const roundText=document.querySelector("#roundText"),fightMessage=document.querySelector("#fightMessage");
const btn={};document.querySelectorAll(".skill").forEach(b=>btn[b.dataset.skill]=b);

const TAU=Math.PI*2,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t;
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const IMG={jugo:new Image(),ult:new Image(),enemy:new Image(),creature:new Image(),archer:new Image()};
IMG.jugo.src=jugoSideUrl;IMG.ult.src=jugoUltUrl;IMG.enemy=IMG.archer;IMG.archer.src=archerUrl;IMG.creature.src=creatureUrl;

let W=0,H=0,dpr=1;
function resize(){dpr=Math.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;canvas.width=W*dpr;canvas.height=H*dpr;canvas.style.width=W+"px";canvas.style.height=H+"px";ctx.setTransform(dpr,0,0,dpr,0,0);}

function updateOrientationHint(){
  const hint=document.querySelector("#orientationHint");
  if(!hint)return;
  const portrait=innerHeight>innerWidth;
  hint.classList.toggle("show",portrait);
}

addEventListener("resize",()=>{resize();updateOrientationHint();});resize();updateOrientationHint();

const FLOOR=H=>H*.79;
const MAX_HP=1000, ENEMY_MAX_HP=1000;
const CD={A:6,B:7,C:18};
let player,enemy,projectiles,effects,cds,time=0,joyId=null,round=1,ended=false;
const input={x:0,y:0,keys:new Set()};

function reset(){
  player={x:-5,y:0,vx:0,vy:0,facing:1,hp:MAX_HP,atk:0,hit:0,anim:0,ult:0,inv:0,stun:0,alive:true};
  enemy={x:5,y:0,vx:0,vy:0,facing:-1,hp:ENEMY_MAX_HP,atk:0,hit:0,anim:0,ai:0,shoot:0,arrowHits:0,stealth:0,stealthCd:0,ultCd:7,alive:true};
  projectiles=[];effects=[];cds={A:0,B:0,C:0};ended=false;
  overlay.classList.add("hidden");roundText.textContent="ROUND "+round;fightMessage.textContent="JUGO";fightMessage.classList.remove("show");
  input.x=0;input.y=0;knob.style.transform="translate(-50%,-50%)";
}

reset();

function joystickMove(x,y){const r=joystick.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,max=r.width*.32;let dx=x-cx,dy=y-cy,l=Math.hypot(dx,dy)||1;l=Math.min(l,max);dx=dx/l*Math.min(Math.hypot(x-cx,y-cy),max);dy=dy/l*Math.min(Math.hypot(x-cx,y-cy),max);input.x=clamp(dx/max,-1,1);input.y=clamp(dy/max,-1,1);knob.style.transform=`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px))`;}
function resetJoy(){input.x=0;input.y=0;joyId=null;knob.style.transform="translate(-50%,-50%)";}
joystick.addEventListener("pointerdown",e=>{e.preventDefault();joyId=e.pointerId;joystick.setPointerCapture(e.pointerId);joystickMove(e.clientX,e.clientY);});
joystick.addEventListener("pointermove",e=>{if(e.pointerId===joyId)joystickMove(e.clientX,e.clientY);});
joystick.addEventListener("pointerup",resetJoy);joystick.addEventListener("pointercancel",resetJoy);

addEventListener("keydown",e=>{const k=e.key.toLowerCase();input.keys.add(k);if(e.repeat)return;if(k==="j"||k==="1")cast("A");if(k==="k"||k==="2")cast("B");if(k==="l"||k==="3")cast("C");if(k===" "||k==="enter")basicAttack();if(k==="r"&&ended)reset();});
addEventListener("keyup",e=>input.keys.delete(e.key.toLowerCase()));

function isNear(){return Math.abs(player.x-enemy.x)<2.15&&Math.abs(player.y-enemy.y)<2.4;}
function faceOpponent(){player.facing=enemy.x>=player.x?1:-1;}
function damageEnemy(amount,knock=0){if(!enemy.alive)return;enemy.hp=Math.max(0,enemy.hp-amount);enemy.hit=.16;enemy.vx=knock;if(enemy.hp<=0){enemy.alive=false;finish(true);}}
function damagePlayer(amount,knock=0){if(!player.alive||player.inv>0)return;player.hp=Math.max(0,player.hp-amount);player.hit=.18;player.vx=knock;if(player.hp<=0){player.alive=false;finish(false);}}

function basicAttack(){
 if(ended||!player.alive||player.atk>0||player.stun>0)return;
 faceOpponent();player.atk=.38;player.anim=.32;
 if(isNear()){damageEnemy(player.ult>0?150:55,player.facing*5);effects.push({type:"slash",x:player.x+player.facing*1.15,y:1.1,life:.22,max:.22,flip:player.facing});}
}
basic.addEventListener("pointerdown",e=>{e.preventDefault();e.stopPropagation();basicAttack();});

function cast(k){
 if(ended||!player.alive)return;
 if(k==="C"){if(cds.C<=0){player.ult=8;cds.C=CD.C;player.inv=.35;effects.push({type:"burst",x:player.x,y:1,life:.6,max:.6});}return;}
 if(cds[k]>0)return;
 faceOpponent();
 if(k==="A"){cds.A=CD.A;projectiles.push({type:"creature",x:player.x+player.facing*1.2,y:0,vx:player.facing*7,life:1.6});}
 if(k==="B"){cds.B=CD.B;for(let i=0;i<6;i++)projectiles.push({type:"orb",x:player.x+player.facing*.8,y:.8+(i%3)*.22,vx:player.facing*(7+i*.35),life:1.25,dy:(i-2.5)*.42});}
}
Object.entries(btn).forEach(([k,b])=>b.addEventListener("pointerdown",e=>{e.preventDefault();e.stopPropagation();b.classList.add("pressed");cast(k);setTimeout(()=>b.classList.remove("pressed"),100);}));
overlay.addEventListener("pointerdown",()=>{if(ended){round++;reset();}});

function finish(win){if(ended)return;ended=true;fightMessage.textContent=win?"K.O.":"DERROTA";fightMessage.classList.add("show");setTimeout(()=>{document.querySelector("#overlayTitle").textContent=win?"JUGO VENCEU":"JUGO PERDEU";overlay.classList.remove("hidden");},500);}

function update(dt){
 time+=dt;
 if(ended){updateHud();return;}
 for(const k of Object.keys(cds))cds[k]=Math.max(0,cds[k]-dt);
 player.atk=Math.max(0,player.atk-dt);player.hit=Math.max(0,player.hit-dt);player.inv=Math.max(0,player.inv-dt);player.stun=Math.max(0,player.stun-dt);
 enemy.atk=Math.max(0,enemy.atk-dt);enemy.hit=Math.max(0,enemy.hit-dt);
 const left=input.keys.has("a")||input.keys.has("arrowleft"),right=input.keys.has("d")||input.keys.has("arrowright"),up=input.keys.has("w")||input.keys.has("arrowup");
 const move=clamp(input.x+(right?1:0)-(left?1:0),-1,1);
 player.vx=player.stun>0?player.vx:move*6.2;
 if(player.stun<=0&&(input.y<-.45||up)&&Math.abs(player.y)<.02){player.vy=8.5;}
 player.vy-=22*dt;player.y=Math.max(0,player.y+player.vy*dt);
 player.x=clamp(player.x+player.vx*dt,-9.2,9.2);
 if(Math.abs(player.vx)>.1&&player.stun<=0)player.facing=player.vx>0?1:-1;
 player.anim+=dt*(Math.abs(player.vx)*1.8+2);

 const dx=player.x-enemy.x;
 enemy.facing=dx>=0?1:-1;
 enemy.ai+=dt;
 enemy.shoot=Math.max(0,enemy.shoot-dt);
 enemy.stealth=Math.max(0,enemy.stealth-dt);
 enemy.stealthCd=Math.max(0,enemy.stealthCd-dt);
 enemy.ultCd=Math.max(0,enemy.ultCd-dt);

 const distance=Math.abs(dx);

 // DUAS LINHAS INVISÍVEIS DE DEFESA DO ARQUEIRO.
 // Linha 1: se Jugo entra aqui, o arqueiro tenta disparar a ultimate.
 // Linha 2: se Jugo passa ainda mais perto, o arqueiro fica invisível e foge.
 const ULT_LINE=11.5;
 const STEALTH_LINE=6.5;

 // O arqueiro sempre procura o ponto MAIS DISTANTE do Jugo.
 // Não existe "voltar para onde estava": a referência é sempre a posição atual do Jugo.
 const leftDistance=Math.abs(player.x-(-9.2));
 const rightDistance=Math.abs(player.x-9.2);
 const farthestCorner=leftDistance>rightDistance?-9.2:9.2;

 if(enemy.stealth>0){
   // Invisível: corrida contínua até o canto mais distante do Jugo.
   enemy.vx=clamp((farthestCorner-enemy.x)*4.5,-8.5,8.5);
   enemy.x=clamp(enemy.x+enemy.vx*dt,-9.2,9.2);
   enemy.anim+=dt*(Math.abs(enemy.vx)*1.8+2);
 }else{
   // Mesmo sem estar invisível, ele se posiciona no extremo mais distante possível.
   if(Math.abs(enemy.x-farthestCorner)>.18){
     enemy.vx=clamp((farthestCorner-enemy.x)*3.2,-7.0,7.0);
   }else{
     enemy.vx=0;
   }

   // Linha 2: Jugo chegou perto demais -> invisibilidade + fuga imediata.
   if(distance<=STEALTH_LINE&&enemy.stealthCd<=0){
     enemy.stealth=2.2;
     enemy.stealthCd=8.0;
     enemy.vx=enemy.x<player.x?-8.5:8.5;
     effects.push({type:"stealth",x:enemy.x,y:1.4,life:.55,max:.55,enemy:true});
   }

   enemy.x=clamp(enemy.x+enemy.vx*dt,-9.2,9.2);
   enemy.anim+=dt*(Math.abs(enemy.vx)*1.8+2);
 }

 // Linha 1: ultimate. O arqueiro só prepara esse disparo quando o Jugo
 // cruza a faixa de segurança, mas ainda não chegou na zona de invisibilidade.
 if(enemy.stealth<=0&&distance<=ULT_LINE&&distance>STEALTH_LINE&&enemy.ultCd<=0){
   enemy.ultCd=20;
   enemy.atk=.8;
   enemy.anim=.65;
   const arrowY=1.25;
   const speed=14.5;
   projectiles.push({type:"ultArrow",x:enemy.x+enemy.facing*1.4,y:arrowY,vx:enemy.facing*speed,vy:0,life:2.0,owner:"enemy"});
   effects.push({type:"ultShot",x:enemy.x+enemy.facing*1.0,y:1.25,life:.45,max:.45,enemy:true});
 }else if(enemy.stealth<=0&&distance>STEALTH_LINE&&enemy.shoot<=0){
   enemy.shoot=1.35;
   enemy.atk=.48;
   enemy.anim=.45;
   const pattern=enemy.arrowHits%3;
   const arrowY=pattern===0?1.05:pattern===1?1.45:2.0;
   const speed=12.5;
   projectiles.push({
     type:"arrow",
     x:enemy.x+enemy.facing*1.15,
     y:arrowY,
     vx:enemy.facing*speed,
     vy:0,
     life:1.8,
     owner:"enemy"
   });
   effects.push({type:"bowshot",x:enemy.x+enemy.facing*.9,y:arrowY,life:.16,max:.16,flip:enemy.facing,enemy:true});
 }

 // O arqueiro não procura corpo a corpo. Se for alcançado, sua resposta é fugir/invisibilidade.

 for(let i=projectiles.length-1;i>=0;i--){
  const p=projectiles[i];
  p.x+=p.vx*dt;
  p.y+=(p.vy||p.dy||0)*dt;
  p.life-=dt;

  if(p.type==="arrow"&&Math.abs(p.x-player.x)<.85&&p.y>=player.y-.35&&p.y<=player.y+3.0){
    enemy.arrowHits++;
    const knockUp=enemy.arrowHits%2===0;
    // O impacto sempre empurra o Jugo PARA LONGE da flecha, nunca em direção ao arqueiro.
    damagePlayer(player.ult>0?22:38,Math.sign(p.vx)*(knockUp?6.5:2.2));
    if(knockUp&&player.alive){
      player.vy=9.5;
      player.hit=.28;
      effects.push({type:"knockup",x:player.x,y:player.y+1.1,life:.42,max:.42});
    }else{
      effects.push({type:"hit",x:p.x,y:p.y,life:.2,max:.2});
    }
    p.life=0;
  }

  if(p.type==="ultArrow"&&Math.abs(p.x-player.x)<1.35&&p.y>=player.y-.45&&p.y<=player.y+3.25){
    damagePlayer(player.ult>0?30:55,Math.sign(p.vx)*7);
    if(player.alive){
      player.stun=2.8;
      player.vx=Math.sign(p.vx)*7;
      player.vy=7.5;
      effects.push({type:"stun",x:player.x,y:player.y+1.2,life:2.8,max:2.8});
    }
    p.life=0;
  }

  if(p.type==="orb"&&Math.abs(p.x-enemy.x)<1.0&&p.y>=enemy.y-.45&&p.y<=enemy.y+3.0){damageEnemy(player.ult>0?45:18,player.facing*1.5);p.life=0;effects.push({type:"hit",x:p.x,y:p.y,life:.2,max:.2});}
  if(p.type==="creature"&&Math.abs(p.x-enemy.x)<1.15&&p.y>=enemy.y-.45&&p.y<=enemy.y+3.1){damageEnemy(player.ult>0?95:50,player.facing*4);p.life=0;effects.push({type:"hit",x:p.x,y:1,life:.3,max:.3});}
  if(p.life<=0||Math.abs(p.x)>12||p.y<-1||p.y>4)projectiles.splice(i,1);
 }
 for(let i=effects.length-1;i>=0;i--){effects[i].life-=dt;if(effects[i].life<=0)effects.splice(i,1);}
 updateHud();
}

function drawBackground(){
 const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,"#09071a");g.addColorStop(.55,"#18113a");g.addColorStop(1,"#30152e");ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
 const horizon=H*.58;ctx.fillStyle="rgba(110,80,190,.14)";ctx.fillRect(0,horizon,W,H*.22);
 for(let i=0;i<12;i++){const x=i*W/11;ctx.fillStyle="rgba(190,130,255,.08)";ctx.fillRect(x,horizon-80-(i%3)*25,18+(i%4)*20,80+(i%3)*25);}
 const floorY=H*.78;ctx.fillStyle="#100d1f";ctx.fillRect(0,floorY,W,H-floorY);
 ctx.strokeStyle="rgba(150,130,220,.18)";ctx.lineWidth=1;
 for(let i=-8;i<=8;i++){const x=W/2+i*W/9;ctx.beginPath();ctx.moveTo(W/2+(x-W/2)*.25,floorY);ctx.lineTo(x,H);ctx.stroke();}
 for(let i=0;i<6;i++){const y=floorY+i*(H-floorY)/6;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
 ctx.fillStyle="rgba(255,190,100,.08)";ctx.fillRect(W*.05,floorY-3,W*.9,6);
}
function sprite(img,x,y,h,flip=1,alpha=1,filter="none"){
 if(!img.complete||!img.naturalWidth)return;
 const w=h*img.naturalWidth/img.naturalHeight;ctx.save();ctx.translate(x,y);ctx.scale(flip,1);ctx.globalAlpha=alpha;ctx.filter=filter;ctx.drawImage(img,-w/2,-h,w,h);ctx.restore();
}
const worldX=x=>W/2+x*W*(W>=H?.035:.065);
function fighterDraw(f,img,h,flip){
 const ground=H*.78;
  // Na horizontal, a altura da tela controla o tamanho do lutador.
  const landscape=W>=H;
  const scale=landscape?clamp(H/600,.38,.52):Math.min(W/520,.68);
  const x=worldX(f.x),y=ground-f.y*H*.075;
 const moving=Math.abs(f.vx)>.1, bob=moving?Math.abs(Math.sin(f.anim*5))*.025:Math.sin(time*2.5)*.012;
 const alpha=f===enemy&&enemy.stealth>0?.10:1;
 sprite(img,x,y-bob*H,h*scale,flip,alpha,f.hit>0?"brightness(2) saturate(.5)":"none");
}
function draw(){
 drawBackground();
 const floorY=H*.78;
 // shadows
 for(const f of [player,enemy]){const x=worldX(f.x);ctx.fillStyle="rgba(0,0,0,.42)";ctx.beginPath();ctx.ellipse(x,floorY+3,45,10,0,0,TAU);ctx.fill();}
 // projectiles behind fighters
 for(const p of projectiles){
   const x=worldX(p.x),y=floorY-p.y*H*.075;
   if(p.type==="creature"){
     sprite(IMG.creature,x,y-10,72,player.facing);
   }else if(p.type==="arrow"){
     const angle=Math.atan2(-(p.vy||0),p.vx);
     ctx.save();ctx.translate(x,y-4);ctx.rotate(angle);
     ctx.globalCompositeOperation="lighter";
     ctx.strokeStyle="rgba(255,220,150,.3)";ctx.lineWidth=8;
     ctx.beginPath();ctx.moveTo(-30,0);ctx.lineTo(12,0);ctx.stroke();
     ctx.globalCompositeOperation="source-over";
     ctx.strokeStyle="#f4d08a";ctx.lineWidth=4;
     ctx.beginPath();ctx.moveTo(-28,0);ctx.lineTo(12,0);ctx.stroke();
     ctx.fillStyle="#fff0bd";
     ctx.beginPath();ctx.moveTo(18,0);ctx.lineTo(7,-7);ctx.lineTo(9,0);ctx.lineTo(7,7);ctx.closePath();ctx.fill();
     ctx.strokeStyle="#d89a55";ctx.lineWidth=2;
     ctx.beginPath();ctx.moveTo(-28,0);ctx.lineTo(-38,-6);ctx.moveTo(-28,0);ctx.lineTo(-38,6);ctx.stroke();
     ctx.restore();
   }else if(p.type==="ultArrow"){
     const angle=Math.atan2(-(p.vy||0),p.vx);
     ctx.save();ctx.translate(x,y-4);ctx.rotate(angle);ctx.globalCompositeOperation="lighter";
     ctx.strokeStyle="rgba(255,80,80,.28)";ctx.lineWidth=22;
     ctx.beginPath();ctx.moveTo(-70,0);ctx.lineTo(42,0);ctx.stroke();
     ctx.globalCompositeOperation="source-over";
     ctx.strokeStyle="#ff6b58";ctx.lineWidth=11;
     ctx.beginPath();ctx.moveTo(-68,0);ctx.lineTo(42,0);ctx.stroke();
     ctx.fillStyle="#fff1d0";
     ctx.beginPath();ctx.moveTo(60,0);ctx.lineTo(34,-18);ctx.lineTo(39,0);ctx.lineTo(34,18);ctx.closePath();ctx.fill();
     ctx.strokeStyle="#d94c48";ctx.lineWidth=5;
     ctx.beginPath();ctx.moveTo(-62,0);ctx.lineTo(-86,-15);ctx.moveTo(-62,0);ctx.lineTo(-86,15);ctx.stroke();
     ctx.restore();
   }else{
     ctx.fillStyle="rgba(90,190,255,.25)";ctx.beginPath();ctx.arc(x,y-20,22,0,TAU);ctx.fill();
     ctx.fillStyle="#75d8ff";ctx.beginPath();ctx.arc(x,y-20,8,0,TAU);ctx.fill();
   }
 }
 for(const e of effects){
   const x=worldX(e.x),y=floorY-e.y*H*.075,k=e.life/e.max;
   if(e.type==="knockup"){
     ctx.save();ctx.translate(x,y);ctx.globalCompositeOperation="lighter";
     ctx.strokeStyle=`rgba(255,220,120,${k*.9})`;ctx.lineWidth=5;
     ctx.beginPath();ctx.arc(0,0,34+26*(1-k),0,TAU);ctx.stroke();
     ctx.strokeStyle=`rgba(255,255,255,${k})`;ctx.lineWidth=3;
     ctx.beginPath();ctx.moveTo(-20,18);ctx.lineTo(-34,-4);ctx.moveTo(20,18);ctx.lineTo(34,-4);ctx.stroke();
     ctx.restore();
   }
 }
 if(player.x<enemy.x){fighterDraw(player,player.ult>0?IMG.ult:IMG.jugo,player.ult>0?330:285,1);fighterDraw(enemy,IMG.archer,270,-1);}
 else{fighterDraw(enemy,IMG.archer,270,1);fighterDraw(player,player.ult>0?IMG.ult:IMG.jugo,player.ult>0?330:285,-1);}
 for(const e of effects){const x=worldX(e.x),y=floorY-e.y*H*.075;const k=e.life/e.max;if(e.type==="slash"){ctx.save();ctx.translate(x,y);ctx.scale(e.flip,1);ctx.globalCompositeOperation="lighter";ctx.strokeStyle=e.enemy?"rgba(255,100,90,.9)":"rgba(130,220,255,.95)";ctx.lineWidth=8*k;ctx.beginPath();ctx.arc(0,0,65*(1-k)+35,-1.1,1.0);ctx.stroke();ctx.restore();}else if(e.type==="hit"){ctx.fillStyle=`rgba(255,230,170,${k})`;ctx.beginPath();ctx.arc(x,y,45*(1-k)+8,0,TAU);ctx.fill();}else if(e.type==="stealth"){ctx.strokeStyle=`rgba(150,220,255,${k*.7})`;ctx.lineWidth=5;ctx.beginPath();ctx.arc(x,y,40+50*(1-k),0,TAU);ctx.stroke();}else if(e.type==="stun"){ctx.save();ctx.translate(x,y);ctx.globalCompositeOperation="lighter";ctx.strokeStyle=`rgba(255,220,80,${k})`;ctx.lineWidth=5;ctx.beginPath();ctx.arc(0,0,38+12*Math.sin(time*10),0,TAU);ctx.stroke();ctx.fillStyle=`rgba(255,245,170,${k})`;ctx.font="bold 28px sans-serif";ctx.textAlign="center";ctx.fillText("STUN",0,-35);ctx.restore();}else{ctx.fillStyle=`rgba(255,210,130,${k*.5})`;ctx.beginPath();ctx.arc(x,y,120*(1-k)+10,0,TAU);ctx.fill();}}
 // center line
 ctx.strokeStyle="rgba(255,220,150,.25)";ctx.setLineDash([8,10]);ctx.beginPath();ctx.moveTo(W/2,floorY-15);ctx.lineTo(W/2,floorY+10);ctx.stroke();ctx.setLineDash([]);
}
function updateHud(){
 playerHp.style.width=(player.hp/MAX_HP*100)+"%";enemyHp.style.width=(enemy.hp/ENEMY_MAX_HP*100)+"%";
 for(const k of ["A","B","C"]){const b=btn[k];const left=cds[k];b.querySelector(".cd").style.setProperty("--cd",clamp(left/(k==="C"?CD.C:CD[k]),0,1));b.querySelector(".cdt").textContent=left>0?Math.ceil(left):"";}
 basic.querySelector(".basic-cd").style.setProperty("--basic-cd",clamp(player.atk/.38,0,1));
 roundText.textContent=player.ult>0?"FORMA ULTIMATE":"ROUND "+round;
}
let last=performance.now();
function loop(now){const dt=Math.min(.033,(now-last)/1000);last=now;update(dt);draw();requestAnimationFrame(loop);}
requestAnimationFrame(loop);