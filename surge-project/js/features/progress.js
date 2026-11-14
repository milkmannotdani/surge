/* Progression: every fighter earns XP and levels up (max level 20).
   XP: +25 per knockout, +100 per win, +20 for finishing a match, +120 per story mission cleared,
   plus Rescue and Exam rewards. Levels and story milestones unlock costumes in the shop (SKINS_U entries below).
   To add an unlockable costume: add it to SKINS_U with price LOCKED and give it a rule in UNLOCKS. */
const MAXLV=20,LOCKED=1e9;
let PROG={};try{PROG=JSON.parse(store.get('surge.prog')||'{}')||{};}catch(e){PROG={};}
function progSave(){store.set('surge.prog',JSON.stringify(PROG));}
function heroKey(i){const h=heroAt(i);return i>=CUST0?'c:'+h.name:h.id;}
function lvNeed(L){return 80+L*40;}
function lvOf(xp){let L=1;while(L<MAXLV&&xp>=lvNeed(L)){xp-=lvNeed(L);L++;}return {L,xp,need:L<MAXLV?lvNeed(L):0};}
function progLevel(k){return lvOf(PROG[k]||0).L;}
function progBadge(i){const k=heroKey(i),v=lvOf(PROG[k]||0);return `<div class="lvb" title="${v.L<MAXLV?v.xp+'/'+v.need+' XP':'MAX LEVEL'}">LV ${v.L}</div>`;}
// unlockable costumes (format like the other universal skins: name, suit, main, trim, glow, material, price)
Object.assign(SKINS_U,{
  academy:['Aegis Uniform',0x141c34,0x2a3a5e,0xd8d8e0,0xffd23f,null,LOCKED],
  licensed:['Pro License',0x0a1430,0x2a4aa8,0xffffff,0x8ad8ff,'gloss',LOCKED],
  veteran:['Veteran',0x2a2418,0x6a5a3a,0xb8a070,0xffe8b0,null,LOCKED],
  elite:['Elite',0x0a0a14,0x22223a,0xffd23f,0xfff2b0,'gloss',LOCKED],
  severance:['Severance',0x0a0408,0x2a0a1a,0x8a2aff,0xc84aff,'gloss',LOCKED],
  legend:['Legend',0x1a1a2a,0xf0f0ff,0xffd23f,0xffffff,'pearl',LOCKED]});
function campDone(key,i){try{const v=JSON.parse(store.get(key)||'null');return !!(v&&v.done&&v.done.indexOf(i)>=0);}catch(e){return false;}}
const UNLOCKS={
  academy:{why:'Clear the Training Arc',ok:()=>campDone('surge.train',0)},
  licensed:{why:'Get rank A or S in the Hero License Exam',ok:()=>{const E=(typeof MIS!=='undefined'&&MIS.best.exam)||null;return !!E&&(E.rank==='S'||E.rank==='A');}},
  veteran:{why:'Reach level 5 with this fighter',ok:h=>progLevel(h)>=5},
  elite:{why:'Reach level 10 with this fighter',ok:h=>progLevel(h)>=10},
  severance:{why:'Clear the villain story',ok:()=>campDone('surge.vstory',5)},
  legend:{why:'Reach level 20 with this fighter',ok:h=>progLevel(h)>=20}};
const _owns0=owns;
owns=function(key){const m=/^skin:([^:]+):(.+)$/.exec(key);if(m&&UNLOCKS[m[2]])return UNLOCKS[m[2]].ok(m[1]);return _owns0(key);};
// shop: locked costumes show how to unlock them instead of a price
const _renderShop0=renderShop;
renderShop=function(){_renderShop0();if(SH.tab!=='skins')return;const H=HEROES[SH.hero],items=skinList(H.id),g=$('shGrid');
  items.forEach(([id],i)=>{const U=UNLOCKS[id],d=g.children[i];if(!U||!d)return;if(!U.ok(H.id)){d.classList.add('lockd');d.querySelector('.shp').textContent='🔒 LOCKED';}});
  const U=UNLOCKS[SH.sel];if(U&&!U.ok(H.id)){const b=$('shBuy');b.textContent='🔒 '+U.why.toUpperCase();b.disabled=true;}};
function progAddXP(i,n,why){if(i==null||game.practice||!n)return;const k=heroKey(i),before=lvOf(PROG[k]||0).L;PROG[k]=(PROG[k]||0)+n;progSave();const v=lvOf(PROG[k]);
  if(v.L>before){const h=heroAt(i);setTimeout(()=>{announceSmall(`${h.name} REACHED LEVEL ${v.L}!`);AU.levelUp();
    ['veteran','elite','legend'].forEach(sid=>{const lv={veteran:5,elite:10,legend:20}[sid];if(before<lv&&v.L>=lv)setTimeout(()=>announceSmall(`UNLOCKED: ${SKINS_U[sid][0].toUpperCase()} COSTUME`),1600);});},400);}
  xpPop(n,why);}
function xpPop(n,why){const me=$('me');if(!me)return;const e=document.createElement('div');e.className='ptpop xp';e.textContent='+'+n+' XP '+(why||'');me.appendChild(e);setTimeout(()=>e.remove(),1700);}
function myHeroIdx(){if(game.story&&game.story.S){const S=game.story.S;return S.playerIdx!=null?S.playerIdx:heroIdx(S.player);}return mySel;}
onEv('kill',(def,att)=>{if(att&&att===ME&&!ally(att,def))progAddXP(myHeroIdx(),25,'KO');});
onEv('win',w=>{if(w&&ME&&ally(w,ME)&&!game.story)progAddXP(mySel,100,'WIN');});
onEv('matchEnd',()=>{if(ME&&!game.practice&&!game.story&&game.matchT>30)progAddXP(mySel,20,'');});
onEv('missionEnd',(win,S)=>{if(win&&S&&!S.done)progAddXP(S.playerIdx!=null?S.playerIdx:heroIdx(S.player),120,'MISSION');});
// show the selected fighter's level on the fighter preview
onEv('frame',()=>{const e=$('pvLv');if(!e||!$('setup').classList.contains('on'))return;const v=lvOf(PROG[heroKey(mySel)]||0);const s=`LV ${v.L}`+(v.L<MAXLV?` · ${v.xp}/${v.need} XP`:' · MAX');if(e.textContent!==s)e.textContent=s;e.style.setProperty('--p',(v.L<MAXLV?v.xp/v.need*100:100)+'%');});
