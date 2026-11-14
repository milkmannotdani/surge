/* Power awakening: once per match, when you're at 30% health or less with a full BREAK bar,
   press X (gamepad: L3/R3 together, touch: AWAKEN button) to awaken for 12 s:
   +25 health, +50 ult meter, 35% more damage, 30% more speed, faster cooldowns, a blazing aura and a dramatic camera moment. */
const AWK_HP=30,AWK_T=12,AWK_KEYS=['KeyX'];
function canAwaken(f){return !f.dead&&!f.downed&&!f.awkUsed&&!(f.awkT>0)&&f.hp<=AWK_HP&&(f.brk||0)>=100&&game.phase==='fight'&&!game.practice;}
function awaken(f,fromNet){if(!fromNet&&!canAwaken(f))return;f.awkUsed=true;f.awkT=AWK_T;f.brk=0;
  f.hp=Math.min(100,f.hp+25);f.meter=Math.min(100,f.meter+50);f.invuln=Math.max(f.invuln||0,1.2);f.hasteT=Math.max(f.hasteT||0,AWK_T);
  const c=f.chest(new V3()),col=f.hero.color,acc=f.hero.accent;
  ring(new V3(f.pos.x,f.pos.y+.2,f.pos.z),acc,6,.7,true,2.6);ring(c,col,4,.5,false,2.6);burst(ADD,c,70,{colors:[col,acc,0xffffff],speed:9,up:4,life:.8,size:.4,size1:0,bright:2.6});
  implode(c,40,2.2,[col,acc,0xffffff],.5,2);flashLight(c,col,14);shake(.35,c);
  const m=f.rig.mats;if(m&&m[1]&&f.awkE==null){f.awkE=m[1].emissiveIntensity||0;m[1].emissiveIntensity=f.awkE+1.4;}
  if(f===ME||(ME&&f.pos.distanceTo(ME.pos)<25)){game.cine={f,t:0};game.slowT=.9;screenFlash(.55,f.pos);AU.scale=1;AU.sting(f.hero.faction==='villain');AU.boom(true);}
  feed(`<b style="--c:${f.hero.css}">${esc(f.name)}</b> has AWAKENED!`);if(f===ME)announce('AWAKENED!',f.hero.css);
  if(!fromNet)netEvent({k:'awk',v:f.id});}
onEv('net:awk',e=>{const f=FS.find(x=>x.id===e.v);if(f&&!f.awkUsed)awaken(f,true);});
onEv('intent',()=>{if(!ME)return;if(AWK_KEYS.some(k=>pressed.has(k)))ME.intent.awk=true;if(ME.intent.awk)netPressAcc|=1024;});
onEv('tick',dt=>{for(const f of FS){
  if(f.intent&&f.intent.awk){f.intent.awk=false;if(NET.role!=='client'&&canAwaken(f))awaken(f);}
  // bots awaken when they qualify
  if(f.isBot&&NET.role!=='client'&&canAwaken(f)&&Math.random()<dt*1.5)awaken(f);
  if(f.awkT>0){f.awkT-=dt;f.specCD=Math.max(0,f.specCD-dt*.6);if(f.xcd){f.xcd[0]=Math.max(0,f.xcd[0]-dt*.6);f.xcd[1]=Math.max(0,f.xcd[1]-dt*.6);}
    if(!f.dead&&Math.random()<.7){const col=Math.random()<.5?f.hero.color:f.hero.accent;burst(ADD,TMP2.set(f.pos.x+rand(-.5,.5),f.pos.y+rand(.1,2),f.pos.z+rand(-.5,.5)),1,{colors:[col,0xffffff],speed:1,up:4,life:.45,size:.35,size1:0,bright:2.2,rad:.3});}
    if(f.awkT<=0||f.dead)awkEnd(f);}}
  // HUD prompt
  const el=$('awkP');if(el){const on=ME&&canAwaken(ME);el.classList.toggle('on',!!on);}});
function awkEnd(f){f.awkT=0;const m=f.rig&&f.rig.mats;if(m&&m[1]&&f.awkE!=null){m[1].emissiveIntensity=f.awkE;f.awkE=null;}}
// awakened fighters hit harder and shrug off some damage
onEv('hit',(att,def,dmg)=>{if(att.awkT>0&&!def.dead){def.hp-=dmg*.35;}if(def.awkT>0)def.hp+=dmg*.15;});
onEv('matchStart',()=>{for(const f of FS){f.awkUsed=false;f.awkT=0;}});
