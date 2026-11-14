/* Missions screen: RESCUE (save civilians during a villain attack) and the HERO LICENSE EXAM
   (obstacle course → rescue trial → combat trial, graded S/A/B/C).
   Both run on the story-mission engine (storyStart) with their own setup/tick/done hooks. */
const MIS={diff:1,best:{}};try{MIS.best=JSON.parse(store.get('surge.mis')||'{}')||{};}catch(e){}
function misSave(){store.set('surge.mis',JSON.stringify(MIS.best));}
const VILLAIN_IDS=['quake','entropy','sovereign','pyre','warp','marble','legion','recoil'];
function showMissions(){showScreen('missions');const h=heroAt(mySel);$('misHero').innerHTML=`PLAYING AS <b style="color:${h.css}">${esc(h.name)}</b> · change fighter in PLAY VS BOTS`;
  const dc=$('misDiff');dc.innerHTML=['EASY','NORMAL','HARD'].map((t,i)=>`<button class="chip ${i===MIS.diff?'on':''}" data-d="${i}">${t}</button>`).join('');
  [...dc.children].forEach(b=>b.onclick=()=>{AU.ui();MIS.diff=+b.dataset.d;showMissions();});
  const R=MIS.best.rescue,E=MIS.best.exam;$('misRescueBest').textContent=R?`BEST: ${R.saved}/${R.total} SAVED · ${R.score} PTS`:'NOT PLAYED YET';$('misExamBest').textContent=E?`BEST RANK: ${E.rank} · ${E.time}s`:'NOT TAKEN YET';}
function misResult(title,col,lines,again){showScreen('missions');$('misBody').style.display='none';const r=$('misRes');r.style.display='';
  r.innerHTML=`<div class="stt" style="color:${col}">${title}</div>${lines.map(l=>`<div class="stl">${l}</div>`).join('')}<div class="rowb" style="margin-top:16px"><button class="btn cy" id="misAgain">PLAY AGAIN</button><button class="btn" id="misBack2">MISSIONS</button></div>`;
  $('misAgain').onclick=()=>{AU.ui();again();};$('misBack2').onclick=()=>{AU.ui();$('misRes').style.display='none';$('misBody').style.display='';showMissions();};}
function misStart(S){$('misRes').style.display='none';$('misBody').style.display='';STG.camp=STG.camp||'hero';showScreen(null);storyStart(S);}

/* ================= RESCUE ================= */
function rescueMission(){const diff=MIS.diff,nV=[2,3,5][diff],nC=[8,10,12][diff],T=[260,240,210][diff];
  const vil=[];const pool=VILLAIN_IDS.slice().sort(()=>Math.random()-.5);for(let i=0;i<nV;i++)vil.push({h:pool[i%pool.length],take:[1.2,1,.85][diff]});
  const st={saved:0,lost:0,total:nC,t:T};
  const S={playerIdx:mySel,enemies:vil,diff,custom:true,music:'exam',goal:'Rescue the civilians! Hold R next to them',winText:'RESCUE COMPLETE',loseText:'RESCUE FAILED',
    setup(a,b){let spots=civSpots(a,b,70).sort(()=>Math.random()-.5);const pick=[];
      for(const s of spots){if(pick.length>=nC)break;if(pick.some(p=>Math.hypot(p.x-s.x,p.z-s.z)<9))continue;pick.push(s);}
      while(pick.length<nC){const p=randomOpenPoint(a,b,50);pick.push({x:p.x,z:p.z,y:0});}
      pick.forEach((p,i)=>makeCiv(p.x,p.z,p.y,(70+Math.random()*90)*[1.3,1,.85][diff]));
      // villains spread out around the disaster zone
      FS.forEach(f=>{if(f.team===1){const p=randomOpenPoint(a,b,45);f.reset(p.x,p.z,rand(0,6.28));}});},
    tick(dt){st.t-=dt;const ev=civTick(dt);
      ev.saved.forEach(()=>{st.saved++;announceSmall(`CIVILIAN SAVED! ${st.saved}/${st.total}`);addPoints(10,'RESCUE');});
      ev.lost.forEach(()=>{st.lost++;announceSmall('A CIVILIAN WAS LOST');AU.scale=1;AU.tone('sine',300,120,.6,.12);});
      const n=nearestCiv();setArrow(n);const m=Math.max(0,Math.floor(st.t/60)),s=Math.max(0,Math.floor(st.t%60));
      setObj(`<b>RESCUE</b> · ${st.saved} SAVED · ${st.lost} LOST · ${civLeft().length} WAITING<br><span>${m}:${String(s).padStart(2,'0')} LEFT · HOLD R NEXT TO SOMEONE TO SAVE THEM</span>`);
      if(!civLeft().length||st.t<=0)return st.saved>=Math.ceil(st.total*.6);},
    hud(){return civLeft().length+' TO SAVE';},
    end(){setArrow(null);setObj('');},
    done(win){const kills=0+(ME?0:0);const score=st.saved*100+(FS.length?0:0)+Math.max(0,Math.round(st.t))*2;const b=MIS.best.rescue;
      if(!b||st.saved>b.saved||(st.saved===b.saved&&score>b.score)){MIS.best.rescue={saved:st.saved,total:st.total,score};misSave();}
      if(win)addPoints(Math.round(score/10),'MISSION');progAddXP(mySel,win?160:60,'RESCUE');
      misResult(win?'RESCUE COMPLETE':'RESCUE FAILED',win?'#5aff8a':'#ff4a3f',[`${st.saved} OF ${st.total} CIVILIANS SAVED · ${st.lost} LOST`,`SCORE ${score}`+(win?` · +${Math.round(score/10)} POINTS`:' · SAVE 60% TO PASS')],()=>misStart(rescueMission()));}};
  return S;}

/* ================= HERO LICENSE EXAM ================= */
const EXAM_RANKS=[['S',170,30,250],['A',230,55,150],['B',320,80,90],['C',1e9,1e9,50]];
function ringMesh(col){const g=new THREE.Group();const t=new THREE.Mesh(new THREE.TorusGeometry(1.6,.14,10,40),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:.9,blending:THREE.AdditiveBlending,depthWrite:false}));g.add(t);
  const b=new THREE.Mesh(new THREE.CylinderGeometry(.1,.1,60,6,1,true),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:.25,blending:THREE.AdditiveBlending,depthWrite:false}));b.position.y=30;g.add(b);scene.add(g);return g;}
function examMission(){const diff=MIS.diff;const st={ph:0,t:0,hp0:100,hpLost:0,cp:[],ci:0,ring:null,boss:null,civN:4,saved:0,phT:[0,0,0]};
  const S={playerIdx:mySel,enemies:[{h:'bastion',name:'PROCTOR GANTRY',take:[.9,.7,.55][diff],boss:true}],diff,custom:true,music:'exam',goal:'Hero License Exam: Trial 1 · Obstacle course',winText:'EXAM COMPLETE',loseText:'EXAM FAILED',
    setup(a,b){st.boss=FS.find(f=>f.team===1);st.boss.hold=true;st.boss.rig.root.visible=false;const p0=randomOpenPoint(a,b+40,30);st.boss.reset(p0.x,p0.z,0);STG.boss=null;
      // checkpoints: down the street, up onto a rooftop, across, and back down
      const roofs=BLDG.filter(B=>B.h<16&&B.h>5).map(B=>({x:(B.x0+B.x1)/2,z:(B.z0+B.z1)/2,y:floorAt((B.x0+B.x1)/2,(B.z0+B.z1)/2,999)})).filter(r=>Math.hypot(r.x-a,r.z-b)<60).sort((p,q)=>Math.hypot(p.x-a,p.z-b)-Math.hypot(q.x-a,q.z-b));
      const st0=ME.pos.clone();const pts=[[st0.x,st0.z+18,1.6]];if(roofs[0])pts.push([roofs[0].x,roofs[0].z,roofs[0].y+1.6]);if(roofs[1])pts.push([roofs[1].x,roofs[1].z,roofs[1].y+1.6]);
      const q=randomOpenPoint(a,b,40);pts.push([q.x,q.z,1.6]);const q2=randomOpenPoint(q.x,q.z,25);pts.push([q2.x,q2.z,5]);pts.push([st0.x,st0.z,1.6]);st.cp=pts;st.ci=0;nextRing();},
    tick(dt){st.t+=dt;if(ME){st.hpLost+=Math.max(0,st.hp0-ME.hp);st.hp0=ME.hp;}
      if(st.ph===0){const c=st.cp[st.ci];if(st.ring){st.ring.rotation.y+=dt*2;st.ring.children[0].scale.setScalar(1+Math.sin(st.t*5)*.06);}
        setArrow({x:c[0],z:c[1]});setObj(`<b>TRIAL 1 · OBSTACLE COURSE</b> · CHECKPOINT ${st.ci+1}/${st.cp.length}<br><span>${fmtT(st.t)} · climb walls, wall-jump, dash</span>`);
        if(ME&&Math.hypot(ME.pos.x-c[0],ME.pos.z-c[1])<2.6&&Math.abs(ME.pos.y+1-c[2])<2.8){burst(ADD,new V3(c[0],c[2],c[1]),30,{colors:[0x5af0ff,0xffffff],speed:5,life:.5,size:.25,size1:0,bright:2.2});AU.scale=1;AU.pick();st.ci++;
          if(st.ci>=st.cp.length){scene.remove(st.ring);st.ring=null;st.phT[0]=st.t;st.ph=1;announce('TRIAL 2','#5af0ff');announceSmall('RESCUE TRIAL · SAVE 4 CIVILIANS');
            const sp=civSpots(ME.pos.x,ME.pos.z,45).sort(()=>Math.random()-.5).filter((s,i,A)=>A.findIndex(o=>Math.hypot(o.x-s.x,o.z-s.z)<8)===i).slice(0,st.civN);
            while(sp.length<st.civN){const p=randomOpenPoint(ME.pos.x,ME.pos.z,35);sp.push({x:p.x,z:p.z,y:0});}sp.forEach(s=>makeCiv(s.x,s.z,s.y,0));}
          else nextRing();}}
      else if(st.ph===1){const ev=civTick(dt);st.saved+=ev.saved.length;setArrow(nearestCiv());
        setObj(`<b>TRIAL 2 · RESCUE</b> · ${st.saved}/${st.civN} SAVED<br><span>${fmtT(st.t)} · hold R next to a civilian</span>`);
        if(st.saved>=st.civN){st.phT[1]=st.t;st.ph=2;clearCivs();announce('TRIAL 3','#ffd23f');announceSmall('COMBAT TRIAL · DEFEAT THE PROCTOR');
          const B=st.boss,p=randomOpenPoint(ME.pos.x,ME.pos.z,14);B.reset(p.x,p.z,Math.atan2(ME.pos.x-p.x,ME.pos.z-p.z));B.hold=false;B.rig.root.visible=true;B.invuln=1.5;portal(B.chest(new V3()),2,true,1.2);STG.boss=B;}}
      else{setArrow(st.boss&&!st.boss.dead?st.boss.pos:null);setObj(`<b>TRIAL 3 · COMBAT</b> · DEFEAT THE PROCTOR<br><span>${fmtT(st.t)}</span>`);if(st.boss.dead){st.phT[2]=st.t;return true;}}
      // a held proctor can't be hurt
      if(st.boss&&st.boss.hold){st.boss.hp=100;st.boss.invuln=1;}},
    hud(){return ['TRIAL 1/3','TRIAL 2/3','TRIAL 3/3'][st.ph];},
    end(){if(st.ring)scene.remove(st.ring);st.ring=null;setArrow(null);setObj('');},
    done(win){const T=Math.round(st.t),L=Math.round(st.hpLost);let R=EXAM_RANKS[3];if(win)R=EXAM_RANKS.find(r=>T<=r[1]&&L<=r[2]);
      const order='SABC';if(win){const b=MIS.best.exam;if(!b||order.indexOf(R[0])<order.indexOf(b.rank)||(R[0]===b.rank&&T<b.time)){MIS.best.exam={rank:R[0],time:T};misSave();}addPoints(R[3],'LICENSE');}
      progAddXP(mySel,win?{S:260,A:200,B:150,C:110}[R[0]]:50,'EXAM');
      misResult(win?`PROVISIONAL HERO LICENSE · RANK ${R[0]}`:'EXAM FAILED',win?'#ffd23f':'#ff4a3f',
        win?[`TOTAL TIME ${fmtT(T)} · DAMAGE TAKEN ${L}`,`COURSE ${fmtT(st.phT[0])} · RESCUE ${fmtT(st.phT[1]-st.phT[0])} · COMBAT ${fmtT(st.phT[2]-st.phT[1])}`,`+${R[3]} POINTS · RANK S NEEDS UNDER ${fmtT(EXAM_RANKS[0][1])} AND ${EXAM_RANKS[0][2]} DAMAGE`]:['You were knocked out. Retake the exam!'],()=>misStart(examMission()));}};
  function nextRing(){if(st.ring)scene.remove(st.ring);const c=st.cp[st.ci];st.ring=ringMesh(st.ci===st.cp.length-1?0xffd23f:0x5af0ff);st.ring.position.set(c[0],c[2],c[1]);}
  return S;}
function fmtT(t){t=Math.max(0,Math.round(t));return Math.floor(t/60)+':'+String(t%60).padStart(2,'0');}
$('bMissions').onclick=()=>{AU.init();AU.ui();showMissions();};
$('misBack').onclick=()=>{AU.ui();showScreen('gmodes');};
$('misRescue').onclick=()=>{AU.init();AU.ui();misStart(rescueMission());};
$('misExam').onclick=()=>{AU.init();AU.ui();misStart(examMission());};
window.__mis={rescueMission,examMission,misStart,CIVS,MIS};
