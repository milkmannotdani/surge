/* The shopping malls: a real two-level interior instead of a solid block.
   - ground floor + upper floor around a skylit atrium, joined by a pair of escalators that carry you up / down
   - shops all round both floors: glass fronts with lit signs, stock that matches the shop (clothes on racks, shoe walls,
     TVs and laptops, bookshelves, cafe counters, jewellery cases...), a counter and ceiling lights in each
   - a food court upstairs: five stalls with menu boards and food on the counters, tables and chairs overlooking the atrium
   - all of it is merged per material like the rest of the city (a few draw calls per mall); colliders go into BLD,
     the escalators into RAMPS (sloped floors that floorAt understands; station.js makes them move you)
   Loaded before world.js; world.js calls mallBuilding() for the MALLS blocks. */
const RAMPS=[];   // sloped floors (stairs, escalators): {x0,x1,z0,z1,ax,a0,a1,y0,y1,carry}
function rampY(r,x,z){const c=r.ax==='z'?z:x,k=Math.max(0,Math.min(1,(c-r.a0)/(r.a1-r.a0)));return r.y0+(r.y1-r.y0)*k;}
function rampAt(x,z,y,tol){if(!world.visible)return null;for(const r of RAMPS)if(x>r.x0&&x<r.x1&&z>r.z0&&z<r.z1){const h=rampY(r,x,z);if(Math.abs(h-y)<(tol||.9))return {r,h};}return null;}
const MALLS_INFO=[];   // per mall: {x,z,walk:[[x0,x1,z0,z1,y]...], esc:{up,down}} for NPCs and bot navigation

/* ---------- textures: shop signs, menu boards, shelf stock, escalator steps ---------- */
const MALL_SHOPS=[['NOVA THREADS','#14141a','#ff5aa8','racks',3],['STRIDE SHOES','#f2f0ea','#1a1a1a','shelves',1],['VOLT TECH','#0a1a2a','#5af0ff','tech',2],['PAGE & INK','#2a1a10','#ffd9a0','shelves',0],
  ['TOY BOX','#ffd23f','#c4102a','shelves',4],['GLOW BEAUTY','#fbe8f0','#c8407a','jewel',5],['PIXEL PLAY','#1a0a2a','#7dff8a','tech',7],['PEAK SPORTS','#1a4a8a','#ffffff','shelves',8],
  ['SPARKLE','#101010','#f0d080','jewel',9],['BLOOM','#eaf4e4','#3a8a4a','shelves',10],['DAILY BREAD','#7a4a24','#fff0d0','cafe',11],['BEAN THERE','#2a1c14','#e8c89a','cafe',13],
  ['HOME & CO','#e8e4dc','#2a4a6a','shelves',14],['SNACK STOP','#e8401a','#ffffff','shelves',6],['SOUND WAVE','#0a0a0a','#ff7a3a','shelves',7],['MEGA MART','#2a8a3a','#ffffff','shelves',15],
  ['URBAN KICKS','#ff7a1a','#101010','shelves',1],['LUMEN LAB','#ffffff','#2a6ad8','tech',12],['THREADLINE','#e8e0d0','#6a3a2a','racks',3],['KAWAII CORNER','#ffc0d8','#8a2a6a','shelves',4]];
const MALL_FOOD=[['ラーメン SLURP','#c4102a','#ffffff'],['SUSHI GO','#1a2a5a','#ffffff'],['BURGER BLAST','#ffb020','#5a1a0a'],['CURRY HOUSE','#e8a020','#3a1a0a'],['CREPE CLOUD','#ffd8e8','#c8407a']];
const MALL_SIGN_TEX=(()=>{const [c,g]=cv(1024,1024);g.fillStyle='#000';g.fillRect(0,0,1024,1024);
  const sign=(i,txt,bg,fg)=>{const x=(i%4)*256,y=Math.floor(i/4)*64;g.fillStyle=bg;g.fillRect(x+2,y+2,252,60);g.strokeStyle=fg;g.globalAlpha=.6;g.lineWidth=2;g.strokeRect(x+7,y+7,242,50);g.globalAlpha=1;
    g.font="900 30px 'Bebas Neue', Impact, 'Noto Sans JP','Hiragino Sans','Yu Gothic','Meiryo',sans-serif";g.textAlign='center';g.textBaseline='middle';g.fillStyle=fg;g.shadowColor=fg;g.shadowBlur=8;g.fillText(txt,x+128,y+34,228);g.shadowBlur=0;};
  MALL_SHOPS.forEach(([n,bg,fg],i)=>sign(i,n,bg,fg));MALL_FOOD.forEach(([n,bg,fg],i)=>sign(20+i,n,bg,fg));
  // menu boards (256x128 each, rows 8-15): pictures of the dishes and prices
  const dish=[['#f0d8a0','#7a3a1a','#f8f0e0'],['#f4f0e8','#e85a3a','#2a3a2a'],['#c8802a','#7a4a1a','#3a8a2a'],['#e8b020','#7a3a10','#ffffff'],['#f8e0c0','#e84a7a','#ffffff']];
  MALL_FOOD.forEach(([n,bg,fg],m)=>{const x=(m%4)*256,y=512+Math.floor(m/4)*128;g.fillStyle='#14110e';g.fillRect(x+2,y+2,252,124);
    for(let k=0;k<3;k++){const cx=x+44+k*84,cy=y+50,[a,b,c2]=dish[m];g.fillStyle='#ffffff';g.beginPath();g.ellipse(cx,cy,34,22,0,0,7);g.fill();g.fillStyle=a;g.beginPath();g.ellipse(cx,cy,28,17,0,0,7);g.fill();
      g.fillStyle=b;for(let q=0;q<5;q++){g.beginPath();g.arc(cx+rand(-16,16),cy+rand(-9,9),rand(3,7),0,7);g.fill();}g.fillStyle=c2;g.beginPath();g.arc(cx+rand(-10,10),cy+rand(-6,6),5,0,7);g.fill();
      g.fillStyle='#ffd23f';g.font="bold 18px 'Bebas Neue', Impact, sans-serif";g.textAlign='center';g.fillText('¥'+(480+Math.floor(rand(0,9))*60),cx,y+102);}
    g.fillStyle=bg;g.fillRect(x+2,y+112,252,14);});
  const t=tex(c);return t;})();
const MALL_PROD_TEX=(()=>{const S=128,[c,g]=cv(512,512);const C=['#c84a4a','#4a7ac8','#e8c84a','#4ac07a','#a860d0','#f0f0f0','#f08a30','#303030','#e86aa0','#6ad0e0'];
  const cell=(i,fn)=>{const x=(i%4)*S,y=Math.floor(i/4)*S;g.save();g.beginPath();g.rect(x,y,S,S);g.clip();g.fillStyle='#e8e4dc';g.fillRect(x,y,S,S);fn(x,y);
    for(let r=1;r<4;r++){g.fillStyle='#b8b2a8';g.fillRect(x,y+r*S/4-3,S,4);g.fillStyle='rgba(0,0,0,.25)';g.fillRect(x,y+r*S/4+1,S,2);}g.restore();};
  const rows=(x,y,fn)=>{for(let r=0;r<4;r++)fn(x,y+r*32,r);};
  cell(0,(x,y)=>rows(x,y,(X,Y)=>{for(let k=X+2;k<X+S-3;){const w=rand(3,7),h=rand(18,27);g.fillStyle=pick(C);g.fillRect(k,Y+29-h,w,h);g.fillStyle='rgba(255,255,255,.35)';g.fillRect(k,Y+31-h,w,1.5);k+=w+.6;}}));
  cell(1,(x,y)=>rows(x,y,(X,Y)=>{for(let k=X+2;k<X+S-10;k+=21){const c2=pick(C);g.fillStyle=c2;g.fillRect(k,Y+16,19,13);g.fillStyle='#ffffff';g.fillRect(k+2,Y+19,7,3);g.fillStyle=c2;g.fillRect(k+2,Y+5,17,11);g.fillStyle='rgba(0,0,0,.25)';g.fillRect(k+2,Y+13,17,3);}}));
  cell(2,(x,y)=>rows(x,y,(X,Y)=>{for(let k=X+4;k<X+S-14;k+=24){g.fillStyle='#202226';g.fillRect(k,Y+8,18,21);g.fillStyle=pick(['#5af0ff','#7dff8a','#ff7a3a','#c58bff']);g.fillRect(k+2,Y+10,14,15);}}));
  cell(3,(x,y)=>rows(x,y,(X,Y)=>{for(let k=X+3;k<X+S-20;k+=24){const c2=pick(C);for(let s=0;s<4;s++){g.fillStyle=c2;g.fillRect(k,Y+25-s*5,21,4.4);g.fillStyle='rgba(0,0,0,.2)';g.fillRect(k,Y+29-s*5,21,.8);}}}));
  cell(4,(x,y)=>rows(x,y,(X,Y)=>{for(let k=X+2;k<X+S-14;k+=17){g.fillStyle=pick(C);g.fillRect(k,Y+9,15,20);g.fillStyle=pick(C);g.beginPath();g.arc(k+7.5,Y+18,5,0,7);g.fill();g.fillStyle='#fff';g.fillRect(k+2,Y+25,11,2);}}));
  cell(5,(x,y)=>rows(x,y,(X,Y)=>{for(let k=X+3;k<X+S-8;k+=10){const h=rand(12,22);g.fillStyle=pick(['#f8d8e8','#e8a0c0','#ffffff','#d8c0f0','#f0e0b0']);g.fillRect(k,Y+29-h,7,h);g.fillStyle='#c0a060';g.fillRect(k+1.5,Y+27-h,4,3);}}));
  cell(6,(x,y)=>rows(x,y,(X,Y)=>{for(let k=X+2;k<X+S-12;k+=14){g.fillStyle=pick(['#e8401a','#ffd23f','#3a8ad8','#4ac06a','#ff7ab0']);g.fillRect(k,Y+8,12,21);g.fillStyle='rgba(255,255,255,.6)';g.beginPath();g.arc(k+6,Y+16,3.4,0,7);g.fill();}}));
  cell(7,(x,y)=>rows(x,y,(X,Y)=>{for(let k=X+2;k<X+S-3;k+=5){g.fillStyle=pick(['#101014','#2a2a40','#3a1a2a','#1a3a3a']);g.fillRect(k,Y+8,4.4,21);g.fillStyle=pick(C);g.fillRect(k+.6,Y+11,3,4);}}));
  cell(8,(x,y)=>rows(x,y,(X,Y)=>{for(let k=X+8;k<X+S-8;k+=18){g.fillStyle=pick(['#f08a30','#ffffff','#e8e04a','#2a2a2a']);g.beginPath();g.arc(k,Y+20,8,0,7);g.fill();g.strokeStyle='rgba(0,0,0,.4)';g.lineWidth=1;g.beginPath();g.arc(k,Y+20,8,0,7);g.stroke();}}));
  cell(9,(x,y)=>{g.fillStyle='#2a0a1a';g.fillRect(x,y,S,S);rows(x,y,(X,Y)=>{for(let k=X+8;k<X+S-6;k+=14){g.fillStyle=pick(['#f0d080','#e8e8f0','#ff8ab0','#8ad8ff']);g.beginPath();g.arc(k,Y+18,3,0,7);g.fill();g.fillStyle='#fff';g.fillRect(k-.5,Y+15,1,2);}});});
  cell(10,(x,y)=>rows(x,y,(X,Y)=>{for(let k=X+8;k<X+S-6;k+=16){g.fillStyle='#3a7a3a';g.fillRect(k-1,Y+18,2,11);for(let p=0;p<5;p++){g.fillStyle=pick(['#ff5a7a','#ffd23f','#ffffff','#c86ad8','#ff9a4a']);g.beginPath();g.arc(k+rand(-5,5),Y+12+rand(-4,4),3.4,0,7);g.fill();}}}));
  cell(11,(x,y)=>rows(x,y,(X,Y)=>{for(let k=X+4;k<X+S-14;k+=19){g.fillStyle=pick(['#c8802a','#e0a050','#a86020','#f0c070']);g.beginPath();g.ellipse(k+8,Y+21,9,6,0,0,7);g.fill();g.strokeStyle='rgba(80,40,10,.6)';g.lineWidth=1;g.beginPath();g.moveTo(k+3,Y+19);g.lineTo(k+13,Y+19);g.stroke();}}));
  cell(12,(x,y)=>{g.fillStyle='#14161a';g.fillRect(x,y,S,S);for(let r=0;r<2;r++)for(let k=0;k<2;k++){const gx=x+6+k*60,gy=y+8+r*58;const gr=g.createLinearGradient(gx,gy,gx+54,gy+48);gr.addColorStop(0,pick(['#3a8ad8','#ff7a3a','#7dff8a','#c58bff']));gr.addColorStop(1,pick(['#102040','#401020','#103020']));g.fillStyle=gr;g.fillRect(gx,gy,54,48);}});
  cell(13,(x,y)=>rows(x,y,(X,Y)=>{for(let k=X+4;k<X+S-10;k+=14){g.fillStyle=pick(['#f4f0e8','#3a2418','#c8a070']);g.fillRect(k,Y+12,10,17);g.fillStyle='#6a3a1a';g.fillRect(k+1,Y+16,8,4);}}));
  cell(14,(x,y)=>rows(x,y,(X,Y)=>{for(let k=X+6;k<X+S-10;k+=18){g.fillStyle=pick(['#d8d8dc','#2a2a2e','#e85a3a','#4a8ad8']);g.beginPath();g.ellipse(k+6,Y+22,8,6,0,0,7);g.fill();g.fillRect(k-2,Y+20,16,3);}}));
  cell(15,(x,y)=>rows(x,y,(X,Y)=>{for(let k=X+2;k<X+S-14;k+=16){g.fillStyle=pick(['#c8a070','#b89060','#d8b080']);g.fillRect(k,Y+10,15,19);g.fillStyle='rgba(0,0,0,.3)';g.fillRect(k+6,Y+10,3,19);g.fillStyle=pick(C);g.fillRect(k+2,Y+20,6,5);}}));
  const t=tex(c);return t;})();
const MALL_STEP_TEX=(()=>{const [c,g]=cv(64,64);g.fillStyle='#3a3c40';g.fillRect(0,0,64,64);for(let x=0;x<64;x+=4){g.fillStyle='#55585e';g.fillRect(x,0,2,64);}g.fillStyle='#e8c030';g.fillRect(0,0,4,64);g.fillRect(60,0,4,64);g.fillStyle='#202226';g.fillRect(0,0,64,5);
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;return t;})();
// interior surfaces light themselves a little (the malls are enclosed, so sun and sky barely reach inside)
function selfLit(m,k){m.emissive=m.color.clone().multiplyScalar(k);if(m.map){m.emissiveMap=m.map;m.emissive.setScalar(k);}return m;}
const MALL_FLOOR=(()=>{const T=ctFloorTex();const m=new THREE.MeshStandardMaterial({map:T.map,normalMap:T.normal,roughnessMap:T.orm,roughness:.6,metalness:.1,color:0xfff8ee});return selfLit(m,.1);})();
const MWT=ctConcTex('#cfc8bc'),mallWallMat=selfLit(new THREE.MeshStandardMaterial({map:MWT.map,normalMap:MWT.normal,color:0xf0ebe2,roughness:.8}),.1),mallCeilMat=selfLit(new THREE.MeshStandardMaterial({color:0xe8e6e2,roughness:.9}),.16);
[MALL_FLOOR,mallWallMat,mallCeilMat].forEach(m=>m.envMapIntensity=.35);
const mallGlassMat=new THREE.MeshStandardMaterial({color:0xb8dcea,transparent:true,opacity:.2,metalness:.6,roughness:.04,depthWrite:false});mallGlassMat.userData.noShadow=true;
const mallSignMat=new THREE.MeshBasicMaterial({map:MALL_SIGN_TEX});mallSignMat.color.setScalar(1.25);mallSignMat.userData.noShadow=true;
const mallProdMat=new THREE.MeshStandardMaterial({map:MALL_PROD_TEX,emissiveMap:MALL_PROD_TEX,emissive:0x3a3a3a,roughness:.7});
const mallSteel=selfLit(new THREE.MeshStandardMaterial({color:0xb8bcc2,metalness:.75,roughness:.3}),.15),mallDark=selfLit(new THREE.MeshStandardMaterial({color:0x26272c,roughness:.5}),.08);
const escMats=[0,1].map(()=>{const t=MALL_STEP_TEX.clone();t.needsUpdate=true;return new THREE.MeshStandardMaterial({map:t,metalness:.6,roughness:.4,emissiveMap:t,emissive:0x404040});});
// vertex-coloured, self-lit: shelves, racks, clothes, counters, tables, chairs, food... (one material, merged)
const mallVC=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.65,emissive:0x262626,envMapIntensity:.45});
mallVC.onBeforeCompile=sh=>{sh.fragmentShader=sh.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n#ifdef USE_COLOR\n totalEmissiveRadiance*=vColor;\n#endif');};
mallVC.customProgramCacheKey=()=>'mallVC';
function mColor(g,col){const c=new THREE.Color(col).convertSRGBToLinear(),n=g.attributes.position.count,a=new Float32Array(n*3);for(let i=0;i<n;i++){a[i*3]=c.r;a[i*3+1]=c.g;a[i*3+2]=c.b;}g.setAttribute('color',new THREE.BufferAttribute(a,3));return g;}
function mBoxC(col,w,h,d,x,y,z){const g=new THREE.BoxGeometry(w,h,d);g.translate(x,y,z);mGeo(mallVC,mColor(g,col));}
function mCylC(col,r0,r1,h,x,y,z,seg){const g=new THREE.CylinderGeometry(r0,r1,h,seg||14);g.translate(x,y,z);mGeo(mallVC,mColor(g,col));}
function mQuad(mat,w,h,x,y,z,ry,uv){const g=new THREE.PlaneGeometry(w,h);if(uv){const a=g.attributes.uv;for(let i=0;i<a.count;i++)a.setXY(i,uv[0]+a.getX(i)*(uv[2]-uv[0]),uv[1]+a.getY(i)*(uv[3]-uv[1]));}
  g.rotateY(ry||0);g.translate(x,y,z);mGeo(mat,g);}
const signUV=i=>{const c=i%4,r=Math.floor(i/4);return [c/4,1-(r+1)/16,(c+1)/4,1-r/16];};
const menuUV=m=>{const c=m%4,r=8+2*Math.floor(m/4);return [c/4,1-(r+2)/16,(c+1)/4,1-r/16];};
const prodUV=i=>{const c=i%4,r=Math.floor(i/4);return [c/4+.004,1-(r+1)/4+.004,(c+1)/4-.004,1-r/4-.004];};

function mallBuilding(X,Z,mi){
  const H1=6.4,C0=6,C1=12.4,ROOF=13,E=15.5,T=.5,I=15,AT=5;   // floor/ceiling heights, half size, wall, interior half, atrium half
  const box=(mat,u0,u1,v0,v1,y0,y1,uvs,coll)=>{const w=u1-u0,d=v1-v0,h=y1-y0;if(w<=.01||d<=.01||h<=.01)return;
    if(Array.isArray(uvs))mBox(mat,w,h,d,X+(u0+u1)/2,(y0+y1)/2,Z+(v0+v1)/2,uvs[0],uvs[1]);else mBox(mat,w,h,d,X+(u0+u1)/2,(y0+y1)/2,Z+(v0+v1)/2,uvs);
    if(coll)BLD.push({x0:X+u0,x1:X+u1,z0:Z+v0,z1:Z+v1,y0,h:y1,top:coll==='top'});};
  const boxC=(col,u0,u1,v0,v1,y0,y1,coll)=>{mBoxC(col,u1-u0,y1-y0,v1-v0,X+(u0+u1)/2,(y0+y1)/2,Z+(v0+v1)/2);if(coll)BLD.push({x0:X+u0,x1:X+u1,z0:Z+v0,z1:Z+v1,y0,h:y1,top:coll==='top'});};
  /* --- shell: ground floor (glass fronts, an entrance in the middle of every side), upper floor, roof with a skylight --- */
  [-1,1].forEach(s=>{const v0=s<0?-E:E-T,v1=v0+T;
    box(mallGF,-E,-2.5,v0,v1,0,C0,[4,6],'wall');box(mallGF,2.5,E,v0,v1,0,C0,[4,6],'wall');box(trimMat,-2.5,2.5,v0,v1,3.8,C0,-4,'wall');box(mallFac,-E,E,v0,v1,C0,C1,[8,12],'wall');
    const u0=s<0?-E:E-T,u1=u0+T;box(mallGF,u0,u1,-I,-2.5,0,C0,[4,6],'wall');box(mallGF,u0,u1,2.5,I,0,C0,[4,6],'wall');box(trimMat,u0,u1,-2.5,2.5,3.8,C0,-4,'wall');box(mallFac,u0,u1,-I,I,C0,C1,[8,12],'wall');});
  BLD.push({x0:X-E,x1:X+E,z0:Z-E,z1:Z+E,y0:C1,h:ROOF,top:true});
  [[-E-.3,E+.3,-E-.3,-AT],[-E-.3,E+.3,AT,E+.3],[-E-.3,-AT,-AT,AT],[AT,E+.3,-AT,AT]].forEach(([a,b,c,d])=>{box(roofMat,a,b,c,d,C1,ROOF,-6);box(mallCeilMat,Math.max(a,-I),Math.min(b,I),Math.max(c,-I),Math.min(d,I),C1-.06,C1);});
  box(mallGlassMat,-AT,AT,-AT,AT,ROOF-.12,ROOF-.02);for(let k=-AT;k<=AT+.01;k+=2.5){box(finMat,k-.06,k+.06,-AT,AT,ROOF-.2,ROOF);box(finMat,-AT,AT,k-.06,k+.06,ROOF-.2,ROOF);}
  box(mallCeilMat,-AT-.3,AT+.3,-AT-.3,-AT,C1-.6,C1);box(mallCeilMat,-AT-.3,AT+.3,AT,AT+.3,C1-.6,C1);box(mallCeilMat,-AT-.3,-AT,-AT,AT,C1-.6,C1);box(mallCeilMat,AT,AT+.3,-AT,AT,C1-.6,C1);
  /* --- floors: ground, and the upper floor ringed round the atrium --- */
  box(MALL_FLOOR,-I,I,-I,I,0,.04,-2.4);
  [[-I,I,-I,-AT],[-I,I,AT,I],[-I,-AT,-AT,AT],[AT,I,-AT,AT]].forEach(([a,b,c,d])=>{box(mallCeilMat,a,b,c,d,C0,H1-.03);box(MALL_FLOOR,a,b,c,d,H1-.03,H1,-2.4);BLD.push({x0:X+a,x1:X+b,z0:Z+c,z1:Z+d,y0:C0,h:H1,top:true});});
  box(mallSteel,-AT-.05,AT+.05,-AT-.05,-AT+.05,C0-.2,H1);box(mallSteel,-AT-.05,AT+.05,AT-.05,AT+.05,C0-.2,H1);box(mallSteel,-AT-.05,-AT+.05,-AT,AT,C0-.2,H1);box(mallSteel,AT-.05,AT+.05,-AT,AT,C0-.2,H1);
  // ceiling light panels on both floors
  for(let a=-12;a<=12;a+=6)for(let b=-12;b<=12;b+=6){if(Math.abs(a)<=AT+1&&Math.abs(b)<=AT+1)continue;box(panelMat,a-1.2,a+1.2,b-.3,b+.3,C0-.08,C0-.02);box(panelMat,a-1.2,a+1.2,b-.3,b+.3,C1-.08,C1-.02);}
  // glass balustrade round the atrium upstairs (gap where the escalators land)
  const rail=(u0,u1,v0,v1)=>{box(mallGlassMat,u0,u1,v0,v1,H1,H1+1.05,0,'wall');const cu=(u0+u1)/2,cv2=(v0+v1)/2,al=u1-u0>v1-v0;box(finMat,al?u0:cu-.05,al?u1:cu+.05,al?cv2-.05:v0,al?cv2+.05:v1,H1+1.02,H1+1.12);};
  rail(-AT,AT,-AT-.06,-AT+.06);rail(-AT,-4.95,AT-.06,AT+.06);rail(-1.65,AT,AT-.06,AT+.06);rail(-AT-.06,-AT+.06,-AT,AT);rail(AT-.06,AT+.06,-AT,AT);
  /* --- escalators: up (west lane) and down (east lane), carry you at 2.4 m/s --- */
  const ea=-4,eb=AT,th=Math.atan2(H1,eb-ea),L=Math.hypot(H1,eb-ea),vm=(ea+eb)/2,ym=H1/2;
  const slope=(mat,w,h,d,u,lift,col)=>{const g=new THREE.BoxGeometry(w,h,d);g.translate(0,lift,0);g.rotateX(-th);g.translate(X+u,ym,Z+vm);if(col!=null)mColor(g,col);mGeo(mat,g);};
  [[-4.15,1,0],[-2.55,-1,1]].forEach(([u,dir,k])=>{
    const st=new THREE.PlaneGeometry(1.0,L);st.rotateX(-Math.PI/2);st.rotateX(-th);st.translate(X+u,ym+.03,Z+vm);const a=st.attributes.uv;for(let i=0;i<a.count;i++)a.setXY(i,a.getX(i),a.getY(i)*L/.42);
    const sm=new THREE.Mesh(st,escMats[k]);sm.receiveShadow=true;world.add(sm);escMats[k].userData.dir=dir;
    RAMPS.push({x0:X+u-.62,x1:X+u+.62,z0:Z+ea-.75,z1:Z+eb+.12,ax:'z',a0:Z+ea,a1:Z+eb,y0:0,y1:H1,carry:2.4*dir,esc:true});
    [-.62,.62].forEach(o=>{slope(mallSteel,.14,1.0,L,u+o,.5);slope(mallGlassMat,.03,.8,L,u+o*.92,1.25);slope(mallDark,.1,.12,L+.6,u+o*.92,1.68);});
    box(mallSteel,u-.6,u+.6,ea-.75,ea,0,.05);box(mallSteel,u-.6,u+.6,eb,eb+.6,H1-.02,H1+.03);});
  slope(mallSteel,3.4,.9,L,-3.35,-.55);   // the truss underneath
  for(let v=ea+1.2;v<eb-.2;v+=1.2){const h=H1*(v-.8-ea)/(eb-ea)-.3;if(h>.5)BLD.push({x0:X-4.95,x1:X-1.75,z0:Z+v,z1:Z+Math.min(eb,v+1.2),y0:0,h});}
  /* --- the atrium floor: a fountain, planters, benches --- */
  {const fx=X+2.4,fz=Z;mCylC(0x9a9690,1.8,1.9,.55,fx,.28,fz,28);mCylC(0x4ab0e8,1.62,1.62,.08,fx,.5,fz,28);mCylC(0xd8dcd8,.18,.25,1.6,fx,.9,fz,12);mCylC(0xbfe8ff,.5,.05,.5,fx,1.85,fz,12);solids.push({x:fx,z:fz,r:1.9});
    [[-1,-1],[1,1]].forEach(([a,b])=>{const px=X+2.4+a*3.2,pz=Z+b*3.6;mBoxC(0x6a6c70,1.6,.6,1.6,px,.3,pz);const lf=new THREE.Mesh(leafGeo,leafMats[1]);lf.position.set(px,1.3,pz);lf.scale.setScalar(.85);world.add(lf);solids.push({x:px,z:pz,r:1});});
    [[0,-3.6],[0,3.6]].forEach(([a,b])=>{boxC(0x8a5a34,a+.2,a+2.6,b-.25,b+.25,.4,.48,'top');boxC(0x3a3c40,a+.3,a+.45,b-.2,b+.2,0,.4);boxC(0x3a3c40,a+2.35,a+2.5,b-.2,b+.2,0,.4);});}
  /* --- shops --- */
  const used=new Set();const pickShop=()=>{let i;do{i=Math.floor(srnd()*MALL_SHOPS.length);}while(used.has(i)&&used.size<MALL_SHOPS.length);used.add(i);return i;};
  // (side: which way the shop front faces; frontage [t0,t1] is glass, the rest of the front edge is wall)
  const shop=(F,C,u0,u1,v0,v1,side,t0,t1,si)=>{const S=MALL_SHOPS[si],style=S[3],cell=S[4];
    const fd=side==='n'?[0,1]:side==='s'?[0,-1]:side==='e'?[1,0]:[-1,0];const alongU=side==='n'||side==='s';
    const fl=side==='n'?v1:side==='s'?v0:side==='e'?u1:u0,D=alongU?v1-v0:u1-u0,ta=alongU?u0:v0,tb=alongU?u1:v1;
    const P=(t,d)=>alongU?[t,fl-fd[1]*d]:[fl-fd[0]*d,t];       // shop coords (along the front, depth in) -> mall coords
    const ry=Math.atan2(fd[0],fd[1]),WT=.18;
    const wall=(t0w,t1w,d0,d1,y0,y1,mat,coll)=>{const [a,b]=P(t0w,d0),[c,d]=P(t1w,d1);box(mat||mallWallMat,Math.min(a,c),Math.max(a,c),Math.min(b,d),Math.max(b,d),y0,y1,0,coll===undefined?'wall':coll);};
    // side walls (skip the outside wall of the building)
    [[ta,1],[tb,-1]].forEach(([t,s])=>{if(Math.abs(Math.abs(t)-I)>.05)wall(t-WT/2,t+WT/2,0,D,F,C);});
    // the back is the outside wall: line it
    wall(ta,tb,D-.06,D,F,C,mallWallMat,null);
    // shop front: solid where it isn't glass, glass either side of a 2.6 m doorway, a lit sign band, bulkhead above
    if(t0>ta+.05)wall(ta,t0,-WT/2,WT/2,F,C);if(t1<tb-.05)wall(t1,tb,-WT/2,WT/2,F,C);
    const tc=(t0+t1)/2,gh=4.1;[[t0,tc-1.3],[tc+1.3,t1]].forEach(([a,b])=>{if(b-a>.1){wall(a,b,-.04,.04,F,F+gh,mallGlassMat);wall(a,b,-.06,.06,F,F+.12,mallSteel,null);}});
    [t0,tc-1.3,tc+1.3,t1].forEach(t=>wall(t-.05,t+.05,-.07,.07,F,F+gh,mallSteel,null));
    wall(t0,t1,-.12,.12,F+gh,F+gh+1.1,mallDark);wall(ta,tb,-.12,.12,F+gh+1.1,C,mallWallMat);
    {const [sx,sz]=P(tc,-.14);mQuad(mallSignMat,Math.min(5,t1-t0-.4),1.0,X+sx,F+gh+.55,Z+sz,ry,signUV(si));}
    // ceiling lights
    for(let k=0;k<2;k++){const [lx,lz]=P(ta+(tb-ta)*(k+1)/3,D/2);mBox(panelMat,alongU?2:.5,.06,alongU?.5:2,X+lx,C-.08,Z+lz);}
    // stock on the back wall: shelving units with product faces
    const W=tb-ta,nU=Math.max(1,Math.floor((W-.6)/1.9)),uw=(W-.6)/nU,bc=style==='jewel'?0x2a1a20:0xf0ece4;
    for(let k=0;k<nU;k++){const t=ta+.3+uw*(k+.5);const [a,b]=P(t,D-.4);const hh=style==='cafe'?2.4:2.3;
      const hw=alongU?uw/2-.05:.3,hd=alongU?.3:uw/2-.05;boxC(bc,a-hw,a+hw,b-hd,b+hd,F,F+hh,'top');
      const [qa,qb]=P(t,D-.71);mQuad(mallProdMat,uw-.25,hh-.25,X+qa,F+hh/2,Z+qb,ry,prodUV(style==='tech'&&k%2?12:cell));}
    const fxt=(t,d,w2,d2,h2,col,coll)=>{const [a,b]=P(t,d);const hw=alongU?w2/2:d2/2,hd=alongU?d2/2:w2/2;boxC(col,a-hw,a+hw,b-hd,b+hd,F,F+h2,coll);return [a,b];};
    const mid=(ta+tb)/2;
    if(style==='racks'){for(let r=0;r<2;r++){const t=ta+(tb-ta)*(r+1)/3,d=D*.5;const [a,b]=P(t,d);const len=Math.min(2.6,(tb-ta)/3);
        [-1,1].forEach(s=>{const [pa,pb]=P(t+s*len/2,d);boxC(0x9a9ea4,pa-.03,pa+.03,pb-.03,pb+.03,F,F+1.7);});const [r0a,r0b]=P(t-len/2,d),[r1a,r1b]=P(t+len/2,d);
        boxC(0xc0c4c8,Math.min(r0a,r1a)-.03,Math.max(r0a,r1a)+.03,Math.min(r0b,r1b)-.03,Math.max(r0b,r1b)+.03,F+1.66,F+1.72);
        for(let q=0;q<9;q++){const tq=t-len/2+.15+q*(len-.3)/8;const [ga,gb]=P(tq,d);const c=pick([0xc84a4a,0x2a3a5a,0xe8e0d0,0x3a3a3a,0x6a8ac8,0xe8a0b0,0x5a7a4a,0xd8b060]);
          boxC(c,ga-(alongU?.03:.25),ga+(alongU?.03:.25),gb-(alongU?.25:.03),gb+(alongU?.25:.03),F+.75,F+1.62);}}
      [[ta+.9,1.2],[tb-.9,1.2]].forEach(([t,d])=>{const [a,b]=P(t,d);boxC(0xe8e4dc,a-.14,a+.14,b-.14,b+.14,F,F+1.05);boxC(pick([0x2a2a30,0xc84a4a,0x4a6a9a]),a-.22,a+.22,b-.14,b+.14,F+1.05,F+1.65);mCylC(0xe8e4dc,.13,.13,.26,X+a,F+1.82,Z+b,10);});}
    else if(style==='shelves'){if(D>4.5){const t=mid,d=D*.5,len=Math.min(4,W-2.4);const [a,b]=P(t,d);const hw=alongU?len/2:.45,hd=alongU?.45:len/2;boxC(0xf0ece4,a-hw,a+hw,b-hd,b+hd,F,F+1.5,'top');
        [-1,1].forEach(s=>{const [qa,qb]=P(t,d+s*.46);mQuad(mallProdMat,len-.2,1.3,X+qa,F+.72,Z+qb,s>0?ry+Math.PI:ry,prodUV(cell));});}
      if(cell===1||cell===8)fxt(mid,1.6,1.8,.5,.45,0x6a4a34,'top');}
    else if(style==='tech'){[ta+W*.3,ta+W*.7].forEach(t=>{const [a,b]=fxt(t,D*.45,1.7,.9,.9,0xf4f4f6,'top');
        [-.45,.45].forEach(o=>{const [la,lb]=P(t+o,D*.45);mBoxC(0x2a2c30,alongU?.5:.34,.03,alongU?.34:.5,X+la,F+.92,Z+lb);const [sa,sb]=P(t+o,D*.45+.17);mQuad(mallProdMat,.48,.3,X+sa,F+1.08,Z+sb,ry,prodUV(12));});});}
    else if(style==='cafe'){fxt(mid,D-1.5,Math.min(4,W-1),.7,1.05,0x8a5a34,'top');const [qa,qb]=P(mid,D-1.86);mQuad(mallProdMat,Math.min(3.6,W-1.4),.8,X+qa,F+.55,Z+qb,ry,prodUV(cell));
      [ta+W*.3,ta+W*.7].forEach(t=>{const [a,b]=P(t,D*.35);mCylC(0xe8e4dc,.38,.38,.05,X+a,F+.74,Z+b,16);mCylC(0x2a2c30,.04,.04,.72,X+a,F+.36,Z+b,8);
        [[-.6,0],[.6,0]].forEach(([o,_])=>{const [ca,cb]=P(t+o,D*.35);mBoxC(0x5a3a24,.38,.45,.38,X+ca,F+.22,Z+cb);});});}
    else if(style==='jewel'){[ta+W*.3,ta+W*.7].forEach(t=>{const [a,b]=fxt(t,D*.45,1.5,.6,.85,0x2a1a20,'top');const [qa,qb]=P(t,D*.45-.31);mQuad(mallProdMat,1.4,.3,X+qa,F+.6,Z+qb,ry,prodUV(9));
        mBox(mallGlassMat,alongU?1.5:.6,.35,alongU?.6:1.5,X+a,F+1.03,Z+b);});}
    // a counter by the door with a till
    if(style!=='cafe'){const t=tb-(tb-ta)*.18>tc+1.6?tb-1.1:ta+1.1;const [a,b]=fxt(t,1.5,1.4,.6,1.0,0x3a3c44,'top');mBoxC(0x14161a,.3,.25,.3,X+a,F+1.13,Z+b);}
  };
  // ground floor: two big corner shops on the north/south sides, two on west/east, an entrance corridor in the middle of each side
  const F0=0;shop(F0,C0,-I,-2.5,-I,-9,'n',-9,-2.5,pickShop());shop(F0,C0,2.5,I,-I,-9,'n',2.5,9,pickShop());
  shop(F0,C0,-I,-2.5,9,I,'s',-9,-2.5,pickShop());shop(F0,C0,2.5,I,9,I,'s',2.5,9,pickShop());
  shop(F0,C0,-I,-9,-9,-2.5,'e',-9,-2.5,pickShop());shop(F0,C0,-I,-9,2.5,9,'e',2.5,9,pickShop());
  shop(F0,C0,9,I,-9,-2.5,'w',-9,-2.5,pickShop());shop(F0,C0,9,I,2.5,9,'w',2.5,9,pickShop());
  // upper floor: shops south/west/east, the food court along the north side
  shop(H1,C1,-I,-2.5,-I,-9,'n',-9,-2.5,pickShop());shop(H1,C1,-2.5,2.5,-I,-9,'n',-2.5,2.5,pickShop());shop(H1,C1,2.5,I,-I,-9,'n',2.5,9,pickShop());
  shop(H1,C1,-I,-9,-9,-2.5,'e',-9,-2.5,pickShop());shop(H1,C1,-I,-9,-2.5,AT,'e',-2.5,AT,pickShop());
  shop(H1,C1,9,I,-9,-2.5,'w',-9,-2.5,pickShop());shop(H1,C1,9,I,-2.5,AT,'w',-2.5,AT,pickShop());
  /* --- food court --- */
  const FS0=10.5;box(mallWallMat,-I,-I+.06,AT,FS0,H1,C1);box(mallWallMat,I-.06,I,AT,FS0,H1,C1);box(mallWallMat,-I,-9,AT-.09,AT+.09,H1,C1,0,'wall');box(mallWallMat,9,I,AT-.09,AT+.09,H1,C1,0,'wall');
  MALL_FOOD.forEach(([n],m)=>{const u0=-I+m*6,u1=u0+6,uc=u0+3;
    if(m)box(mallWallMat,u0-.09,u0+.09,FS0,I,H1,C1,0,'wall');box(mallWallMat,u0,u1,I-.06,I,H1,C1);
    boxC(0xd8d4cc,u0+.4,u1-.4,FS0+.1,FS0+.8,H1,H1+1.05,'top');boxC(0x3a3c44,u0+.4,u1-.4,FS0+.1,FS0+.16,H1,H1+.95);
    for(let k=0;k<4;k++){const bx=X+u0+1+k*1.3;mCylC(0xffffff,.2,.14,.1,bx,H1+1.1,Z+FS0+.45,12);mCylC(pick([0xc8802a,0xe8c050,0xd84a2a,0xf0e0c0]),.17,.17,.04,bx,H1+1.16,Z+FS0+.45,12);}
    boxC(0xc8ccd0,u0+.5,u1-.5,I-1,I-.1,H1,H1+.95,'top');boxC(0x2a2c30,u0+1,u0+2.4,I-.9,I-.2,H1+.95,H1+1.05);
    mQuad(mallSignMat,4.2,2.1,X+uc,H1+3.1,Z+I-.08,Math.PI,menuUV(m));mQuad(mallSignMat,4.6,.95,X+uc,H1+4.65,Z+FS0-.14,Math.PI,signUV(20+m));
    box(mallDark,u0,u1,FS0-.12,FS0+.12,H1+4.1,H1+5.2,0,'wall');box(mallWallMat,u0,u1,FS0-.12,FS0+.12,H1+5.2,C1,0,'wall');
    mBox(panelMat,4,.06,.5,X+uc,C1-.08,Z+12.8);});
  // tables and chairs (you can stand on the tables)
  [6.9,9.1].forEach((v,r)=>{for(let u=-13;u<=13;u+=3.6){if(r===0&&u>-6.5&&u<-.5)continue;if(r===1&&u>-5.2&&u<-1.2)continue;const tx=X+u,tz=Z+v;
    mCylC(0xf4f2ee,.55,.55,.05,tx,H1+.76,tz,18);mCylC(0x3a3c40,.05,.05,.72,tx,H1+.38,tz,8);mCylC(0x3a3c40,.3,.3,.03,tx,H1+.02,tz,12);
    BLD.push({x0:tx-.45,x1:tx+.45,z0:tz-.45,z1:tz+.45,y0:H1,h:H1+.78,top:true});
    [[-.85,0],[.85,0]].forEach(([o])=>{const c=pick([0xe8a020,0xd84a3a,0x3a7ad8,0x4ac07a]);mBoxC(c,.42,.06,.42,tx+o,H1+.46,tz);mBoxC(c,.06,.45,.42,tx+o*1.24,H1+.7,tz);mBoxC(0x3a3c40,.05,.44,.05,tx+o,H1+.22,tz);});}});
  /* --- where people can walk (NPC shoppers, bots) --- */
  const walk=[[-9,9,-9,-AT-.4,0],[-9,9,AT+.4,9,0],[-9,-AT-.4,-AT,AT,0],[AT+.4,9,-AT,AT,0],[-2,2,-I+.6,-9,0],[-2,2,9,I-.6,0],[-I+.6,-9,-2,2,0],[9,I-.6,-2,2,0],
    [-9,9,-9,-AT-.4,H1],[-9,-AT-.4,-AT,AT,H1],[AT+.4,9,-AT,AT,H1],[-14,14,AT+.4,FS0-.9,H1]].map(([a,b,c,d,y])=>[X+a,X+b,Z+c,Z+d,y]);
  MALLS_INFO.push({x:X,z:Z,walk,H1,escUp:{x:X-4.15,z0:Z+ea-.5,z1:Z+eb+.4},escDown:{x:X-2.55,z0:Z+eb+.4,z1:Z+ea-.5}});
  /* --- the street side --- */
  const doors=[[0,-1],[0,1],[-1,0],[1,0]].map(([nx,nz])=>({nx,nz,x:X+nx*E,z:Z+nz*E,len:31}));
  const B={x0:X-E,x1:X+E,z0:Z-E,z1:Z+E,h:ROOF,doors,kind:'mall'};BLDG.push(B);
  ROOFSIGN.push([X,ROOF+3.2,Z+(srnd()<.5?-9:9),16,4.4,1,0]);
  bldDetail(X,Z,31,31,C1,'mall',true);}
