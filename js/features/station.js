/* SURGE LINE: an underground station under the z=48 road, and the bullet train that runs through it.
   - Stairs go down from the plaza at (-24,24) into a tiled hall with two platforms, pillars, benches, signs and boards.
   - The tunnel runs the whole width of the city. The bullet train shuttles: station -> west depot -> station -> east depot,
     stopping with its doors open. Walk inside (seats, racks, gangways between cars) or ride on the roof; anyone on the
     track in front of it gets launched. Its position is one shared phase (the host re-syncs it), so everyone sees the same train.
   - The underground is real: floorAt() gets the station floor from ugBase, the street slab is a ceiling, attacks don't
     reach through it, the camera stays under it, and bots walk the stairs (and mall escalators) to reach you.
   Also here: sloped-floor snapping + moving escalators for every RAMP (mall.js). */
const UG={xc0:12,xc1:17,z:48,hx0:-68,hx1:20,hz0:37.5,hz1:58.5,bed:-7.1,plat:-6,ceil:-.6,tz0:44.5,tz1:51.5,tceil:-.8,end:BOUND-2,
  st:{x0:-28.5,x1:-19.5,z0:28.5,z1:37.5},pS:46.1,pN:49.9,cx:-24};
function ugInHall(x,z){return x>UG.hx0&&x<UG.hx1&&z>UG.hz0&&z<UG.hz1;}
function ugIn(x,z){return ugInHall(x,z)||(z>UG.tz0&&z<UG.tz1&&Math.abs(x)<UG.end+1);}
function ugStair(x,z){const S=UG.st;return x>S.x0&&x<S.x1&&z>S.z0&&z<S.z1;}
function isUnder(p){return p.y<-1.2&&ugIn(p.x,p.z);}
// the ground under a point for things that used to assume the street (y=0): projectiles landing, ground waves
function gndY(p){return p.y<-.4&&world.visible&&(ugIn(p.x,p.z)||ugStair(p.x,p.z))?floorAt(p.x,p.z,p.y+.4):0;}
ugBase=function(x,z,y){if(!world.visible)return 0;if(ugStair(x,z))return UG.bed;if(y<-.3&&ugIn(x,z))return UG.bed;return 0;};
RAMPS.push({x0:UG.st.x0,x1:UG.st.x1,z0:UG.st.z0-.05,z1:UG.st.z1+.05,ax:'z',a0:UG.st.z0,a1:UG.st.z1,y0:0,y1:UG.plat,stair:true});

/* ---------- station textures ---------- */
const ST_TILE=(()=>{const T=ctLayers(256,256,'#e8e6e0',.35,0),{g,hg}=T;for(let y=0;y<256;y+=16)for(let x=0;x<256;x+=16){ctRect(g,ctShade('#eeece6',rand(-.04,.03)),x+.6,y+.6,14.8,14.8);ctRect(hg,'#b0b0b0',x+.6,y+.6,14.8,14.8);}
  ctRect(g,'#1aa89a',0,150,256,22);ctRect(g,'#e8c030',0,174,256,5);ctGrain(g,8);
  return {map:ctRep(tex(T.c)),normal:ctNormal(T.hc,1.6),orm:ctData(T.o)};})();
const ST_ADS=[[512,128],[768,128],[512,384]];
const ST_SIGNS=(()=>{const [c,g]=cv(1024,512);g.fillStyle='#000';g.fillRect(0,0,1024,512);const F="'Bebas Neue', Impact, 'Noto Sans JP','Hiragino Sans','Meiryo',sans-serif";
  const board=(x,y,w,h,bg,draw)=>{g.fillStyle=bg;g.fillRect(x+2,y+2,w-4,h-4);draw(x,y,w,h);};
  // 0: station name board
  board(0,0,512,128,'#f4f4f0',(x,y)=>{g.fillStyle='#1aa89a';g.fillRect(x+2,y+86,508,14);g.fillStyle='#14161a';g.textAlign='center';g.font=`900 52px ${F}`;g.fillText('中央 CENTRAL',x+256,y+58);
    g.font=`700 18px ${F}`;g.fillStyle='#ffffff';g.fillText('SURGE LINE  ·  S-07',x+256,y+97);g.fillStyle='#14161a';g.textAlign='left';g.fillText('◀ WEST DEPOT',x+14,y+120);g.textAlign='right';g.fillText('EAST DEPOT ▶',x+498,y+120);});
  // 1: hanging direction sign
  board(512,0,512,128,'#14161a',(x,y)=>{g.textAlign='center';g.font=`900 44px ${F}`;g.fillStyle='#ffffff';g.fillText('🚅 SURGE LINE',x+256,y+56);g.font=`700 26px ${F}`;g.fillStyle='#e8c030';g.fillText('EXIT ▲ PLAZA  ·  PLATFORMS 1 / 2',x+256,y+100);});
  // 2: departure board
  board(0,128,512,128,'#0a0c10',(x,y)=>{g.textAlign='left';g.font=`700 28px ${F}`;[['BULLET','WEST DEPOT','ON TIME','#7dff8a'],['BULLET','EAST DEPOT','ON TIME','#7dff8a'],['LOCAL','CENTRAL','BOARDING','#ffd23f']].forEach(([a,b,s,c2],i)=>{
    g.fillStyle='#ff8a3a';g.fillText(a,x+16,y+36+i*34);g.fillStyle='#e8e8e8';g.fillText(b,x+140,y+36+i*34);g.fillStyle=c2;g.fillText(s,x+360,y+36+i*34);});});
  // 3-5: wall ads (original products)
  [['HYPER COLA','#e8302a','#ffffff','ICE COLD POWER'],['HERO INSURANCE','#2a5ad8','#ffd23f','WE COVER COLLATERAL'],['ZEN SPA','#8a4ac8','#ffffff','RECOVER LIKE A PRO']].forEach(([t,bg,fg,s],i)=>{
    board(ST_ADS[i][0],ST_ADS[i][1],256,128,bg,(x,y)=>{const gr=g.createLinearGradient(x,y,x+256,y+128);gr.addColorStop(0,'rgba(255,255,255,.18)');gr.addColorStop(1,'rgba(0,0,0,.25)');g.fillStyle=gr;g.fillRect(x+2,y+2,252,124);
      g.textAlign='center';g.fillStyle=fg;g.font=`900 34px ${F}`;g.fillText(t,x+128,y+60,236);g.font=`700 18px ${F}`;g.fillText(s,x+128,y+92,236);});});
  // 6: platform numbers
  board(0,256,256,128,'#1aa89a',(x,y)=>{g.textAlign='center';g.fillStyle='#ffffff';g.font=`900 80px ${F}`;g.fillText('1',x+128,y+92);});
  board(256,256,256,128,'#1aa89a',(x,y)=>{g.textAlign='center';g.fillStyle='#ffffff';g.font=`900 80px ${F}`;g.fillText('2',x+128,y+92);});
  // 8: entrance sign
  board(512,256,512,128,'#1aa89a',(x,y)=>{g.textAlign='center';g.fillStyle='#ffffff';g.font=`900 56px ${F}`;g.fillText('地下鉄 SURGE LINE',x+256,y+72);g.font=`700 22px ${F}`;g.fillText('CENTRAL STATION · BULLET SERVICE',x+256,y+106);});
  // 10: crossing warning
  board(768,384,256,128,'#f2c230',(x,y)=>{g.fillStyle='#14161a';for(let i=-2;i<12;i++){g.beginPath();g.moveTo(x+4+i*24,y+4);g.lineTo(x+16+i*24,y+4);g.lineTo(x+4+i*24,y+16);g.lineTo(x-8+i*24,y+16);g.fill();g.beginPath();g.moveTo(x+4+i*24,y+112);g.lineTo(x+16+i*24,y+112);g.lineTo(x+4+i*24,y+124);g.lineTo(x-8+i*24,y+124);g.fill();}
    g.fillStyle='#f2c230';g.fillRect(x,y,4,128);g.fillRect(x+252,y,4,128);g.fillStyle='#14161a';g.textAlign='center';g.font=`900 34px ${F}`;g.fillText('⚠ TRACK CROSSING',x+128,y+58,236);g.font=`700 22px ${F}`;g.fillText('PLATFORM 1 ⇄ 2 · LOOK BOTH WAYS',x+128,y+92,240);});
  // 9: train livery text
  board(0,384,512,128,'#000000',(x,y)=>{g.textAlign='center';g.fillStyle='#1aa89a';g.font=`900 60px ${F}`;g.fillText('SURGE LINE',x+256,y+82);});
  return tex(c);})();
const stUV=(x,y,w,h)=>[x/1024,1-(y+h)/512,(x+w)/1024,1-y/512];
const stTileMat=selfLit(new THREE.MeshStandardMaterial({map:ST_TILE.map,normalMap:ST_TILE.normal,roughnessMap:ST_TILE.orm,roughness:1}),.12);
const stFloorMat=selfLit(new THREE.MeshStandardMaterial({map:STN.map,normalMap:STN.normal,roughness:.7,color:0xd8d6d0}),.09);
const stCeilMat=selfLit(new THREE.MeshStandardMaterial({color:0xe4e8ee,roughness:.8}),.2);
const stConcMat=selfLit(new THREE.MeshStandardMaterial({map:TRT.map,normalMap:TRT.normal,roughness:.9,color:0x9a9ca0}),.06);
const stBedMat=(()=>{const T=ctLayers(128,128,'#3a3836',.95,0),{g,hg}=T;for(let i=0;i<2200;i++){const v=rand(40,120)|0;ctRect(g,`rgb(${v},${v-4},${v-8})`,rand(0,128),rand(0,128),rand(1,3),rand(1,3));ctRect(hg,`rgb(${v*2},${v*2},${v*2})`,rand(0,128),rand(0,128),rand(1,3),rand(1,3));}
  return selfLit(new THREE.MeshStandardMaterial({map:ctRep(tex(T.c)),normalMap:ctNormal(T.hc,2),roughness:1}),.06);})();
const stYellow=(()=>{const [c,g]=cv(32,32);g.fillStyle='#e8c030';g.fillRect(0,0,32,32);g.fillStyle='#f8d850';for(let y=4;y<32;y+=8)for(let x=4;x<32;x+=8){g.beginPath();g.arc(x,y,2.4,0,7);g.fill();}
  const t=ctRep(tex(c));return selfLit(new THREE.MeshStandardMaterial({map:t,roughness:.7}),.1);})();
[stTileMat,stFloorMat,stCeilMat,stConcMat,stBedMat,stYellow].forEach(m=>m.envMapIntensity=.2);
const stSignMat=new THREE.MeshBasicMaterial({map:ST_SIGNS});stSignMat.color.setScalar(1.2);stSignMat.userData.noShadow=true;
const stLight=new THREE.MeshStandardMaterial({color:0xffffff,emissive:0xf4fbff,emissiveIntensity:2.4});stLight.userData.noShadow=true;
const stWarn=new THREE.MeshStandardMaterial({color:0x401010,emissive:0xff2a1a,emissiveIntensity:.15});stWarn.userData.noShadow=true;

/* ---------- build the station, stairs, tunnel ---------- */
(function buildStation(){const U=UG,Y0=U.bed,P=U.plat,CL=U.ceil,coll=(x0,x1,z0,z1,y0,h,top)=>BLD.push({x0,x1,z0,z1,y0,h,top:!!top});
  const B=(mat,x0,x1,z0,z1,y0,y1,uv,c)=>{mBox(mat,x1-x0,y1-y0,z1-z0,(x0+x1)/2,(y0+y1)/2,(z0+z1)/2,uv);if(c)coll(x0,x1,z0,z1,y0,y1,c==='top');};
  // hall shell: ceiling slab (casts the shadow that keeps the sun out), walls, platforms, track bed
  B(stCeilMat,U.hx0-.3,U.hx1+.3,U.hz0-.3,U.hz1+.3,CL,-.05,0,'wall');
  B(stTileMat,U.hx0,U.hx1,U.hz0-.3,U.hz0,Y0,CL,-4);coll(U.hx0,U.st.x0,U.hz0-.3,U.hz0,-8,-.05);coll(U.st.x1,U.hx1,U.hz0-.3,U.hz0,-8,-.05);
  B(stTileMat,U.hx0,U.hx1,U.hz1,U.hz1+.3,Y0,CL,-4,'wall');
  [[U.hx0-.3,U.hx0],[U.hx1,U.hx1+.3]].forEach(([a,b])=>{B(stTileMat,a,b,U.hz0,U.tz0,Y0,CL,-4,'wall');B(stTileMat,a,b,U.tz1,U.hz1,Y0,CL,-4,'wall');B(stConcMat,a,b,U.tz0,U.tz1,U.tceil,CL,-4);});
  const XC0=U.xc0,XC1=U.xc1;
  B(stFloorMat,U.hx0,XC0,U.hz0,U.pS,Y0,P,-3,'top');B(stFloorMat,U.hx0,XC0,U.pN,U.hz1,Y0,P,-3,'top');
  B(stYellow,U.hx0,XC0-.4,U.pS-.75,U.pS-.35,P,P+.01,-.4);B(stYellow,U.hx0,XC0-.4,U.pN+.35,U.pN+.75,P,P+.01,-.4);
  B(stLight,U.hx0,XC0,U.pS-.1,U.pS-.02,P-.02,P+.004);B(stLight,U.hx0,XC0,U.pN+.02,U.pN+.1,P-.02,P+.004);
  B(stBedMat,U.hx0,U.hx1,U.pS,U.pN,Y0-.3,Y0,-4);
  // east end: both platforms slope down to a level crossing over the tracks, so you can get from one side to the other
  // without jumping (the trains still come through here: look both ways)
  B(stFloorMat,XC1,U.hx1,U.hz0,U.pS,Y0-.3,Y0,-3);B(stFloorMat,XC1,U.hx1,U.pN,U.hz1,Y0-.3,Y0,-3);
  for(let x=XC1+.25;x<U.hx1-.2;x+=.7)B(stYellow,x,x+.35,U.pS+.1,U.pN-.1,Y0,Y0+.015,-.4);
  {const dy=P-Y0,an=Math.atan2(dy,XC1-XC0),L=Math.hypot(dy,XC1-XC0);
    [[U.hz0,U.pS,U.pS-.15,U.pS],[U.pN,U.hz1,U.pN,U.pN+.15]].forEach(([z0,z1,e0,e1])=>{
      // the ramp is a wedge (closed sides, nothing to see under it)
      const g=new THREE.BoxGeometry(XC1-XC0,dy,z1-z0);boxUVW(g,3);const pa=g.attributes.position;for(let i=0;i<pa.count;i++)if(pa.getX(i)>0&&pa.getY(i)>0)pa.setY(i,-dy/2+.001);
      g.computeVertexNormals();g.translate((XC0+XC1)/2,(P+Y0)/2,(z0+z1)/2);mGeo(stFloorMat,g);
      const st=new THREE.BoxGeometry(L,.014,.3);st.rotateZ(-an);st.translate((XC0+XC1)/2,(P+Y0)/2+.008,(e0+e1)/2+(e0<U.z?-.12:.12));mGeo(stYellow,st);
      RAMPS.push({x0:XC0,x1:XC1+.05,z0,z1,ax:'x',a0:XC0,a1:XC1,y0:P,y1:Y0});
      // the ramp's edge over the tracks is a wall from below until it's low enough to step onto
      for(let k=0;k<10;k++){const xa=XC0+k*.5,top=P-(k+1)*.5*dy/(XC1-XC0);coll(xa,xa+.5,e0,e1,Y0-.3,top,true);}});}
  // crossing: warning signs + lamps that flash when a train is coming
  [[U.hz0+.02,0],[U.hz1-.02,Math.PI]].forEach(([z,r])=>{mBox(blackMat,2.3,1.2,.06,(XC1+U.hx1)/2,-3.9,z+(r?-.03:.03));mQuad(stSignMat,2.2,1.1,(XC1+U.hx1)/2,-3.9,z+(r?-.07:.07),r,stUV(768,384,256,128));
    [-1.45,1.45].forEach(o=>{mBox(blackMat,.36,.36,.12,(XC1+U.hx1)/2+o,-3.9,z+(r?-.06:.06));mBox(stWarn,.24,.24,.06,(XC1+U.hx1)/2+o,-3.9,z+(r?-.13:.13));});});
  // tunnel: concrete tube both ways out of the hall to the depots
  [[-U.end,U.hx0-.3],[U.hx1+.3,U.end]].forEach(([a,b])=>{B(stConcMat,a,b,U.tz0-.3,U.tz1+.3,U.tceil,-.05,-4,'wall');B(stConcMat,a,b,U.tz0-.3,U.tz0,Y0,U.tceil,-4,'wall');B(stConcMat,a,b,U.tz1,U.tz1+.3,Y0,U.tceil,-4,'wall');
    B(stBedMat,a,b,U.tz0,U.tz1,Y0-.3,Y0,-4);for(let x=a+6;x<b;x+=12){[U.tz0+.08,U.tz1-.08].forEach(z=>mBox(stLight,.5,.12,.06,x,-3.2,z));mBox(pipeMat,6,.1,.1,x,-2.3,U.tz0+.1);}});
  [-1,1].forEach(s=>{B(stConcMat,s*U.end-(s<0?.4:0),s*U.end+(s>0?.4:0),U.tz0,U.tz1,Y0,U.tceil,0,'wall');for(let k=-1;k<=1;k+=2){const bx=s*(U.end-.6);mBox(lanternMat,.5,1,.6,bx,Y0+.5,U.z+k*.7);}});
  // rails + sleepers the whole way
  [-.72,.72].forEach(o=>mBox(railMat,U.end*2,.16,.12,0,Y0+.08,U.z+o));for(let x=-U.end+.5;x<U.end;x+=1.2)mBox(blackMat,.28,.1,2.4,x,Y0+.03,U.z);
  // platforms: pillars, benches, bins, vending machines, signs, boards, ads, lights
  for(let x=U.hx0+8;x<U.hx1-4;x+=10){[41.6,54.4].forEach((z,k)=>{B(stTileMat,x-.45,x+.45,z-.45,z+.45,P,CL,-4,'wall');
      if(Math.round(x/10)%2===0){B(furnMats[0],x+1.5,x+3.7,z-.25,z+.25,P+.42,P+.5,0,'top');mBox(railMat,.1,.42,.4,x+1.6,P+.21,z);mBox(railMat,.1,.42,.4,x+3.6,P+.21,z);}
      else{mBox(railMat,.5,.9,.5,x+1.6,P+.45,z);}});}
  [[U.hx0+.6,41,1],[U.hx0+.6,55,-1]].forEach(([x,z])=>{mBox(blackMat,.8,1.9,1.1,x+.4,P+.95,z);mBox(machineMat,.05,1.1,.9,x+.82,P+1.2,z);coll(x,x+.8,z-.55,z+.55,P,P+1.9,true);});
  // wall dressing: tiles hide the concrete; station name boards and ads on the walls facing the platforms
  for(let x=U.hx0+6;x<U.hx1-6;x+=16){mQuad(stSignMat,6,1.5,x,P+2.6,U.hz0+.02,0,stUV(0,0,512,128));mQuad(stSignMat,6,1.5,x,P+2.6,U.hz1-.02,Math.PI,stUV(0,0,512,128));
    const k=Math.round((x-U.hx0)/16),a1=ST_ADS[k%3],a2=ST_ADS[(k+1)%3];mQuad(stSignMat,3,1.5,x+8,P+2.6,U.hz0+.02,0,stUV(a1[0],a1[1],256,128));mQuad(stSignMat,3,1.5,x+8,P+2.6,U.hz1-.02,Math.PI,stUV(a2[0],a2[1],256,128));}
  // hanging signs, departure boards, ceiling light strips
  for(let x=U.hx0+12;x<U.hx1-4;x+=24){[[42.5,0],[53.5,Math.PI]].forEach(([z,r])=>{mBox(blackMat,4.2,1.1,.12,x,-2.3,z);mQuad(stSignMat,4,1,x,-2.3,z+(r?-.07:.07),r,stUV(512,0,512,128));mQuad(stSignMat,4,1,x,-2.3,z+(r?.07:-.07),r+Math.PI,stUV(512,0,512,128));
      mBox(railMat,.05,1.1,.05,x-1.6,-1.2,z);mBox(railMat,.05,1.1,.05,x+1.6,-1.2,z);});
    [[44,0],[52,Math.PI]].forEach(([z,r])=>{mBox(blackMat,2.6,.8,.14,x+12,-2.1,z);mQuad(stSignMat,2.5,.65,x+12,-2.1,z+(r?-.08:.08),r,stUV(0,128,512,128));});}
  for(let x=U.hx0+2;x<U.hx1-2;x+=6){[40.2,43.8,52.2,55.8].forEach(z=>mBox(stLight,3.6,.06,.22,x+1.8,CL-.05,z));}
  mQuad(stSignMat,2,1,U.hx0+.05,P+2.2,41.5,Math.PI/2,stUV(0,256,256,128));mQuad(stSignMat,2,1,U.hx0+.05,P+2.2,54.5,Math.PI/2,stUV(256,256,256,128));
  // the stairs down from the plaza: real steps (the walk is a smooth ramp), tiled side walls, handrails, a canopy and sign
  const S=U.st,n=34,run=(S.z1-S.z0)/n,rise=-P/n;for(let i=0;i<n;i++){const y=-(i+1)*rise;mBox(stFloorMat,S.x1-S.x0,rise+.02,run+.02,(S.x0+S.x1)/2,y+rise/2,S.z0+(i+.5)*run);mBox(stYellow,S.x1-S.x0,.012,.06,(S.x0+S.x1)/2,y+rise+.006,S.z0+i*run+.03);}
  [[S.x0-.3,S.x0],[S.x1,S.x1+.3]].forEach(([a,b])=>{B(stTileMat,a,b,S.z0,S.z1,Y0,-.05,-4);coll(a,b,S.z0,S.z1,-8,-.05);
    const hx=(a+b)/2+(a<S.x0?.25:-.25),ln=Math.hypot(S.z1-S.z0,-P),th=Math.atan2(-P,S.z1-S.z0);const g=new THREE.BoxGeometry(.07,.07,ln);g.rotateX(th);g.translate(hx,P/2+.95,(S.z0+S.z1)/2);mGeo(railMat,g);
    for(const z of [33.2,35.2,37])mBox(stLight,.04,.12,1.2,(a+b)/2+(a<S.x0?.17:-.17),P*(z-S.z0)/(S.z1-S.z0)+2.3,z);});
  [[S.x0-.45,S.x0+.05],[S.x1-.05,S.x1+.45]].forEach(([a,b])=>{B(capMat,a,b,S.z0,S.z1+.3,-.05,.16,-4);B(mallGlassMat,a+.2,b-.2,S.z0+.3,S.z1,.16,1.1,0,'wall');B(finMat,a+.15,b-.15,S.z0+.3,S.z1,1.06,1.14);});
  B(capMat,S.x0-.45,S.x1+.45,S.z1,S.z1+.45,-.05,.16,-4);B(mallGlassMat,S.x0,S.x1,S.z1+.1,S.z1+.3,.16,1.1,0,'wall');B(finMat,S.x0,S.x1,S.z1+.12,S.z1+.28,1.06,1.14);
  [[S.x0-.3,S.z0+.3],[S.x1+.3,S.z0+.3],[S.x0-.3,S.z1],[S.x1+.3,S.z1]].forEach(([x,z])=>{mBox(finMat,.22,3.6,.22,x,1.8,z);solids.push({x,z,r:.3});});
  mBox(mallGlassMat,S.x1-S.x0+1.2,.08,S.z1-S.z0+.6,(S.x0+S.x1)/2,3.62,(S.z0+S.z1)/2+.15);for(let z=S.z0+.3;z<=S.z1+.01;z+=2.2)mBox(finMat,S.x1-S.x0+1.2,.14,.12,(S.x0+S.x1)/2,3.6,z);
  coll(S.x0-.6,S.x1+.6,S.z0+.2,S.z1+.3,3.4,3.7,true);
  mBox(finMat,S.x1-S.x0+1.2,1.4,.2,(S.x0+S.x1)/2,4.4,S.z0+.3);mQuad(stSignMat,8.6,1.2,(S.x0+S.x1)/2,4.4,S.z0+.19,Math.PI,stUV(512,256,512,128));
  mBox(blackMat,4.4,1.2,.1,(S.x0+S.x1)/2,-1.7,U.hz0+.3);mQuad(stSignMat,4.2,1.05,(S.x0+S.x1)/2,-1.7,U.hz0+.36,0,stUV(512,0,512,128));
  {const px=S.x0-2.6,pz=S.z0-1.4;mBox(capMat,1,.3,1,px,.15,pz);mBox(finMat,.3,4.1,.3,px,2.2,pz);mBox(blackMat,2.5,.72,.34,px,4.1,pz);
    [[pz+.175,0],[pz-.175,Math.PI]].forEach(([z,r])=>mQuad(stSignMat,2.4,.6,px,4.1,z,r,stUV(512,256,512,128)));mBox(stLight,2.3,.05,.2,px,3.72,pz);solids.push({x:px,z:pz,r:.45});}
  mergeCity();
  // cut the stairwell out of the street
  {const H=(BOUND*2+160)/2,sh=new THREE.Shape();sh.moveTo(-H,-H);sh.lineTo(H,-H);sh.lineTo(H,H);sh.lineTo(-H,H);sh.lineTo(-H,-H);
    const hole=new THREE.Path();hole.moveTo(S.x0,-S.z0);hole.lineTo(S.x0,-S.z1);hole.lineTo(S.x1,-S.z1);hole.lineTo(S.x1,-S.z0);hole.lineTo(S.x0,-S.z0);sh.holes.push(hole);
    const g=new THREE.ShapeGeometry(sh);const p=g.attributes.position,uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,(p.getX(i)+H)/(2*H),(p.getY(i)+H)/(2*H));
    ground.geometry.dispose();ground.geometry=g;}
  // nothing parked in the hole
  props.forEach(p=>{if(ugStair(p.x,p.z)||(Math.abs(p.x-UG.cx)<6&&p.z>27&&p.z<39)){p.x=p.z=9999;p.g.position.set(9999,-50,9999);}});
  for(let i=solids.length-1;i>=0;i--){const s=solids[i];if(ugStair(s.x,s.z))solids.splice(i,1);}
  // minimap: the line and the station
  {const g=mmBase.getContext('2d');g.strokeStyle='rgba(26,168,154,.75)';g.lineWidth=2;g.setLineDash([5,4]);g.beginPath();g.moveTo((-U.end+MAPH)*MS,(U.z+MAPH)*MS);g.lineTo((U.end+MAPH)*MS,(U.z+MAPH)*MS);g.stroke();g.setLineDash([]);
    g.fillStyle='#1aa89a';g.fillRect((S.x0+MAPH)*MS,(S.z0+MAPH)*MS,(S.x1-S.x0)*MS,(S.z1-S.z0)*MS);}
  // a white dot on the minimap marks the station entrance (it sticks to the edge when you're far away)
  MAP_MARKS.push({x:UG.cx,z:(S.z0+S.z1)/2,col:'#ffffff',r:9,label:'M',tcol:'#0f7a70',edge:true,ring:true});
})();

/* ---------- the bullet train ---------- */
const BT={cars:4,CL:17,gap:.6,W:3.4,yF:-6,yC:-3.45,yT:-3.05,nose:7,stop:UG.cx,ph:0,x:UG.cx,v:0,dirn:0,open:0,g:null,boxes:[],doorBoxes:[],sync:0,P:0,legs:[]};
BT.half=(BT.cars*BT.CL+(BT.cars-1)*BT.gap)/2;BT.depW=-UG.end+BT.half+1;BT.depE=UG.end-BT.half-1;
// timetable: dwell at the station, run to the west depot, dwell, back, dwell, east depot, dwell, back
{const A=12,VM=46,run=(x0,x1)=>{const d=Math.abs(x1-x0),tA=VM/A,dA=VM*VM/(2*A);const t=d<2*dA?2*Math.sqrt(d/A):2*tA+(d-2*dA)/VM;return {k:'run',x0,x1,t,d};},dw=(x,t)=>({k:'dwell',x,t});
  BT.legs=[dw(BT.stop,10),run(BT.stop,BT.depW),dw(BT.depW,5),run(BT.depW,BT.stop),dw(BT.stop,10),run(BT.stop,BT.depE),dw(BT.depE,5),run(BT.depE,BT.stop)];BT.P=BT.legs.reduce((a,l)=>a+l.t,0);
  BT.at=ph=>{ph=((ph%BT.P)+BT.P)%BT.P;for(const l of BT.legs){if(ph<l.t){if(l.k==='dwell'){const o=Math.min(1,Math.max(0,Math.min(ph-.8,l.t-1.2-ph)/.8));return {x:l.x,v:0,open:o,dir:0,dwell:true,left:l.t-ph};}
        const s=Math.sign(l.x1-l.x0),d=l.d,tA=VM/A,dA=VM*VM/(2*A);let p,v;
        if(d<2*dA){const th=l.t/2,vp=A*th;if(ph<th){p=.5*A*ph*ph;v=A*ph;}else{const q=ph-th;p=d/2+vp*q-.5*A*q*q;v=vp-A*q;}}
        else{const tc=l.t-2*tA;if(ph<tA){p=.5*A*ph*ph;v=A*ph;}else if(ph<tA+tc){p=dA+VM*(ph-tA);v=VM;}else{const q=ph-tA-tc;p=dA+VM*tc+VM*q-.5*A*q*q;v=VM-A*q;}}
        return {x:l.x0+s*p,v:v*s,open:0,dir:s,dwell:false,left:l.t-ph,to:l.x1};}ph-=l.t;}return {x:BT.stop,v:0,open:0,dir:0,dwell:true,left:0};};}
// merge a list of geometries into one mesh per material (the train is a moving group, so it isn't part of mergeCity)
function geoMerge(list){let nv=0,ni=0;list.forEach(g=>{nv+=g.attributes.position.count;ni+=g.index?g.index.count:g.attributes.position.count;});
  const P=new Float32Array(nv*3),N=new Float32Array(nv*3),U=new Float32Array(nv*2),C=list[0].attributes.color?new Float32Array(nv*3):null,I=new Uint32Array(ni);let ov=0,oi=0;
  list.forEach(g=>{const pc=g.attributes.position.count;P.set(g.attributes.position.array,ov*3);N.set(g.attributes.normal.array,ov*3);if(g.attributes.uv)U.set(g.attributes.uv.array,ov*2);if(C&&g.attributes.color)C.set(g.attributes.color.array,ov*3);
    if(g.index){const ix=g.index.array;for(let k=0;k<ix.length;k++)I[oi+k]=ix[k]+ov;oi+=ix.length;}else{for(let k=0;k<pc;k++)I[oi+k]=ov+k;oi+=pc;}ov+=pc;g.dispose();});
  const M=new THREE.BufferGeometry();M.setAttribute('position',new THREE.BufferAttribute(P,3));M.setAttribute('normal',new THREE.BufferAttribute(N,3));M.setAttribute('uv',new THREE.BufferAttribute(U,2));if(C)M.setAttribute('color',new THREE.BufferAttribute(C,3));
  M.setIndex(new THREE.BufferAttribute(I,1));M.computeBoundingSphere();return M;}
function btMerge(G,list,mat){const m=new THREE.Mesh(geoMerge(list),mat);m.castShadow=!mat.transparent;m.receiveShadow=true;m.frustumCulled=false;G.add(m);return m;}
const btBody=new THREE.MeshPhysicalMaterial({vertexColors:true,metalness:.3,roughness:.3,clearcoat:.6,clearcoatRoughness:.15,envMapIntensity:.35});
const btGlass=new THREE.MeshStandardMaterial({color:0x1a2a3a,transparent:true,opacity:.38,metalness:.8,roughness:.05,depthWrite:false,envMapIntensity:.4});
const btHead=new THREE.MeshStandardMaterial({color:0xffffff,emissive:0xfff4d8,emissiveIntensity:3}),btTail=new THREE.MeshStandardMaterial({color:0x400000,emissive:0xff2010,emissiveIntensity:2.5});
const btLamp=new THREE.MeshStandardMaterial({color:0xffffff,emissive:0xf4fbff,emissiveIntensity:1.1});
const btDoorMat=new THREE.MeshStandardMaterial({color:0xe8eaee,metalness:.4,roughness:.35});
(function buildTrain(){const G=new THREE.Group(),lists={b:[],v:[],gl:[],l:[]},T=BT,z0=-T.W/2,z1=T.W/2,yR=UG.bed;
  const colorize=(g,c)=>mColor(g,c);
  const bx=(L,col,x0,x1,za,zb,y0,y1)=>{const g=new THREE.BoxGeometry(x1-x0,y1-y0,zb-za);g.translate((x0+x1)/2,(y0+y1)/2,(za+zb)/2);if(col!=null)colorize(g,col);L.push(g);};
  const WH=0xf2f4f6,STR=0x1aa89a,DK=0x22262c,INT=0xe8e2d6,SEAT=0x2a4a8a,FLR=0x4a4e58;
  const LB=[],door=[];
  const box=(x0,x1,za,zb,y0,h,top,isDoor)=>{const b={lx0:x0,lx1:x1,z0:UG.z+za,z1:UG.z+zb,y0,h,top:!!top,x0:0,x1:0};(isDoor?door:LB).push(b);};
  for(let c=0;c<T.cars;c++){const cx=-T.half+T.CL/2+c*(T.CL+T.gap),a=cx-T.CL/2,b=cx+T.CL/2;const lead=c===0,tail=c===T.cars-1;
    const pa=lead?a+T.nose:a,pb=tail?b-T.nose:b;   // passenger section
    // undercarriage, floor, bogies
    bx(lists.b,0x5a5e66,a+.4,b-.4,z0+.15,z1-.15,yR+.3,T.yF-.25);bx(lists.v,FLR,pa,pb,z0+.1,z1-.1,T.yF-.25,T.yF);
    [a+2.6,b-2.6].forEach(x=>{bx(lists.b,0x1a1c20,x-1.4,x+1.4,z0+.3,z1-.3,yR+.1,yR+.75);[-.9,.9].forEach(o=>[-.75,.75].forEach(q=>{const w=new THREE.CylinderGeometry(.42,.42,.12,16);w.rotateX(Math.PI/2);w.translate(x+o,yR+.42,q);colorize(w,0x2a2c30);lists.b.push(w);}));});
    box(a,b,z0,z1,yR+.2,T.yF,true);
    // walls with two doors per side, windows, roof
    const doors=lead||tail?[(pa+pb)/2-2.2,(pa+pb)/2+2.2].map(x=>Math.max(pa+1,Math.min(pb-1,x))):[cx-5.4,cx+5.4];
    [-1,1].forEach(s=>{const zo=s<0?z0:z1-.12,zi=s<0?z0+.12:z1;let x=pa;const segs=[];doors.forEach(d=>{segs.push([x,d-.68]);x=d+.68;});segs.push([x,pb]);
      segs.forEach(([x0,x1])=>{if(x1-x0<.02)return;bx(lists.b,WH,x0,x1,zo,zi,T.yF,T.yF+.95);bx(lists.b,WH,x0,x1,zo,zi,T.yF+1.8,T.yC);bx(lists.gl,null,x0,x1,zo+.02,zi-.02,T.yF+.95,T.yF+1.8);
        bx(lists.b,STR,x0,x1,s<0?zo-.01:zi-.005,s<0?zo+.005:zi+.01,T.yF+.78,T.yF+.92);bx(lists.v,INT,x0,x1,s<0?zi:zo-.04,s<0?zi+.04:zo,T.yF,T.yF+.9);
        for(let q=x0+1.1;q<x1-.3;q+=1.1)bx(lists.b,WH,q-.06,q+.06,zo,zi,T.yF+.95,T.yF+1.8);
        box(x0,x1,s<0?z0:z1-.15,s<0?z0+.15:z1,T.yF,T.yC);});
      doors.forEach(d=>{bx(lists.b,WH,d-.68,d+.68,zo,zi,T.yF+2.1,T.yC);box(d-.68,d+.68,s<0?z0:z1-.15,s<0?z0+.15:z1,T.yF+2.1,T.yC);
        const L=new THREE.Group();L.userData={d,s,side:-1};const R=new THREE.Group();R.userData={d,s,side:1};
        [L,R].forEach(p=>{const pl=new THREE.Mesh(new THREE.BoxGeometry(.66,2.1,.07),btDoorMat);pl.position.set(0,T.yF+1.05,0);p.add(pl);const w=new THREE.Mesh(new THREE.BoxGeometry(.4,.7,.075),btGlass);w.position.set(0,T.yF+1.45,0);p.add(w);
          p.position.set(d+p.userData.side*.34,0,s<0?z0+.06:z1-.06);G.add(p);T.doorPanels=(T.doorPanels||[]).concat([p]);});
        box(d-.68,d+.68,s<0?z0:z1-.15,s<0?z0+.15:z1,T.yF,T.yF+2.1,false,true);});});
    // roof (stand on it), ceiling, lights, luggage racks
    bx(lists.b,WH,pa,pb,z0,z1,T.yC,T.yT-.12);{const r=new THREE.CylinderGeometry(T.W/2,T.W/2,pb-pa,18,1,false,0,Math.PI);r.rotateZ(Math.PI/2);r.scale(1,.16/(T.W/2),1);r.translate((pa+pb)/2,T.yT-.12,0);colorize(r,0xdadde2);lists.b.push(r);}
    box(pa,pb,z0,z1,T.yC,T.yT,true);bx(lists.v,INT,pa,pb,z0+.12,z1-.12,T.yC-.05,T.yC);bx(lists.l,null,pa+.5,pb-.5,-.18,.18,T.yC-.08,T.yC-.04);
    [-1,1].forEach(s=>bx(lists.v,0xb8bcc2,pa+.4,pb-.4,s<0?z0+.12:z1-.5,s<0?z0+.5:z1-.12,T.yC-.42,T.yC-.38));
    // seats 2+2 with an aisle, facing the way the train runs
    for(let x=pa+.9;x<pb-.7;x+=1.05){if(doors.some(d=>Math.abs(x-d)<1.2))continue;[[z0+.2,-.3],[.3,z1-.2]].forEach(([za,zb])=>{bx(lists.v,SEAT,x-.25,x+.25,za,zb,T.yF+.42,T.yF+.55);bx(lists.v,SEAT,x+.22,x+.32,za,zb,T.yF+.55,T.yF+1.2);bx(lists.v,0x14161a,x-.2,x+.2,za+.1,zb-.1,T.yF,T.yF+.42);});}
    // ends: gangway doors between cars; the cab bulkhead at each nose
    [[pa,!lead],[pb,!tail]].forEach(([x,gw])=>{const x0=x-.08,x1=x+.08;if(gw){bx(lists.b,WH,x0,x1,z0,-.55,T.yF,T.yC);bx(lists.b,WH,x0,x1,.55,z1,T.yF,T.yC);bx(lists.b,WH,x0,x1,-.55,.55,T.yF+2.1,T.yC);box(x0,x1,z0,-.55,T.yF,T.yC);box(x0,x1,.55,z1,T.yF,T.yC);}
      else{bx(lists.v,INT,x0,x1,z0,z1,T.yF,T.yC);box(x0,x1,z0,z1,T.yF,T.yC);}});
    if(!tail){const gx=b+T.gap/2;bx(lists.b,0x2a2c30,gx-.4,gx+.4,-.7,.7,T.yF-.2,T.yC+.1);bx(lists.v,FLR,gx-.4,gx+.4,-.55,.55,T.yF-.05,T.yF);box(gx-.42,gx+.42,-.6,.6,T.yF-.3,T.yF,true);}
    // the nose: a long lofted duck-bill, white with the line stripe and a dark cockpit visor
    if(lead||tail){const s=lead?-1:1,x0=lead?a+T.nose:b-T.nose,M=16,Q=20,pos=[],col=[];const cW=new THREE.Color(WH),cS=new THREE.Color(STR),cK=new THREE.Color(0x0c1016);
      for(let i=0;i<=M;i++){const t=i/M,w=T.W/2*(1-.78*Math.pow(t,1.7)),top=T.yT-(T.yT-(T.yF+.25))*Math.pow(t,1.15),bot=yR+.32+.3*t,x=x0+s*T.nose*t,cy=(top+bot)/2,hh=(top-bot)/2;
        for(let j=0;j<=Q;j++){const a2=j/Q*Math.PI*2,ca=Math.cos(a2),sa=Math.sin(a2),k=2.6,ex=Math.sign(ca)*Math.pow(Math.abs(ca),2/k),ey=Math.sign(sa)*Math.pow(Math.abs(sa),2/k);
          const py=cy+ey*hh,pz=ex*w;pos.push(x,py,pz);const c=(t>.12&&t<.52&&ey>.55&&Math.abs(ex)<.8)?cK:(py>T.yF+.7&&py<T.yF+.92&&t<.7)?cS:cW;col.push(c.r,c.g,c.b);}}
      const idx=[];for(let i=0;i<M;i++)for(let j=0;j<Q;j++){const p0=i*(Q+1)+j,p1=p0+1,p2=p0+Q+1,p3=p2+1;if(s>0)idx.push(p0,p2,p1,p1,p2,p3);else idx.push(p0,p1,p2,p1,p3,p2);}
      const tip=pos.length/3;pos.push(x0+s*T.nose+s*.05,yR+.32+.3+((T.yF+.25)-(yR+.62))/2,0);col.push(cW.r,cW.g,cW.b);for(let j=0;j<Q;j++){const p0=M*(Q+1)+j;if(s>0)idx.push(p0,tip,p0+1);else idx.push(p0,p0+1,tip);}
      const ng=new THREE.BufferGeometry();ng.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));ng.setAttribute('color',new THREE.Float32BufferAttribute(col,3));ng.setAttribute('uv',new THREE.Float32BufferAttribute(new Float32Array(pos.length/3*2),2));ng.setIndex(idx);ng.computeVertexNormals();lists.b.push(ng);
      [-.55,.55].forEach(o=>{const hl=new THREE.Mesh(new THREE.BoxGeometry(.5,.14,.32),btHead),tl=new THREE.Mesh(new THREE.BoxGeometry(.3,.1,.2),btTail);const hx=x0+s*T.nose*.86;hl.position.set(hx,T.yF+.05,o*1.05);tl.position.set(hx+s*.1,T.yF-.15,o*1.1);hl.userData.s=s;tl.userData.s=s;G.add(hl);G.add(tl);(T.lamps=T.lamps||[]).push(hl,tl);});
      // nose colliders: you can stand on it; it's solid (that's the cab)
      [[0,.35,T.yT],[.35,.7,T.yF+1.6],[.7,1,T.yF+.6]].forEach(([u0,u1,h])=>{const xa=x0+s*T.nose*u0,xb=x0+s*T.nose*u1;box(Math.min(xa,xb),Math.max(xa,xb),z0+.2,z1-.2,yR+.2,h,true);});}}
  btMerge(G,lists.b,btBody);btMerge(G,lists.v,mallVC);btMerge(G,lists.gl,btGlass);btMerge(G,lists.l,btLamp);
  // the livery name along both sides
  for(let c=1;c<T.cars-1;c++){const cx=-T.half+T.CL/2+c*(T.CL+T.gap);[-1,1].forEach(s=>{const q=new THREE.Mesh(new THREE.PlaneGeometry(3.4,.85),new THREE.MeshBasicMaterial({map:ST_SIGNS,transparent:true}));
    const uv=stUV(0,384,512,128),a=q.geometry.attributes.uv;for(let i=0;i<a.count;i++)a.setXY(i,uv[0]+a.getX(i)*(uv[2]-uv[0]),uv[1]+a.getY(i)*(uv[3]-uv[1]));q.material.blending=THREE.AdditiveBlending;
    q.position.set(cx,T.yF+2.25,s*(T.W/2+.015));q.rotation.y=s>0?0:Math.PI;G.add(q);});}
  G.position.set(BT.x,0,UG.z);world.add(G);T.g=G;T.lb=LB;T.ldoor=door;
  T.boxes=LB.map(b=>Object.assign({},b));T.dboxes=door.map(b=>Object.assign({},b));})();

/* ---------- running the train ---------- */
onEv('matchStart',()=>{BT.ph=0;BT.was=null;});
onEv('frame',dt=>{const on=inMatch()&&!game.story&&!(typeof PR!=='undefined'&&PR.on)&&world.visible;BT.g.visible=on;if(!on){DYNB.length=0;return;}
  BT.ph+=dt;const s=BT.at(BT.ph),ox=BT.x,dx=s.x-ox;BT.x=s.x;BT.v=s.v;BT.open=s.open;BT.g.position.x=BT.x;
  BT.doorPanels.forEach(p=>{p.position.x=p.userData.d+p.userData.side*(.34+.64*BT.open);});
  BT.lamps.forEach(m=>{const front=s.dir===0||m.userData.s===s.dir;m.visible=m.material===btHead?front:!front||s.dir===0;});
  // moving colliders: floor, walls, roof (doors only while they're shut)
  DYNB.length=0;BT.boxes.forEach((b,i)=>{const l=BT.lb[i];b.x0=BT.x+l.lx0;b.x1=BT.x+l.lx1;DYNB.push(b);});
  if(BT.open<.6)BT.dboxes.forEach((b,i)=>{const l=BT.ldoor[i];b.x0=BT.x+l.lx0;b.x1=BT.x+l.lx1;DYNB.push(b);});
  DYNR.x0=BT.x-BT.half-14;DYNR.x1=BT.x+BT.half+14;DYNR.z0=UG.z-14;DYNR.z1=UG.z+14;
  // riders inside and on the roof move with it
  if(dx)for(const f of FS){if(f.dead)continue;const p=f.pos;if(Math.abs(p.z-UG.z)<BT.W/2+.05&&p.x>ox-BT.half-.3&&p.x<ox+BT.half+.3&&p.y>BT.yF-.35&&p.y<-1)p.x+=dx;}
  // anyone on the track in its way gets launched (host decides)
  if(NET.role!=='client'&&Math.abs(BT.v)>5){const sg=Math.sign(BT.v);for(const f of FS){if(f.dead||f.dormant||f.trainT>game.time)continue;const p=f.pos;
    if(Math.abs(p.z-UG.z)<BT.W/2+.2&&p.y<BT.yF-.3&&p.y>UG.bed-1.5){const ah=(p.x-BT.x)*sg;if(ah>-BT.half&&ah<BT.half+1.4)btHit(f,sg);}}}
  if(NET.role==='host'&&(BT.sync-=dt)<=0){BT.sync=3;netEvent({k:'btr',ph:BT.ph});}
  // platform announcements for whoever is down here
  const st=s.dwell&&s.x===BT.stop?'in':'out';if(BT.was&&st!==BT.was&&ME&&!ME.dead&&ugInHall(ME.pos.x,ME.pos.z)&&ME.pos.y<-2){
    if(st==='in'){announceSmall('🚅 SURGE LINE · NOW ARRIVING — MIND THE GAP');AU.scale=.5;[880,698,587,784].forEach((f,i)=>AU.tone('sine',f,f,.35,.08,i*.32));AU.scale=1;}}
  if(s.dwell&&s.left<2.2&&s.left+dt>=2.2&&ME&&Math.abs(ME.pos.x-BT.x)<BT.half+20&&isUnder(ME.pos)){announceSmall('DOORS CLOSING');AU.scale=.5;AU.tone('square',660,660,.18,.06);AU.tone('square',660,660,.18,.06,.3);AU.scale=1;}
  BT.was=st;
  if(!s.dwell&&Math.abs(BT.v)>20&&ME&&isUnder(ME.pos)&&Math.abs(ME.pos.x-BT.x)<60&&Math.random()<dt*4){AU.scale=Math.min(.6,12/Math.abs(ME.pos.x-BT.x+1));AU.noise&&AU.noise(.3,.3,'lowpass',400,200,.6,0);AU.scale=1;}});
onEv('frame',()=>{const near=Math.abs(BT.v)>.5&&Math.abs(BT.x-18.5)<BT.half+80;stWarn.emissiveIntensity=near?(Math.sin(game.time*11)>0?3.2:.12):.15;});
onEv('net:btr',e=>{if(Math.abs(e.ph-BT.ph)>.3)BT.ph=e.ph;});
function btHit(f,sg){f.trainT=game.time+1.2;if(f.invuln>0)return;const side=f.pos.z>=UG.z?1:-1;f.hp-=26*DMG_SCALE*(f.take||1);f.flash=1;f.vel.set(sg*26,9,side*7);f.onGround=false;f.set('fly');f.pos.y+=.1;
  const c=f.chest(new V3());impactFX(f,c,true,false);shake(.6,c);AU.scale=sndAt(c);AU.crash();AU.boom(false);AU.scale=1;
  if(f===ME)announceSmall('HIT BY THE BULLET TRAIN!');else if(f.lastHitBy===ME&&game.time-f.lastHitT<3)announceSmall('BULLET TRAIN KO SETUP!');
  if(f.hp<=0&&!f.dead)killFighter(f,f.lastHitBy&&game.time-f.lastHitT<6?f.lastHitBy:null,new V3(sg,0,0));}

/* ---------- sloped floors: stay on stairs / escalators going down, and let escalators carry you ---------- */
const _rmpPhys=Fighter.prototype.physics;
Fighter.prototype.physics=function(dt,fr,grav){const wasG=this.onGround;_rmpPhys.call(this,dt,fr,grav);if(!RAMPS.length)return;
  const r=rampAt(this.pos.x,this.pos.z,this.pos.y,.8);if(!r)return;
  if(this.pos.y>r.h&&this.pos.y-r.h<.75&&(wasG||this.onGround)&&this.vel.y<=.5){this.pos.y=r.h;this.onGround=true;if(this.vel.y<0)this.vel.y=0;}
  if(r.r.carry&&this.onGround&&Math.abs(this.pos.y-r.h)<.2){const d=r.r.carry*dt;if(r.r.ax==='z')this.pos.z+=d;else this.pos.x+=d;}};
onEv('frame',dt=>{escMats.forEach(m=>{m.map.offset.y+=(m.userData.dir||1)*2.4/.42*dt;});});

/* ---------- the street is a ceiling: no hits through it, and the camera stays on your side of it ---------- */
function ugSplit(a,b){const ua=isUnder(a),ub=isUnder(b);if(ua===ub)return false;const top=ua?b:a;return top.y>-.7&&!ugStair(top.x,top.z);}
const _ugAH=applyHit;applyHit=function(att,def){if(att&&def&&att!==def&&att.pos&&def.pos&&ugSplit(att.pos,def.pos))return;return _ugAH.apply(this,arguments);};
function inBT(p){return Math.abs(p.z-UG.z)<BT.W/2&&Math.abs(p.x-BT.x)<BT.half-BT.nose&&p.y>BT.yF-.3&&p.y<BT.yC;}
function mallAt(p){for(const m of MALLS_INFO)if(Math.abs(p.x-m.x)<15&&Math.abs(p.z-m.z)<15)return m;return null;}
function camClampY(F,c){let lo=.4,hi=1e9;const p=F.pos;
  if(p.y<-.5&&(ugIn(p.x,p.z)||ugStair(p.x,p.z))){lo=(F.floorY!=null?Math.min(F.floorY,p.y):p.y)+.35;if(ugIn(p.x,p.z))hi=(ugInHall(p.x,p.z)?UG.ceil:UG.tceil)-.25;if(inBT(p))hi=BT.yC-.15;}
  else{const m=mallAt(p);if(m&&p.y<m.H1+3){if(p.y<m.H1-1)hi=5.7;else{lo=m.H1+.4;hi=12.1;}}}
  if(c.y>hi)c.y=hi;if(c.y<lo)c.y=lo;}

/* ---------- bots: take the stairs / escalators when you're on another level ---------- */
function navWaypoint(f,T){const a=f.pos,b=T.pos,S=UG.st,cx=(S.x0+S.x1)/2;
  if(world.visible){const fu=isUnder(a)||(ugStair(a.x,a.z)&&a.y<-1),tu=isUnder(b)||(ugStair(b.x,b.z)&&b.y<-1);
    // east end of the hall: ramps + level crossing. lanes: S = south platform side, N = north, T = track
    const lane=p=>p.z<UG.pS?'S':p.z>UG.pN?'N':'T',X1=UG.xc1+1.4,midS=(UG.hz0+UG.pS)/2,midN=(UG.pN+UG.hz1)/2;
    const viaCrossing=want=>{const l=lane(a);if(l===want)return want==='S'?[UG.xc0-1.5,Math.min(UG.pS-.8,Math.max(UG.hz0+1,a.z))]:[UG.xc0-1.5,Math.max(UG.pN+.8,Math.min(UG.hz1-1,a.z))];
      if(a.x<X1-.6)return [X1,l==='S'?Math.min(UG.pS-.8,a.z):l==='N'?Math.max(UG.pN+.8,a.z):a.z];return [X1,want==='S'?midS:midN];};
    if(fu!==tu){if(!fu){if(ugStair(a.x,a.z))return [cx,S.z1+3];if(Math.hypot(a.x-cx,a.z-(S.z0-1.5))<2.4)return [cx,S.z0+2];return [cx,S.z0-1.5];}
      if(ugStair(a.x,a.z)||(ugInHall(a.x,a.z)&&a.z<UG.hz0+2.5&&Math.abs(a.x-cx)<4))return [cx,S.z0-2.5];
      if(!ugInHall(a.x,a.z))return [Math.max(UG.hx0+4,Math.min(UG.hx1-4,a.x)),UG.z];
      if(a.x>UG.xc0-1&&!(lane(a)==='S'&&a.x<UG.xc0+.5))return viaCrossing('S');
      if(a.y<UG.plat-.5)return [a.x,UG.pS-1.6,Math.abs(a.z-UG.pS)<1.3];
      if(a.z>UG.pN-.2)return [a.x,UG.z];
      return [cx,UG.hz0+1];}
    // both down here but on different sides of the tracks
    if(fu&&tu&&ugInHall(a.x,a.z)&&ugInHall(b.x,b.z)&&b.y>UG.plat-.5&&lane(b)!=='T'&&lane(a)!==lane(b)){const want=lane(b);
      if(a.x>UG.xc0-1)return viaCrossing(want);if(a.y<UG.plat-.5)return [a.x,want==='S'?UG.pS-1.6:UG.pN+1.6,Math.abs(a.z-(want==='S'?UG.pS:UG.pN))<1.3];}}
  const m=mallAt(a);if(m&&mallAt(b)===m&&Math.abs(b.y-a.y)>3){const up=b.y>a.y,E=up?m.escUp:m.escDown;const onR=rampAt(a.x,a.z,a.y,.6);
    if(onR&&onR.r.esc)return [E.x,E.z1];const st=up?[E.x,E.z0]:[E.x,E.z0];if(Math.hypot(a.x-st[0],a.z-st[1])<1.4)return [E.x,E.z1];return st;}
  return null;}
const _navThink=AI.prototype.think;AI.prototype.think=function(dt){_navThink.call(this,dt);const f=this.f,T=f.tgt;if(!T||T.dead||f.dead||f.hold||f.downed||!inMatch())return;
  const w=navWaypoint(f,T);if(!w)return;const d=this.goTo(w[0],w[1]);f.intent.sprint=d>5;if(w[2])f.intent.jump=true;};
