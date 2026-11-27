/* COSTUMES — every fighter wears their own outfit: a real face and hair (humans.js) plus clothes and gear themed to who
   they are and what their power does. Fighters inspired by characters from other series take the *idea* of that
   character (their job, attitude, power) into a new outfit of our own — no signature costume pieces are copied.
   The old armored suits are still there: the fighter-select ARMOR toggle (and your saved preference) switches to them.

   How it works: after the body is built, the generic armor bits are removed, the base body is recoloured by region
   (shirt / sleeves / hands / trousers / shoes), and garment pieces are added from the library below. A fighter's
   outfit is one COS entry: base colours + a list of [piece, options]. Colours can be numbers or tokens that follow
   shop skins: 'C' = main colour, 'A' = accent, 'S' = suit colour, 'M' = secondary colour. */

/* ---------- fabric / leather / metal surface textures (normal maps, made once) ---------- */
const CTX={};
function cosNormal(kind){if(CTX[kind])return CTX[kind];const S=128,[c,g]=cv(S,S);g.fillStyle='#808080';g.fillRect(0,0,S,S);
  if(kind==='twill'){g.strokeStyle='rgba(40,40,40,.6)';g.lineWidth=1.5;for(let i=-S;i<S*2;i+=5){g.beginPath();g.moveTo(i,0);g.lineTo(i+S,S);g.stroke();}
    for(let i=0;i<800;i++){const v=110+Math.random()*40|0;g.fillStyle=`rgba(${v},${v},${v},.5)`;g.fillRect(Math.random()*S,Math.random()*S,2,1);}}
  else if(kind==='leather'){for(let i=0;i<260;i++){const v=90+Math.random()*80|0;g.fillStyle=`rgba(${v},${v},${v},.55)`;g.beginPath();g.arc(Math.random()*S,Math.random()*S,1+Math.random()*4,0,7);g.fill();}
    g.strokeStyle='rgba(50,50,50,.35)';g.lineWidth=.8;for(let i=0;i<40;i++){g.beginPath();const x=Math.random()*S,y=Math.random()*S;g.moveTo(x,y);g.quadraticCurveTo(x+rand(-12,12),y+rand(-12,12),x+rand(-18,18),y+rand(-18,18));g.stroke();}}
  else if(kind==='knit'){for(let x=0;x<S;x+=8)for(let y=0;y<S;y+=6){g.fillStyle='rgba(170,170,170,.8)';g.beginPath();g.ellipse(x+2,y+3,2,3.2,.5,0,7);g.fill();g.beginPath();g.ellipse(x+6,y+3,2,3.2,-.5,0,7);g.fill();}}
  else if(kind==='quilt'){g.strokeStyle='rgba(30,30,30,.9)';g.lineWidth=2.5;for(let i=-S;i<S*2;i+=32){g.beginPath();g.moveTo(i,0);g.lineTo(i+S,S);g.stroke();g.beginPath();g.moveTo(i,S);g.lineTo(i+S,0);g.stroke();}
    const gr=g.createRadialGradient(16,16,2,16,16,18);gr.addColorStop(0,'rgba(200,200,200,.6)');gr.addColorStop(1,'rgba(128,128,128,0)');for(let y=-16;y<S;y+=32)for(let x=-16;x<S;x+=32){g.save();g.translate(x+16,y);g.fillStyle=gr;g.fillRect(-16,0,32,32);g.restore();}}
  else if(kind==='scales'){g.strokeStyle='rgba(30,30,30,.9)';g.lineWidth=2;for(let y=0;y<S+12;y+=10)for(let x=(y/10%2)*8;x<S+16;x+=16){g.beginPath();g.arc(x,y,8,0,Math.PI);g.stroke();}}
  else if(kind==='rubber'){for(let i=0;i<1500;i++){const v=118+Math.random()*20|0;g.fillStyle=`rgb(${v},${v},${v})`;g.fillRect(Math.random()*S,Math.random()*S,1,1);}}
  else if(kind==='sequin'){for(let y=0;y<S;y+=6)for(let x=(y/6%2)*3;x<S;x+=6){const v=150+Math.random()*80|0;g.fillStyle=`rgb(${v},${v},${v})`;g.beginPath();g.arc(x,y,2.6,0,7);g.fill();}}
  else if(kind==='fur'){g.strokeStyle='rgba(60,60,60,.5)';for(let i=0;i<900;i++){g.lineWidth=rand(.5,1.4);const x=Math.random()*S,y=Math.random()*S;g.beginPath();g.moveTo(x,y);g.lineTo(x+rand(-2,2),y+rand(4,9));g.stroke();}}
  else{// plain woven cloth
    for(let y=0;y<S;y+=4)for(let x=0;x<S;x+=4){const v=((x+y)/4)%2?150:104;g.fillStyle=`rgb(${v},${v},${v})`;g.fillRect(x,y,4,2);}}
  const t=normalFromHeight(c,kind==='quilt'?2.4:kind==='leather'?1.4:1.6);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(kind==='quilt'?3:6,kind==='quilt'?3:6);CTX[kind]=t;return t;}
const COS_KIND={cloth:{n:'cloth',r:.86},denim:{n:'twill',r:.92},leather:{n:'leather',r:.42,cc:.35},rubber:{n:'rubber',r:.32,cc:.6},metal:{n:'metal',r:.3,m:.85},
  gold:{n:'metal',r:.25,m:1},knit:{n:'knit',r:.95},quilt:{n:'quilt',r:.7},silk:{n:'cloth',r:.38,cc:.25},fur:{n:'fur',r:1},scales:{n:'scales',r:.45,cc:.3},sequin:{n:'sequin',r:.25,m:.6,cc:.5},
  plastic:{n:'rubber',r:.35,cc:.8},glass:{n:null,r:.05,cc:1},glow:{n:null,r:.3,e:1},bone:{n:'leather',r:.6}};

/* ---------- the builder ---------- */
function cosCtx(R,h){const env=R.mats&&R.mats[0]&&R.mats[0].envMap;const cache={};const look=typeof humanLook==='function'?humanLook(h):[2];
  const tok=c=>c==='C'?h.color:c==='A'?h.accent:c==='S'?h.suit:c==='M'?(h.mainCol!=null?h.mainCol:h.color):c==='skin'?SKIN[look[0]]:c==='hair'?look[1]:c;
  const mat=(kind,col,o)=>{col=tok(col);const key=kind+'|'+col+'|'+(o?JSON.stringify(o):'');if(cache[key])return cache[key];const K=COS_KIND[kind]||COS_KIND.cloth;
    const P={color:new THREE.Color(col).convertSRGBToLinear(),roughness:K.r,metalness:K.m||0};if(K.cc){P.clearcoat=K.cc;P.clearcoatRoughness=.4;}
    if(K.e){P.emissive=new THREE.Color(col);P.emissiveIntensity=(o&&o.e)||1.8;}
    if(kind==='glass'){P.transparent=true;P.opacity=(o&&o.op)||.55;}
    const m=K.cc||kind==='glass'?new THREE.MeshPhysicalMaterial(P):new THREE.MeshStandardMaterial(P);
    if(K.n==='metal'){m.normalMap=scratchNormal();m.normalScale=new THREE.Vector2(.3,.3);}else if(K.n){m.normalMap=cosNormal(K.n);m.normalScale=new THREE.Vector2(.5,.5);}
    if(o&&o.side)m.side=THREE.DoubleSide;if(env){m.envMap=env;m.envMapIntensity=K.m?.9:.3;}
    if(kind!=='glow'&&kind!=='glass'){enhanceMat(m,h.accent,.18);R.mats.push(m);}
    cache[key]=m;return m;};
  const add=(par,g,m,p,r,s)=>{const o=new THREE.Mesh(g,m);if(p)o.position.set(p[0],p[1],p[2]);if(r)o.rotation.set(r[0],r[1],r[2]);if(s)o.scale.set(s[0],s[1],s[2]);o.castShadow=true;o.userData.cos=1;par.add(o);return o;};
  return {R,h,B:h.bulk||1,BX:1+((h.bulk||1)-1)*.6,tok,mat,add,anim:[]};}
// body meshes by their (cached) geometry
function cosGeoKey(m){for(const k in GC)if(GC[k]===m.geometry)return k;return null;}
const COS_ARMOR=new Set(['plate','s0.1_32','s0.045_16','emb','embR','strip','pad','padR','gaunt','ring','kp','cuff','sole','belt','buck']);
const COS_BODY={torso:'top','s0.2_32':'pelvis','cap0.07_0.062_0.28':'upper','s0.058_24':'upper','cap0.062_0.052_0.25':'lower','cap0.105_0.08_0.42':'thigh','s0.075_24':'thigh',
  'cap0.078_0.062_0.38':'shin',boot:'shoe',toe:'toe','s0.06_24':'hand','cap0.016_0.014_0.045':'hand','cap0.018_0.015_0.04':'hand'};
function costumeBuild(R,h,C){const G=cosCtx(R,h),{mat,add}=G,b=C.base||{};
  const protect=new Set();[R.whip&&R.whip.group,R.beam&&R.beam.group,R.beast&&R.beast.group,R.frame,R.field,R.sword,R.flames,R.swordTip].concat(R.blades||[],R.spikes?[R.spikes]:[],R.wings||[],R.orbiters||[]).forEach(o=>{if(o&&o.traverse)o.traverse(q=>protect.add(q));});
  if(R.cloth&&R.cloth.mesh&&C.cape!==false&&!C.keepCape){R.cloth.mesh.visible=false;R.cloth=null;}
  const bones=[R.spine,R.hips,R.neck,R.lS,R.rS,R.lE,R.rE,R.lF,R.rF,R.lH,R.rH,R.lK,R.rK];
  const legsR=b.legsR!=null?mat(b.legK||'denim',b.legsR):null;const sl=b.sleeve||'long',top=mat(b.topK||'cloth',b.top!=null?b.top:'S'),legs=mat(b.legK||'denim',b.legs!=null?b.legs:0x2a2c34),shoe=mat(b.shoeK||'leather',b.shoe!=null?b.shoe:0x1a1a1e),
    skin=mat('cloth','skin'),hand=b.hands==null||b.hands==='skin'?skin:mat(b.handK||'leather',b.hands),sole=mat('rubber',b.sole!=null?b.sole:0x111114);
  for(const bn of bones){if(!bn)continue;const list=(bn===R.lF||bn===R.rF)?(()=>{const a=[];bn.traverse(q=>{if(q!==bn)a.push(q);});return a;})():bn.children.slice();
    list.forEach(o=>{if(protect.has(o)||o.userData.cos||o===R.head)return;if(bones.indexOf(o)>=0)return;
      if(!o.isMesh){if(C.hideDecor&&o.parent===bn&&!(C.keepDecor&&C.keepDecor(o,bn,R))&&bn!==R.lF&&bn!==R.rF)o.visible=false;return;}
      const k=cosGeoKey(o);if(k&&COS_ARMOR.has(k)){o.visible=false;return;}
      const reg=k&&COS_BODY[k];if(reg){if(bn===R.neck)return;
        o.visible=true;o.material=reg==='top'?top:reg==='pelvis'?legs:reg==='thigh'?(legsR&&bn===R.rH?legsR:legs):reg==='shin'?(b.shin!=null?mat(b.shinK||'leather',b.shin):legsR&&bn===R.rK?legsR:legs):reg==='shoe'?shoe:reg==='toe'?(b.toe!=null?mat('leather',b.toe):shoe):
          reg==='upper'?(sl==='none'?skin:top):reg==='lower'?(sl==='long'?top:skin):reg==='hand'?(b.fingerless&&(k!=='s0.06_24')?skin:hand):o.material;return;}
      // any other decoration: armor-layer bits always go; power props stay unless this outfit hides them
      if(C.hideDecor&&o.parent===bn&&!(C.keepDecor&&C.keepDecor(o,bn,R)))o.visible=false;});}
  if(R.head)R.head.traverse(o=>{if(o.isMesh&&o.material&&o.material.color&&!o.material.userData.lin&&!o.userData.cos&&o.material.isMeshStandardMaterial){o.material.userData.lin=1;o.material.color.convertSRGBToLinear();}});
  // the old armor neck ring / extra neck pieces stay hidden (humanize did that); shoe soles get a rubber sole
  [R.lK,R.rK].forEach(k=>{if(!k)return;add(k,cg('cSole',()=>new THREE.BoxGeometry(.146,.025,.3)),sole,[0,-.495,.05]);});
  (C.parts||[]).forEach(([name,o])=>{const f=COS_PARTS[name];if(!f){console.warn('no costume part',name);return;}try{f(G,o||{});}catch(e){console.warn('costume part',h.id,name,e);}});
  if(!C.hideDecor&&R.mats){const tc=new THREE.Color(G.tok(b.top!=null?b.top:'S')).convertSRGBToLinear(),lc=new THREE.Color(G.tok(b.legs!=null?b.legs:0x2a2c34)).convertSRGBToLinear();
    if(R.mats[1]&&R.mats[1].color)R.mats[1].color.copy(tc);if(R.mats[0]&&R.mats[0].color)R.mats[0].color.copy(lc);}
  R.cosAnim=G.anim;return G;}
// per-frame motion for coat tails, capes, hanging straps
function cosTick(R,speed,t){if(!R||!R.cosAnim)return;for(const a of R.cosAnim)a(speed||0,t||0);}

/* ---------- garment library ---------- */
const TOP_PROFILE=(grow,ext)=>{const P=TORSO.slice(1,-1).map(([y,r])=>[y,r*grow+.012]);if(ext)P.unshift([-ext,.26*grow],[-ext*.5,.235*grow]);return P;};
const COS_PARTS={
  belly(G,o){const {R,mat}=G;R.spine.children.forEach(c=>{if(c.isMesh&&c.geometry&&c.geometry.type==='SphereGeometry'&&c.geometry.parameters.radius>=.4)c.material=mat(o.k||'quilt',o.col||'C');});},
  bib(G,o){// overalls: a front bib with two straps over the shoulders
    const {R,mat,add,B,BX}=G,m=mat(o.k||'denim',o.col||0x3a4a5a,{side:1});add(R.spine,cg('cBib',()=>new THREE.LatheGeometry(TOP_PROFILE(1.11,0).filter(([y])=>y<.44).map(([y,r])=>new THREE.Vector2(r,y)),24,-.55,1.1)),m,null,null,[B,1,.72*BX]);
    [-1,1].forEach(s=>add(R.spine,cg('cBibS',()=>new THREE.TorusGeometry(.2,.016,6,24)),m,[s*.1*B,.45,0],[0,Math.PI/2,0],[1,1.3,.98*BX]));
    [-1,1].forEach(s=>add(R.spine,cg('cBibB',()=>new THREE.CylinderGeometry(.015,.015,.01,10)),mat('metal',0xc8c8d0),[s*.1,.42,.25*BX],[Math.PI/2,0,0]));},
  bands(G,o){// reflective / coloured bands around the torso
    const {R,mat,add,B,BX}=G,m=mat(o.k||'plastic',o.col||0xd8d8d8);(o.y||[.22,.36]).forEach(y=>add(R.spine,cg('cBd'+y,()=>new THREE.TorusGeometry(.285,.016,6,40)),m,[0,y,0],[Math.PI/2,0,0],[B*(y<.3?.92:1.02),.75*BX*(y<.3?.92:1.02),1]));},
  ropecoil(G,o){const {R,mat,add}=G,m=mat(o.k||'rubber',o.col||0x8a9ab0);for(let i=0;i<4;i++)add(R.hips,cg('cRc',()=>new THREE.TorusGeometry(.07,.014,6,20)),m,[o.side==='r'?-.24:.24,-.06+i*.018,0],[0,Math.PI/2,0]);},
  visorcap(G,o){const {R,mat,add}=G;add(R.head,cg('cVcB',()=>new THREE.CylinderGeometry(.165,.165,.03,24,1,true)),mat('cloth',o.band||0x1a1a14),[0,.2,0],[-.1,0,0]);
    add(R.head,cg('cVcV',()=>new THREE.CylinderGeometry(.14,.15,.01,20,1,false,-Math.PI*.4,Math.PI*.8)),mat('glass',o.col||0x2a8a4a,{op:.7}),[0,.19,.15],[-.25,0,0]);},
  hairstar(G,o){const {R,add}=G,M=new THREE.MeshBasicMaterial({map:emblemTex('star',G.tok(o.col||'A')),transparent:true,depthWrite:false,side:THREE.DoubleSide});[-1,1].forEach(s=>add(R.head,new THREE.PlaneGeometry(.07,.07),M,[s*.12,.22,.06],[0,s*.9,0]));},
  wristbands(G,o){const {R,mat,add}=G,m=mat('knit',o.col||'A');[R.lE,R.rE].forEach(e=>add(e,cg('cWb',()=>new THREE.CylinderGeometry(.07,.066,.06,16)),m,[0,-.24,0]));},
  // jacket / coat body over the torso. o: col, k(kind), open, len ('hip'|'waist'), sleeves ('long'|'short'|'none'|'rolled'), collar, trim
  jacket(G,o){const {R,mat,add,B,BX}=G,m=mat(o.k||'cloth',o.col||'C',{side:1}),open=o.open?(o.gap||.42):0;const ext=o.len==='waist'?0:o.len==='crop'?-.12:.16,gr=o.grow||1.09;
    const mk=(p0,pl)=>cg('cJk'+ext+'_'+gr+'_'+p0.toFixed(3)+'_'+pl.toFixed(3),()=>{let P=TOP_PROFILE(gr,ext>0?ext:0);if(ext<0)P=P.filter(([y])=>y>-ext);return new THREE.LatheGeometry(P.map(([y,r])=>new THREE.Vector2(r,y)),40,p0,pl);});
    if(o.split){add(R.spine,mk(open,Math.PI-open),mat(o.k||'cloth',o.split[0],{side:1}),null,null,[B,1,.72*BX]);add(R.spine,mk(Math.PI,Math.PI-open),mat(o.k||'cloth',o.split[1],{side:1}),null,null,[B,1,.72*BX]);}
    else add(R.spine,mk(open,Math.PI*2-open*2),m,[0,0,0],[0,0,0],[B,1,.72*BX]);
    if(o.sleeves!=='none'){const up=cg('cSlU',()=>capsule(.079,.071,.27)),lo=cg('cSlL',()=>capsule(.071,.062,.22));[[R.lS,R.lE],[R.rS,R.rE]].forEach(([s,e],si)=>{const sm=o.split?mat(o.k||'cloth',o.split[si],{side:1}):m;add(s,up,sm,[0,-.005,0],null,[B,1,B]);
      if(o.sleeves!=='short'&&o.sleeves!=='rolled')add(e,lo,sm,[0,0,0],null,[B,1,B]);if(o.sleeves==='rolled')add(e,cg('cRoll',()=>new THREE.TorusGeometry(.068,.022,8,20)),m,[0,-.02,0],[Math.PI/2,0,0],[B,B,1]);
      if(o.cuff)add(e,cg('cCuf',()=>new THREE.CylinderGeometry(.068,.064,.05,18)),mat(o.cuffK||o.k||'cloth',o.cuff),[0,-.2,0],null,[B,1,B]);});}
    if(o.collar)COS_PARTS.collar(G,{col:o.collarCol||o.col||'C',k:o.collarK||o.k,type:o.collar});
    if(open&&o.lapel!==false){const lm=mat(o.k||'cloth',o.lapelCol||o.col||'C',{side:1});[-1,1].forEach(s=>add(R.spine,cg('cLap',()=>{const g=new THREE.BoxGeometry(.06,.24,.012);g.translate(0,-.12,0);return g;}),lm,[s*.07*B,.62,.2*BX],[-.18,s*.25,s*.32]));}
    if(o.trim){const tm=mat('cloth',o.trim);const hemY=ext>0?-ext+.01:-ext+.03;add(R.spine,cg('cHem'+B,()=>new THREE.TorusGeometry(.268,.012,6,40)),tm,[0,ext>0?-ext+.012:Math.max(.02,-ext),0],[Math.PI/2,0,0],[B*(ext>0?1.0:.85),.72*BX*(ext>0?1:.85),1]);}
    if(o.zip!==false&&!open)add(R.spine,cg('cZip',()=>new THREE.BoxGeometry(.012,.5,.008)),mat('metal',o.zipCol||0x9a9aa4),[0,.3,.232*BX],[-.05,0,0]);},
  // a vest / waistcoat / tank top: no sleeves
  vest(G,o){COS_PARTS.jacket(G,Object.assign({sleeves:'none',len:'waist',zip:false,grow:1.045},o));},
  // long coat skirt hanging from the waist in panels that swing with the legs
  coat(G,o){const {R,mat,add,B}=G,m=mat(o.k||'cloth',o.col||'C',{side:1}),L=o.len||.75,rT=.25*B,rB=(o.flare||.34)*B;
    const mk=(t0,tl)=>cg('cCt'+L+'_'+rT+'_'+rB+'_'+t0+'_'+tl,()=>{const g=new THREE.CylinderGeometry(rT,rB,L,14,4,true,t0,tl);g.translate(0,-L/2,0);return g;});
    const piv=(t0,tl)=>{const p=new THREE.Group();p.position.set(0,.02,0);R.hips.add(p);const s=add(p,mk(t0,tl),m);s.scale.z=.82;return p;};
    const open=o.open===false?0:.35,back=piv(Math.PI*.62,Math.PI*.76),lf=piv(open,Math.PI*.62-open),rf=piv(Math.PI*1.38,Math.PI*.62-open);
    if(o.trim){const tm=mat('cloth',o.trim);[back,lf,rf].forEach(p=>{const ch=p.children[0],gp=ch.geometry.parameters;const r=add(p,new THREE.CylinderGeometry(rB+.004,rB+.006,.035,14,1,true,gp.thetaStart,gp.thetaLength),tm,[0,-L+.02,0]);r.scale.z=.82;});}
    G.anim.push((sp)=>{const lx=R.lH.rotation.x,rx=R.rH.rotation.x,fl=Math.min(.9,sp*.045);lf.rotation.x=Math.min(.2,lx*.75)-fl*.2;rf.rotation.x=Math.min(.2,rx*.75)-fl*.2;
      back.rotation.x=Math.max(0,Math.max(lx,rx))*.7+fl;lf.rotation.z=.04;rf.rotation.z=-.04;});},
  // a skirt / kilt / tasset ring around the hips
  skirt(G,o){const {R,mat,add,B}=G,L=o.len||.3,m=mat(o.k||'cloth',o.col||'C',{side:1});const g=cg('cSk'+L+(o.flare||.36),()=>{const g=new THREE.CylinderGeometry(.24,(o.flare||.36),L,24,2,true);g.translate(0,-L/2,0);return g;});
    const p=new THREE.Group();p.position.y=.04;R.hips.add(p);const s=add(p,g,m,null,null,[B,1,.85*B]);
    if(o.pleats)for(let i=0;i<16;i++){const a=i/16*6.283;add(p,cg('cPl'+L,()=>new THREE.BoxGeometry(.012,L*.96,.012)),m,[Math.sin(a)*(.24+(o.flare||.36))/2*B,-L/2,Math.cos(a)*(.24+(o.flare||.36))/2*.85*B],[Math.cos(a)*-.35,0,Math.sin(a)*.35]);}
    G.anim.push(sp=>{const lx=R.lH.rotation.x,rx=R.rH.rotation.x;p.rotation.x=(lx+rx)*.25+Math.min(.5,sp*.03);});},
  // wide pleated trousers (one flared tube per leg) — follow the legs
  hakama(G,o){const {R,mat,add,B}=G,m=mat(o.k||'cloth',o.col||'C',{side:1});const g=cg('cHk',()=>{const g=new THREE.CylinderGeometry(.122,.17,.92,16,1,true);g.translate(0,-.46,0);return g;});
    [R.lH,R.rH].forEach(hp=>add(hp,g,m,[0,.02,0],null,[B,1,B]));if(o.waist!==false)add(R.hips,cg('cHkW',()=>new THREE.CylinderGeometry(.235,.25,.16,24,1,true)),m,[0,.0,0],null,[B,1,.85*B]);},
  // pant details
  legstripe(G,o){const {R,mat,add}=G,m=mat('cloth',o.col||'A');[R.lH,R.rH].forEach((hp,i)=>{const s=i?-1:1;add(hp,cg('cLs',()=>new THREE.BoxGeometry(.014,.46,.012)),m,[s*.1,-.22,0]);});
    [R.lK,R.rK].forEach((k,i)=>{const s=i?-1:1;add(k,cg('cLs2',()=>new THREE.BoxGeometry(.012,.38,.012)),m,[s*.075,-.19,0]);});},
  kneepads(G,o){const {R,mat,add}=G,m=mat(o.k||'rubber',o.col||0x1a1a1e);[R.lK,R.rK].forEach(k=>add(k,cg('cKp',()=>new THREE.SphereGeometry(.085,16,10,0,Math.PI*2,0,Math.PI*.55)),m,[0,-.01,.045],[Math.PI/2,0,0],[1,1,.8]));},
  greaves(G,o){const {R,mat,add}=G,m=mat(o.k||'metal',o.col||0x6a6e78);[R.lK,R.rK].forEach(k=>{add(k,cg('cGr',()=>new THREE.CylinderGeometry(.088,.078,.3,16,1,true,-1.3,2.6)),m,[0,-.2,.004]);
    add(k,cg('cGk',()=>new THREE.SphereGeometry(.08,16,10,0,Math.PI*2,0,Math.PI*.55)),m,[0,-.01,.05],[Math.PI/2,0,0],[1,1,.8]);});},
  // footwear
  boots(G,o){const {R,mat,add}=G,m=mat(o.k||'leather',o.col||0x1a1410);[R.lK,R.rK].forEach(k=>{add(k,cg('cBt'+(o.h||.24),()=>new THREE.CylinderGeometry(.084,.08,o.h||.24,18)),m,[0,-.42+(o.h||.24)/2,0]);
      if(o.cuff)add(k,cg('cBc',()=>new THREE.TorusGeometry(.086,.014,6,18)),mat(o.cuffK||'leather',o.cuff),[0,-.42+(o.h||.24),0],[Math.PI/2,0,0]);
      if(o.buckles)for(let i=0;i<2;i++)add(k,cg('cBb',()=>new THREE.BoxGeometry(.04,.018,.012)),mat('metal',0xb0b0b8),[0,-.36+i*.08,.085]);});
    if(o.shoe!==false)[R.lK,R.rK].forEach(k=>k.children.forEach(c=>{if(c.isMesh&&(cosGeoKey(c)==='boot'||cosGeoKey(c)==='toe'))c.material=m;}));},
  sneakers(G,o){const {R,mat}=G,m=mat('leather',o.col||0xf2f2f2),a=mat('rubber',o.acc||'A');[R.lK,R.rK].forEach(k=>{k.children.forEach(c=>{if(!c.isMesh)return;const gk=cosGeoKey(c);if(gk==='boot')c.material=m;if(gk==='toe')c.material=a;});
      G.add(k,cg('cSnS',()=>new THREE.BoxGeometry(.148,.02,.18)),a,[0,-.47,.0]);});},
  sandals(G,o){const {R,mat,add}=G,s=mat('cloth','skin'),w=mat('leather',o.col||0x3a2a1a);[R.lK,R.rK].forEach(k=>{k.children.forEach(c=>{if(!c.isMesh)return;const gk=cosGeoKey(c);if(gk==='boot'||gk==='toe')c.material=s;});
      add(k,cg('cSdl',()=>new THREE.BoxGeometry(.15,.03,.31)),w,[0,-.5,.05]);add(k,cg('cSdS',()=>new THREE.TorusGeometry(.07,.01,6,16,Math.PI)),w,[0,-.47,.1],[0,0,0],[1,.6,1]);});},
  wraps(G,o){// bandage / cloth wraps around forearms or shins
    const {R,mat,add}=G,m=mat(o.k||'cloth',o.col||0xe8e0cc),where=o.where||'arms';const segs=where==='arms'?[R.lE,R.rE]:[R.lK,R.rK];
    segs.forEach(e=>{for(let i=0;i<(o.n||5);i++)add(e,cg('cWr'+where,()=>new THREE.TorusGeometry(where==='arms'?.064:.08,.014,6,18)),m,[0,(where==='arms'?-.05:-.1)-i*.045,0],[Math.PI/2+(i%2?.18:-.18),0,0]);});},
  // hands
  gauntlets(G,o){const {R,mat,add,B}=G,m=mat(o.k||'metal',o.col||0x5a5e68);[R.lE,R.rE].forEach(e=>{add(e,cg('cGa'+(o.big?1:0),()=>new THREE.CylinderGeometry(o.big?.09:.074,o.big?.1:.066,o.big?.2:.16,18)),m,[0,-.2,0],null,[B,1,B]);
      if(o.spikes)for(let i=0;i<3;i++)add(e,cg('cGs',()=>new THREE.ConeGeometry(.016,.07,6)),mat('metal',0xc8c8d0),[0,-.14-i*.045,-.08],[-1.57,0,0]);
      if(o.glow)add(e,cg('cGg',()=>new THREE.TorusGeometry(o.big?.093:.075,.008,6,20)),mat('glow',o.glow),[0,-.13,0],[Math.PI/2,0,0]);});},
  knuckles(G,o){const {R,mat,add}=G,m=mat('gold',o.col||0xc8a050);[R.lF,R.rF].forEach(f=>add(f,cg('cKn',()=>new THREE.BoxGeometry(.11,.03,.03)),m,[0,-.05,.06]));},
  // neck
  collar(G,o){const {R,mat,add}=G,m=mat(o.k||'cloth',o.col||'C',{side:1}),t=o.type||'high';
    if(t==='high'||t==='pop')add(R.neck,cg('cCo'+t,()=>new THREE.CylinderGeometry(t==='pop'?.135:.105,.1,t==='pop'?.12:.09,24,1,true,Math.PI*(t==='pop'?.34:.26),Math.PI*(t==='pop'?1.32:1.48))),m,[0,t==='pop'?.02:.015,-.012],[t==='pop'?.12:0,Math.PI,0]);
    if(t==='fur'||t==='puff')add(R.neck,cg('cCoF',()=>new THREE.TorusGeometry(.13,.05,10,24)),mat(t==='fur'?'fur':o.k||'cloth',o.col||'C'),[0,-.02,-.01],[Math.PI/2,0,0],[1.15,1,1]);
    if(t==='turtle')add(R.neck,cg('cCoT',()=>new THREE.CylinderGeometry(.085,.09,.1,20)),m,[0,.02,0]);
    if(t==='shirt'){[-1,1].forEach(s=>add(R.neck,cg('cCoS',()=>new THREE.BoxGeometry(.07,.04,.01)),m,[s*.05,-.02,.08],[.5,s*.4,s*.6]));}},
  scarf(G,o){const {R,mat,add}=G,m=mat(o.k||'knit',o.col||'A',{side:1});for(let i=0;i<(o.wraps||2);i++)add(R.neck,cg('cSc'+i,()=>new THREE.TorusGeometry(.1+i*.012,.035,10,24)),m,[0,-.02+i*.04,0],[Math.PI/2+(i?.15:-.1),0,0],[1.1,1,1]);
    const tails=[];const tl=o.len||.45;(o.tails||[[.06,1],[-.02,1]]).forEach(([x,back],i)=>{const p=new THREE.Group();p.position.set(x,-.02,back?-.12:.12);R.neck.add(p);
      add(p,cg('cScT'+tl,()=>{const g=new THREE.BoxGeometry(.075,tl,.018,1,6);g.translate(0,-tl/2,0);return g;}),m);tails.push([p,back,i]);});
    G.anim.push((sp,t)=>{tails.forEach(([p,back,i])=>{p.rotation.x=(back?1:-1)*(.1+Math.min(1.1,sp*.08))+Math.sin(t*5+i)*.06*(1+sp*.1);});});},
  tie(G,o){const {R,mat,add,BX}=G,m=mat(o.k||'silk',o.col||'A');if(o.bow){[-1,1].forEach(s=>add(R.neck,cg('cBow',()=>new THREE.ConeGeometry(.03,.06,4)),m,[s*.028,-.035,.085],[0,0,s*Math.PI/2]));return;}
    add(R.spine,cg('cTie',()=>{const g=new THREE.BoxGeometry(.045,.34,.012);g.translate(0,-.17,0);return g;}),m,[0,.64,.225*BX],[-.12,0,0]);},
  hood(G,o){const {R,mat,add}=G,m=mat(o.k||'cloth',o.col||'C',{side:1});if(o.up){add(R.head,cg('cHdU',()=>new THREE.SphereGeometry(.2,24,18,-Math.PI*.72,Math.PI*1.44,0,Math.PI*.78)),m,[0,.12,-.02],[0,-Math.PI/2,0],[1.12,1.1,1]);return;}   // the opening faces forward (it used to face the side and hide the face)
    add(R.neck,cg('cHdD',()=>new THREE.SphereGeometry(.17,20,14,0,Math.PI*2,Math.PI*.35,Math.PI*.4)),m,[0,-.02,-.1],[-.5,0,0],[1.1,.7,.9]);},
  // head
  headband(G,o){const {R,mat,add}=G,m=mat(o.k||'cloth',o.col||'A');add(R.head,cg('cHb',()=>new THREE.TorusGeometry(.158,.016,8,30)),m,[0,.19,0],[Math.PI/2-.12,0,0],[.98,1.07,1]);
    if(o.tails!==false){const p=new THREE.Group();p.position.set(0,.19,-.17);R.head.add(p);for(let i=0;i<2;i++)add(p,cg('cHbT',()=>{const g=new THREE.BoxGeometry(.03,.22,.006);g.translate(0,-.11,0);return g;}),m,[(i-.5)*.03,0,0],[.4,0,(i-.5)*.3]);
      G.anim.push((sp,t)=>{p.rotation.x=.3+Math.min(1,sp*.07)+Math.sin(t*6)*.05;});}
    if(o.plate)add(R.head,cg('cHbP',()=>new THREE.BoxGeometry(.09,.04,.01)),mat('metal',o.plate),[0,.2,.155],[-.12,0,0]);},
  goggles(G,o){const {R,mat,add}=G,fr=mat('rubber',o.frame||0x1a1a1e),ln=mat('glass',o.lens||'A',{op:.75}),y=o.forehead?.23:.135,tilt=o.forehead?-.5:0;
    [-1,1].forEach(s=>{add(R.head,cg('cGgF',()=>new THREE.CylinderGeometry(.032,.034,.03,18)),fr,[s*.052,y,.142+(o.forehead?-.02:0)],[Math.PI/2+tilt,0,0]);add(R.head,cg('cGgL',()=>new THREE.CircleGeometry(.027,18)),ln,[s*.052,y+(o.forehead?.008:0),.158+(o.forehead?-.026:0)],[tilt,0,0]);});
    add(R.head,cg('cGgS',()=>new THREE.TorusGeometry(.162,.009,6,30)),fr,[0,y,0],[Math.PI/2+tilt*.4,0,0],[1,1.06,1]);},
  shades(G,o){const {R,mat,add}=G,m=mat('glass',o.col||0x101014,{op:.9});add(R.head,cg('cSh'+(o.visor?1:0),()=>new THREE.SphereGeometry(.158,24,6,Math.PI*.18,Math.PI*.64,Math.PI*.44,Math.PI*(o.visor?.1:.08))),m,[0,.12,0],[0,0,0],[.98,1.1,1.07]);
    if(o.glow)add(R.head,cg('cShG',()=>new THREE.SphereGeometry(.16,24,4,Math.PI*.2,Math.PI*.6,Math.PI*.47,Math.PI*.02)),mat('glow',o.glow),[0,.12,0],null,[.98,1.1,1.07]);},
  mask(G,o){// lower-face mask (cloth / respirator / surgical)
    const {R,mat,add}=G,m=mat(o.k||'cloth',o.col||0x1a1a1e,{side:1});add(R.head,cg('cMk',()=>new THREE.SphereGeometry(.156,24,12,Math.PI*.12,Math.PI*.76,Math.PI*.5,Math.PI*.34)),m,[0,.12,.006],null,[.99,1.13,1.08]);
    if(o.filters)[-1,1].forEach(s=>add(R.head,cg('cMkF',()=>new THREE.CylinderGeometry(.03,.034,.04,16)),mat('rubber',o.filters),[s*.07,.02,.13],[Math.PI/2,0,s*.5]));
    if(o.loops)[-1,1].forEach(s=>add(R.head,cg('cMkL',()=>new THREE.TorusGeometry(.03,.004,4,12)),m,[s*.14,.1,.02],[0,Math.PI/2,0]));},
  eyemask(G,o){const {R,mat,add}=G;add(R.head,cg('cEm',()=>new THREE.SphereGeometry(.158,24,6,Math.PI*.14,Math.PI*.72,Math.PI*.4,Math.PI*.14)),mat(o.k||'cloth',o.col||0x101014,{side:1}),[0,.12,.002],null,[.99,1.11,1.08]);},
  cap(G,o){const {R,mat,add}=G,m=mat(o.k||'cloth',o.col||'C');add(R.head,cg('cCp',()=>new THREE.SphereGeometry(.168,24,12,0,Math.PI*2,0,Math.PI*.42)),m,[0,.15,-.005],[o.back?.12:-.1,0,0],[1,1.02,1.06]);
    add(R.head,cg('cCpB',()=>new THREE.CylinderGeometry(.12,.13,.012,20,1,false,-Math.PI*.4,Math.PI*.8)),mat(o.k||'cloth',o.brim||o.col||'C'),o.back?[0,.205,-.14]:[0,.205,.14],[o.back?.15:-.15,o.back?Math.PI:0,0],[1,1,.9]);},
  hat(G,o){const {R,mat,add}=G,m=mat(o.k||'cloth',o.col||0x1a1a1e);add(R.head,cg('cHtB'+(o.brim||.28),()=>new THREE.CylinderGeometry(o.brim||.28,o.brim||.28,.012,28)),m,[0,.24,0],[o.tilt||-.08,0,0]);
    add(R.head,cg('cHtC'+(o.h||.12),()=>new THREE.CylinderGeometry(o.top||.13,.15,o.h||.12,24)),m,[0,.24+(o.h||.12)/2,0],[o.tilt||-.08,0,0]);
    if(o.band)add(R.head,cg('cHtR',()=>new THREE.CylinderGeometry(.152,.152,.03,24,1,true)),mat('silk',o.band),[0,.265,0],[o.tilt||-.08,0,0]);},
  hardhat(G,o){const {R,mat,add}=G,m=mat('plastic',o.col||'C');add(R.head,cg('cHh',()=>new THREE.SphereGeometry(.175,24,14,0,Math.PI*2,0,Math.PI*.5)),m,[0,.17,0],null,[1,.95,1.08]);
    add(R.head,cg('cHhB',()=>new THREE.CylinderGeometry(.205,.205,.012,24)),m,[0,.17,.01],[-.05,0,0],[1,1,1.12]);add(R.head,cg('cHhR',()=>new THREE.BoxGeometry(.03,.03,.3)),m,[0,.34,0]);},
  beanie(G,o){const {R,mat,add}=G,m=mat('knit',o.col||'C');add(R.head,cg('cBn',()=>new THREE.SphereGeometry(.172,24,14,0,Math.PI*2,0,Math.PI*.46)),m,[0,.15,-.01],[-.15,0,0],[1,1.12,1.06]);
    add(R.head,cg('cBnR',()=>new THREE.TorusGeometry(.16,.02,8,28)),m,[0,.17,.0],[Math.PI/2-.15,0,0],[1,1.06,1]);},
  horns(G,o){const {R,mat,add}=G,m=mat(o.k||'bone',o.col||0x1a1214);[-1,1].forEach(s=>add(R.head,cg('cHn'+(o.len||.18),()=>new THREE.ConeGeometry(.03,o.len||.18,10)),m,[s*.09,.27,-.01],[-.3,0,-s*.45]));},
  circlet(G,o){const {R,mat,add}=G,m=mat('gold',o.col||0xd8b060);add(R.head,cg('cCi',()=>new THREE.TorusGeometry(.162,.009,6,30)),m,[0,.21,0],[Math.PI/2-.15,0,0],[.98,1.06,1]);
    if(o.gem)add(R.head,cg('cCiG',()=>new THREE.OctahedronGeometry(.022)),mat('glow',o.gem),[0,.22,.16],[0,0,0],[1,1.4,.6]);},
  headset(G,o){const {R,mat,add}=G,m=mat('plastic',o.col||0x1a1a20);add(R.head,cg('cHsB',()=>new THREE.TorusGeometry(.17,.01,6,24,Math.PI)),m,[0,.13,0],[0,Math.PI/2,0]);
    [-1,1].forEach(s=>add(R.head,cg('cHsE',()=>new THREE.CylinderGeometry(.05,.05,.035,18)),m,[s*.16,.12,0],[0,0,Math.PI/2]));
    if(o.mic)add(R.head,cg('cHsM',()=>new THREE.CylinderGeometry(.006,.006,.16,6)),m,[.13,.06,.09],[1.2,0,.5]);
    if(o.eye)add(R.head,cg('cHsY',()=>new THREE.CylinderGeometry(.03,.03,.04,14)),mat('glow',o.eye),[-.07,.14,.15],[Math.PI/2,0,0]);},
  earrings(G,o){const {R,mat,add}=G;[-1,1].forEach(s=>{if(o.one&&s<0)return;add(R.head,cg('cEr',()=>new THREE.TorusGeometry(.014,.004,6,12)),mat('gold',o.col||0xd8b060),[s*.142,.08,0],[0,Math.PI/2,0]);});},
  // torso extras
  belt(G,o){const {R,mat,add,B}=G,m=mat(o.k||'leather',o.col||0x1a1410);add(R.hips,cg('cBl',()=>new THREE.CylinderGeometry(.218,.222,o.w||.05,28,1,true)),m,[0,o.y!=null?o.y:.04,0],null,[B*1.02,1,.86*B]);
    if(o.buckle!==false)add(R.hips,cg('cBlB',()=>new THREE.BoxGeometry(.07,.05,.015)),mat(o.buckleK||'metal',o.buckle||0xb8b8c0),[0,o.y!=null?o.y:.04,.19*B]);
    (o.pouches||[]).forEach(a=>add(R.hips,cg('cBlP',()=>THREE.RoundedBoxGeometry?new THREE.RoundedBoxGeometry(.07,.08,.04,2,.012):new THREE.BoxGeometry(.07,.08,.04)),mat(o.pk||o.k||'leather',o.pcol||o.col||0x1a1410),[Math.sin(a)*.22*B,(o.y||.04)-.03,Math.cos(a)*.19*B],[0,a,0]));},
  sash(G,o){const {R,mat,add,B}=G,m=mat(o.k||'silk',o.col||'A',{side:1});add(R.hips,cg('cSs',()=>new THREE.CylinderGeometry(.226,.23,.09,28,1,true)),m,[0,.06,0],null,[B,1,.86*B]);
    const p=new THREE.Group();p.position.set(o.side||.14,.04,.17*B);R.hips.add(p);add(p,cg('cSsT',()=>{const g=new THREE.BoxGeometry(.07,.34,.012);g.translate(0,-.17,0);return g;}),m);
    G.anim.push((sp,t)=>{p.rotation.x=-.1-Math.min(.6,sp*.04)+Math.sin(t*4)*.05;});},
  strap(G,o){// a strap / bandolier diagonally across the chest (o.dir 1 or -1), optional ammo/vials
    const {R,mat,add,B,BX}=G,m=mat(o.k||'leather',o.col||0x2a1a10),d=o.dir||1;
    const grp=new THREE.Group();grp.position.set(0,.4,0);grp.rotation.z=d*.78;R.spine.add(grp);add(grp,cg('cSt',()=>new THREE.TorusGeometry(.33,.018,6,40)),m,[0,0,0],[Math.PI/2,0,0],[.96*B,.72*BX,1]);
    if(o.ammo||o.vials){const am=o.vials?mat('glass',o.vials,{op:.85}):mat('gold',o.ammo);for(let i=0;i<(o.n||7);i++){const a=-.9+i*.3;const s=add(grp,cg(o.vials?'cStV':'cStA',()=>new THREE.CylinderGeometry(o.vials?.018:.012,o.vials?.018:.012,o.vials?.07:.055,8)),am,[Math.sin(a)*.32*B,0,Math.cos(a)*.72*.32*BX*1.33],[Math.PI/2,0,0]);s.rotation.set(0,0,Math.PI/2);}}},
  harness(G,o){const {R,mat,add,B,BX}=G,m=mat(o.k||'leather',o.col||0x1a1410);[-1,1].forEach(s=>add(R.spine,cg('cHr',()=>new THREE.TorusGeometry(.2,.014,6,30)),m,[s*.1*B,.45,0],[0,Math.PI/2,0],[1,1.35,.95*BX]));
    add(R.spine,cg('cHrC',()=>new THREE.BoxGeometry(.24,.02,.01)),m,[0,.36,.21*BX]);if(o.ring)add(R.spine,cg('cHrR',()=>new THREE.TorusGeometry(.03,.008,6,14)),mat('metal',0xb0b0b8),[0,.36,.222*BX]);},
  apron(G,o){const {R,mat,add,BX}=G,m=mat(o.k||'leather',o.col||0x3a2a1a,{side:1});const L=o.len||.95;
    add(R.spine,cg('cAp'+L,()=>{const g=new THREE.CylinderGeometry(.24,.3,L,16,6,true,-.9,1.8);g.translate(0,-L/2,0);return g;}),m,[0,.6,.005],null,[1,1,.95*BX]);
    if(o.ties)add(R.spine,cg('cApT',()=>new THREE.TorusGeometry(.255,.01,6,30)),m,[0,.15,0],[Math.PI/2,0,0],[1,.75*BX,1]);},
  tabard(G,o){// front + back cloth panels hanging from the belt
    const {R,mat,add,B}=G,m=mat(o.k||'cloth',o.col||'C',{side:1}),L=o.len||.55,w=o.w||.22;const mk=()=>cg('cTb'+L+w,()=>{const g=new THREE.BoxGeometry(w,L,.012);g.translate(0,-L/2,0);return g;});
    const f=new THREE.Group();f.position.set(0,.03,.2*B);R.hips.add(f);add(f,mk(),m);const bk=new THREE.Group();bk.position.set(0,.03,-.18*B);R.hips.add(bk);add(bk,mk(),m);
    if(o.emb)add(f,new THREE.PlaneGeometry(w*.7,w*.7),new THREE.MeshBasicMaterial({map:emblemTex(o.emb,G.tok(o.embCol||'A')),transparent:true,depthWrite:false}),[0,-L*.35,.008]);
    G.anim.push(sp=>{const lx=R.lH.rotation.x,rx=R.rH.rotation.x;f.rotation.x=Math.min(lx,rx,0)*.9-Math.min(.3,sp*.02);bk.rotation.x=Math.max(lx,rx,0)*.9+Math.min(.6,sp*.04);});},
  chestplate(G,o){const {R,mat,add,B,BX}=G,m=mat(o.k||'metal',o.col||0x5a5e68);add(R.spine,lathe('plate',PLATE,40,-Math.PI*.55,Math.PI*1.1),m,[0,0,0],null,[1.08*B,1,.8*BX]);
    if(o.emb)add(R.spine,new THREE.PlaneGeometry(.14,.14),new THREE.MeshBasicMaterial({map:emblemTex(o.emb,G.tok(o.embCol||'A')),transparent:true,depthWrite:false}),[0,.48,.252*BX]);},
  pauldrons(G,o){const {R,mat,add,B}=G,m=mat(o.k||'metal',o.col||0x5a5e68);[R.lS,R.rS].forEach((s,i)=>{if(o.one&&i!==(o.one==='r'?1:0))return;add(s,cg('cPd'+(o.big?1:0),()=>new THREE.SphereGeometry(o.big?.15:.125,20,12,0,Math.PI*2,0,Math.PI*.5)),m,[0,.04,0],[0,0,(i?-1:1)*-.2],[1.1*B,.75,1.05*B]);
      if(o.spikes)for(let k=0;k<(o.spikes|0||2);k++)add(s,cg('cPdS',()=>new THREE.ConeGeometry(.022,.1,6)),mat('metal',0xc8c8d0),[(k-.5)*.06,.13,0],[0,0,(i?1:-1)*.25]);
      if(o.trim)add(s,cg('cPdT'+(o.big?1:0),()=>new THREE.TorusGeometry(o.big?.15:.125,.01,6,24)),mat('cloth',o.trim),[0,.04,0],[Math.PI/2,0,0],[1.1*B,1.05*B,1]);});},
  backpack(G,o){const {R,mat,add,BX}=G,m=mat(o.k||'cloth',o.col||0x2a2c30);add(R.spine,cg('cBp',()=>THREE.RoundedBoxGeometry?new THREE.RoundedBoxGeometry(.3,.32,.14,3,.04):new THREE.BoxGeometry(.3,.32,.14)),m,[0,.42,-.25*BX]);
    if(o.glow)add(R.spine,cg('cBpG',()=>new THREE.BoxGeometry(.22,.03,.01)),mat('glow',o.glow),[0,.48,-.325*BX]);if(o.straps!==false)COS_PARTS.harness(G,{col:o.strapCol||0x1a1a1e});},
  tanks(G,o){const {R,mat,add,BX}=G,m=mat(o.k||'metal',o.col||0xb0b4bc);[-1,1].forEach(s=>{add(R.spine,cg('cTk',()=>new THREE.CylinderGeometry(.06,.06,.36,16)),m,[s*.08,.42,-.26*BX]);add(R.spine,cg('cTkC',()=>new THREE.SphereGeometry(.06,14,8,0,Math.PI*2,0,Math.PI/2)),m,[s*.08,.6,-.26*BX]);
      if(o.glow)add(R.spine,cg('cTkG',()=>new THREE.TorusGeometry(.062,.008,6,18)),mat('glow',o.glow),[s*.08,.42,-.26*BX],[Math.PI/2,0,0]);});
    if(o.hose){const cur=new THREE.CatmullRomCurve3([new V3(.08,.25,-.26*BX),new V3(.26,.2,-.15),new V3(.33,.4,-.02)]);add(R.spine,new THREE.TubeGeometry(cur,12,.014,6),mat('rubber',o.hose));}},
  pouches(G,o){const {R,mat,add}=G,m=mat(o.k||'cloth',o.col||0x3a3a2a);[R.lH,R.rH].forEach((hp,i)=>{if(o.one&&i)return;add(hp,cg('cPo',()=>THREE.RoundedBoxGeometry?new THREE.RoundedBoxGeometry(.06,.1,.09,2,.015):new THREE.BoxGeometry(.06,.1,.09)),m,[(i?-1:1)*.11,-.2,0]);});},
  patch(G,o){// an emblem decal: where 'chest','back','arm'
    const {R,add,BX}=G,M=new THREE.MeshBasicMaterial({map:emblemTex(o.emb||'star',G.tok(o.col||'A')),transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2});
    const w=o.where||'chest',s=o.size||.12;if(w==='chest')add(R.spine,new THREE.PlaneGeometry(s,s),M,[o.x||0,o.y||.47,.268*BX+(o.z||0)],[-.12,0,0]);
    else if(w==='back')add(R.spine,new THREE.PlaneGeometry(s*1.6,s*1.6),M,[0,.42,-.25*BX],[0,Math.PI,0]);else add(o.side==='r'?R.rS:R.lS,new THREE.PlaneGeometry(s*.7,s*.7),M,[(o.side==='r'?-1:1)*.08,-.1,0],[0,(o.side==='r'?-1:1)*Math.PI/2,0]);},
  stripes(G,o){// rings around sleeves / legs
    const {R,mat,add}=G,m=mat(o.k||'cloth',o.col||'A');(o.where==='legs'?[R.lK,R.rK]:[R.lE,R.rE]).forEach(e=>{for(let i=0;i<(o.n||2);i++)add(e,cg('cSr'+(o.where||'a'),()=>new THREE.TorusGeometry(o.where==='legs'?.08:.072,.008,6,20)),m,[0,(o.y||-.08)-i*.04,0],[Math.PI/2,0,0]);});},
  chain(G,o){const {R,mat,add,BX}=G,m=mat('gold',o.col||0xc8c8d0);const n=o.n||9;for(let k=0;k<n;k++){const a=(k-(n-1)/2)*(o.spread||.17);const l=add(o.on==='hips'?R.hips:R.spine,cg('cChL',()=>new THREE.TorusGeometry(.02,.006,6,12)),m,
      o.on==='hips'?[Math.sin(a)*.24,-.02-Math.cos(a)*.05+.05,Math.cos(a)*.19]:[Math.sin(a)*.2,.56-Math.cos(a)*.08+.08,.222*BX]);l.rotation.y=k%2?Math.PI/2:0;}},
  cape(G,o){const {R,mat}=G,m=mat(o.k||'cloth',o.col||'C',{side:1});const c=makeCloth(o.w||.62,o.len||1.2,6,16,m,o.amp||.75);c.mesh.position.set(0,o.y||.62,-(o.z||.2));c.mesh.userData.cos=1;R.spine.add(c.mesh);R.cloth=c;
    if(o.inner){const mi=mat(o.ik||'silk',o.inner,{side:1});mi.side=THREE.BackSide;const ci=new THREE.Mesh(c.mesh.geometry,mi);ci.userData.cos=1;c.mesh.add(ci);}},
  halfcape(G,o){// a short cape over one shoulder
    const {R,mat,add}=G,m=mat(o.k||'cloth',o.col||'C',{side:1}),sh=o.side==='r'?R.rS:R.lS;const p=new THREE.Group();p.position.set(0,.08,-.02);sh.add(p);
    add(p,cg('cHc',()=>{const g=new THREE.CylinderGeometry(.14,.24,.5,14,3,true,-Math.PI*.1,Math.PI*1.2);g.translate(0,-.25,0);return g;}),m,null,[0,o.side==='r'?Math.PI:0,0]);
    G.anim.push((sp,t)=>{p.rotation.x=Math.min(.7,sp*.05)+Math.sin(t*3)*.03;});},
  robe(G,o){// a long robe: jacket + coat to the ankles, crossed at the front
    COS_PARTS.jacket(G,Object.assign({open:false,zip:false,len:'hip'},o));COS_PARTS.coat(G,Object.assign({len:o.len||.95,open:false,flare:.38},o));
    const {R,mat,add,B,BX}=G,m=mat(o.k||'cloth',o.cross||o.col||'C');[-1,1].forEach(s=>add(R.spine,cg('cRbX',()=>new THREE.BoxGeometry(.035,.5,.012)),m,[s*.05,.4,.235*BX],[-.1,0,s*.38]));},
  kimono(G,o){// crossed-front top (wrap) with wide sleeves
    const {R,mat,add,B,BX}=G,m=mat(o.k||'cloth',o.col||'C',{side:1});COS_PARTS.jacket(G,{col:o.col,k:o.k,open:false,zip:false,len:'hip',sleeves:'short'});
    [[R.lS,R.lE],[R.rS,R.rE]].forEach(([s,e])=>add(s,cg('cKmS',()=>{const g=new THREE.CylinderGeometry(.09,.16,.34,14,1,true);g.translate(0,-.2,0);return g;}),m,null,null,[B,1,B]));
    const tm=mat(o.k||'cloth',o.trim||'A');add(R.spine,cg('cKmX',()=>new THREE.BoxGeometry(.04,.46,.012)),tm,[.06,.42,.236*BX],[-.1,0,.42]);add(R.spine,cg('cKmX',()=>new THREE.BoxGeometry(.04,.46,.012)),tm,[-.05,.4,.238*BX],[-.1,0,-.42]);},
  hoodiepocket(G,o){const {R,mat,add,BX}=G;add(R.spine,cg('cHp',()=>new THREE.BoxGeometry(.2,.09,.015)),mat(o.k||'cloth',o.col||'C'),[0,.16,.205*BX],[-.2,0,0]);},
  buttons(G,o){const {R,mat,add,BX}=G,m=mat('gold',o.col||0xd8b060);for(let i=0;i<(o.n||4);i++)[-1,1].forEach(s=>{if(!o.double&&s<0)return;add(R.spine,cg('cBu',()=>new THREE.SphereGeometry(.012,8,6)),m,[(o.double?s*.06:0),.2+i*.1,.235*BX+(i>2?.01:0)]);});},
  epaulettes(G,o){const {R,mat,add}=G,m=mat('gold',o.col||0xd8b060);[R.lS,R.rS].forEach((s,i)=>{add(s,cg('cEp',()=>new THREE.CylinderGeometry(.09,.09,.02,18)),m,[0,.09,0],[0,0,(i?1:-1)*.15]);
      for(let k=0;k<8;k++){const a=k/8*Math.PI-Math.PI/2;add(s,cg('cEpF',()=>new THREE.CylinderGeometry(.006,.006,.06,4)),m,[Math.cos(a)*.085*(i?-1:1)*0+(i?-1:1)*.08,.06,Math.sin(a)*.08]);}});},
  aiguillette(G,o){const {R,mat,add,BX}=G;add(R.spine,cg('cAg',()=>new THREE.TorusGeometry(.12,.01,6,20,Math.PI)),mat('gold',o.col||0xd8b060),[.12,.45,.22*BX],[0,0,-1.9]);},
  vents(G,o){const {R,mat,add,BX}=G,hot=mat('glow',o.col||'A');[-1,1].forEach(s=>{for(let k=0;k<3;k++)add(R.spine,cg('cVn',()=>new THREE.BoxGeometry(.05,.012,.02)),hot,[s*.1,.5-k*.035,-.23*BX]);});},
  piping(G,o){// glowing seams down the jacket and sleeves
    const {R,mat,add,BX}=G,m=mat('glow',o.col||'A',{e:o.e||1.4});[-1,1].forEach(s=>add(R.spine,cg('cPp',()=>new THREE.BoxGeometry(.008,.5,.008)),m,[s*.12,.34,.226*BX],[-.1,0,s*.12]));
    [R.lS,R.rS,R.lE,R.rE].forEach(b=>add(b,cg('cPpA',()=>new THREE.BoxGeometry(.006,.26,.006)),m,[0,-.14,.075]));},
  spikes(G,o){const {R,mat,add,BX}=G,m=mat('metal',o.col||0xc8c8d0);for(let i=0;i<(o.n||5);i++)add(R.spine,cg('cSp',()=>new THREE.ConeGeometry(.02,.08,6)),m,[(i-(o.n||5)/2+.5)*.07,.6,-.18*BX],[-1.9,0,0]);
    if(o.shoulders)[R.lS,R.rS].forEach((s,i)=>{for(let k=0;k<3;k++)add(s,cg('cSp',()=>new THREE.ConeGeometry(.02,.08,6)),m,[(k-1)*.05,.11,0],[0,0,(i?1:-1)*.2]);});},
  tassets(G,o){const {R,mat,add,B}=G,m=mat(o.k||'metal',o.col||0x5a5e68);for(let i=0;i<(o.n||6);i++){const a=(i/(o.n||6))*6.283;add(R.hips,cg('cTs',()=>{const g=new THREE.BoxGeometry(.12,.18,.012);g.translate(0,-.09,0);return g;}),m,[Math.sin(a)*.24*B,0,Math.cos(a)*.2*B],[.18,a,0]);}},
  lantern(G,o){const {R,mat,add}=G;add(R.hips,cg('cLnF',()=>new THREE.CylinderGeometry(.04,.045,.1,8)),mat('metal',0x2a2a30),[-.24,-.08,.05]);add(R.hips,cg('cLnG',()=>new THREE.CylinderGeometry(.03,.03,.07,8)),mat('glow',o.col||'A',{e:2.4}),[-.24,-.08,.05]);},
  holster(G,o){const {R,mat,add}=G;add(o.side==='r'?R.rH:R.lH,cg('cHl',()=>new THREE.BoxGeometry(.05,.16,.1)),mat('leather',o.col||0x1a1410),[(o.side==='r'?-1:1)*.11,-.14,0]);},
  sheathback(G,o){const {R,mat,add,BX}=G;add(R.spine,cg('cShB',()=>new THREE.CylinderGeometry(.03,.035,.9,10)),mat('leather',o.col||0x1a0a0a),[0,.35,-.24*BX],[0,0,.7]);},
  number(G,o){const {R,add,BX}=G;const [c,g]=cv(128,128);g.fillStyle='#'+new THREE.Color(G.tok(o.col||'A')).getHexString();g.font='bold 96px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(String(o.n||1),64,68);
    add(R.spine,new THREE.PlaneGeometry(.18,.18),new THREE.MeshBasicMaterial({map:tex(c),transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}),[0,.42,-.255*BX],[0,Math.PI,0]);},
  furtrim(G,o){const {R,mat,add,B}=G;add(R.spine,cg('cFt',()=>new THREE.TorusGeometry(.268,.03,8,36)),mat('fur',o.col||0xe8e0d0),[0,-.15,0],[Math.PI/2,0,0],[B,.72,1]);},
  tag(G,o){// paper talismans / tags hanging from the belt
    const {R,mat,add,B}=G,m=mat('cloth',o.col||0xf2ead0,{side:1});for(let k=0;k<(o.n||5);k++){const a=(k-(o.n||5)/2+.5)*.45+(o.off||0);add(R.hips,cg('cTg',()=>new THREE.PlaneGeometry(.045,.13)),m,[Math.sin(a)*.235*B,-.04,Math.cos(a)*.2*B],[0,a,0]);}},
  shoulderwrap(G,o){// a cloth draped from one shoulder across the body
    const {R,mat,add,B,BX}=G,m=mat(o.k||'cloth',o.col||'A',{side:1});const g=new THREE.Group();g.position.set(0,.36,0);g.rotation.z=(o.dir||1)*.65;R.spine.add(g);
    add(g,cg('cSw',()=>new THREE.CylinderGeometry(.33,.33,.13,32,1,true)),m,null,null,[.92*B,1,.72*BX]);},
  bracers(G,o){const {R,mat,add,B}=G,m=mat(o.k||'leather',o.col||0x2a1a10);[R.lE,R.rE].forEach(e=>{add(e,cg('cBr',()=>new THREE.CylinderGeometry(.07,.064,.14,18)),m,[0,-.16,0],null,[B,1,B]);
    if(o.lace)for(let i=0;i<3;i++)add(e,cg('cBrL',()=>new THREE.BoxGeometry(.04,.006,.006)),mat('cloth',o.lace),[0,-.12-i*.035,.07]);});},
  badge(G,o){const {R,mat,add,BX}=G;add(R.spine,cg('cBg',()=>new THREE.CylinderGeometry(.03,.03,.008,6)),mat('gold',o.col||0xd8b060),[o.x||.12,.5,.248*BX],[Math.PI/2,0,0]);},
  shirttails(G,o){const {R,mat,add,B}=G;COS_PARTS.skirt(G,{col:o.col,len:.12,flare:.26,k:'cloth'});},
  bones(G,o){// bone plates / ribs worn on the outside
    const {R,mat,add,BX}=G,m=mat('bone',o.col||0xe8dcc0);for(let i=0;i<4;i++)[-1,1].forEach(s=>add(R.spine,cg('cRb',()=>new THREE.TorusGeometry(.12,.016,6,12,Math.PI*.7)),m,[s*.03,.34+i*.06,.2*BX],[0,s>0?0:Math.PI,s>0?-.3:.3]));
    if(o.spine)for(let i=0;i<6;i++)add(R.spine,cg('cVt',()=>new THREE.SphereGeometry(.03,10,8)),m,[0,.15+i*.08,-.2*BX],null,[1.4,.8,1]);},
};

/* ---------- every fighter's outfit ---------- */
const DK=0x1a1a1e,WHT=0xf2f2ee;
const COS={
  // CINDER — smokejumper: charred leather jacket with ember seams, cargo pants, buckled boots, smoke goggles
  cinder:{hideDecor:1,base:{top:0x3a1a10,legs:0x3a3630,shoe:0x1a1410,hands:DK,fingerless:1},parts:[['jacket',{col:0x2a2420,k:'leather',open:1,collar:'pop',trim:'C'}],['piping',{col:'C'}],['vents',{col:'A'}],
    ['belt',{pouches:[.9,-.9,2.6]}],['boots',{h:.26,buckles:1,col:0x1a1410}],['goggles',{forehead:1,lens:'C'}],['kneepads',{col:0x2a2420,k:'leather'}]]},
  // RIPTIDE — deep-water diver: wetsuit with glowing panels, rubber fin gauntlets, dive goggles
  riptide:{hideDecor:1,base:{top:0x0e1a2a,topK:'rubber',legs:0x0e1a2a,legK:'rubber',shoe:0x0e1a2a,shoeK:'rubber',hands:0x0e1a2a,handK:'rubber'},parts:[['jacket',{col:0x0e1a2a,k:'rubber',collar:'turtle',zipCol:'A'}],['piping',{col:'C'}],
    ['legstripe',{col:'C'}],['gauntlets',{k:'rubber',col:'C',glow:'A'}],['boots',{k:'rubber',col:0x0e1a2a,h:.16,cuff:'C',cuffK:'rubber'}],['goggles',{forehead:1,lens:'A'}],['belt',{k:'rubber',col:0x1a2a3a,buckle:'A'}]]},
  // GALE — windrunner: sleeveless tunic, long trailing scarf, sash, wide trousers, wrapped arms and shins
  gale:{hideDecor:1,base:{top:0xe8e4f4,sleeve:'none',legs:0x3a2e5a,legK:'cloth',shoe:0xd8d0ec,shoeK:'cloth'},parts:[['vest',{col:0x3a2e5a,grow:1.06,trim:'C'}],['scarf',{col:0xf2f0fa,k:'silk',len:.78,wraps:2,tails:[[.07,1],[-.05,1]]}],
    ['sash',{col:'C'}],['hakama',{col:0xb8a8e0,waist:false}],['wraps',{col:0xd8d0ec,n:5}],['wraps',{where:'legs',col:0xd8d0ec,n:4}]]},
  // NITRO — demolition crew: hi-vis vest over a work shirt, padded blast mitts, ear defenders, canister bandolier
  nitro:{hideDecor:1,base:{top:0x2a2a2e,legs:0x4a4030,shoe:0x3a2a1a,hands:0x2a2a2e,handK:'rubber'},parts:[['jacket',{col:0x2a2a2e,sleeves:'rolled',zip:false,collar:'shirt'}],['vest',{col:0xffa820,k:'rubber',grow:1.15}],['bands',{col:0xd8d8dc,y:[.22,.36]}],
    ['gauntlets',{big:1,k:'rubber',col:0x2a2a2e,glow:'C'}],['headset',{col:0xffa820}],['kneepads',{}],['boots',{h:.22,col:0x3a2a1a,cuff:0xffa820}],['strap',{dir:-1,ammo:0xc85020,n:6,col:0x2a2a2e}]]},
  // TITAN — the champion: white entrance coat with blue trim, sleeveless top, gold title belt, taped wrists
  titan:{hideDecor:1,base:{top:'C',topK:'knit',sleeve:'none',legs:0x1a2a4a,shoe:'C'},parts:[['jacket',{open:1,col:0xf4f4f8,k:'silk',trim:'C',collar:'high'}],['coat',{col:0xf4f4f8,k:'silk',len:.7,trim:'C'}],
    ['belt',{w:.1,k:'gold',col:0xc8a050,buckle:0xffe08a,buckleK:'gold'}],['wraps',{col:WHT,n:3}],['boots',{col:'C',h:.3,cuff:0xf4f4f8}],['patch',{where:'back',emb:'star',col:'A'}]]},
  // VOLTA — punk lineworker: studded leather vest, insulated rubber gloves, battery pack, ripped jeans
  volta:{hideDecor:1,base:{top:0x2a2a2e,sleeve:'short',legs:0x2a3a5a,shoe:DK,hands:'C',handK:'rubber'},parts:[['vest',{col:0x141418,k:'leather',grow:1.07}],['spikes',{shoulders:1,n:0}],['gauntlets',{k:'rubber',col:'C'}],
    ['backpack',{col:0x2a2a2e,glow:'C',strapCol:0x141418}],['tanks',{col:0x3a3a40,glow:'C',hose:0x141418}],['boots',{h:.2,col:DK}],['goggles',{forehead:1,lens:'C'}],['chain',{on:'hips',n:7}]]},
  // UMBRA — night stalker: long tattered leather coat with a dark fur collar, clawed gloves
  umbra:{hideDecor:1,keepDecor:o=>false,base:{top:0x1a1426,legs:0x14101e,shoe:0x0e0c14,hands:0x0e0c14},parts:[['jacket',{col:0x1a1426,k:'leather',open:1,collar:'fur',collarCol:0x2a2236}],['coat',{col:0x1a1426,k:'leather',len:.92,flare:.4,trim:'C'}],
    ['gauntlets',{k:'leather',col:0x0e0c14,spikes:1}],['boots',{h:.3,col:0x0e0c14}],['belt',{col:0x0e0c14,buckle:'A'}]]},
  // DRIFT — orbital engineer: padded flight suit, harness, small air tanks, mission patches, headset
  drift:{base:{top:0xe8e4f8,topK:'quilt',legs:0xe8e4f8,legK:'quilt',shoe:0xf2f2f6,shoeK:'rubber',hands:0xf2f2f2,handK:'rubber'},parts:[['jacket',{col:0xe8e4f8,k:'quilt',zipCol:'C',collar:'turtle'}],['harness',{col:0x5a4a7a,ring:1}],
    ['tanks',{col:0xf0f0f4,glow:'C'}],['patch',{where:'arm',emb:'orbit',col:'C'}],['patch',{where:'chest',emb:'orbit',col:'C',x:-.1,size:.08}],['boots',{col:0xf2f2f6,h:.22,k:'rubber',cuff:'C'}],['headset',{mic:1,col:0xf2f2f2}],['legstripe',{col:'C'}]]},
  // BASTION — riot breaker: layered heavy plates, tassets, greaves, big gauntlets
  bastion:{base:{top:0x3a3a40,topK:'knit',sleeve:'none',legs:0x2a2a30,shoe:0x1a1a1e},parts:[['chestplate',{col:0x4a4e56,emb:'shield',embCol:'C'}],['pauldrons',{big:1,trim:'C',col:0x4a4e56}],['tassets',{col:0x4a4e56}],
    ['greaves',{col:0x4a4e56}],['gauntlets',{big:1,col:0x4a4e56}],['belt',{col:0x1a1a1e,w:.07}]]},
  // QUILL — crystal-feather aviator: cropped leather flight jacket, high boots, feather earrings
  quill:{base:{top:0xf2e8ec,legs:0x1a1a22,shoe:0x1a1a22,hands:0x1a1a22,fingerless:1},parts:[['jacket',{k:'leather',col:0x2a1e26,open:1,len:'waist',collar:'high',trim:'C'}],['boots',{h:.32,cuff:'C',col:0x1a1a22}],
    ['earrings',{col:'C'}],['belt',{col:'C',k:'leather',buckle:'A'}],['scarf',{col:'C',k:'silk',len:.32,wraps:1,tails:[[.06,1]]}]]},
  // VOID — cosmic monk: long navy robe with a crossed front, sash, gemmed circlet, wrapped forearms (keeps his star cloak)
  void:{keepCape:1,hideDecor:1,keepDecor:(o,bn,R)=>false,base:{top:0x10142a,legs:0x10142a,shoe:0x2a2a3a,shoeK:'cloth'},parts:[['robe',{col:0x10142a,k:'silk',cross:'C',len:.95}],['sash',{col:'C'}],['circlet',{gem:'A'}],['wraps',{col:0x2a3050,n:5}],['sandals',{col:0x2a2a3a}]]},
  // RONIN — wandering swordsman: wrap-front kimono, wide hakama, sash, headband, sandals
  ronin:{hideDecor:1,base:{top:0x2a1618,legs:0x16161e,legK:'cloth'},parts:[['kimono',{col:0x2a1618,trim:'C'}],['hakama',{col:0x16161e}],['sash',{col:'C'}],['sandals',{}],['headband',{col:'C'}],['wraps',{col:0xe8e0cc,n:3}],['sheathback',{}]]},
  // QUAKE — quarry foreman: flannel shirt with rolled sleeves, denim overalls, tool belt, hard hat, work boots (keeps his rock shoulders)
  quake:{base:{top:0x8a3a2a,legs:0x3a4a5a,shoe:0x5a3a1a,hands:0x8a6a3a},parts:[['jacket',{col:0x8a3a2a,sleeves:'rolled',zip:false,collar:'shirt',len:'waist'}],['bib',{col:0x3a4a5a}],['belt',{col:0x5a3a1a,pouches:[1,-1,2.2,-2.2]}],
    ['boots',{h:.22,col:0x5a3a1a,cuff:0x3a2a1a}],['hardhat',{col:'C'}]]},
  // MARROW — the anatomist: long dark coat with a high collar, stained butcher's apron, bone shoulder plates, rubber gloves
  marrow:{hideDecor:1,base:{top:0x2a0e14,legs:0x14080c,shoe:0x0e0608,hands:DK,handK:'rubber'},parts:[['jacket',{col:0x1a0a10,k:'leather',open:1,collar:'high'}],['coat',{col:0x1a0a10,k:'leather',len:.85,trim:'C'}],
    ['apron',{col:0x4a2a22,len:.82,ties:1}],['pauldrons',{k:'bone',col:0xe8dcc0,spikes:2}],['boots',{h:.26,col:0x0e0608}],['bones',{}]]},
  // ENTROPY — ash vagrant: frayed hooded long coat, worn scarf, bandaged hands, faint cracks glowing at the seams
  entropy:{hideDecor:1,base:{top:0x3a3436,legs:0x2a2a30,shoe:0x3a3434,hands:0x8a8278,fingerless:1},parts:[['jacket',{col:0x2e2a32,open:1}],['coat',{col:0x2e2a32,len:.82,flare:.42}],['hood',{col:0x2e2a32}],
    ['scarf',{col:0x6a5a5a,k:'cloth',len:.35,wraps:1}],['wraps',{col:0x8a8278,n:4}],['boots',{h:.2,col:0x3a3434}],['piping',{col:'A',e:.6}]]},
  // SOVEREIGN — the crime lord: three-piece suit, coat over the shoulders, silk tie, gold chain, leather gloves
  sovereign:{hideDecor:1,base:{top:0xe8e4f0,legs:0x14121a,legK:'cloth',shoe:0x0a0a0c,hands:DK},parts:[['vest',{col:0x2a2236,k:'silk'}],['tie',{col:'C'}],['jacket',{col:0x14121a,k:'silk',open:1,gap:.34,collar:'high'}],
    ['coat',{col:0x0e0c14,k:'silk',len:.92,trim:'C'}],['chain',{}],['buttons',{n:3,col:0xd8b060}]]},
  // STROBE — track sprinter: zip track jacket with sleeve stripes, striped track pants, neon trainers, sweatband
  strobe:{hideDecor:1,base:{top:0x14262a,legs:0x1a2a2a,legK:'cloth',shoe:WHT},parts:[['jacket',{col:0x14262a,zipCol:'C',collar:'turtle'}],['stripes',{col:'C',n:2}],['legstripe',{col:'C'}],['sneakers',{col:WHT,acc:'C'}],
    ['headband',{col:'C',tails:false}],['wristbands',{col:'C'}],['number',{n:7,col:'C'}]]},
  // PYRE — the lamplighter: long dark duster with blue-glowing seams, a blue lantern at the hip, tall boots
  pyre:{hideDecor:1,base:{top:0x1a1c24,legs:0x14161e,shoe:0x0e0e12,hands:DK,fingerless:1},parts:[['jacket',{col:0x101218,k:'leather',open:1,collar:'high'}],['coat',{col:0x101218,k:'leather',len:.95}],['piping',{col:'A'}],
    ['lantern',{col:'C'}],['belt',{}],['boots',{h:.3,col:0x0e0e12}]]},
  // WARP — the concierge: waistcoat, bow tie, sleeve garters, sharp slacks, polished shoes
  warp:{hideDecor:1,base:{top:0xf2f0ea,legs:0x1a1a22,legK:'cloth',shoe:0x0a0a0c},parts:[['vest',{col:0x1e1838,k:'silk'}],['tie',{bow:1,col:'C'}],['stripes',{col:'C',n:1,y:-.02}],['buttons',{n:4,col:0xd8b060}],['collar',{type:'shirt',col:0xf2f0ea}],
    ['badge',{col:'C',x:-.12}]]},
  // HEX — hedge witch: short jacket, pleated skirt, striped stockings, talisman tags, a hooded cloak
  hex:{hideDecor:1,base:{top:0x1a2a1e,legs:0x0e1a12,legK:'knit',shoe:0x14141a},parts:[['jacket',{col:0x14201a,open:1,len:'waist',collar:'high'}],['skirt',{col:0x0e1a12,len:.32,pleats:1}],['tag',{n:6}],
    ['stripes',{where:'legs',col:'C',n:4,y:-.05}],['boots',{h:.3,col:0x14141a}],['cape',{col:0x0e1a12,len:1,w:.6,inner:'C'}],['hood',{col:0x0e1a12}]]},
  // SCATHE — street slasher: studded leather vest, spiked shoulders, chain belt, claw gloves, bandana mask
  scathe:{hideDecor:1,keepDecor:(o,bn,R)=>bn===R.rF||bn===R.lF,base:{top:0x3a1a1a,sleeve:'none',legs:0x1a1a20,shoe:DK},parts:[['vest',{col:0x1a1416,k:'leather',grow:1.06}],['spikes',{shoulders:1,n:0}],['chain',{on:'hips'}],['belt',{}],
    ['gauntlets',{k:'leather',col:0x1a1416,spikes:1}],['boots',{h:.26,buckles:1}],['mask',{col:'C'}],['kneepads',{col:0x1a1416,k:'leather'}]]},
  // SOLSTICE — frost & flame: high-collared fitted jacket with icy trim, a frost mantle on one shoulder, heat-glow bracer
  solstice:{base:{top:0x1a2236,legs:0x0e1220,shoe:0x0e1220},parts:[['jacket',{col:0x1a2236,collar:'high',trim:0xe8f4ff}],['halfcape',{side:'r',col:0xe8f4ff,k:'silk'}],['bracers',{col:0x2a1a1a}],
    ['belt',{col:0x0e1220}],['boots',{h:.28,col:0x0e1220,cuff:0xe8f4ff}]]},
  // PISTON — the racer: racing suit with stripes and patches, racing gloves (keeps his engine legs)
  piston:{base:{top:'C',legs:'C',legK:'cloth',shoe:0xf2f2f2,hands:0xf2f2f2},parts:[['jacket',{col:'C',collar:'turtle',zipCol:0xf2f2f2}],['legstripe',{col:0xf2f2f2}],['stripes',{col:0xf2f2f2,n:2}],
    ['patch',{where:'chest',emb:'gear',col:0xf2f2f2,x:.1,size:.09}],['patch',{where:'arm',emb:'gear',col:'A'}],['belt',{col:0x1a1a22}]]},
  // SNARE — night-shift investigator: long trench coat, turtleneck, glowing tinted shades, coiled binding cable
  snare:{hideDecor:1,base:{top:0x1a1a1e,legs:0x1a1a20,shoe:0x101012,hands:0x101012},parts:[['collar',{type:'turtle',col:0x1a1a1e}],['jacket',{col:0x2a2a30,open:1,collar:'pop'}],['coat',{col:0x2a2a30,len:.86}],
    ['belt',{col:0x101012,pouches:[2.2,-2.2]}],['ropecoil',{}],['shades',{glow:'C'}],['boots',{h:.2,col:0x101012}]]},
  // MARBLE — the dealer: waistcoat, bow tie, green eyeshade, sleeve garters (keeps his crystal marbles)
  marble:{base:{top:0xf2f0e8,legs:0x101014,legK:'cloth',shoe:0x0a0a0c},parts:[['vest',{col:0x1a1a14,k:'silk'}],['tie',{bow:1,col:'C'}],['stripes',{col:'C',n:1,y:-.02}],['visorcap',{}],['buttons',{n:4}],['collar',{type:'shirt',col:0xf2f0e8}]]},
  // LEGION — two of a kind: a hoodie and trousers split down the middle in two tones, mismatched trainers
  legion:{hideDecor:1,base:{top:0x2a2c34,legs:0x2a2c34,legsR:0xb8bcc8,shoe:0x2a2c34},parts:[['jacket',{split:[0x2a2c34,0xb8bcc8],zipCol:'A'}],['hood',{col:0x2a2c34}],['hoodiepocket',{col:0x2a2c34}],
    ['sneakers',{col:0xb8bcc8,acc:'A'}],['patch',{where:'chest',emb:'mirror',col:'A',x:.1,size:.08}]]},
  // RECOIL — recon sniper: high-collared field jacket, tactical vest, ammo bandolier, scope headset (keeps her rifle arm)
  recoil:{base:{top:0x2a2a30,legs:0x2a2620,shoe:0x14141a,hands:DK},parts:[['jacket',{col:0x3a3440,collar:'high'}],['vest',{col:0x2a2620,grow:1.15}],['strap',{dir:1,ammo:0xd8b060}],['belt',{pouches:[1,-1,2,-2]}],
    ['kneepads',{}],['boots',{h:.26,col:0x14141a}],['headset',{eye:'C',mic:1}],['hood',{col:0x3a3440}]]},
  // CRIMSON — red raincoat: glossy rubber raincoat, hood down, a bandolier of blood vials, platform boots
  crimson:{hideDecor:1,base:{top:0x1a1a1e,legs:0x1a1a1e,shoe:0x14141a},parts:[['jacket',{col:'C',k:'rubber',collar:'high',zipCol:DK}],['coat',{col:'C',k:'rubber',len:.55,open:false}],['hood',{col:'C',k:'rubber'}],
    ['strap',{vials:0xc4102a,dir:-1,col:DK}],['boots',{h:.32,col:0x14141a,k:'rubber'}],['stripes',{where:'legs',col:WHT,n:2,y:-.02}]]},
  // SAWBACK — scrapyard nomad: scale-patterned top, a tattered shawl, wrapped arms and shins (keeps his blade bundle)
  sawback:{base:{top:0x5a7a3a,topK:'scales',sleeve:'none',legs:0x4a4030,shoe:0x3a2a1a},parts:[['vest',{col:0x5a7a3a,k:'scales'}],['scarf',{col:0x6a5a3a,k:'cloth',len:.5,wraps:1}],['wraps',{col:0xc8b890,n:5}],
    ['wraps',{where:'legs',col:0xc8b890,n:4}],['belt',{pouches:[1.2,-1.2]}],['boots',{h:.22,col:0x3a2a1a}]]},
  // RESECT — the surgeon: scrubs, a long white lab coat, surgical mask, nitrile gloves, ID badge
  resect:{hideDecor:1,base:{top:0x3a7a8a,legs:0x3a7a8a,legK:'cloth',shoe:0xf2f2f2,hands:0x7ab8d8,handK:'rubber'},parts:[['jacket',{col:0xeeeeea,open:1,collar:'shirt'}],['coat',{col:0xeeeeea,len:.72}],['mask',{col:0xa8d8e0,loops:1}],['badge',{col:0xc8c8d0,x:.12}],['sneakers',{col:0xf2f2f2,acc:0xc8c8d0}]]},
  // CUSHION — the gentle giant: quilted padded top, headband, wristbands, big trainers (keeps his huge build)
  cushion:{base:{top:'C',topK:'quilt',legs:0x2a2a30,shoe:WHT},parts:[['belly',{}],['headband',{col:'A'}],['wristbands',{col:'A'}],['sneakers',{col:WHT,acc:'A'}]]},
  // CORROSA — hazmat chic: cropped rubber jacket, acid-green goggles, utility belt, platform boots with acid trim
  corrosa:{hideDecor:1,base:{top:0x1a1418,legs:0x2a1a2a,shoe:0x1a1418},parts:[['jacket',{col:'C',k:'rubber',open:1,len:'crop',collar:'high'}],['goggles',{forehead:1,lens:'A'}],['belt',{col:0x2a1a2a,pouches:[1,-1]}],
    ['legstripe',{col:'A'}],['boots',{h:.32,k:'rubber',col:0x1a1418,cuff:'A',cuffK:'rubber'}],['gauntlets',{k:'rubber',col:0x1a1418,glow:'A'}]]},
  // VERDICT — the executioner-judge: tattered black robe with a crimson cross, red sash, knife strap, hood up
  verdict:{hideDecor:1,keepDecor:(o,bn,R)=>bn===R.rF||bn===R.lF,base:{top:0x141216,legs:0x141216,shoe:0x0e0e10},parts:[['robe',{col:0x141216,len:.8,cross:'C'}],['sash',{col:'C'}],['strap',{col:0x2a1a14,dir:1}],['hood',{col:0x141216,up:1}],
    ['wraps',{col:0x8a7a6a,n:4}],['boots',{h:.26,col:0x0e0e10}]]},
  // DECREE — the field marshal: dress coat with gold epaulettes and braid, sash, white gloves, peaked cap, tall boots
  decree:{hideDecor:1,base:{top:0x1a2a4a,legs:0xe8e4d8,legK:'cloth',shoe:0x0e0e12,hands:WHT,handK:'cloth'},parts:[['jacket',{col:0x1a2a4a,collar:'high',zip:false,trim:'C'}],['coat',{col:0x1a2a4a,len:.55,trim:'C'}],['epaulettes',{}],['aiguillette',{}],
    ['buttons',{double:1,n:4}],['sash',{col:'C'}],['boots',{h:.36,col:0x0e0e12}],['cap',{col:0x1a2a4a,brim:0x0e0e12}],['badge',{x:-.12}]]},
  // SKITTER — bike courier: hoodie, messenger strap and bag, beanie, knee pads, trainers, fingerless gloves
  skitter:{hideDecor:1,base:{top:'C',legs:0x2a2a30,shoe:WHT,hands:DK,fingerless:1},parts:[['jacket',{col:'C',zip:false}],['hoodiepocket',{col:'C'}],['hood',{col:'C'}],['strap',{dir:-1,col:0x2a2a2a}],['pouches',{one:1,col:0x2a2a2a}],
    ['kneepads',{}],['sneakers',{acc:'A'}],['beanie',{col:0x2a2a30}]]},
  // OLD GUARD — old-school brawler: trench coat, waistcoat and braces, fedora, brass knuckles, taped hands
  oldguard:{hideDecor:1,base:{top:0xe8e0d0,legs:0x2a2a30,shoe:0x3a2414},parts:[['vest',{col:0x3a2a1e}],['jacket',{col:0x6a5038,open:1,collar:'pop'}],['coat',{col:0x6a5038,len:.8}],['hat',{col:0x3a2a1e,brim:.26,band:0x1a1410}],
    ['knuckles',{}],['wraps',{col:WHT,n:3}],['belt',{col:0x2a1a10}]]},
  // HOPSTAR — street-dance performer: cropped satin bomber, pleated skirt over leggings, leg warmers, high-tops, star clips
  hopstar:{hideDecor:1,base:{top:WHT,legs:0x1a1a22,legK:'knit',shoe:WHT},parts:[['jacket',{col:'C',k:'silk',open:1,len:'crop',collar:'high',trim:'A'}],['skirt',{col:0x2a1a3a,len:.22,pleats:1,flare:.34}],['wraps',{where:'legs',col:'A',k:'knit',n:5}],
    ['sneakers',{col:WHT,acc:'A'}],['patch',{where:'arm',emb:'star',col:'A'}],['hairstar',{col:'A'}]]},
  // HEADLINER — the showman: sequinned stage jacket, white flares, a white cape with a coloured lining, gold buckle
  headliner:{hideDecor:1,base:{top:WHT,legs:WHT,legK:'silk',shoe:WHT},parts:[['jacket',{col:'C',k:'sequin',open:1,collar:'pop',trim:WHT}],['cape',{col:0xf4f4f4,inner:'C',len:1.2,k:'silk'}],['belt',{k:'gold',col:0xd8b060,w:.07,buckle:0xffe08a,buckleK:'gold'}],
    ['boots',{col:WHT,h:.26,cuff:'C'}]]},
  // ZANSHIN — spirit hunter: charcoal coat with a crimson lining, grey hakama, bandaged forearms, sash (keeps his blade)
  zanshin:{base:{top:0x1a1a1e,legs:0x3a3a44,legK:'cloth',shoe:0x14141a},parts:[['jacket',{col:0x24242a,open:1,collar:'high',lapelCol:'C'}],['coat',{col:0x24242a,len:.65,trim:'C'}],['hakama',{col:0x3a3a44,waist:false}],['wraps',{col:0xe8e0cc,n:5}],['sash',{col:'C'}]]},
  // TORRENT — biker boss: leather biker jacket with a popped collar and glowing piping, chains, jeans, buckled boots
  torrent:{hideDecor:1,base:{top:0x1a1a22,legs:0x1e2a3a,shoe:0x0e0e12},parts:[['jacket',{col:0x14141c,k:'leather',open:1,collar:'pop'}],['piping',{col:'C'}],['chain',{on:'hips'}],['belt',{}],['boots',{h:.26,buckles:1,col:0x0e0e12}],['patch',{where:'back',emb:'target',col:'C'}]]},
  // HEIR — hero in training: green hooded track jacket, joggers with a stripe, utility belt, fingerless gloves, trainers
  heir:{hideDecor:1,base:{top:0xf2f2f2,legs:0x1a1a1e,legK:'cloth',shoe:WHT,hands:DK,fingerless:1},parts:[['jacket',{col:'C',zipCol:WHT,collar:'turtle',trim:WHT}],['hood',{col:'C'}],['stripes',{col:WHT,n:1}],['legstripe',{col:'C'}],
    ['sneakers',{col:WHT,acc:'C'}],['belt',{col:0x2a2a2a,pouches:[1.2,-1.2,2.4]}],['kneepads',{col:0x2a2a2a}]]},
};

/* ---------- wiring ---------- */
// the armored suits are the default look (armor2.js); the fighter-select ARMOR toggle switches to these outfits
const _cosBR=buildRig;buildRig=function(h,sc){if(!h||!h.human||h.armor||h.custom||h.id==='chimera'||!COS[h.id])return _cosBR.apply(this,arguments);
  const a=[].slice.call(arguments);const R=_cosBR.apply(this,a);try{costumeBuild(R,a[0],COS[h.id]);}catch(e){console.warn('costume',h.id,e);}return R;};
// coat tails, scarves and sashes move with the body
const _cosAP=Fighter.prototype.applyPose;Fighter.prototype.applyPose=function(dt){const r=_cosAP.apply(this,arguments);const R=this.rig;if(R&&R.cosAnim&&nearCam(this.pos,45))cosTick(R,Math.hypot(this.vel.x,this.vel.z),game.time);return r;};
const _cosPRiv=setInterval(()=>{if(typeof poseRig!=='function')return;clearInterval(_cosPRiv);const _cosPR=poseRig;poseRig=function(R,P,t){const r=_cosPR.apply(this,arguments);if(R&&R.cosAnim)cosTick(R,0,t||0);return r;};},5);
