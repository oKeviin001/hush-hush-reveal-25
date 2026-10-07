import "./style.css";
import jugoSideUrl from "./assets/jugo-side.png";
import jugoUltUrl from "./assets/jugo-ult.png";
import archerUrl from "./assets/archer.png";
import knightUrl from "./assets/knight.png";
import creatureUrl from "./assets/creature.png";
import ecronixUrl from "./assets/ecronix.svg";
import kairaUrl from "./assets/kaira.svg";

const app = document.querySelector("#app");
app.innerHTML = `
<main class="game-shell fighter-shell">
  <section class="menu-screen intro-screen" id="introScreen">
    <div class="veil-mark">Ø</div><div class="veil-title">VEILØRIS</div>
    <div class="veil-subtitle">UM PROJETO KEVIN'S</div><div class="intro-line"></div>
  </section>
  <section class="menu-screen main-menu hidden" id="mainMenu">
    <div class="menu-brand">VEILØRIS</div><div class="menu-kicker">TEST BUILD</div>
    <button class="menu-button locked" disabled>JOGAR <span>EM BREVE</span></button>
    <button class="menu-button primary" id="testButton">TESTAR</button>
    <div class="menu-version">PROTÓTIPO DE COMBATE • 01</div>
  </section>
  <section class="menu-screen select-screen hidden" id="characterSelect">
    <div class="select-top"><span>VEILØRIS</span><b>ESCOLHA SEU PERSONAGEM</b></div>
    <div class="selection-grid">
      <button class="character-card selected" data-character="jugo"><div class="character-art"><img src="${jugoSideUrl}" alt="Jugo"></div><strong>JUGO</strong><small>DISPONÍVEL</small></button>
      <button class="character-card" data-character="ecronix"><div class="character-art"><img src="${ecronixUrl}" alt="Ecronix"></div><strong>ECRONIX</strong><small>DISPONÍVEL</small></button>
      <button class="character-card" data-character="kaira"><div class="character-art"><img src="${kairaUrl}" alt="Kaira"></div><strong>KAIRA</strong><small>DISPONÍVEL</small></button>
      <button class="character-card locked" disabled><div class="question">?</div><strong>DESCONHECIDO</strong><small>BLOQUEADO</small></button>
      <button class="character-card locked" disabled><div class="question">?</div><strong>DESCONHECIDO</strong><small>BLOQUEADO</small></button>
      <button class="character-card locked" disabled><div class="question">?</div><strong>DESCONHECIDO</strong><small>BLOQUEADO</small></button>
    </div>
    <button class="select-confirm" id="characterConfirm">CONTINUAR</button>
  </section>
  <section class="menu-screen select-screen hidden" id="opponentSelect">
    <div class="select-top"><span>VEILØRIS</span><b>ESCOLHA O OPONENTE</b></div>
    <div class="opponent-grid">
      <button class="character-card selected" data-opponent="archer"><div class="character-art"><img src="${archerUrl}" alt="Arqueiro"></div><strong>ARQUEIRO</strong><small>DISPONÍVEL</small></button>
      <button class="character-card" data-opponent="ecronix"><div class="character-art"><img src="${ecronixUrl}" alt="Ecronix"></div><strong>ECRONIX</strong><small>DISPONÍVEL</small></button>
      <button class="character-card" data-opponent="kaira"><div class="character-art"><img src="${kairaUrl}" alt="Kaira"></div><strong>KAIRA</strong><small>DISPONÍVEL</small></button>
    </div>
    <button class="select-confirm" id="opponentConfirm">CONTINUAR</button>
  </section>
  <div class="ult-choice hidden" id="ultChoice">
  <div class="ult-choice-title">A IA ESTÁ ESCOLHENDO...</div>
</div>
<div class="game-layer hidden" id="gameLayer">
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

  <div class="fight-message" id="fightMessage">JUGO VS ARQUEIRO</div>

  <div class="orientation-hint" id="orientationHint">RECOMENDADO: JOGUE NA HORIZONTAL<br><span>Você também pode jogar na vertical.</span></div>
  <div class="arena-banner" id="arenaBanner"><span>MAPA 01</span><b>DISTRITO ZERO</b></div>

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
  </div>
</main>`;

const ultChoice=document.querySelector("#ultChoice");
const introScreen=document.querySelector("#introScreen"),mainMenu=document.querySelector("#mainMenu"),characterSelect=document.querySelector("#characterSelect"),opponentSelect=document.querySelector("#opponentSelect"),gameLayer=document.querySelector("#gameLayer"),testButton=document.querySelector("#testButton"),characterConfirm=document.querySelector("#characterConfirm"),opponentConfirm=document.querySelector("#opponentConfirm");
let screen="intro";
function showScreen(next){screen=next;[introScreen,mainMenu,characterSelect,opponentSelect,gameLayer].forEach(el=>el.classList.add("hidden"));const target={intro:introScreen,menu:mainMenu,characters:characterSelect,opponents:opponentSelect,game:gameLayer}[next];if(target)target.classList.remove("hidden");}
setTimeout(()=>showScreen("menu"),1900);

function menuAction(button,action){
  if(!button)return;
  button.addEventListener("pointerup",(event)=>{
    event.preventDefault();
    event.stopPropagation();
    action();
  });
}
menuAction(testButton,()=>showScreen("characters"));
menuAction(characterConfirm,()=>showScreen("opponents"));
menuAction(opponentConfirm,()=>{showScreen("game");reset();});

const canvas=document.querySelector("#game"),ctx=canvas.getContext("2d");
const joystick=document.querySelector("#joystick"),knob=document.querySelector("#joystickKnob");
const basic=document.querySelector("#basicAttack"),overlay=document.querySelector("#overlay");
const playerHp=document.querySelector("#playerHp"),enemyHp=document.querySelector("#enemyHp");
const roundText=document.querySelector("#roundText"),fightMessage=document.querySelector("#fightMessage");
const btn={};document.querySelectorAll(".skill").forEach(b=>btn[b.dataset.skill]=b);

const TAU=Math.PI*2,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t;
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const IMG={jugo:new Image(),ult:new Image(),enemy:new Image(),creature:new Image(),archer:new Image(),ecronix:new Image(),kaira:new Image()};
IMG.jugo.src=jugoSideUrl;IMG.ult.src=jugoUltUrl;IMG.enemy=IMG.archer;IMG.archer.src=archerUrl;IMG.creature.src=creatureUrl;IMG.ecronix.src=ecronixUrl;IMG.kaira.src=kairaUrl;
const CHAR_NAME={jugo:"JUGO",archer:"ARQUEIRO",ecronix:"ECRONIX",kaira:"KAIRA"};
let selectedCharacter="jugo",selectedOpponent="archer";
function setupSelection(){
 document.querySelectorAll("[data-character]").forEach(card=>card.addEventListener("pointerup",e=>{e.preventDefault();document.querySelectorAll("[data-character]").forEach(x=>x.classList.remove("selected"));card.classList.add("selected");selectedCharacter=card.dataset.character;}));
 document.querySelectorAll("[data-opponent]").forEach(card=>card.addEventListener("pointerup",e=>{e.preventDefault();document.querySelectorAll("[data-opponent]").forEach(x=>x.classList.remove("selected"));card.classList.add("selected");selectedOpponent=card.dataset.opponent;opponentConfirm.textContent="TESTAR CONTRA O "+CHAR_NAME[selectedOpponent];}));
}
setupSelection();

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
let player,enemy,projectiles,effects,cds,time=0,joyId=null,round=1,ended=false,cameraX=0;
const input={x:0,y:0,keys:new Set()};

function reset(){
  player={kind:selectedCharacter,x:-5,y:0,vx:0,vy:0,facing:1,hp:MAX_HP,atk:0,hit:0,anim:0,ult:0,form:"human",inv:0,stun:0,alive:true};
  enemy={kind:selectedOpponent,x:5,y:0,vx:0,vy:0,facing:-1,hp:ENEMY_MAX_HP,atk:0,hit:0,anim:0,ai:0,shoot:0,arrowHits:0,stealth:0,stealthCd:0,ultCd:7,alive:true,ultChoiceOpen:false,ultChoicePending:false,ultChoiceDone:false,ultChoiceTimer:0,ultChoiceIndex:0,ultFollowup:"",ultFollowCount:0,ultFollowTimer:0,ultBActive:false,form:"human"};
  projectiles=[];effects=[];cds={A:0,B:0,C:0};ended=false;cameraX=0;
  overlay.classList.add("hidden");roundText.textContent="ROUND "+round;fightMessage.textContent=CHAR_NAME[player.kind]+" VS "+CHAR_NAME[enemy.kind];fightMessage.classList.remove("show");
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
function damagePlayer(amount,knock=0){if(!player.alive||player.inv>0)return;player.hp=Math.max(0,player.hp-amount);player.hit=.18;player.vx=knock;if(player.hp<=0){player.alive=false;enemy.ultBActive=false;finish(false);}}

function basicAttack(){
 if(ended||!player.alive||player.atk>0||player.stun>0)return;
 faceOpponent();player.atk=.38;player.anim=.32;
 const dmg=player.kind==="ecronix"?(player.ult>0?175:70):player.kind==="kaira"?(player.ult>0?155:60):(player.ult>0?150:55);
 if(isNear()){damageEnemy(dmg,player.facing*(player.kind==="ecronix"?6:5));effects.push({type:"slash",x:player.x+player.facing*1.15,y:1.1,life:.22,max:.22,flip:player.facing,kind:player.kind});}
}
basic.addEventListener("pointerdown",e=>{e.preventDefault();e.stopPropagation();basicAttack();});

function cast(k){
 if(ended||!player.alive||player.stun>0||cds[k]>0)return;
 faceOpponent();
 if(player.kind==="jugo"){
  if(k==="A"){cds.A=CD.A;player.vx=player.facing*12;player.x=clamp(player.x+player.facing*2.2,-17,17);if(isNear())damageEnemy(player.ult>0?190:105,player.facing*7);effects.push({type:"jugoLance",x:player.x,y:1.1,life:.32,max:.32,flip:player.facing});}
  else if(k==="B"){cds.B=CD.B;for(let i=0;i<6;i++)projectiles.push({type:"jugoOrb",x:player.x+player.facing*.9,y:.7+(i%3)*.32,vx:player.facing*(7.5+i*.25),vy:(i-2.5)*.18,life:2.2,owner:"player",index:i});}
  else if(k==="C"){cds.C=CD.C;player.ult=4.8;player.inv=.5;effects.push({type:"jugoCollapse",x:enemy.x,y:1.2,life:1,max:1});damageEnemy(170,player.facing*8);}
 }else if(player.kind==="ecronix"){
  if(k==="A"){cds.A=CD.A;player.vx=player.facing*11;player.x=clamp(player.x+player.facing*2.5,-17,17);if(isNear())damageEnemy(player.ult>0?210:120,player.facing*8);effects.push({type:"ecronixClaw",x:player.x,y:1.1,life:.35,max:.35,flip:player.facing});}
  else if(k==="B"){cds.B=CD.B;for(let i=0;i<3;i++)projectiles.push({type:"chaosOrb",x:player.x+player.facing,y:1+i*.35,vx:player.facing*(8+i),vy:(i-1)*.45,life:2.2,owner:"player"});}
  else if(k==="C"){cds.C=CD.C;player.ult=5.5;player.form="final";player.inv=.55;if(isNear())damageEnemy(230,player.facing*9);effects.push({type:"ecronixFinal",x:player.x,y:1.2,life:.8,max:.8});}
 }else if(player.kind==="kaira"){
  if(k==="A"){cds.A=CD.A;player.vx=player.facing*10;player.x=clamp(player.x+player.facing*2,-17,17);if(isNear())damageEnemy(player.ult>0?180:105,player.facing*6);effects.push({type:"kairaClaw",x:player.x,y:1.15,life:.3,max:.3,flip:player.facing});}
  else if(k==="B"){cds.B=CD.B;projectiles.push({type:"kairaShot",x:player.x+player.facing,y:1.55,vx:player.facing*16,vy:0,life:1.5,owner:"player"});}
  else if(k==="C"){cds.C=CD.C;player.ult=5.2;player.form="beast";player.inv=.5;player.x=clamp(player.x+player.facing*1.6,-17,17);if(isNear())damageEnemy(240,player.facing*10);effects.push({type:"kairaUltimate",x:player.x,y:1.1,life:1,max:1});}
 }
}
Object.entries(btn).forEach(([k,b])=>b.addEventListener("pointerdown",e=>{e.preventDefault();e.stopPropagation();b.classList.add("pressed");cast(k);setTimeout(()=>b.classList.remove("pressed"),100);}));
function updateSkillLabels(){
 const labels={jugo:["LANÇA","ÓRBITA","COLAPSO"],ecronix:["GARRAS","CAOS","FORMA FINAL"],kaira:["LANÇA","RIFLE","CAÇADORA"]}[player?.kind||"jugo"];
 ["A","B","C"].forEach((k,i)=>btn[k].querySelector(".lbl").textContent=labels[i]);
 document.querySelector(".player-card .fighter-name").textContent=CHAR_NAME[player?.kind||"jugo"];
 document.querySelector(".enemy-card .fighter-name").textContent=CHAR_NAME[enemy?.kind||"archer"];
}
overlay.addEventListener("pointerdown",()=>{if(ended){round++;reset();}});

function finish(win){if(ended)return;ended=true;const winner=CHAR_NAME[win?player.kind:enemy.kind]||"PERSONAGEM";fightMessage.textContent=win?"K.O.":"DERROTA";fightMessage.classList.add("show");setTimeout(()=>{document.querySelector("#overlayTitle").textContent=winner+" VENCEU";overlay.classList.remove("hidden");},500);}


function openArcherUltimateChoice(){
  // A IA alterna as duas opções a cada Ultimate.
  // A primeira é A; na próxima Ultimate será B; depois A novamente.
  enemy.ultChoiceOpen=false;
  enemy.ultChoicePending=false;
  enemy.ultChoiceDone=true;
  enemy.ultChoiceIndex=1-enemy.ultChoiceIndex;
  enemy.ultFollowup=enemy.ultChoiceIndex===0?"A":"B";
  enemy.ultFollowCount=0;
  enemy.ultFollowTimer=.12;
}
function chooseArcherUltimate(choice){
  // Mantido como fallback interno; o jogador não escolhe a Ultimate.
  enemy.ultChoiceDone=true;
  enemy.ultChoiceOpen=false;
  enemy.ultFollowup=choice;
  enemy.ultFollowCount=0;
  enemy.ultFollowTimer=.12;
}
function fireArcherFollowup(){
  if(enemy.ultFollowup==="A"&&enemy.ultFollowCount<5){
    projectiles.push({type:"ultFollowArrow",x:enemy.x+enemy.facing*1.2,y:1.35,vx:enemy.facing*13,vy:0,life:1.8,owner:"enemy"});
    enemy.ultFollowCount++;
    enemy.ultFollowTimer=.34;
  }else if(enemy.ultFollowup==="B"&&enemy.ultFollowCount===0){
    projectiles.push({type:"arrow",ultB:true,x:enemy.x+enemy.facing*1.2,y:1.35,vx:enemy.facing*10.5,vy:0,life:4.5,owner:"enemy",phase:"travel",split:false,explodeIn:0});
    enemy.ultFollowCount=1;
    enemy.ultBActive=true;
    enemy.ultFollowTimer=.2;
  }
}

function update(dt){
 time+=dt;
 if(ended){updateHud();return;}
 for(const k of Object.keys(cds))cds[k]=Math.max(0,cds[k]-dt);
 player.atk=Math.max(0,player.atk-dt);player.hit=Math.max(0,player.hit-dt);player.inv=Math.max(0,player.inv-dt);player.stun=Math.max(0,player.stun-dt);player.ult=Math.max(0,player.ult-dt); if(player.ult<=0&&(player.kind==="ecronix"||player.kind==="kaira"))player.form="human";
 enemy.atk=Math.max(0,enemy.atk-dt);enemy.hit=Math.max(0,enemy.hit-dt);
 const left=input.keys.has("a")||input.keys.has("arrowleft"),right=input.keys.has("d")||input.keys.has("arrowright"),up=input.keys.has("w")||input.keys.has("arrowup");
 const move=clamp(input.x+(right?1:0)-(left?1:0),-1,1);
 player.vx=player.stun>0?player.vx:move*6.2;
 if(player.stun<=0&&(input.y<-.45||up)&&Math.abs(player.y)<.02){player.vy=9.5;}
 player.vy-=22*dt;player.y=Math.max(0,player.y+player.vy*dt);
 if(enemy.ultChoicePending&&player.y<=.001&&player.vy<=0)openArcherUltimateChoice();
 player.x=clamp(player.x+player.vx*dt,-17,17);
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

 // Linhas de distância do mapa usadas pelo comportamento de longo alcance.
 const ULT_LINE=11.5;
 const STEALTH_LINE=6.5;

 // IA DOS NOVOS PERSONAGENS.
 if(enemy.kind==="archer"){
 // DUAS LINHAS INVISÍVEIS DE DEFESA DO ARQUEIRO.
 // Linha 1: se Jugo entra aqui, o arqueiro tenta disparar a ultimate.
 // Linha 2: se Jugo passa ainda mais perto, o arqueiro fica invisível e foge.
 // O arqueiro sempre procura o ponto MAIS DISTANTE do Jugo.
 // Não existe "voltar para onde estava": a referência é sempre a posição atual do Jugo.
 const leftDistance=Math.abs(player.x-(-17));
 const rightDistance=Math.abs(player.x-17);
 const farthestCorner=leftDistance>rightDistance?-17:17;

 if(enemy.stealth>0){
   // Invisível: corrida contínua até o canto mais distante do Jugo.
   enemy.vx=clamp((farthestCorner-enemy.x)*4.5,-8.5,8.5);
   enemy.x=clamp(enemy.x+enemy.vx*dt,-17,17);
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


 }else if(enemy.kind==="ecronix"){
   enemy.facing=dx>=0?1:-1;
   const close=distance<2.2;
   if(!close){
     enemy.vx=clamp(dx*1.5,-5.8,5.8);
     if(enemy.shoot<=0&&distance<7.5){
       enemy.shoot=.9;enemy.atk=.35;
       projectiles.push({type:"enemyChaosOrb",x:enemy.x+enemy.facing,y:1.1,vx:enemy.facing*8,vy:0,life:2,owner:"enemy"});
       effects.push({type:"bowshot",x:enemy.x+enemy.facing,y:1.1,life:.16,max:.16,enemy:true});
     }
   }else{
     enemy.vx=0;
     if(enemy.atk<=0){enemy.atk=.55;damagePlayer(65,enemy.facing*5);effects.push({type:"ecronixClaw",x:enemy.x+enemy.facing,y:1.1,life:.3,max:.3,flip:enemy.facing,enemy:true});}
   }
   if(enemy.ultCd<=0&&distance<6.5){
     enemy.ultCd=15;enemy.atk=.8;enemy.form="final";
     damagePlayer(150,enemy.facing*7);effects.push({type:"ecronixFinal",x:enemy.x,y:1.2,life:.8,max:.8,enemy:true});
   }
   enemy.x=clamp(enemy.x+enemy.vx*dt,-17,17);
   enemy.anim+=dt*(Math.abs(enemy.vx)*1.8+2);
 }else if(enemy.kind==="kaira"){
   enemy.facing=dx>=0?1:-1;
   const preferred=4.8;
   if(distance<2.4){
     enemy.vx=enemy.facing>0?-5.5:5.5;
     if(enemy.atk<=0){enemy.atk=.5;damagePlayer(60,enemy.facing*5);effects.push({type:"kairaClaw",x:enemy.x+enemy.facing,y:1.15,life:.3,max:.3,flip:enemy.facing,enemy:true});}
   }else if(distance>preferred+.9){
     enemy.vx=clamp(dx*1.7,-5.5,5.5);
   }else{
     enemy.vx=0;
     if(enemy.shoot<=0){
       enemy.shoot=1.15;enemy.atk=.35;
       projectiles.push({type:"enemyKairaShot",x:enemy.x+enemy.facing,y:1.55,vx:enemy.facing*15,vy:0,life:1.6,owner:"enemy"});
     }
   }
   if(enemy.ultCd<=0&&distance<8){
     enemy.ultCd=16;enemy.atk=.8;enemy.form="beast";
     enemy.x=clamp(enemy.x+enemy.facing*1.8,-17,17);
     damagePlayer(165,enemy.facing*8);effects.push({type:"kairaUltimate",x:enemy.x,y:1.1,life:1,max:1,enemy:true});
   }
   enemy.x=clamp(enemy.x+enemy.vx*dt,-17,17);
   enemy.anim+=dt*(Math.abs(enemy.vx)*1.8+2);
 } // A arena é maior que a tela. A câmera acompanha o meio dos dois lutadores
 // e para antes das extremidades do palco, como em um jogo de luta 2D.
 const landscape=W>=H;
 const worldScale=landscape?.04:.065;
 const halfView=1/(2*worldScale);
 const cameraLimit=17-halfView;
 const targetCamera=clamp((player.x+enemy.x)*.5,-cameraLimit,cameraLimit);
 cameraX+= (targetCamera-cameraX)*Math.min(1,dt*7.5);

 // Durante a escolha e durante A/B, o arqueiro fica dedicado à ultimate.
 if(enemy.ultChoiceOpen){
   enemy.vx=0;
   enemy.shoot=0;
   enemy.atk=0;
 }else if(enemy.ultChoicePending){
   enemy.vx=0;
   enemy.shoot=0;
   enemy.atk=0;
 }else if(enemy.ultFollowup&&!(enemy.ultFollowup==="B"&&!enemy.ultBActive&&!projectiles.some(q=>q.type==="arrow"&&q.ultB))){
   enemy.vx=0;
   enemy.shoot=0;
   enemy.atk=0;
 }else if(enemy.kind==="archer"&&enemy.stealth<=0&&distance<=ULT_LINE&&distance>STEALTH_LINE&&enemy.ultCd<=0){
   enemy.ultCd=20;
   enemy.atk=.8;
   enemy.anim=.65;
   const arrowY=1.25;
   const speed=14.5;
   projectiles.push({type:"ultArrow",x:enemy.x+enemy.facing*1.4,y:arrowY,vx:enemy.facing*speed,vy:0,life:2.0,owner:"enemy"});
   effects.push({type:"ultShot",x:enemy.x+enemy.facing*1.0,y:1.25,life:.45,max:.45,enemy:true});
 }else if(enemy.kind==="archer"&&enemy.stealth<=0&&distance>STEALTH_LINE&&enemy.shoot<=0){
   enemy.shoot=1.35;
   enemy.atk=.48;
   enemy.anim=.45;
   const pattern=enemy.arrowHits%3;
   const highArrow=pattern===2;
   const arrowY=highArrow?1.72:1.35;
   const speed=12.5;
   const vy=highArrow?1.0:0;
   projectiles.push({
     type:"arrow",
     x:enemy.x+enemy.facing*1.15,
     y:arrowY,
     vx:enemy.facing*speed,
     vy:vy,
     high:highArrow,
     life:1.8,
     owner:"enemy"
   });
   effects.push({type:"bowshot",x:enemy.x+enemy.facing*.9,y:arrowY,life:.16,max:.16,flip:enemy.facing,enemy:true});
 }

 // O arqueiro não procura corpo a corpo. Se for alcançado, sua resposta é fugir/invisibilidade.

 if(enemy.ultChoiceDone&&!enemy.ultChoiceOpen&&enemy.ultFollowup){
   enemy.ultFollowTimer=Math.max(0,enemy.ultFollowTimer-dt);
   if(enemy.ultFollowup==="A"&&enemy.ultFollowCount<5&&enemy.ultFollowTimer<=0)fireArcherFollowup();
   if(enemy.ultFollowup==="A"&&enemy.ultFollowCount>=5){enemy.ultFollowup="";enemy.ultCd=18;}
   if(enemy.ultFollowup==="B"&&enemy.ultFollowCount>=1&&!projectiles.some(q=>q.type==="arrow"&&q.ultB)){enemy.ultBActive=false;enemy.ultFollowup="";enemy.ultCd=18;}
 }
 for(let i=projectiles.length-1;i>=0;i--){
  const p=projectiles[i];
  p.x+=p.vx*dt;
  p.y+=(p.vy||p.dy||0)*dt;
  if(!(p.type==="arrow"&&p.ultB&&p.phase==="split"))p.life-=dt;

  if(p.type==="arrow"&&!p.ultB&&Math.abs(p.x-player.x)<.78&&p.y>=player.y-.15&&p.y<=player.y+2.35){
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
      enemy.ultChoicePending=true;
      effects.push({type:"stun",x:player.x,y:player.y+1.2,life:2.8,max:2.8});
    }
    p.life=0;
  }

  if(p.type==="ultFollowArrow"&&Math.abs(p.x-player.x)<.82&&p.y>=player.y-.2&&p.y<=player.y+2.5){
    damagePlayer(player.ult>0?15:28,Math.sign(p.vx)*2.5);
    effects.push({type:"hit",x:p.x,y:p.y,life:.18,max:.18});
    p.life=0;
  }

  if(p.type==="arrow"&&p.ultB&&p.phase==="travel"&&!p.split&&Math.abs(p.x-player.x)<=3.0){
    // A flecha normal chega perto do Jugo e se divide imediatamente.
    p.split=true;
    p.phase="split";
    p.x=player.x;
    p.vx=0;
    p.life=.5;
    p.explodeIn=.5;
    p.y=player.y+1;
    effects.push({type:"yellowSplit",x:player.x,y:player.y+1,life:.28,max:.28});
    projectiles.push(
      {type:"pierceArrow",x:player.x-.14,y:player.y+.42,vx:0,vy:0,life:.5,owner:"enemy",hitDone:false,offsetX:-.14,offsetY:.42},
      {type:"pierceArrow",x:player.x+.14,y:player.y+1.58,vx:0,vy:0,life:.5,owner:"enemy",hitDone:false,offsetX:.14,offsetY:1.58}
    );
  }
  if(p.type==="pierceArrow"){
    // As duas partes ficam grudadas no Jugo durante os 0,5 s.
    p.x=player.x+p.offsetX;
    p.y=player.y+p.offsetY;
    if(!p.hitDone){
      damagePlayer(player.ult>0?18:34,0);
      p.hitDone=true;
    }
  }
  if(p.type==="arrow"&&p.ultB&&p.phase==="split"){
    p.explodeIn=Math.max(0,p.explodeIn-dt);
    p.life=p.explodeIn;
    if(p.explodeIn<=0){
      damagePlayer(player.ult>0?42:72,0);
      for(const q of projectiles)if(q.type==="pierceArrow")q.life=0;
      effects.push({type:"yellowExplosion",x:player.x,y:player.y+1,life:.55,max:.55});
      p.life=0;
      enemy.ultBActive=false;
    }
  }

  if(p.owner==="player"&&p.type==="jugoOrb"&&Math.abs(p.x-enemy.x)<.9&&p.y>=enemy.y-.4&&p.y<=enemy.y+2.8){
    damageEnemy(player.ult>0?48:22,player.facing*1.5);p.life=0;effects.push({type:"orbHit",x:p.x,y:p.y,life:.24,max:.24});
  }
  if(p.owner==="player"&&p.type==="chaosOrb"&&Math.abs(p.x-enemy.x)<.9&&p.y>=enemy.y-.4&&p.y<=enemy.y+3.0){
    damageEnemy(player.ult>0?55:30,player.facing*2);p.life=0;effects.push({type:"chaosHit",x:p.x,y:p.y,life:.28,max:.28});
  }
  if(p.owner==="player"&&p.type==="kairaShot"&&Math.abs(p.x-enemy.x)<.75&&p.y>=enemy.y-.2&&p.y<=enemy.y+2.7){
    damageEnemy(player.ult>0?70:45,player.facing*3);p.life=0;effects.push({type:"kairaHit",x:p.x,y:p.y,life:.22,max:.22});
  }
  if(p.owner==="enemy"&&p.type==="enemyChaosOrb"&&Math.abs(p.x-player.x)<.9&&p.y>=player.y-.4&&p.y<=player.y+3.0){
    damagePlayer(34,Math.sign(p.vx)*3);p.life=0;effects.push({type:"chaosHit",x:p.x,y:p.y,life:.28,max:.28,enemy:true});
  }
  if(p.owner==="enemy"&&p.type==="enemyKairaShot"&&Math.abs(p.x-player.x)<.75&&p.y>=player.y-.2&&p.y<=player.y+2.7){
    damagePlayer(42,Math.sign(p.vx)*3);p.life=0;effects.push({type:"kairaHit",x:p.x,y:p.y,life:.22,max:.22,enemy:true});
  }
  if(p.type==="orb"&&Math.abs(p.x-enemy.x)<1.0&&p.y>=enemy.y-.45&&p.y<=enemy.y+3.0){damageEnemy(player.ult>0?45:18,player.facing*1.5);p.life=0;effects.push({type:"hit",x:p.x,y:p.y,life:.2,max:.2});}
  if(p.type==="creature"&&Math.abs(p.x-enemy.x)<1.15&&p.y>=enemy.y-.45&&p.y<=enemy.y+3.1){damageEnemy(player.ult>0?95:50,player.facing*4);p.life=0;effects.push({type:"hit",x:p.x,y:1,life:.3,max:.3});}
  const visibleHalf=1/(2*(W>=H?.04:.065));
  if(p.ultB&&p.life<=0&&!p.split){
    enemy.ultBActive=false;
  }
  if(p.life<=0||(!p.ultB&&Math.abs(p.x-cameraX)>visibleHalf+1.2)||p.y<-1||p.y>4)projectiles.splice(i,1);
 }
 for(let i=effects.length-1;i>=0;i--){effects[i].life-=dt;if(effects[i].life<=0)effects.splice(i,1);}
 updateHud();
}

function drawBackground(){
 // MAPA 01 — DISTRITO ZERO
 // Cenário em camadas: cidade distante, estruturas próximas e palco de batalha.
 const sky=ctx.createLinearGradient(0,0,0,H);
 sky.addColorStop(0,"#04030d");sky.addColorStop(.42,"#0c1230");sky.addColorStop(.7,"#21132f");sky.addColorStop(1,"#08070f");
 ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);

 const horizon=H*.54;
 const floorY=H*.78;
 const parallax=(amount)=>cameraX*W*amount;

 // Lua/portal distante.
 ctx.save();ctx.globalCompositeOperation="lighter";
 const moonX=W*.78-parallax(.006),moonY=H*.22,moonR=Math.min(W,H)*.075;
 const moon=ctx.createRadialGradient(moonX,moonY,moonR*.15,moonX,moonY,moonR);
 moon.addColorStop(0,"rgba(235,220,255,.34)");moon.addColorStop(.35,"rgba(155,120,255,.14)");moon.addColorStop(1,"rgba(80,60,180,0)");
 ctx.fillStyle=moon;ctx.beginPath();ctx.arc(moonX,moonY,moonR,0,TAU);ctx.fill();ctx.restore();

 // Cidade no horizonte.
 ctx.fillStyle="#08091a";
 const blocks=[[-.02,.38,.12,.17],[.11,.31,.08,.24],[.2,.4,.14,.15],[.34,.28,.09,.27],[.46,.36,.13,.19],[.61,.25,.1,.30],[.73,.34,.14,.21],[.89,.29,.09,.26]];
 for(const [px,py,pw,ph] of blocks)ctx.fillRect(px*W-parallax(.012),py*H,pw*W,ph*H);
 ctx.fillStyle="rgba(112,190,255,.18)";
 for(let i=0;i<48;i++){const bx=(i*137%(Math.max(1,W+80)))-40-parallax(.014),by=H*.33+(i*47%(H*.25));ctx.fillRect(bx,by,3,7);}

 // Estruturas próximas.
 ctx.fillStyle="rgba(15,17,39,.96)";
 const nearOffset=parallax(.025);
 for(let i=-2;i<9;i++){
   const x=i*W*.15-nearOffset,h=H*(.12+(i%3)*.035);
   ctx.fillRect(x,horizon-h,42,h);
   ctx.fillStyle="rgba(103,84,190,.18)";ctx.fillRect(x+8,horizon-h+18,6,h*.72);ctx.fillStyle="rgba(15,17,39,.96)";
 }
 ctx.strokeStyle="rgba(120,145,220,.14)";ctx.lineWidth=2;
 for(let i=0;i<5;i++){const x1=-W*.1+i*W*.28-parallax(.02);ctx.beginPath();ctx.moveTo(x1,0);ctx.quadraticCurveTo(W*.5,H*.18+i*8,x1+W*.32,H*.52);ctx.stroke();}

 // Parede ao fundo do palco.
 ctx.fillStyle="rgba(4,5,13,.94)";ctx.fillRect(0,horizon,W,floorY-horizon);
 ctx.strokeStyle="rgba(145,105,255,.2)";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,horizon);ctx.lineTo(W,horizon);ctx.stroke();

 // Piso principal.
 const floor=ctx.createLinearGradient(0,floorY,0,H);floor.addColorStop(0,"#15142a");floor.addColorStop(1,"#05060b");
 ctx.fillStyle=floor;ctx.fillRect(0,floorY,W,H-floorY);

 // Perspectiva.
 ctx.strokeStyle="rgba(110,135,220,.18)";ctx.lineWidth=1;
 for(let i=-10;i<=10;i++){const x=worldX(i*2);ctx.beginPath();ctx.moveTo(W/2+(x-W/2)*.2,floorY);ctx.lineTo(x,H);ctx.stroke();}
 for(let i=0;i<=7;i++){const t=i/7,y=floorY+Math.pow(t,1.55)*(H-floorY);ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}

 // Emblema central do mapa.
 ctx.fillStyle="rgba(150,90,255,.08)";ctx.fillRect(0,floorY-8,W,16);
 const centerX=worldX(0),centerY=floorY-2,r=Math.min(W,H)*.07;
 ctx.strokeStyle="rgba(230,190,255,.25)";ctx.lineWidth=2;
 ctx.beginPath();ctx.arc(centerX,centerY,r,0,TAU);ctx.stroke();
 ctx.beginPath();ctx.moveTo(centerX-r*.65,centerY);ctx.lineTo(centerX+r*.65,centerY);ctx.moveTo(centerX,centerY-r*.65);ctx.lineTo(centerX,centerY+r*.65);ctx.stroke();

 // Torres que marcam os dois extremos do campo.
 for(const side of [-1,1]){
   const sx=worldX(side*16.6);
   ctx.fillStyle="rgba(9,8,20,.98)";ctx.fillRect(sx-18,horizon-20,36,floorY-horizon+20);
   ctx.strokeStyle="rgba(175,110,255,.5)";ctx.lineWidth=3;
   ctx.beginPath();ctx.moveTo(sx-18,horizon-20);ctx.lineTo(sx-18,floorY);ctx.moveTo(sx+18,horizon-20);ctx.lineTo(sx+18,floorY);ctx.stroke();
   ctx.fillStyle="rgba(255,75,190,.8)";ctx.fillRect(sx-12,horizon+15,24,4);
 }

 // Bordas de segurança.
 for(const side of [-1,1]){
   const sx=worldX(side*17);
   ctx.save();ctx.globalCompositeOperation="lighter";ctx.strokeStyle="rgba(255,185,80,.7)";ctx.lineWidth=5;
   ctx.beginPath();ctx.moveTo(sx,floorY-14);ctx.lineTo(sx,H);ctx.stroke();ctx.restore();
 }
}
function sprite(img,x,y,h,flip=1,alpha=1,filter="none"){
 if(!img.complete||!img.naturalWidth)return;
 const w=h*img.naturalWidth/img.naturalHeight;ctx.save();ctx.translate(x,y);ctx.scale(flip,1);ctx.globalAlpha=alpha;ctx.filter=filter;ctx.drawImage(img,-w/2,-h,w,h);ctx.restore();
}
// Câmera mais afastada na horizontal: mais espaço visual entre os lutadores
// e mais tempo/espaço para as flechas atravessarem a arena.
const worldX=x=>W/2+(x-cameraX)*W*(W>=H?.04:.065);
function fighterDraw(f,img,h,flip){
 const ground=H*.78;
 const landscape=W>=H;
 const scale=landscape?clamp(H/760,.23,.30):Math.min(W/520,.68);
 const x=worldX(f.x),y=ground-f.y*H*.075;
 const moving=Math.abs(f.vx)>.1,bob=moving?Math.abs(Math.sin(f.anim*5))*.025:Math.sin(time*2.5)*.012;
 const alpha=f===enemy&&enemy.stealth>0?.10:1;
 sprite(img,x,y-bob*H,h*scale,flip,alpha,f.hit>0?"brightness(2) saturate(.5)":"none");
 if(f===player&&f.kind==="ecronix"&&f.form==="final"){
   ctx.save();ctx.globalCompositeOperation="lighter";ctx.strokeStyle="rgba(255,35,110,.8)";ctx.lineWidth=5;ctx.beginPath();ctx.arc(x,y-h*scale*.45,48,0,TAU);ctx.stroke();ctx.restore();
 }
 if(f===player&&f.kind==="kaira"&&f.form==="beast"){
   ctx.save();ctx.globalCompositeOperation="lighter";ctx.strokeStyle="rgba(110,170,255,.85)";ctx.lineWidth=5;ctx.beginPath();ctx.arc(x,y-h*scale*.45,44,0,TAU);ctx.stroke();ctx.restore();
 }
 if(f===enemy&&enemy.ultFollowup){
   ctx.save();ctx.textAlign="center";ctx.font="900 12px Rajdhani, Segoe UI, sans-serif";ctx.fillStyle=enemy.ultFollowup==="A"?"#ffe3a3":"#fff36a";ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=12;
   ctx.fillText(enemy.ultFollowup==="A"?"A • RAJADA":"B • PERFURAÇÃO",x,y-h*scale*.5-18);ctx.restore();
 }else if(f===enemy&&enemy.ultChoiceOpen){
   ctx.save();ctx.textAlign="center";ctx.font="900 11px Rajdhani, Segoe UI, sans-serif";ctx.fillStyle="#f2d9ff";ctx.shadowColor="#b86cff";ctx.shadowBlur=12;
   ctx.fillText("ESCOLHA A OU B",x,y-h*scale*.5-18);ctx.restore();
 }
}
function draw(){
  if(ultChoice&&enemy.ultChoiceOpen&&screen==="game")ultChoice.classList.remove("hidden");
  else if(ultChoice)ultChoice.classList.add("hidden");
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
     ctx.strokeStyle=p.ultB?"rgba(255,245,70,.9)":"rgba(255,220,150,.24)";ctx.lineWidth=p.ultB?7:5;
     ctx.beginPath();ctx.moveTo(-20,0);ctx.lineTo(8,0);ctx.stroke();
     ctx.globalCompositeOperation="source-over";
     ctx.strokeStyle=p.ultB?"#fff36a":"#f4d08a";ctx.lineWidth=p.ultB?3.5:2.5;
     ctx.beginPath();ctx.moveTo(-19,0);ctx.lineTo(8,0);ctx.stroke();
     ctx.fillStyle=p.ultB?"#fff36a":"#fff0bd";
     ctx.beginPath();ctx.moveTo(13,0);ctx.lineTo(6,-5);ctx.lineTo(7,0);ctx.lineTo(6,5);ctx.closePath();ctx.fill();
     ctx.strokeStyle="#d89a55";ctx.lineWidth=1.4;
     ctx.beginPath();ctx.moveTo(-19,0);ctx.lineTo(-26,-4);ctx.moveTo(-19,0);ctx.lineTo(-26,4);ctx.stroke();
     ctx.restore();
   }else if(p.type==="ultFollowArrow"||p.type==="yellowArrow"||p.type==="pierceArrow"){
     ctx.save();ctx.translate(x,y-4);
     const yellow=p.type!=="ultFollowArrow",len=p.type==="pierceArrow"?34:(yellow?42:48);
     ctx.globalCompositeOperation="lighter";ctx.strokeStyle=yellow?"rgba(255,245,70,.9)":"rgba(255,220,150,.8)";ctx.lineWidth=6;
     ctx.beginPath();ctx.moveTo(-len,0);ctx.lineTo(len*.35,0);ctx.stroke();
     ctx.strokeStyle="#fff8bd";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-len,0);ctx.lineTo(len*.35,0);ctx.stroke();
     ctx.fillStyle=yellow?"#fff36a":"#fff0bd";ctx.beginPath();ctx.moveTo(len*.58,0);ctx.lineTo(len*.25,-7);ctx.lineTo(len*.35,0);ctx.lineTo(len*.25,7);ctx.closePath();ctx.fill();
     ctx.restore();
   }else if(p.type==="pierceArrow"){
     // As duas flechas da B usam a mesma arte de flecha normal, agora grudadas no Jugo.
     const angle=p.offsetY<1?-.35:Math.PI+.35;
     ctx.save();ctx.translate(x,y-4);ctx.rotate(angle);
     ctx.globalCompositeOperation="lighter";
     ctx.strokeStyle="rgba(255,245,70,.9)";ctx.lineWidth=7;
     ctx.beginPath();ctx.moveTo(-20,0);ctx.lineTo(8,0);ctx.stroke();
     ctx.globalCompositeOperation="source-over";
     ctx.strokeStyle="#fff36a";ctx.lineWidth=3.5;
     ctx.beginPath();ctx.moveTo(-19,0);ctx.lineTo(8,0);ctx.stroke();
     ctx.fillStyle="#fff36a";
     ctx.beginPath();ctx.moveTo(13,0);ctx.lineTo(6,-5);ctx.lineTo(7,0);ctx.lineTo(6,5);ctx.closePath();ctx.fill();
     ctx.strokeStyle="#d89a55";ctx.lineWidth=1.4;
     ctx.beginPath();ctx.moveTo(-19,0);ctx.lineTo(-26,-4);ctx.moveTo(-19,0);ctx.lineTo(-26,4);ctx.stroke();
     ctx.restore();
   }else if(p.type==="jugoOrb"||p.type==="chaosOrb"||p.type==="enemyChaosOrb"||p.type==="kairaShot"||p.type==="enemyKairaShot"){
     ctx.save();ctx.translate(x,y-5);ctx.globalCompositeOperation="lighter";
     const chaos=p.type==="chaosOrb"||p.type==="enemyChaosOrb";
     const rifle=p.type==="kairaShot"||p.type==="enemyKairaShot";
     ctx.fillStyle=chaos?"#ff35df":rifle?"#a9d8ff":"#6e9dff";
     ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=18;
     if(rifle){ctx.rotate(p.vx<0?Math.PI:0);ctx.fillRect(-22,-3,38,6);ctx.beginPath();ctx.moveTo(20,0);ctx.lineTo(8,-7);ctx.lineTo(8,7);ctx.closePath();ctx.fill();}
     else{ctx.beginPath();ctx.arc(0,0,chaos?9:8,0,TAU);ctx.fill();ctx.strokeStyle=chaos?"#ffb5ff":"#d9f6ff";ctx.lineWidth=2;ctx.stroke();}
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
 const playerImg=player.kind==="ecronix"?IMG.ecronix:player.kind==="kaira"?IMG.kaira:(player.ult>0?IMG.ult:IMG.jugo);
 const enemyImg=enemy.kind==="ecronix"?IMG.ecronix:enemy.kind==="kaira"?IMG.kaira:IMG.archer;
 const playerH=player.kind==="ecronix"?285:player.kind==="kaira"?275:(player.ult>0?315:270);
 const enemyH=enemy.kind==="ecronix"?285:enemy.kind==="kaira"?275:255;
 if(player.x<enemy.x){fighterDraw(player,playerImg,playerH,1);fighterDraw(enemy,enemyImg,enemyH,-1);}
 else{fighterDraw(enemy,enemyImg,enemyH,1);fighterDraw(player,playerImg,playerH,-1);}
 for(const e of effects){const x=worldX(e.x),y=floorY-e.y*H*.075;const k=e.life/e.max;if(e.type==="slash"){ctx.save();ctx.translate(x,y);ctx.scale(e.flip,1);ctx.globalCompositeOperation="lighter";ctx.strokeStyle=e.enemy?"rgba(255,100,90,.9)":"rgba(130,220,255,.95)";ctx.lineWidth=8*k;ctx.beginPath();ctx.arc(0,0,65*(1-k)+35,-1.1,1.0);ctx.stroke();ctx.restore();}else if(e.type==="hit"){ctx.fillStyle=`rgba(255,230,170,${k})`;ctx.beginPath();ctx.arc(x,y,45*(1-k)+8,0,TAU);ctx.fill();}else if(e.type==="stealth"){ctx.strokeStyle=`rgba(150,220,255,${k*.7})`;ctx.lineWidth=5;ctx.beginPath();ctx.arc(x,y,40+50*(1-k),0,TAU);ctx.stroke();}else if(e.type==="stun"){ctx.save();ctx.translate(x,y);ctx.globalCompositeOperation="lighter";ctx.strokeStyle=`rgba(255,220,80,${k})`;ctx.lineWidth=5;ctx.beginPath();ctx.arc(0,0,38+12*Math.sin(time*10),0,TAU);ctx.stroke();ctx.fillStyle=`rgba(255,245,170,${k})`;ctx.font="bold 28px sans-serif";ctx.textAlign="center";ctx.fillText("STUN",0,-35);ctx.restore();}else if(e.type==="yellowExplosion"){ctx.save();ctx.globalCompositeOperation="lighter";ctx.strokeStyle=`rgba(255,245,70,${k})`;ctx.lineWidth=9*k;ctx.beginPath();ctx.arc(x,y,35+95*(1-k),0,TAU);ctx.stroke();ctx.fillStyle=`rgba(255,235,80,${k*.45})`;ctx.beginPath();ctx.arc(x,y,55*(1-k)+8,0,TAU);ctx.fill();ctx.restore();}else if(e.type==="jugoCollapse"){
  ctx.save();ctx.globalCompositeOperation="lighter";ctx.strokeStyle=`rgba(100,180,255,${k})`;ctx.lineWidth=7;ctx.beginPath();ctx.arc(x,y,45+110*(1-k),0,TAU);ctx.stroke();ctx.restore();
}else if(e.type==="ecronixFinal"){
  ctx.save();ctx.globalCompositeOperation="lighter";ctx.strokeStyle=`rgba(255,30,120,${k})`;ctx.lineWidth=10*k;ctx.beginPath();ctx.arc(x,y,35+100*(1-k),0,TAU);ctx.stroke();ctx.restore();
}else if(e.type==="kairaUltimate"){
  ctx.save();ctx.globalCompositeOperation="lighter";ctx.strokeStyle=`rgba(120,190,255,${k})`;ctx.lineWidth=8*k;ctx.beginPath();ctx.arc(x,y,35+100*(1-k),0,TAU);ctx.stroke();ctx.restore();
}else if(e.type==="orbHit"||e.type==="chaosHit"||e.type==="kairaHit"){
  ctx.save();ctx.globalCompositeOperation="lighter";ctx.fillStyle=`rgba(180,220,255,${k})`;ctx.beginPath();ctx.arc(x,y,35*(1-k)+7,0,TAU);ctx.fill();ctx.restore();
}else if(e.type==="yellowSplit"){ctx.save();ctx.globalCompositeOperation="lighter";ctx.strokeStyle=`rgba(255,245,70,${k})`;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(x-28,y-22);ctx.lineTo(x+28,y+22);ctx.moveTo(x-28,y+22);ctx.lineTo(x+28,y-22);ctx.stroke();ctx.restore();}else{ctx.fillStyle=`rgba(255,210,130,${k*.5})`;ctx.beginPath();ctx.arc(x,y,120*(1-k)+10,0,TAU);ctx.fill();}}
 // center line
 ctx.strokeStyle="rgba(255,220,150,.25)";ctx.setLineDash([8,10]);ctx.beginPath();ctx.moveTo(W/2,floorY-15);ctx.lineTo(W/2,floorY+10);ctx.stroke();ctx.setLineDash([]);
}
function updateHud(){
 updateSkillLabels();
 playerHp.style.width=(player.hp/MAX_HP*100)+"%";enemyHp.style.width=(enemy.hp/ENEMY_MAX_HP*100)+"%";
 for(const k of ["A","B","C"]){const b=btn[k];const left=cds[k];b.querySelector(".cd").style.setProperty("--cd",clamp(left/(k==="C"?CD.C:CD[k]),0,1));b.querySelector(".cdt").textContent=left>0?Math.ceil(left):"";}
 basic.querySelector(".basic-cd").style.setProperty("--basic-cd",clamp(player.atk/.38,0,1));
 roundText.textContent=player.ult>0?"FORMA ULTIMATE":"ROUND "+round;
}
let last=performance.now();
function loop(now){const dt=Math.min(.033,(now-last)/1000);last=now;if(screen==="game"){update(dt);draw();}requestAnimationFrame(loop);}
requestAnimationFrame(loop);