/* ARMOR 2 — the original armored hero suits, rebuilt with far more detail. Every fighter keeps their own colours,
   emblem, helmet parts and power props; the suit underneath is upgraded:
   • true-to-colour materials (the suits used to render washed-out), a technical hex-weave undersuit, armour plates
     with machined panel lines and wear, carbon-weave dark parts
   • sculpted, segmented chest plates with a sternum channel, layered abdominal bands, flank and back plates,
     a gorget around the neck and glowing seams between the plates
   • layered pauldrons, bicep plates, elbow cops, stacked gauntlet cuffs, knuckle guards
   • thigh plates, hip tassets, layered knee guards, shin ridges, heels and ankle cuffs on the boots
   • a sculpted helmet: jaw guard, brow ridge, cheek vents, a crest and a glassy visor with reflections
   The costume outfits (costumes.js) are still there behind the fighter-select ARMOR toggle. */
const A2N={};
function a2Normal(kind){if(A2N[kind])return A2N[kind];const S=256,[c,g]=cv(S,S);g.fillStyle='#808080';g.fillRect(0,0,S,S);
  if(kind==='panel'){// machined panel grooves + light wear
    g.strokeStyle='rgba(30,30,30,.95)';g.lineWidth=2.2;const cut=(x0,y0,x1,y1)=>{g.beginPath();g.moveTo(x0,y0);g.lineTo(x1,y1);g.stroke();};
    cut(0,64,S,64);cut(0,192,S,192);cut(96,64,96,192);cut(200,0,200,64);cut(40,192,40,S);cut(160,192,160,S);cut(150,64,150,120);cut(150,120,256,120);
    g.fillStyle='rgba(40,40,40,.9)';[[110,80],[110,176],[186,80],[186,176],[20,40],[236,40],[60,220],[200,220]].forEach(([x,y])=>{g.beginPath();g.arc(x,y,3,0,7);g.fill();});   // rivets
    g.strokeStyle='rgba(70,70,70,.5)';for(let i=0;i<60;i++){g.lineWidth=rand(.4,1.1);g.beginPath();const x=Math.random()*S,y=Math.random()*S;g.moveTo(x,y);g.lineTo(x+rand(-20,20),y+rand(-20,20));g.stroke();}
    for(let i=0;i<2500;i++){const v=118+Math.random()*20|0;g.fillStyle=`rgb(${v},${v},${v})`;g.fillRect(Math.random()*S,Math.random()*S,1,1);}}
  else if(kind==='hex'){g.strokeStyle='rgba(40,40,40,.9)';g.lineWidth=1.6;const r=7,h=r*Math.sqrt(3);for(let row=-1;row<S/h+1;row++)for(let col=-1;col<S/(r*1.5)+1;col++){const cx=col*r*1.5,cy=row*h+(col%2?h/2:0);
      g.beginPath();for(let k=0;k<6;k++){const a=k/6*Math.PI*2;g.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r);}g.closePath();g.stroke();}}
  else{// carbon weave
    for(let y=0;y<S;y+=8)for(let x=0;x<S;x+=8){const o=((x+y)/8)%2;const gr=g.createLinearGradient(x,y,o?x+8:x,o?y:y+8);gr.addColorStop(0,'#5a5a5a');gr.addColorStop(.5,'#b0b0b0');gr.addColorStop(1,'#5a5a5a');g.fillStyle=gr;g.fillRect(x,y,8,8);}}
  const t=normalFromHeight(c,kind==='panel'?2.2:1.4);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(kind==='hex'?5:kind==='panel'?1.5:6,kind==='hex'?5:kind==='panel'?1.5:6);A2N[kind]=t;return t;}
const A2_HIDE=new Set(['plate','s0.1_32','s0.045_16','strip']);
function a2Key(m){for(const k in GC)if(GC[k]===m.geometry)return k;return null;}
function a2Profile(y){for(let i=0;i<TORSO.length-1;i++){const [y0,r0]=TORSO[i],[y1,r1]=TORSO[i+1];if(y>=y0&&y<=y1)return r0+(r1-r0)*((y-y0)/((y1-y0)||1));}return .2;}
function a2Band(y0,y1,grow,p0,pl,seg){return cg('a2b'+y0+'_'+y1+'_'+grow+'_'+p0+'_'+pl,()=>{const P=[];for(let k=0;k<=(seg||3);k++){const y=y0+(y1-y0)*k/(seg||3);P.push(new THREE.Vector2(a2Profile(y)*grow+.012,y));}
  return new THREE.LatheGeometry(P,28,p0,pl);});}
function armorUpgrade(R,h){const suit=R.mats[0],main=R.mats[1],trim=R.mats[2],glow=R.glow;let dark=null;
  R.lF&&R.lF.traverse(o=>{if(!dark&&o.isMesh&&o.material&&o.material!==suit&&o.material!==main&&o.material!==trim&&o.material!==glow)dark=o.material;});dark=dark||main;
  // true-to-colour, richer materials
  [main,trim].forEach(m=>{if(m&&m.color&&!m.userData.a2lin){m.userData.a2lin=1;const c0=m.color.clone();m.color.convertSRGBToLinear().lerp(c0,.35);}});
  suit.normalMap=a2Normal('hex');suit.normalScale=new THREE.Vector2(.35,.35);suit.roughness=.55;
  [main,trim].forEach(m=>{m.normalMap=a2Normal('panel');m.normalScale=new THREE.Vector2(.55,.55);if(m.envMapIntensity!=null)m.envMapIntensity*=1.25;});
  if(dark&&dark!==main){dark.normalMap=a2Normal('carbon');dark.normalScale=new THREE.Vector2(.4,.4);dark.roughness=.32;}
  const B=h.bulk||1,BX=1+(B-1)*.6,add=(par,g,m,p,r,s)=>{if(!par)return null;const o=new THREE.Mesh(g,m);if(p)o.position.set(p[0],p[1],p[2]);if(r)o.rotation.set(r[0],r[1],r[2]);if(s)o.scale.set(s[0],s[1],s[2]);o.castShadow=true;o.userData.a2=1;par.add(o);return o;};
  const L=typeof LOOKS!=='undefined'?(LOOKS[h.id]||(h.as&&LOOKS[h.as.look])||{}):{};
  // the old single chest shell, the bumpy abs and the stuck-on strips go
  [R.spine].forEach(bn=>bn.children.forEach(o=>{if(o.isMesh&&A2_HIDE.has(a2Key(o)))o.visible=false;}));
  const sp=R.spine,TS=[B,1,.72*BX];
  // segmented chest: two pectoral plates with a sternum channel, glowing seam beneath
  add(sp,lathe('a2pecL',PLATE,24,.09,1.42),main,null,null,[1.06*B,1,.78*BX]);add(sp,lathe('a2pecR',PLATE,24,-1.51,1.42),main,null,null,[1.06*B,1,.78*BX]);
  add(sp,cg('a2sternG',()=>new THREE.BoxGeometry(.008,.12,.012)),glow,[0,.33,.236*BX],[-.05,0,0]);
  add(sp,a2Band(.232,.244,1.1,-1.25,2.5,1),glow,null,null,TS);
  // segmented abdominal plates (two rows, split down the middle)
  [[.135,.222],[.05,.125]].forEach(([y0,y1],i)=>[[.06,.82-i*.06],[-.88+i*.06,.82-i*.06]].forEach(([p0,pl])=>add(sp,a2Band(y0,y1,1.05,p0,pl,2),main,null,null,TS)));
  // armoured waist ring over the hips
  add(R.hips,cg('a2wr',()=>new THREE.LatheGeometry([[.252,.03],[.262,-.03],[.272,-.085]].map(([r,y])=>new THREE.Vector2(r,y)),32,.55,Math.PI*2-1.1)),dark,null,null,[B,1,.84*BX]);
  // flank plates and shoulder blades
  [[1.45,.8],[-2.25,.8]].forEach(([p0,pl])=>add(sp,a2Band(.16,.5,1.06,p0,pl,4),dark,null,null,TS));
  [[Math.PI*.62,Math.PI*.34],[Math.PI*1.04,Math.PI*.34]].forEach(([p0,pl])=>add(sp,a2Band(.36,.6,1.07,p0,pl,4),main,null,null,TS));
  for(let i=0;i<5;i++)add(sp,cg('a2vert',()=>THREE.RoundedBoxGeometry?new THREE.RoundedBoxGeometry(.07,.045,.04,2,.012):new THREE.BoxGeometry(.07,.045,.04)),i%2?trim:dark,[0,.12+i*.06,-.205*BX]);
  // gorget around the neck
  add(sp,cg('a2gor',()=>new THREE.LatheGeometry([[.15,.585],[.16,.62],[.125,.665],[.1,.69]].map(([r,y])=>new THREE.Vector2(r,y)),28)),trim,null,null,[B,1,.9*BX]);
  add(sp,cg('a2gorG',()=>new THREE.TorusGeometry(.152,.006,6,32)),glow,[0,.6,0],[Math.PI/2,0,0],[B,.9*BX,1]);
  // arms: layered pauldrons (unless the fighter's own shoulder armour is there), bicep plates, elbow cops, gauntlet cuffs, knuckles
  [[R.lS,R.lE,R.lF,1],[R.rS,R.rE,R.rF,-1]].forEach(([s,e,f,sd])=>{if(!s)return;
    if(!L.sh||L.sh==='none'){s.children.forEach(o=>{const k=o.isMesh&&a2Key(o);if(k==='pad'||k==='padR')o.visible=false;});
      add(s,cg('a2pd0',()=>new THREE.SphereGeometry(.13,28,14,0,Math.PI*2,0,Math.PI*.48)),main,[0,.03,0],[0,0,sd*.25],[1.12*B,.82,1.06*B]);
      add(s,cg('a2pd1',()=>new THREE.SphereGeometry(.142,28,6,0,Math.PI*2,Math.PI*.38,Math.PI*.14)),trim,[0,.0,0],[0,0,sd*.3],[1.12*B,.9,1.06*B]);
      add(s,cg('a2pd2',()=>new THREE.SphereGeometry(.15,28,6,0,Math.PI*2,Math.PI*.42,Math.PI*.12)),main,[0,-.035,0],[0,0,sd*.34],[1.1*B,.9,1.04*B]);
      add(s,cg('a2pdG',()=>new THREE.TorusGeometry(.133,.006,6,32)),glow,[0,.028,0],[Math.PI/2,sd*.25,0],[1.12*B,1.06*B,1]);}
    const tc=sd*Math.PI/4;add(s,cg('a2bi'+sd,()=>new THREE.CylinderGeometry(.08,.074,.16,16,1,true,tc-1.05,2.1)),main,[0,-.15,0],null,[B,1,B]);
    add(e,cg('a2el',()=>new THREE.SphereGeometry(.058,16,10,0,Math.PI*2,0,Math.PI*.5)),trim,[0,.01,-.035],[-Math.PI/2,0,0],[B,B,.9]);
    if(!L.br||L.br==='band'){[-.1,-.135].forEach((y,i)=>add(e,cg('a2cf'+i,()=>new THREE.CylinderGeometry(.069-i*.002,.067-i*.002,.03,22,1,true)),i?main:trim,[0,y,0],null,[B,1,B]));}
    add(e,cg('a2fr',()=>THREE.RoundedBoxGeometry?new THREE.RoundedBoxGeometry(.05,.16,.03,2,.01):new THREE.BoxGeometry(.05,.16,.03)),dark,[0,-.1,-.06],[.08,0,0],[B,1,1]);
    if(f){add(f,cg('a2kn',()=>THREE.RoundedBoxGeometry?new THREE.RoundedBoxGeometry(.115,.028,.05,2,.01):new THREE.BoxGeometry(.115,.028,.05)),trim,[0,-.055,.045],[.2,0,0]);
      add(f,cg('a2bh',()=>THREE.RoundedBoxGeometry?new THREE.RoundedBoxGeometry(.09,.06,.02,2,.008):new THREE.BoxGeometry(.09,.06,.02)),main,[0,-.01,-.05]);}});
  // legs: thigh plates, hip tassets, layered knee guards, shin ridges, heels and ankle cuffs
  [[R.lH,R.lK,1],[R.rH,R.rK,-1]].forEach(([hp,kn,sd])=>{if(!hp)return;
    add(hp,cg('a2th',()=>new THREE.CylinderGeometry(.114,.098,.28,18,1,true,-1.1,2.2)),main,[0,-.2,.006],null,[B,1,B]);
    add(hp,cg('a2thS'+sd,()=>new THREE.CylinderGeometry(.112,.1,.22,12,1,true,sd*Math.PI/2-.45,.9)),trim,[0,-.18,0],null,[B,1,B]);
    kn.children.forEach(o=>{if(o.isMesh&&a2Key(o)==='kp')o.visible=false;});
    add(kn,cg('a2kp',()=>new THREE.SphereGeometry(.078,20,12,0,Math.PI*2,0,Math.PI*.55)),main,[0,.0,.05],[Math.PI/2,0,0],[1,1,.85]);
    add(kn,cg('a2kp2',()=>new THREE.SphereGeometry(.07,18,8,0,Math.PI*2,Math.PI*.3,Math.PI*.22)),trim,[0,-.045,.04],[Math.PI/2,0,0],[1,1,.9]);
    add(kn,cg('a2kpG',()=>new THREE.CylinderGeometry(.012,.012,.012,10)),glow,[0,.0,.128],[Math.PI/2,0,0]);
    add(kn,cg('a2sh',()=>THREE.RoundedBoxGeometry?new THREE.RoundedBoxGeometry(.05,.26,.03,2,.012):new THREE.BoxGeometry(.05,.26,.03)),trim,[0,-.2,.072],[-.06,0,0],[B,1,1]);
    add(kn,cg('a2shS'+sd,()=>new THREE.CylinderGeometry(.082,.07,.2,12,1,true,sd*Math.PI/2-.5,1)),main,[0,-.2,0],null,[B,1,B]);
    if(!L.bt||L.bt==='cuff'){add(kn,cg('a2an',()=>new THREE.CylinderGeometry(.086,.088,.05,20,1,true)),trim,[0,-.34,0]);}
    add(kn,cg('a2hl',()=>THREE.RoundedBoxGeometry?new THREE.RoundedBoxGeometry(.13,.07,.07,2,.015):new THREE.BoxGeometry(.13,.07,.07)),dark,[0,-.47,-.085]);
    add(kn,cg('a2tr',()=>new THREE.BoxGeometry(.15,.016,.31)),dark,[0,-.52,.05]);});
  [[1.35,.75],[-2.1,.75]].forEach(([p0,pl])=>add(R.hips,cg('a2ts'+p0,()=>{const g=new THREE.CylinderGeometry(.25,.29,.16,14,1,true,p0,pl);g.translate(0,-.08,0);return g;}),trim,[0,-.02,0],null,[B*1.02,1,.86*B]));
  // helmet: jaw guard, brow ridge, cheek vents, crest, glassy visor
  const hd=R.head;if(hd){const HS=[.98,1.1,1.06];
    add(hd,cg('a2jaw',()=>new THREE.SphereGeometry(.172,32,10,Math.PI*.16,Math.PI*.68,Math.PI*.6,Math.PI*.24)),trim,[0,.12,.004],null,HS);
    add(hd,cg('a2brow',()=>new THREE.SphereGeometry(.177,32,3,Math.PI*.08,Math.PI*.84,Math.PI*.385,Math.PI*.035)),trim,[0,.12,0],null,HS);
    [-1,1].forEach(s=>{for(let k=0;k<3;k++)add(hd,cg('a2vent',()=>new THREE.BoxGeometry(.004,.012,.05)),dark,[s*.165,.065-k*.02,.06],[0,s*.45,0]);});
    add(hd,cg('a2crest',()=>THREE.RoundedBoxGeometry?new THREE.RoundedBoxGeometry(.024,.04,.2,2,.008):new THREE.BoxGeometry(.024,.04,.2)),main,[0,.3,-.01],[-.1,0,0]);
    add(hd,cg('a2crG',()=>new THREE.BoxGeometry(.008,.012,.16)),glow,[0,.322,-.01],[-.1,0,0]);
    const vg=new THREE.MeshPhysicalMaterial({color:0x101418,metalness:.2,roughness:.04,clearcoat:1,clearcoatRoughness:.02,transparent:true,opacity:.32,envMap:main.envMap,envMapIntensity:1.6});
    add(hd,cg('a2vis',()=>new THREE.SphereGeometry(.176,40,12,Math.PI*.08,Math.PI*.84,Math.PI*.42,Math.PI*.17)),vg,[0,.12,0],null,HS).userData.noTint=true;}
  R.a2=true;return R;}
// armored rigs (the default look) get the upgrade
const _a2BR=buildRig;buildRig=function(h,sc){const R=_a2BR.apply(this,arguments);if(h&&!h.human&&h.id!=='chimera'&&R&&R.mats&&R.spine){try{armorUpgrade(R,h);}catch(e){console.warn('armor2',h.id,e);}}return R;};
