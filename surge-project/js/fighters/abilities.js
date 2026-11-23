/* Ability engine used by created fighters */
/* ================= ABILITY ENGINE =================
   Runs brand-new abilities described as a recipe: a form (how it's delivered), a style (looks/sounds),
   colors, a projectile shape, numbers (count, size, range, speed, duration, power) and on-hit / self effects.
   Created fighters get these recipes from Claude (when the page can ask Claude) or from the built-in designer. */
const CAB_FORMS=['bolt','volley','beam','wave','burst','zone','rain','pillar','dash','blink','grab','orbit','cone','shield','buff','slam','summon'];
const CAB_STYLES=['fire','ice','water','wind','lightning','shadow','light','earth','metal','crystal','blood','poison','void','spirit','sound','plant','explosion','time','blade'];
const STYLE_KEY={fire:'fire',ice:'crystal',water:'water',wind:'wind',lightning:'electric',shadow:'shadow',light:'crystal',earth:'rock',metal:'metal',crystal:'crystal',blood:'flesh',poison:'decay',
  void:'void',spirit:'portal',sound:'wind',plant:'rock',explosion:'blast',time:'frame',blade:'blade'};
const STYLE_COL={fire:[0xff5a1f,0xffd04a],ice:[0x9ae8ff,0xffffff],water:[0x1fb8ff,0x9af0ff],wind:[0xcfe4ff,0xffffff],lightning:[0xffe03a,0xffffff],shadow:[0x6a3acf,0x1a0a2a],light:[0xfff2b0,0xffffff],
  earth:[0x9a7a5a,0xd8b080],metal:[0xb8c0cc,0xffffff],crystal:[0xb07bff,0xf0e0ff],blood:[0xc4102a,0xff3048],poison:[0x7aff3a,0x2a8a1a],void:[0x8ac4ff,0x3a2a8a],spirit:[0x6affd8,0xd8fff4],
  sound:[0xff9ad8,0xffffff],plant:[0x3ad86a,0xa8ff7a],explosion:[0xff7a10,0xffd04a],time:[0x3fe0c5,0xe8fffb],blade:[0xff6060,0xffffff]};
const CAB_FX=['burn','freeze','poison','stun','pull','push','launch','float','lifesteal','chain','explode','pierce','mark','slow','drain'];
const CAB_SELF=['heal','shield','haste','power','lift'];
const CAB_SHAPES=['orb','spike','blade','ring','shard','star','bird','arrow'];
const CAB_BASE={bolt:10,volley:13,beam:16,wave:11,burst:11,zone:13,rain:15,pillar:12,dash:11,blink:11,grab:12,orbit:12,cone:14,shield:0,buff:0,slam:12,summon:12};
function cabCol(v,d){if(typeof v==='string'){const m=v.replace('#','').match(/^[0-9a-f]{6}$/i);return m?parseInt(m[0],16):d;}const n=+v;return isFinite(n)&&n>=0?(n>>>0)&0xffffff:d;}
function sanitizeAbil(a){if(!a||typeof a!=='object')return null;const one=(v,l,d)=>l.indexOf(v)>=0?v:d;const num=(v,lo,hi,d)=>{const n=+v;return isFinite(n)?clamp(n,lo,hi):d;};
  const str=(v,n)=>String(v||'').replace(/[<>&"`]/g,'').slice(0,n);
  const style=one(String(a.style||'').toLowerCase(),CAB_STYLES,'light'),form=one(String(a.form||'').toLowerCase(),CAB_FORMS,'bolt'),dc=STYLE_COL[style];
  const cs=Array.isArray(a.colors)?a.colors:[a.c1,a.c2];
  const lst=(v,l,n)=>(Array.isArray(v)?v:[]).map(x=>String(x).toLowerCase()).filter((x,i,arr)=>l.indexOf(x)>=0&&arr.indexOf(x)===i).slice(0,n);
  return {name:str(a.name,24).toUpperCase()||'NEW MOVE',desc:str(a.desc,110),form,style,shape:one(String(a.shape||'').toLowerCase(),CAB_SHAPES,'orb'),c1:cabCol(cs[0],dc[0]),c2:cabCol(cs[1],dc[1]),
    count:Math.round(num(a.count,1,12,form==='volley'?5:form==='rain'?8:form==='orbit'?4:1)),size:num(a.size,.5,2.2,1),range:num(a.range,3,36,form==='bolt'||form==='beam'?20:10),
    speed:num(a.speed,8,60,form==='dash'?30:28),dur:num(a.dur!=null?a.dur:a.duration,0,4,form==='beam'?1.1:form==='zone'?2.2:form==='summon'?5:form==='orbit'?4:1.2),
    power:num(a.power,.6,1.5,1),fx:lst(a.fx||a.effects,CAB_FX,4),self:lst(a.self||a.selfEffects,CAB_SELF,2)};}
/* ---- runtime lists ---- */
const CABP=[],CABW=[];const Z1=new V3(0,0,1);
function cabMul(A,tier,k){let m=(tier==='ult'?2.3:1)*A.power*(1+.6*(k||0));const n=A.fx.length;if(n>2)m*=Math.pow(.92,n-2);return m;}
function cabMesh(A,s,f){if(typeof CAB_SHAPES2!=='undefined'&&CAB_SHAPES2.indexOf(A.shape)>=0){const mg=cabModel(A.shape,A,f);if(mg){mg.scale.multiplyScalar(s);return mg;}}const g=new THREE.Group(),m1=addMat(A.c1,2.2,.9),m2=addMat(A.c2,2.8);
  const G=(k,fn)=>cg('cab_'+k,fn),M=(geo,m)=>{const x=new THREE.Mesh(geo,m);g.add(x);return x;};
  switch(A.shape){
    case 'spike':M(G('sp',()=>{const q=new THREE.ConeGeometry(.17,1.15,14);q.rotateX(Math.PI/2);return q;}),m1);M(G('sp2',()=>{const q=new THREE.ConeGeometry(.07,.95,8);q.rotateX(Math.PI/2);return q;}),m2);break;
    case 'blade':{const a=M(G('bl',()=>new THREE.TorusGeometry(.7,.06,8,40,Math.PI)),m1);a.rotation.x=Math.PI/2;const b=M(G('bl2',()=>new THREE.TorusGeometry(.6,.025,6,40,Math.PI)),m2);b.rotation.x=Math.PI/2;break;}
    case 'ring':M(G('rg',()=>new THREE.TorusGeometry(.48,.07,10,48)),m1);M(G('rg2',()=>new THREE.TorusGeometry(.32,.03,8,40)),m2);break;
    case 'shard':M(G('sh',()=>new THREE.OctahedronGeometry(.38,0)),m1);M(G('sh2',()=>new THREE.OctahedronGeometry(.2,0)),m2);break;
    case 'star':M(G('st',()=>new THREE.IcosahedronGeometry(.4,0)),m1);M(G('st2',()=>new THREE.SphereGeometry(.2,16,12)),m2);break;
    case 'bird':{M(G('bd',()=>{const q=new THREE.ConeGeometry(.16,.8,10);q.rotateX(Math.PI/2);return q;}),m1);
      [-1,1].forEach(sd=>{const w=M(G('bw',()=>{const q=new THREE.PlaneGeometry(.9,.32);q.translate(.45,0,0);return q;}),m2);w.rotation.set(Math.PI/2,0,sd>0?0:Math.PI);w.position.z=-.05;w.userData.wing=sd;});break;}
    case 'arrow':M(G('ar',()=>{const q=new THREE.CylinderGeometry(.035,.035,1.2,8);q.rotateX(Math.PI/2);return q;}),m2);{const h=M(G('ar2',()=>{const q=new THREE.ConeGeometry(.12,.35,10);q.rotateX(Math.PI/2);return q;}),m1);h.position.z=.7;}break;
    default:M(G('ob',()=>new THREE.SphereGeometry(.38,24,18)),m1);M(G('ob2',()=>new THREE.SphereGeometry(.2,16,12)),m2);{const r=M(G('ob3',()=>new THREE.TorusGeometry(.5,.025,6,40)),m2);r.rotation.x=Math.PI/2;}}
  g.scale.setScalar(s);return g;}
function cabFX(A,pt,big){const E=ELEM[STYLE_KEY[A.style]];if(E&&E.impact)E.impact(pt,big);burst(ADD,pt,big?26:12,{colors:[A.c1,A.c2,0xffffff],speed:big?8:5,life:.4,size:big?.4:.28,size1:0,bright:2.4});
  if(big)ring(pt,A.c1,2.4*A.size,.3,false,2.2);}
function cabSnd(A,f,kind){const S=SND[STYLE_KEY[A.style]];if(!S)return;sndHere(f,()=>{try{if(kind==='ult'&&S.ult)S.ult(f);else if(kind==='hit')S.hit(1,f);else if(S.spec)S.spec(f);else S.hit(1,f);}catch(e){}});}
/* ---- one hit with all of the recipe's effects ---- */
function cabHit(f,o,A,mul,share,pt,extra){if(!o||o.dead||o.downed||ally(o,f))return false;pt=pt||o.chest(new V3());extra=extra||{};
  const x={dmg:(CAB_BASE[A.form]||10)*mul*(share||1),kb:4,up:0,stun:.45,pt,noSpark:true};const fx=A.fx;
  if(fx.indexOf('launch')>=0){x.launch=true;x.up=12;x.kb=5;x.heavy=true;}
  if(fx.indexOf('push')>=0){x.launch=true;x.kb=14;x.up=Math.max(x.up,5);x.heavy=true;}
  if(fx.indexOf('stun')>=0)x.stun=1;
  if(extra.hold){x.hold=true;x.launch=false;x.kb=.5;}
  if(fx.indexOf('float')>=0&&!x.hold&&!extra.tick)x.float=1.3;
  if(fx.indexOf('mark')>=0)x.mark=1;
  if(extra.last){x.launch=true;x.heavy=true;x.up=Math.max(x.up,10);x.kb=Math.max(x.kb,9);x.hold=false;}
  const r=applyHit(f,o,x);if(r!==true)return r;
  cabFX(A,pt,(share||1)>=.5);
  if(fx.indexOf('burn')>=0)burnOn(o,3,2.2+mul,A.style==='spirit'||A.style==='void'||A.style==='ice');
  if(fx.indexOf('freeze')>=0){o.slowT=Math.max(o.slowT||0,2.6);if(o.state==='hit')o.stunT=(o.stunT||0)+.4;burst(ADD,pt,10,{colors:[0x9ae8ff,0xffffff],speed:4,life:.5,size:.25,bright:2});}
  if(fx.indexOf('slow')>=0)o.slowT=Math.max(o.slowT||0,2.6);
  if(fx.indexOf('poison')>=0){o.decay=Math.min(5,(o.decay||0)+2);o.decayT=5;}
  if(fx.indexOf('lifesteal')>=0)heal(f,x.dmg*.35);
  if(fx.indexOf('drain')>=0){const s=Math.min(o.meter,10);o.meter-=s;f.meter=Math.min(100,f.meter+s);}
  if(fx.indexOf('pull')>=0&&!extra.nopull){const dx=f.pos.x-o.pos.x,dz=f.pos.z-o.pos.z,d=Math.hypot(dx,dz)||1;if(d>1.8)pullTo(o,o.pos.x+dx/d*Math.min(2.5,d-1.6),o.pos.z+dz/d*Math.min(2.5,d-1.6));}
  if(fx.indexOf('chain')>=0&&!extra.chained){let N=null,nd=7;for(const q of FS){if(q===o||q.dead||ally(q,f))continue;const d=q.pos.distanceTo(o.pos);if(d<nd){nd=d;N=q;}}
    if(N){bolt(o.chest(new V3()),N.chest(new V3()),A.c1,.07,.22);cabHit(f,N,A,mul,(share||1)*.6,null,{chained:true,exploded:true});}}
  if(fx.indexOf('explode')>=0&&!extra.exploded){explosion(pt,2.2*A.size,[A.c1,A.c2,0xffffff]);foes(f,2.6*A.size,pt).forEach(q=>{if(q!==o)cabHit(f,q,A,mul,(share||1)*.5,null,{exploded:true,chained:true});});}
  return r;}
function cabAoE(f,A,mul,share,p,R,extra){ring(TMP.set(p.x,.2,p.z).clone(),A.c1,R*2,.4,true,2.2);const far=p.distanceTo(f.pos)>4;foes(f,R,p).forEach(o=>{if(far&&A.fx.indexOf('pull')>=0)pullTo(o,lerp(o.pos.x,p.x,.5),lerp(o.pos.z,p.z,.5));cabHit(f,o,A,mul,share,null,Object.assign({nopull:far},extra||{}));});}
function cabSelf(f,A,tier){const u=tier==='ult'?1.6:1;A.self.forEach(s=>{const c=f.chest(new V3());
  if(s==='heal'){heal(f,8*u);burst(ADD,c,20,{colors:[0x8aff9a,0xffffff],speed:3,up:2,life:.6,size:.3,bright:2});}
  if(s==='shield'){f.armorT=Math.max(f.armorT,2.5*u);ring(c,A.c1,2.4,.35,false,2.4);}
  if(s==='haste'){f.hasteT=Math.max(f.hasteT||0,4*u);}
  if(s==='power'){f.powT=Math.max(f.powT||0,5*u);ring(c,A.c2,2.2,.35,false,2.4);}
  if(s==='lift'&&tier!=='ult'){f.vel.y=Math.max(f.vel.y,11);f.onGround=false;f.pos.y+=.1;}});}
function cabTarget(f,A,R){const T=tgtOf(f,R);if(T)return T.pos.clone();const fw=f.fwd(),L=clearLen(f.pos,fw,R*.65);return f.pos.clone().addScaledVector(fw,L);}
function cabProj(f,A,mul,share,pos,dir,speed,o){o=o||{};const sc=A.size*(o.sc||1);const g=cabMesh(A,sc,f);g.position.copy(pos);g.quaternion.setFromUnitVectors(Z1,dir.clone().normalize());scene.add(g);
  CABP.push({sc0:sc,f,A,mul,share,pos:pos.clone(),vel:dir.clone().normalize().multiplyScalar(speed),r:.42*sc+.25,life:o.life||(A.range/speed),g,hit:{},pierce:A.fx.indexOf('pierce')>=0||!!o.pierce,grav:o.grav||0,boom:o.boom||0,t:0,homing:o.homing||0});}
function clearCab(){CABP.forEach(p=>scene.remove(p.g));CABP.length=0;CABW.forEach(w=>{if(w.mesh)scene.remove(w.mesh);(w.meshes||[]).forEach(m=>scene.remove(m));});CABW.length=0;}
/* ---- per-frame update of projectiles and lingering effects ---- */
function updateCab(dt){
  for(let i=CABP.length-1;i>=0;i--){const p=CABP[i];p.t+=dt;p.vel.y-=p.grav*dt;
    if(p.homing){let T=null,bd=14;for(const o of FS){if(o.dead||ally(o,p.f))continue;const d=o.pos.distanceTo(p.pos);if(d<bd){bd=d;T=o;}}if(T){const want=TMP.subVectors(T.chest(TMP2),p.pos).normalize().multiplyScalar(p.vel.length());p.vel.lerp(want,Math.min(1,dt*p.homing));}}
    p.pos.addScaledVector(p.vel,dt);p.g.position.copy(p.pos);if(p.vel.lengthSq()>.01)p.g.quaternion.setFromUnitVectors(Z1,TMP3.copy(p.vel).normalize());
    p.g.children.forEach(c=>{if(c.userData.wing)c.rotation.y=Math.sin(p.t*22)*.6*c.userData.wing;if(c.userData.seg)c.position.x=Math.sin(p.t*14-c.userData.seg)*.08*c.userData.seg;});const ud=p.g.userData;
    if(ud.spin)p.g.rotateX(p.t*16);if(ud.spinY)p.g.rotateY(p.t*16);if(ud.spinZ)p.g.rotateZ(p.t*16);if(ud.flutter)p.g.rotateZ(Math.sin(p.t*12)*.7);if(ud.flick)p.g.scale.setScalar(p.sc0*(1+Math.sin(p.t*40)*.08));if(p.A.shape==='ring'||p.A.shape==='star'||p.A.shape==='shard')p.g.rotateZ(p.t*8);
    if(Math.random()<.85)burst(ADD,p.pos,1,{colors:[p.A.c1,p.A.c2],speed:.5,life:.3,size:.4*p.A.size,size1:0,bright:2});
    let dead=p.t>p.life||insideBld(p.pos.x,p.pos.z,0,p.pos.y)||Math.abs(p.pos.x)>BOUND+4||Math.abs(p.pos.z)>BOUND+4,land=false;
    if(p.pos.y<=.25&&p.vel.y<=0){dead=true;land=true;}
    if(!dead)for(const o of FS){if(o.dead||o.downed||ally(o,p.f)||p.hit[o.id])continue;const dx=o.pos.x-p.pos.x,dy=o.pos.y+1-p.pos.y,dz=o.pos.z-p.pos.z;
      if(dx*dx+dz*dz<(p.r+.55)*(p.r+.55)&&Math.abs(dy)<1.4+p.r){p.hit[o.id]=1;if(p.boom){dead=true;break;}cabHit(p.f,o,p.A,p.mul,p.share,p.pos.clone());if(!p.pierce){dead=true;break;}}}
    if(dead){if(p.boom||land&&p.grav){const c=p.pos.clone();c.y=Math.max(.6,c.y);explosion(c,1.6*p.A.size*(p.boom||1),[p.A.c1,p.A.c2,0xffffff]);cabAoE(p.f,p.A,p.mul,p.share,c,2.3*p.A.size*(p.boom||1));}
      else cabFX(p.A,p.pos,false);scene.remove(p.g);CABP.splice(i,1);}}
  for(let i=CABW.length-1;i>=0;i--){const w=CABW[i];w.t+=dt;const A=w.A,f=w.f;let end=w.t>w.dur||(f.dead&&w.type!=='pillar');
    if(w.type==='zone'){if(Math.random()<.9){const a=rand(0,6.28),r=Math.sqrt(Math.random())*w.R;burst(ADD,TMP.set(w.p.x+Math.cos(a)*r,.2,w.p.z+Math.sin(a)*r),1,{colors:[A.c1,A.c2],speed:.4,up:2.4,life:.7,size:.45,size1:0,bright:1.8});}
      if(w.mesh){w.mesh.rotation.z+=dt*.8;w.mesh.material.opacity=.45+Math.sin(w.t*6)*.12;}
      w.n-=dt;if(w.n<=0){w.n=.3;foes(f,w.R,w.p).forEach(o=>{if(A.fx.indexOf('pull')>=0)pullTo(o,lerp(o.pos.x,w.p.x,.25),lerp(o.pos.z,w.p.z,.25));cabHit(f,o,A,w.mul,.3/w.dur,null,{hold:true,tick:true,nopull:true});});}}
    else if(w.type==='rain'){w.n-=dt;while(w.n<=0&&w.left>0){w.n+=w.dur/w.cnt;w.left--;const a=rand(0,6.28),r=Math.sqrt(Math.random())*w.R;
        cabProj(f,A,w.mul,1/w.cnt*1.4,new V3(w.p.x+Math.cos(a)*r,16+rand(0,3),w.p.z+Math.sin(a)*r),new V3(rand(-.1,.1),-1,rand(-.1,.1)),30,{grav:6,life:3,pierce:true});}
      if(Math.random()<.4)ring(TMP.set(w.p.x,.15,w.p.z),A.c1,w.R*2,.3,true,1.4);end=w.left<=0;}
    else if(w.type==='pillar'){if(!w.done&&w.t>w.delay&&isPhys(A)){w.done=1;physPillar(A,w.p,w.mul>1.5);foes(f,2.2*A.size,w.p).forEach(o=>cabHit(f,o,A,w.mul,w.share,null,{last:true}));}
      else if(!w.done&&w.t>w.delay){w.done=1;const p=w.p;for(let k=0;k<6;k++)burst(ADD,TMP.set(p.x,k*.8,p.z),8,{colors:[A.c1,A.c2,0xffffff],speed:3,up:6,life:.6,size:.5,bright:2.4});
        explosion(TMP.set(p.x,1.5,p.z).clone(),1.8*A.size,[A.c1,A.c2]);if(A.style==='earth'||A.style==='plant'||A.style==='crystal'||A.style==='ice')spike(p.x,p.z,1.4*A.size);
        foes(f,2.2*A.size,p).forEach(o=>cabHit(f,o,A,w.mul,w.share,null,{last:true}));}else if(!w.done&&Math.random()<.6){if(isPhys(A)){dust(w.p,1,.6);if(Math.random()<.3)debris(TMP.set(w.p.x,.2,w.p.z).clone(),1,0,3,.25);}else ring(TMP.set(w.p.x,.15,w.p.z),A.c1,2*A.size,.25,true,2);}end=w.t>w.delay+.1;}
    else if(w.type==='wave'){const adv=w.spd*dt;w.d+=adv;const p=TMP.copy(w.o).addScaledVector(w.dir,w.d);if(w.mesh){w.mesh.position.set(p.x,0,p.z);w.mesh.material.opacity=Math.max(0,.7-w.d/w.L*.6);}
      if(insideBld(p.x,p.z,0,.5))end=true;if(w.phys)physWaveStep(w,p);else for(let k=0;k<3;k++)burst(ADD,TMP2.set(p.x+w.dir.z*rand(-w.W,w.W),.3,p.z-w.dir.x*rand(-w.W,w.W)),1,{colors:[A.c1,A.c2],speed:1,up:3,life:.4,size:.5,bright:2});
      for(const o of FS){if(o.dead||ally(o,f)||w.hit[o.id])continue;const rx=o.pos.x-w.o.x,rz=o.pos.z-w.o.z,al=rx*w.dir.x+rz*w.dir.z,lt=Math.abs(rx*w.dir.z-rz*w.dir.x);
        if(Math.abs(al-w.d)<1.2&&lt<w.W&&o.pos.y<3){w.hit[o.id]=1;cabHit(f,o,A,w.mul,1,null,{last:true});}}end=end||w.d>w.L;}
    else if(w.type==='orbit'){const n=w.meshes.length;w.meshes.forEach((m,k)=>{const a=w.t*3.2+k/n*6.28;m.position.set(f.pos.x+Math.cos(a)*w.R,f.pos.y+1.1+Math.sin(w.t*4+k)*.25,f.pos.z+Math.sin(a)*w.R);m.rotation.y+=dt*6;
        if(Math.random()<.4)burst(ADD,m.position,1,{colors:[A.c1,A.c2],speed:.3,life:.3,size:.3,size1:0,bright:2});
        for(const o of FS){if(o.dead||ally(o,f))continue;if(o.pos.distanceTo(TMP.set(m.position.x,o.pos.y,m.position.z))<.9&&game.time-(w.cd[o.id]||0)>.45){w.cd[o.id]=game.time;cabHit(f,o,A,w.mul,1/(w.dur*1.4),m.position.clone(),{hold:true});}}});}
    else if(w.type==='summon'){if(w.mesh){w.mesh.rotation.y+=dt*2;w.mesh.position.y=1.2+Math.sin(w.t*3)*.15;}w.n-=dt;if(w.n<=0){w.n=.45;let T=null,bd=15;for(const o of FS){if(o.dead||ally(o,f))continue;const d=o.pos.distanceTo(w.p);if(d<bd){bd=d;T=o;}}
        if(T){const s=w.p.clone();s.y=1.3;cabProj(f,A,w.mul,w.share,s,TMP.subVectors(T.chest(TMP2),s).clone(),34,{sc:.55,life:.8});}}}
    else if(w.type==='beam'||w.type==='cone'){if(f.state!==w.st||f.stateT<w.from)end=true;}
    if(end){if(w.mesh)scene.remove(w.mesh);(w.meshes||[]).forEach(m=>scene.remove(m));CABW.splice(i,1);}}}
/* ---- what the fighter does: t counts from the moment the ability fires ---- */
function cabTick(f,A,t,dt,mul,tier){const u=tier==='ult',sz=u?1.5:1,vf=f.vf,fw=f.fwd(),c=f.chest(new V3());
  const first=!vf.cf;if(first){vf.cf=1;f.fired=true;cabSelf(f,A,tier);cabSnd(A,f,u?'ult':'spec');}
  const cnt=Math.round(clamp(A.count*(u?1.5:1),1,16));
  switch(A.form){
    case 'bolt':if(first){const n=Math.min(cnt,3);for(let k=0;k<n;k++)cabProj(f,A,mul,1/n,c.clone().addScaledVector(fw,.8),fw.clone().applyAxisAngle(UP,(k-(n-1)/2)*.09),A.speed,{sc:sz,boom:u?1.3:0,homing:A.fx.indexOf('chain')>=0?2:0});}
      f.poseKey='spech';return {fr:10,end:.3};
    case 'volley':{const per=Math.max(1,Math.ceil(cnt/3));const w=Math.floor(t/.08);if(w<3&&!vf['w'+w]){vf['w'+w]=1;for(let k=0;k<per;k++){const a=(rand(-1,1))*(u?.6:.4);
        cabProj(f,A,mul,1/(per*3),c.clone().addScaledVector(fw,.7).add(new V3(rand(-.3,.3),rand(-.2,.4),rand(-.3,.3))),fw.clone().applyAxisAngle(UP,a),A.speed,{sc:.7*sz,homing:u?1.5:0});}}
      f.poseKey=w%2?'jabLh':'jabRh';return {fr:10,end:.4};}
    case 'beam':{const D=A.dur*(u?1.3:1);if(first){const m=new THREE.Mesh(cg('cab_beam',()=>{const q=new THREE.CylinderGeometry(1,1,1,16,1,true);q.rotateX(Math.PI/2);q.translate(0,0,.5);return q;}),addMat(A.c1,2.2,.75));
        const m2=new THREE.Mesh(cg('cab_beam',()=>null),addMat(A.c2,2.8,.9));m.add(m2);m2.scale.set(.45,.45,1);scene.add(m);CABW.push({type:'beam',f,A,t:0,dur:D+.2,mesh:m,st:f.state,from:f.stateT-.05});vf.beam=m;}
      const L=clearLen(f.pos,fw,A.range*(u?1.3:1),c.y),w=.25*A.size*sz*(1+Math.sin(t*40)*.15);if(vf.beam){vf.beam.position.copy(c);vf.beam.quaternion.setFromUnitVectors(Z1,fw);vf.beam.scale.set(w,w,Math.max(.1,L));}
      if(!vf.bt||t-vf.bt>.1){vf.bt=t;lineFoes(f,f.pos,fw,L,1+A.size*.6*sz).forEach(o=>cabHit(f,o,A,mul,.1/D,null,{hold:true,tick:true}));const e=c.clone().addScaledVector(fw,L);burst(ADD,e,6,{colors:[A.c1,A.c2,0xffffff],speed:5,life:.3,size:.35,bright:2.4});}
      f.poseKey='spech';if(t>D&&vf.beam){scene.remove(vf.beam);vf.beam=null;}return {fr:14,end:D+.15};}
    case 'wave':if(first){const W=1.6*A.size*sz;const m=new THREE.Mesh(cg('cab_wave',()=>{const q=new THREE.PlaneGeometry(1,1);q.translate(0,.5,0);return q;}),addMat(A.c1,1.6,.7));m.scale.set(W*2,1.6*A.size*sz,1);m.rotation.y=Math.atan2(fw.x,fw.z);scene.add(m);
        CABW.push({type:'wave',f,A,mul,t:0,dur:4,o:f.pos.clone(),dir:fw.clone(),d:.5,L:A.range*(u?1.4:1),W,spd:Math.max(14,A.speed*.7),hit:{},mesh:m,phys:isPhys(A)});if(isPhys(A))m.visible=false;dust(f.pos,10,1);}
      f.poseKey='smashh';return {fr:12,end:.4};
    case 'burst':if(first){const R=3.2*A.size*sz;if(isPhys(A))physRing(A,f.pos,R*.7,12);else explosion(c,R*.8,[A.c1,A.c2,0xffffff]);ring(TMP.set(f.pos.x,.2,f.pos.z).clone(),A.c1,R*2,.45,true,2.4);if(u){screenFlash(.35,f.pos);shake(.9,f.pos);}
        foes(f,R).forEach(o=>cabHit(f,o,A,mul,1,null,{last:true}));}f.poseKey='spech';return {fr:12,end:.45};
    case 'zone':if(first){const p=cabTarget(f,A,A.range*(u?1.3:1));const R=2.8*A.size*sz;const m=new THREE.Mesh(cg('cab_zone',()=>{const q=new THREE.RingGeometry(.92,1,64);return q;}),addMat(A.c1,1.6,.5));
        m.rotation.x=-Math.PI/2;m.position.set(p.x,.06,p.z);m.scale.setScalar(R);scene.add(m);CABW.push({type:'zone',f,A,mul,t:0,dur:A.dur*(u?1.4:1),p,R,n:0,mesh:m});orb(TMP.set(p.x,1,p.z).clone(),A.c1,R*.6,.4,1.6);}
      f.poseKey='command';return {fr:12,end:.4};
    case 'rain':if(first){const p=cabTarget(f,A,A.range*(u?1.3:1));const n=Math.max(5,Math.round(A.count*(u?1.6:1)));CABW.push({type:'rain',f,A,mul,t:0,dur:A.dur*(u?1.4:1),p,R:3.4*A.size*sz,cnt:n,left:n,n:0});}
      f.poseKey='command';return {fr:12,end:.45};
    case 'pillar':if(first){const T=foes(f,A.range*(u?1.3:1),f.pos,u?null:.3);const pts=T.length?T.slice(0,Math.max(1,Math.min(cnt,u?6:2))).map(o=>o.pos.clone()):[cabTarget(f,A,A.range)];
        pts.forEach((p,k)=>CABW.push({type:'pillar',f,A,mul,share:1/Math.max(1,pts.length*.7),t:0,dur:2,delay:.3+k*.12,p}));}f.poseKey='command';return {fr:12,end:.5};
    case 'dash':{if(first){vf.dir=fw.clone();vf.hit={};}const go=t<.38;if(go)f.cabSwing=true;if(go){const sp=clamp(A.speed,18,42)*(u?1.2:1);f.vel.x=vf.dir.x*sp;f.vel.z=vf.dir.z*sp;
        burst(ADD,c,4,{colors:[A.c1,A.c2],speed:2,life:.3,size:.5*A.size,size1:0,bright:2.2,dir:vf.dir,dirSp:-8});
        foes(f,1.9*sz,f.pos).forEach(o=>{if(!vf.hit[o.id]){vf.hit[o.id]=1;cabHit(f,o,A,mul,1,null,{last:true});}});}
      f.poseKey='dash';return {fr:go?0:12,end:.6};}
    case 'blink':{if(first){const T=tgtOf(f,A.range*(u?1.3:1));vf.T=T;burst(ADD,c,20,{colors:[A.c1,A.c2],speed:5,life:.4,size:.35,bright:2.4});
        if(T){const b=T.fwd();if(!blink(f,T.pos.x-b.x*1.5,T.pos.z-b.z*1.5))blink(f,T.pos.x+b.z*1.5,T.pos.z-b.x*1.5);faceTo(f,T);}else{const L=clearLen(f.pos,fw,A.range*.6);blink(f,f.pos.x+fw.x*L,f.pos.z+fw.z*L);}
        burst(ADD,f.chest(new V3()),20,{colors:[A.c1,A.c2],speed:5,life:.4,size:.35,bright:2.4});}
      if(t>.12&&t<.35)f.cabSwing=true;if(t>.18&&!vf.h){vf.h=1;const T=vf.T;(T&&!T.dead&&T.pos.distanceTo(f.pos)<3.6?[T]:foes(f,2.8,f.pos,.2)).forEach(o=>cabHit(f,o,A,mul,1,null,{last:true}));slashFX(f.chest(new V3()).addScaledVector(f.fwd(),1),A.c1,2.2);}
      f.poseKey=t<.18?'heavyw':'slash';return {fr:10,end:.55};}
    case 'grab':{if(first){const T=tgtOf(f,A.range*(u?1.3:1));vf.T=T;if(T){bolt(c,T.chest(new V3()),A.c1,.1,.45);cabHit(f,T,A,mul,.4,null,{hold:true});}}
      const T=vf.T;if(T&&!T.dead&&t<.35){pullTo(T,lerp(T.pos.x,f.pos.x+fw.x*1.7,.2),lerp(T.pos.z,f.pos.z+fw.z*1.7,.2));if(Math.random()<.5)bolt(c,T.chest(new V3()),A.c1,.06,.08);}
      if(t>.38&&!vf.h){vf.h=1;if(T&&!T.dead&&T.pos.distanceTo(f.pos)<3.4)cabHit(f,T,A,mul,.7,null,{last:true});}f.poseKey=t<.38?'command':'heavyh';return {fr:10,end:.7};}
    case 'orbit':if(first){const n=clamp(cnt,2,8),ms=[];for(let k=0;k<n;k++){const m=cabMesh(A,.8*A.size,f);scene.add(m);ms.push(m);}CABW.push({type:'orbit',f,A,mul,t:0,dur:A.dur*(u?1.5:1),R:1.6*A.size*sz,meshes:ms,cd:{}});}
      f.poseKey='command';return {fr:12,end:.35};
    case 'cone':{const D=Math.min(1.4,A.dur||.9)*(u?1.4:1),R=clamp(A.range,10,15)*(u?1.3:1);if(t<D){coneFX(f,A,c,fw,R,t,D,vf,first,dt);
        if(!vf.bt||t-vf.bt>.12){vf.bt=t;foes(f,R,f.pos,.6).forEach(o=>cabHit(f,o,A,mul,.12/D,null,{hold:true,tick:true}));}}
      f.poseKey='spech';return {fr:12,end:D+.1};}
    case 'shield':{const D=1.1*(u?1.8:1);if(first){f.armorT=Math.max(f.armorT,D+1.5);ring(c,A.c1,2.6,.4,false,2.6);}if(t<D){reflectProjs(f,3.8);for(const p of CABP){if(!ally(p.f,f)&&p.pos.distanceTo(f.pos)<3.8){p.vel.negate();p.f=f;p.hit={};}}
        if(Math.random()<.4)ring(f.chest(TMP),A.c1,2.4,.2,false,1.8);}
      if(u&&t>D&&!vf.h){vf.h=1;cabAoE(f,A,mul,1,f.pos,4.5,{last:true});}f.poseKey='block';return {fr:14,end:D+.1};}
    case 'buff':{if(first){f.powT=Math.max(f.powT||0,5*(u?1.6:1));f.hasteT=Math.max(f.hasteT||0,5*(u?1.6:1));f.auraC=A.c1;ring(c,A.c1,3,.4,false,2.6);flashLight(c,A.c1,10);if(u)cabAoE(f,A,mul,1,f.pos,3.5,{last:true});}
      f.poseKey='charge';return {fr:12,end:.45};}
    case 'slam':{if(first){f.vel.set(fw.x*6,u?16:12,fw.z*6);f.onGround=false;f.pos.y+=.1;}
      if(!vf.h)f.cabSwing=true;if(!vf.h&&t>.25&&f.onGround){vf.h=1;vf.ht=t;const p=f.pos.clone();if(isPhys(A))physRing(A,p,2.4*A.size*sz,10);else explosion(TMP.set(p.x,.8,p.z).clone(),2.4*A.size*sz,[A.c1,A.c2,0xffffff]);dust(p,18,1.5);shake(u?1:.5,p);cabAoE(f,A,mul,1,p,3.4*A.size*sz,{last:true});}
      f.poseKey=vf.h?'slamLand':'slamAir';return {fr:vf.h?12:0,end:vf.h?vf.ht+.25:2.2};}
    case 'summon':if(first){const p=f.pos.clone().addScaledVector(fw,2);p.y=1.2;const m=cabMesh(A,1.3*A.size,f);m.position.copy(p);scene.add(m);const D=A.dur*(u?1.5:1);
        CABW.push({type:'summon',f,A,mul,share:.45/D*1.3,t:0,dur:D,p,n:.3,mesh:m});burst(ADD,p,30,{colors:[A.c1,A.c2,0xffffff],speed:5,life:.5,size:.35,bright:2.4});}
      f.poseKey='command';return {fr:12,end:.45};}
  return {fr:10,end:.3};}
/* ---- hooking recipes into specials and ultimates ---- */
function cabSpecial(f,dt,A,k){const t=f.stateT-.18;if(t<0){f.poseKey='specw';return 10;}const r=cabTick(f,A,t,dt,cabMul(A,'sp',k),'sp');if(t>r.end)f.set(f.onGround?'idle':'air');return r.fr;}
SPECIALS.cab=function(f,dt){const C=f.hero.cab;if(!C||!C.sp){f.set('idle');return 10;}return cabSpecial(f,dt,C.sp,0);};
SPECVAR.cab={chg:['',(f,dt,k)=>{const C=f.hero.cab;return C&&C.sp?cabSpecial(f,dt,C.sp,.4+k*.6):10;}],alt:['',f=>{const C=f.hero.cab;const A=C&&(C.spAlt||C.sp);return A?cabSpecial(f,0,A,0):10;}]};
function doCabUltWith(f,dt,A){const t=f.stateT,c=f.chest(new V3());
  if(t<.9){f.poseKey='charge';f.invuln=Math.max(f.invuln,.2);for(let k=0;k<4;k++){const a=rand(0,6.28),r=rand(2,3.5),p=new V3(c.x+Math.cos(a)*r,c.y+rand(-1.2,1.2),c.z+Math.sin(a)*r);
      ADD.spawn(p.x,p.y,p.z,(c.x-p.x)*3,(c.y-p.y)*3,(c.z-p.z)*3,..._rgb(pick([A.c1,A.c2,0xffffff]),2.2),.33,.3,.05,0,0);}if(Math.random()<.2)ring(c,A.c1,rand(1.5,2.5),.3,false,2);return 10;}
  if(!f.u1){f.u1=true;if(game.cine&&game.cine.f===f)game.cine=null;f.uEnd=99;}
  const r=cabTick(f,A,t-.9,dt,cabMul(A,'ult',0),'ult');if(t-.9>r.end){f.set(f.onGround?'idle':'air');f.invuln=.2;f.clearUltFX();}return r.fr;}
Fighter.prototype.doCabUlt=function(dt){const C=this.hero.cab,A=this.ultAlt?(C.ultAlt||C.ult):C.ult;return doCabUltWith(this,dt,A);};
ALTULT.cab={name:'',r:14,s(){},u(){return 12;}};
function cabAI(A){if(!A)return [6,22,.5];const m={bolt:[3,22],volley:[2,18],beam:[3,A.range],wave:[2,A.range],burst:[0,3.5*A.size],zone:[2,A.range],rain:[3,A.range],pillar:[2,A.range],dash:[2,10],
  blink:[3,A.range],grab:[3,A.range],orbit:[0,6],cone:[0,7],shield:[0,6],buff:[0,8],slam:[0,6],summon:[0,14]}[A.form]||[3,16];return [m[0],m[1],.5];}
function cabSpecTime(A){return ({zone:5,summon:7,orbit:6,shield:5,buff:8,rain:4.5,beam:3.6,cone:3.4})[A.form]||2.6;}
function cabDescribe(A){if(!A)return '';if(A.desc)return A.desc;const F={bolt:'fires a projectile',volley:'fires a volley',beam:'channels a beam',wave:'sends a ground wave',burst:'erupts around you',zone:'creates a zone',
  rain:'rains down on an area',pillar:'erupts under foes',dash:'dashes through foes',blink:'teleports and strikes',grab:'grabs and pulls',orbit:'circles you with orbs',cone:'breathes a cone',shield:'raises a shield',
  buff:'powers you up',slam:'leaps and slams',summon:'summons a turret'}[A.form];return `${A.style} — ${F}${A.fx.length?' · '+A.fx.join(', '):''}`;}
window.__cabw=()=>CABW.map(w=>w.type+':'+w.t.toFixed(1)+'@'+(w.p?w.p.x.toFixed(1)+','+w.p.z.toFixed(1):'')).join(' ');
