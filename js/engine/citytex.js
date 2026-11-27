/* City textures, all drawn on canvases at load (no image files).
   Compared to the first versions they are:
   - sharper: canvases are drawn at 2x on HIGH graphics (CTQ), in the same layout units, so building UVs still line up
   - lit properly: every surface carries a normal map (paver bevels, window recesses, sills, tile grout, planks) and a
     roughness/metalness map (glass is glossy and reflects the sky, concrete and wood are matte, tar seams shine)
   - weathered: tone variation, grain, rain streaks under sills, sealed cracks, oil stains, tyre tracks, worn paint
   Window textures keep the 3 floors x 4 windows tile (128x192 units) that world.js maps with boxUV(8,12). */
const CTQ=GFX.high?2:1;
function ctCv(w,h){const [c,g]=cv(Math.round(w*CTQ),Math.round(h*CTQ));g.scale(CTQ,CTQ);return [c,g];}
// per-pixel grain: aggregate in concrete and asphalt, dust on paint
function ctGrain(g,amt,colour){const c=g.canvas,im=g.getImageData(0,0,c.width,c.height),d=im.data;
  for(let i=0;i<d.length;i+=4){const n=(Math.random()-.5)*amt;d[i]+=n;d[i+1]+=colour?(Math.random()-.5)*amt:n;d[i+2]+=colour?(Math.random()-.5)*amt:n;}g.putImageData(im,0,0);}
// smooth, seamlessly tiling low-frequency noise blended over the canvas (big stains, sun bleaching, patchy repairs)
function ctCloud(g,w,h,n,alpha,mode,lo,hi){const [s,sg]=cv(n+2,n+2),v=[];for(let i=0;i<n*n;i++)v.push(lo+Math.random()*(hi-lo));
  const im=sg.createImageData(n+2,n+2);for(let y=0;y<n+2;y++)for(let x=0;x<n+2;x++){const k=v[((y+n-1)%n)*n+((x+n-1)%n)]|0,i=(y*(n+2)+x)*4;im.data[i]=im.data[i+1]=im.data[i+2]=k;im.data[i+3]=255;}
  sg.putImageData(im,0,0);g.save();g.globalAlpha=alpha;g.globalCompositeOperation=mode||'overlay';g.imageSmoothingEnabled=true;g.drawImage(s,1,1,n,n,0,0,w,h);g.restore();}
// height canvas -> tangent-space normal map (green points up the texture, which is what three.js expects)
function ctNormal(hc,str){const w=hc.width,h=hc.height,src=hc.getContext('2d').getImageData(0,0,w,h).data;const [c,g]=cv(w,h);const out=g.createImageData(w,h),o=out.data;
  const H=(x,y)=>src[(((y+h)%h)*w+((x+w)%w))*4]/255;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const dx=(H(x-1,y)-H(x+1,y))*str,dy=(H(x,y+1)-H(x,y-1))*str,l=Math.hypot(dx,dy,1),i=(y*w+x)*4;
    o[i]=(dx/l*.5+.5)*255;o[i+1]=(dy/l*.5+.5)*255;o[i+2]=(1/l*.5+.5)*255;o[i+3]=255;}
  g.putImageData(out,0,0);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());return t;}
function ctData(c){const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());return t;}
function ctRep(t){t.wrapS=t.wrapT=THREE.RepeatWrapping;return t;}
function ctShade(hex,k){const c=new THREE.Color(hex);if(k>0)c.lerp(new THREE.Color(1,1,1),k);else c.multiplyScalar(1+k);return '#'+c.getHexString();}
// a wandering crack; tar-sealed ones are glossy (low roughness) and sit slightly proud
function ctCrack(L,x,y,len,ang,wd,col,seal){const P=[[x,y]];let a=ang;for(let s=0;s<len;s+=rand(3,7)){a+=rand(-.6,.6);x+=Math.cos(a)*5;y+=Math.sin(a)*5;P.push([x,y]);}
  const line=(g,st,lw)=>{g.strokeStyle=st;g.lineWidth=lw;g.lineJoin='round';g.lineCap='round';g.beginPath();P.forEach(([px,py],i)=>i?g.lineTo(px,py):g.moveTo(px,py));g.stroke();};
  line(L.g,col,wd);if(L.h)line(L.h,seal?'rgba(200,200,200,.55)':'rgba(0,0,0,.8)',wd*.8);if(L.o&&seal)line(L.o,'rgb(0,70,0)',wd);
  if(!seal&&Math.random()<.6){const b=P[Math.floor(P.length/2)];ctCrack({g:L.g,h:L.h},b[0],b[1],len*.4,ang+rand(-1.2,1.2),wd*.6,col,false);}}
// dirty water running down from a ledge
function ctStreaks(g,x0,x1,y,n,len,a){for(let i=0;i<n;i++){const sx=rand(x0,x1),l=rand(len*.3,len),gr=g.createLinearGradient(0,y,0,y+l);
  gr.addColorStop(0,`rgba(22,18,14,${a})`);gr.addColorStop(1,'rgba(22,18,14,0)');g.fillStyle=gr;g.fillRect(sx,y,rand(.6,2.4),l);}}
// general weathering for a facade tile
function ctGrime(g,w,h,k){ctCloud(g,w,h,3,.35*k,'overlay',60,200);ctCloud(g,w,h,9,.18*k,'soft-light',40,220);ctStreaks(g,0,w,0,Math.round(10*k),h*.45,.12*k);
  const gr=g.createLinearGradient(0,h*.82,0,h);gr.addColorStop(0,'rgba(30,26,20,0)');gr.addColorStop(1,`rgba(30,26,20,${.12*k})`);g.fillStyle=gr;g.fillRect(0,h*.82,w,h*.18);ctGrain(g,14*k);}
// four contexts drawn together: colour, emissive, rough/metal (G = roughness, B = metalness), height
function ctLayers(w,h,base,rough,metal){const [c,g]=ctCv(w,h),[e,eg]=ctCv(w,h),[o,og]=ctCv(w,h),[hc,hg]=ctCv(w,h);
  g.fillStyle=base||'#808080';g.fillRect(0,0,w,h);eg.fillStyle='#000';eg.fillRect(0,0,w,h);og.fillStyle=`rgb(0,${(rough==null?.85:rough)*255|0},${(metal||0)*255|0})`;og.fillRect(0,0,w,h);
  hg.fillStyle='#808080';hg.fillRect(0,0,w,h);return {c,g,e,eg,o,og,hc,hg,L:{g,e:eg,o:og,h:hg}};}
function ctRect(ctx,st,x,y,w,h){if(!ctx)return;ctx.fillStyle=st;ctx.fillRect(x,y,w,h);}

/* ---------- windows ---------- */
const CT_CURT=['#c8b8a0','#8a9ab8','#b88a8a','#e8e0d0','#9ab89a','#d8c890','#a890b8','#f0ece4','#6a7a98'];
// one window: reveal, glass (sky reflection or a lit room), curtains / blinds / a plant, frame + mullion, sill and the streaks under it
function ctWin(L,x,y,w,h,O){O=O||{};const g=L.g,e=L.e,fr=O.frame||'#9aa0a8',fw=O.fw||1.3,lit=!!O.lit,col=O.col||'#ffd59a';
  ctRect(g,'rgba(0,0,0,.5)',x-1.1,y-1.1,w+2.2,h+2.2);ctRect(L.h,'#262626',x-.6,y-.6,w+1.2,h+1.2);
  if(lit){const gr=g.createLinearGradient(x,y,x,y+h);gr.addColorStop(0,ctShade(col,.25));gr.addColorStop(.6,col);gr.addColorStop(1,ctShade(col,-.5));g.fillStyle=gr;g.fillRect(x,y,w,h);
    e.globalAlpha=rand(.55,1);const ge=e.createLinearGradient(x,y,x,y+h);ge.addColorStop(0,ctShade(col,.3));ge.addColorStop(1,ctShade(col,-.55));e.fillStyle=ge;e.fillRect(x,y,w,h);e.globalAlpha=1;
    for(let i=0;i<2;i++){const fw2=rand(w*.2,w*.5),fh=rand(h*.12,h*.32),fx=x+rand(0,w-fw2);ctRect(g,'rgba(24,16,10,.4)',fx,y+h-fh,fw2,fh);ctRect(e,'rgba(0,0,0,.5)',fx,y+h-fh,fw2,fh);}}
  else{const t=rand(-.18,.12),gr=g.createLinearGradient(x,y,x+w*.6,y+h);gr.addColorStop(0,ctShade(O.sky||'#a4b8cc',t));gr.addColorStop(.45,ctShade('#435670',t));gr.addColorStop(1,'#0e131b');g.fillStyle=gr;g.fillRect(x,y,w,h);
    ctRect(g,'rgba(0,0,0,.28)',x+rand(0,w*.5),y+h*.55,rand(w*.2,w*.5),h*.45);}
  if(O.dress!==false){const it=Math.random(),cc=pick(CT_CURT);
    if(it<.3){const cw=rand(.16,.42)*w;[[x,cw],[x+w-cw*rand(.5,1),cw]].forEach(([cx,c2])=>{c2=Math.min(c2,x+w-cx);g.globalAlpha=lit?.88:.6;ctRect(g,cc,cx,y,c2,h);g.globalAlpha=1;
        for(let s=cx+.6;s<cx+c2;s+=2.1)ctRect(g,'rgba(0,0,0,.18)',s,y,.8,h);ctRect(e,'rgba(0,0,0,.6)',cx,y,c2,h);});}
    else if(it<.52){const bd=rand(.25,1)*h;for(let s=y;s<y+bd;s+=1.7){ctRect(g,lit?'rgba(255,248,236,.4)':'rgba(214,220,228,.3)',x,s,w,.9);ctRect(e,'rgba(0,0,0,.55)',x,s+.9,w,.8);}}
    else if(it<.6){g.fillStyle='#2e5a2a';g.beginPath();g.ellipse(x+w*.24,y+h*.86,w*.17,h*.13,0,0,7);g.fill();ctRect(g,'#6a4a2a',x+w*.16,y+h*.9,w*.16,h*.1);}}
  g.save();g.beginPath();g.rect(x,y,w,h);g.clip();g.fillStyle=`rgba(255,255,255,${rand(.04,.13)})`;const sx=x+rand(-w*.3,w*.6);
  g.beginPath();g.moveTo(sx,y);g.lineTo(sx+w*.32,y);g.lineTo(sx+w*.08,y+h);g.lineTo(sx-w*.24,y+h);g.fill();g.restore();
  ctRect(L.o,'rgb(0,20,70)',x,y,w,h);
  const bars=[[x,y,w,fw],[x,y+h-fw,w,fw],[x,y,fw,h],[x+w-fw,y,fw,h]];if(O.mull!==0)bars.push([x+w/2-fw*.45,y,fw*.9,h]);if(O.transom)bars.push([x,y+h*O.transom,w,fw*.8]);
  bars.forEach(b=>{ctRect(g,fr,...b);ctRect(L.h,'#b8b8b8',...b);ctRect(L.o,'rgb(0,120,210)',...b);});ctRect(g,'rgba(255,255,255,.14)',x,y,w,.45);
  if(O.sill!==false){ctRect(g,O.sillC||'#b4b0a6',x-2,y+h+.3,w+4,2);ctRect(g,'rgba(255,255,255,.18)',x-2,y+h+.3,w+4,.5);ctRect(g,'rgba(0,0,0,.38)',x-2,y+h+2.3,w+4,.9);
    ctRect(L.h,'#e8e8e8',x-2,y+h+.3,w+4,2);ctStreaks(g,x-1,x+w+1,y+h+2.4,4,O.streak||18,.24);}}
// a split-system condenser hung on the wall
function ctAC(L,x,y,s){s=s||1;const w=9*s,h=6.4*s,g=L.g;ctRect(g,'rgba(0,0,0,.3)',x+.8,y+.8,w,h);ctRect(g,'#d6d6d0',x,y,w,h);ctRect(g,'rgba(0,0,0,.12)',x,y+h-1,w,1);
  g.fillStyle='#3a3c40';g.beginPath();g.arc(x+w*.38,y+h/2,h*.36,0,7);g.fill();g.strokeStyle='#9a9c9e';g.lineWidth=.35;for(let r=h*.1;r<h*.36;r+=h*.08){g.beginPath();g.arc(x+w*.38,y+h/2,r,0,7);g.stroke();}
  ctRect(g,'#b0b0aa',x+w*.75,y+1,w*.18,h-2);ctRect(L.h,'#d8d8d8',x,y,w,h);ctRect(L.o,'rgb(0,150,40)',x,y,w,h);ctStreaks(g,x,x+w,y+h,2,10,.2);}
function windowTex(wall,litP,hue,style){const W=128,H=192,T=ctLayers(W,H,wall,.9,.02),{g,hg}=T,L=T.L;
  ctCloud(g,W,H,3,.4,'overlay',60,200);ctGrain(hg,22);
  const fr=Math.random()<.55?'#a6acb4':'#26282d',lit=()=>Math.random()<litP,col=()=>Math.random()<.75?(hue||'#ffd59a'):'#cfe9ff';
  if(style==='brick'){for(let r=0;r*3<H;r++){const y=r*3,off=(r%2)*4;for(let x=-8;x<W;x+=8){const t=rand(-1,1);g.fillStyle=t>0?`rgba(255,210,170,${t*.12})`:`rgba(0,0,0,${-t*.14})`;g.fillRect(x+off,y,7.6,2.6);
      ctRect(g,'rgba(0,0,0,.2)',x+off+7.6,y,.4,3);ctRect(hg,'#5a5a5a',x+off+7.6,y,.45,3);}ctRect(g,'rgba(0,0,0,.2)',0,y+2.6,W,.4);ctRect(hg,'#5a5a5a',0,y+2.6,W,.45);}}
  else{for(let k=0;k<=4;k++){ctRect(g,'rgba(0,0,0,.18)',k*32-.5,0,1,H);ctRect(hg,'#5c5c5c',k*32-.6,0,1.2,H);}}
  for(let f=0;f<3;f++){const fy=f*64;
    // floor slab band with a drip edge
    ctRect(g,'rgba(255,255,255,.08)',0,fy+55,W,6.5);ctRect(g,'rgba(0,0,0,.25)',0,fy+61.5,W,1);ctRect(g,'rgba(0,0,0,.18)',0,fy+54.2,W,.8);ctRect(hg,'#a8a8a8',0,fy+55,W,6.5);
    ctStreaks(g,0,W,fy+62.5,5,14,.14);
    if(style==='band'){const on=Math.random()<litP*1.4,c=col();for(let k=0;k<8;k++)ctWin(L,k*16+.7,fy+11,14.6,36,{lit:on&&Math.random()<.85,col:c,frame:fr,mull:0,sill:false,transom:.22});
      ctRect(g,'#9a978f',0,fy+47.3,W,2);ctRect(hg,'#e0e0e0',0,fy+47.3,W,2);ctStreaks(g,0,W,fy+49.5,8,12,.2);}
    else if(style==='tall'){for(let k=0;k<4;k++){ctWin(L,k*32+8,fy+5,16,46,{lit:lit(),col:col(),frame:fr,mull:0,transom:.2});}}
    else for(let k=0;k<4;k++){const x=k*32+5,y=fy+8;ctWin(L,x,y,22,40,{lit:lit(),col:col(),frame:fr,transom:.26});if(Math.random()<.16)ctAC(L,x+(Math.random()<.5?-1:14),y+42.6,.9);}}
  ctGrime(g,W,H,.8);
  const a=ctRep(tex(T.c)),b=ctRep(tex(T.e)),ro=ctData(T.o),n=ctNormal(T.hc,2.4);return [a,b,ro,n];}

/* ---------- facades for the building kinds ---------- */
// draw(g,e,w,h,o,hg,L): colour, emissive, rough/metal, height (see ctLayers). Opts: grime (0 = none), bump (normal strength)
function facMat(w,h,draw,emI,extra,opt){opt=opt||{};const X=extra||{},T=ctLayers(w,h,'#808080',X.roughness!=null?X.roughness:.6,X.metalness!=null?X.metalness:.2);
  draw(T.g,T.eg,w,h,T.og,T.hg,T.L);if(opt.grime!==0)ctGrime(T.g,w,h,opt.grime||1);
  const a=ctRep(tex(T.c)),b=ctRep(tex(T.e)),r=ctData(T.o),n=ctNormal(T.hc,opt.bump||2.2);
  return new THREE.MeshStandardMaterial(Object.assign({map:a,emissiveMap:b,emissive:0xffffff,emissiveIntensity:emI||1.2,envMapIntensity:1.2},X,
    {roughness:1,metalness:1,roughnessMap:r,metalnessMap:r,normalMap:n,normalScale:new THREE.Vector2(.85,.85)}));}
// glass office tower: curtain wall, fritted spandrels hiding the slabs, whole floors lit at once
const glassFac=facMat(128,192,(g,e,w,h,o,hg)=>{ctRect(g,'#1c2a3a',0,0,128,192);
  for(let f=0;f<3;f++){const fy=f*64,litF=Math.random()<.42;
    ctRect(g,'#25323f',0,fy+50,128,14);for(let x=0;x<128;x+=1.5)ctRect(g,'rgba(255,255,255,.035)',x,fy+50,.6,14);ctRect(o,'rgb(0,70,170)',0,fy+50,128,14);ctRect(hg,'#707070',0,fy+50,128,14);
    for(let k=0;k<4;k++){const x=k*32+1.2,y=fy+.8,ww=29.6,hh=49;const t=rand(-.12,.12);
      const gr=g.createLinearGradient(x,y,x+ww*.3,y+hh);gr.addColorStop(0,ctShade('#b6cadb',t));gr.addColorStop(.35,ctShade('#6c88a4',t));gr.addColorStop(.7,'#2a4058');gr.addColorStop(1,'#142233');g.fillStyle=gr;g.fillRect(x,y,ww,hh);
      g.save();g.beginPath();g.rect(x,y,ww,hh);g.clip();for(let i=0;i<3;i++){g.fillStyle=`rgba(255,255,255,${rand(.05,.14)})`;g.beginPath();g.ellipse(x+rand(0,ww),y+rand(0,hh*.5),rand(6,16),rand(2,5),0,0,7);g.fill();}g.restore();
      if(litF&&Math.random()<.85){const a=rand(.35,.75);e.globalAlpha=a;ctRect(e,'#cfe6ff',x,y,ww,hh);e.globalAlpha=1;ctRect(g,'rgba(210,230,255,.35)',x,y,ww,hh);
        for(let s=y+3;s<y+hh*.5;s+=9){ctRect(e,'rgba(255,255,255,.9)',x+2,s,ww-4,1);ctRect(g,'rgba(255,255,255,.4)',x+2,s,ww-4,1);}
        ctRect(e,'rgba(0,0,0,.45)',x,y+hh*.72,ww,hh*.28);ctRect(g,'rgba(20,30,40,.35)',x,y+hh*.72,ww,hh*.28);}
      if(Math.random()<.3){const bd=rand(.2,.9)*hh;for(let s=y;s<y+bd;s+=1.6){ctRect(g,'rgba(220,226,232,.3)',x,s,ww,.8);ctRect(e,'rgba(0,0,0,.6)',x,s+.8,ww,.8);}}
      ctRect(o,'rgb(0,16,95)',x,y,ww,hh);}
    [[0,fy+49.6,128,1.6],[0,fy+63.2,128,1.6]].forEach(b=>{ctRect(g,'#aeb8c4',...b);ctRect(hg,'#c0c0c0',...b);ctRect(o,'rgb(0,90,235)',...b);});}
  for(let k=0;k<=4;k++){const b=[k*32-1.2,0,2.4,192];ctRect(g,'#a8b4c0',...b);ctRect(g,'rgba(0,0,0,.25)',k*32+.8,0,.4,192);ctRect(hg,'#d0d0d0',...b);ctRect(o,'rgb(0,90,235)',...b);}
},1,{roughness:.12,metalness:.85},{grime:.25,bump:2.6});
// apartment ("mansion"): small tiles, balcony sliding doors with curtains, condensers by the doors
const aptFac=facMat(128,192,(g,e,w,h,o,hg,L)=>{ctRect(g,'#d6d0c2',0,0,128,192);
  for(let y=0;y<192;y+=3){for(let x=(y/3%2)*3;x<128;x+=6){const t=rand(-1,1);ctRect(g,t>0?`rgba(255,255,255,${t*.08})`:`rgba(0,0,0,${-t*.08})`,x,y,5.6,2.6);}ctRect(g,'rgba(0,0,0,.08)',0,y+2.6,128,.4);ctRect(hg,'#6a6a6a',0,y+2.6,128,.4);}
  for(let f=0;f<3;f++){const fy=f*64;ctRect(g,'#e2dcd0',0,fy+56,128,8);ctRect(g,'rgba(0,0,0,.22)',0,fy+63.4,128,.8);ctRect(hg,'#b0b0b0',0,fy+56,128,8);ctStreaks(g,0,128,fy+64,6,12,.12);
    for(let k=0;k<2;k++){const x=9+k*62,y=fy+9;ctWin(L,x,y,46,45,{lit:Math.random()<.5,col:pick(['#ffd59a','#ffe9c4','#ffcf8a','#cfe9ff']),frame:'#b4b8bc',fw:1.5,sill:false});
      ctRect(g,'#8a8e94',x+22.3,y,1.4,45);if(Math.random()<.55)ctAC(L,x+(k?-11:47.5),fy+47,.95);}}
},1,{roughness:.75,metalness:.05},{grime:.9});
// small shop buildings: glazed tile with grout, framed windows, a gas pipe running down the wall
const shopFacs=['#c8b8a0','#a8b4b0','#b89a8a','#9aa0b8'].map(col=>facMat(128,128,(g,e,w,h,o,hg,L)=>{ctRect(g,col,0,0,128,128);
  for(let y=0;y<128;y+=4){for(let x=0;x<128;x+=8){const t=rand(-1,1);ctRect(g,t>0?`rgba(255,255,255,${t*.1})`:`rgba(0,0,0,${-t*.1})`,x,y,7.6,3.6);ctRect(g,'rgba(0,0,0,.1)',x+7.6,y,.4,4);ctRect(hg,'#666',x+7.6,y,.4,4);}
    ctRect(g,'rgba(0,0,0,.1)',0,y+3.6,128,.4);ctRect(hg,'#666',0,y+3.6,128,.4);}ctRect(o,'rgb(0,110,20)',0,0,128,128);
  for(let k=0;k<2;k++){const x=12+k*60,y=20;ctWin(L,x,y,44,56,{lit:Math.random()<.55,col:pick(['#ffd59a','#ffc0d8','#bfe6ff','#e8ffd0']),frame:pick(['#a8acb2','#2a2c30','#e8e8e4']),transom:.22});
    if(Math.random()<.35)ctAC(L,x+30,y+60,.9);}
  const px=Math.random()<.5?4:122;ctRect(g,'#8c8a86',px,0,1.6,128);ctRect(g,'rgba(255,255,255,.25)',px,0,.5,128);ctRect(hg,'#d0d0d0',px,0,1.6,128);for(let y=10;y<128;y+=30)ctRect(g,'#5a5a58',px-.6,y,2.8,1.2);
  ctRect(g,'#8a8478',0,118,128,10);ctRect(g,'rgba(0,0,0,.25)',0,117.4,128,.8);ctRect(hg,'#a8a8a8',0,118,128,10);
},1,{roughness:.55,metalness:.05},{grime:1}));
// wooden ramen shop / izakaya: weathered planks with grain and knots, glowing paper screens
function ctPlanks(g,hg,o,x0,y0,w,h,bw,base){for(let x=x0;x<x0+w;x+=bw){const t=rand(-.18,.12);ctRect(g,ctShade(base,t),x,y0,bw-.6,h);ctRect(g,'rgba(0,0,0,.6)',x+bw-.6,y0,.6,h);ctRect(hg,'#909090',x,y0,bw-.6,h);ctRect(hg,'#303030',x+bw-.6,y0,.6,h);
    g.strokeStyle='rgba(0,0,0,.22)';g.lineWidth=.35;for(let i=0;i<3;i++){const ph=rand(0,6),gx=x+rand(1,bw-1.6);g.beginPath();for(let y=y0;y<=y0+h;y+=2)g.lineTo(gx+Math.sin(y*.15+ph)*.7,y);g.stroke();}
    if(Math.random()<.4){const ky=y0+rand(5,h-5);g.fillStyle='rgba(20,10,4,.55)';g.beginPath();g.ellipse(x+bw/2,ky,1.1,1.8,0,0,7);g.fill();}}
  ctRect(o,'rgb(0,215,0)',x0,y0,w,h);}
function ctShoji(g,e,hg,o,x,y,w,h,cell,frame){ctRect(g,'#f2e2bf',x,y,w,h);ctRect(e,'#ffd49a',x,y,w,h);const gr=g.createLinearGradient(x,y,x,y+h);gr.addColorStop(0,'rgba(255,240,210,.3)');gr.addColorStop(1,'rgba(120,80,40,.2)');g.fillStyle=gr;g.fillRect(x,y,w,h);
  ctRect(hg,'#505050',x,y,w,h);ctRect(o,'rgb(0,240,0)',x,y,w,h);g.fillStyle=frame;e.fillStyle='rgba(0,0,0,.85)';
  for(let cx=x;cx<=x+w+.1;cx+=cell){g.fillRect(cx-.6,y,1.2,h);e.fillRect(cx-.6,y,1.2,h);ctRect(hg,'#909090',cx-.6,y,1.2,h);}
  for(let cy=y;cy<=y+h+.1;cy+=cell*.75){g.fillRect(x,cy-.6,w,1.2);e.fillRect(x,cy-.6,w,1.2);ctRect(hg,'#909090',x,cy-.6,w,1.2);}
  g.strokeStyle=frame;g.lineWidth=3;g.strokeRect(x-1.5,y-1.5,w+3,h+3);ctRect(hg,'#c0c0c0',x-3,y-3,w+6,3);ctRect(hg,'#c0c0c0',x-3,y+h,w+6,3);}
const woodFac=facMat(128,128,(g,e,w,h,o,hg)=>{ctPlanks(g,hg,o,0,0,128,128,8,'#43291a');
  ctShoji(g,e,hg,o,16,30,96,50,16,'#2e1c10');ctRect(g,'#5a3a22',12,82,104,3);ctRect(hg,'#e0e0e0',12,82,104,3);
  const gr=g.createLinearGradient(0,0,0,14);gr.addColorStop(0,'rgba(0,0,0,.55)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,128,14);
},1.1,{roughness:.85,metalness:0},{grime:.6});
const woodGF=facMat(128,128,(g,e,w,h,o,hg)=>{ctPlanks(g,hg,o,0,0,128,128,6,'#352014');
  ctShoji(g,e,hg,o,14,24,100,70,10,'#2a180c');ctRect(g,'#1e120a',14,94,100,1.5);ctRect(g,'#4a3020',0,104,128,24);for(let x=0;x<128;x+=16)ctRect(g,'rgba(0,0,0,.4)',x,104,.8,24);ctRect(hg,'#b0b0b0',0,104,128,24);
},1.1,{roughness:.85,metalness:0},{grime:.5});
// convenience store: white composite panels, brand stripes, a bright glass front full of shelves
const konbiniFac=[['#2aa84a','#3a8ad8'],['#3a6ad8','#7ac8ff'],['#e8702a','#2a9a4a']].map(([a,b])=>facMat(128,64,(g,e,w,h,o,hg)=>{ctRect(g,'#f2f2ee',0,0,128,64);
  for(let x=0;x<=128;x+=32){ctRect(g,'rgba(0,0,0,.12)',x-.4,0,.8,64);ctRect(hg,'#5a5a5a',x-.4,0,.8,64);}ctRect(o,'rgb(0,90,60)',0,0,128,64);
  ctRect(g,a,0,14,128,10);ctRect(g,b,0,26,128,6);ctRect(g,'rgba(255,255,255,.25)',0,14,128,1);ctRect(e,'#3a3a3a',0,14,128,18);ctRect(hg,'#a0a0a0',0,14,128,18);ctStreaks(g,0,128,32,10,20,.1);
},1,{roughness:.4,metalness:.1},{grime:.45}));
const konbiniGF=facMat(128,128,(g,e,w,h,o,hg)=>{ctRect(g,'#d8dde2',0,0,128,128);{const kg=g.createLinearGradient(0,10,0,110);kg.addColorStop(0,'#eef4fa');kg.addColorStop(1,'#9aa2aa');g.fillStyle=kg;g.fillRect(6,10,116,100);const ke=e.createLinearGradient(0,10,0,110);ke.addColorStop(0,'#c8d4e0');ke.addColorStop(1,'#3a4048');e.fillStyle=ke;e.fillRect(6,10,116,100);}ctRect(o,'rgb(0,25,60)',6,10,116,100);ctRect(hg,'#303030',6,10,116,100);
  for(let r=0;r<3;r++){const sy=42+r*20;ctRect(g,'#b8c0c8',8,sy+12,112,2);for(let x=9;x<119;x+=rand(2.5,5)){const c=pick(['#e84a4a','#4a8ae8','#f0c040','#4ac06a','#f08a30','#ffffff','#a060d0']),ph=rand(5,11);
      ctRect(g,c,x,sy+12-ph,rand(1.8,3.6),ph);ctRect(e,ctShade(c,.2),x,sy+12-ph,2,ph);}}
  ctRect(g,'rgba(255,255,255,.7)',8,13,112,2.4);ctRect(e,'#ffffff',8,13,112,2.4);
  [[16,30,14,18,'#e8404a'],[92,28,18,12,'#2a7ae8']].forEach(([x,y,w2,h2,c])=>{ctRect(g,c,x,y,w2,h2);ctRect(g,'rgba(255,255,255,.6)',x+2,y+2,w2-4,2);});
  [[4,8,2,104],[122,8,2,104],[62,10,4,100],[4,8,120,2],[4,110,120,3]].forEach(b=>{ctRect(g,'#9aa4ae',...b);ctRect(hg,'#c0c0c0',...b);ctRect(o,'rgb(0,90,220)',...b);ctRect(e,'#000',...b);});
  g.fillStyle='rgba(255,255,255,.1)';g.beginPath();g.moveTo(20,10);g.lineTo(48,10);g.lineTo(30,110);g.lineTo(6,110);g.fill();
},.55,{roughness:.2,metalness:.3},{grime:.3});
// pachinko parlour: loud red and gold, rows of bulbs in chrome sockets
const pachiFac=facMat(128,128,(g,e,w,h,o,hg)=>{const gr=g.createLinearGradient(0,0,0,128);gr.addColorStop(0,'#c4102a');gr.addColorStop(1,'#6a0a3a');g.fillStyle=gr;g.fillRect(0,0,128,128);
  for(let y=0;y<128;y+=24){ctRect(g,'#d8a830',0,y,128,1.6);ctRect(g,'rgba(255,255,255,.5)',0,y,128,.4);ctRect(hg,'#d0d0d0',0,y,128,1.6);ctRect(o,'rgb(0,70,230)',0,y,128,1.6);}
  for(let y=6;y<128;y+=12)for(let x=6;x<128;x+=12){const c=pick(['#ffd23f','#ffffff','#ff5aa8','#5af0ff']);g.fillStyle='#c8c8cc';g.beginPath();g.arc(x,y,4.2,0,7);g.fill();g.fillStyle=c;g.beginPath();g.arc(x,y,3,0,7);g.fill();
    g.fillStyle='rgba(255,255,255,.7)';g.beginPath();g.arc(x-.9,y-.9,.9,0,7);g.fill();e.fillStyle=c;e.beginPath();e.arc(x,y,3.4,0,7);e.fill();
    hg.fillStyle='#e8e8e8';hg.beginPath();hg.arc(x,y,3.6,0,7);hg.fill();o.fillStyle='rgb(0,40,200)';o.beginPath();o.arc(x,y,4.2,0,7);o.fill();}
},2.2,{roughness:.4,metalness:.1},{grime:.3});
// shopping mall: big stone panels and a glass band
const mallFac=facMat(128,128,(g,e,w,h,o,hg,L)=>{for(let y=0;y<128;y+=16)for(let x=((y/16)%2)*16;x<160;x+=32){ctRect(g,ctShade('#e2dccf',rand(-.06,.04)),x-16,y,31.4,15.4);ctRect(hg,'#909090',x-16,y,31.4,15.4);}
  for(let y=0;y<128;y+=16){ctRect(g,'rgba(0,0,0,.18)',0,y+15.4,128,.6);ctRect(hg,'#505050',0,y+15.4,128,.6);}
  for(let k=0;k<8;k++)ctWin(L,k*16+.6,40,14.8,48,{lit:Math.random()<.35,col:'#d8eeff',frame:'#6a6e74',fw:.7,mull:0,sill:false,dress:false,sky:'#c4d4e2'});
  ctRect(g,'#cfc8b8',0,88,128,3);ctRect(hg,'#e0e0e0',0,88,128,3);ctStreaks(g,0,128,91,8,16,.14);
},1,{roughness:.45,metalness:.05},{grime:.6});
const mallGF=facMat(128,128,(g,e,w,h,o,hg)=>{ctRect(g,'#c8ccd0',0,0,128,128);const mg=g.createLinearGradient(0,6,0,122);mg.addColorStop(0,'#dfe8f0');mg.addColorStop(1,'#8a96a2');g.fillStyle=mg;g.fillRect(4,6,120,116);ctRect(e,'#c8d4de',4,6,120,116);ctRect(o,'rgb(0,22,60)',4,6,120,116);ctRect(hg,'#303030',4,6,120,116);
  for(let k=0;k<3;k++){const x=6+k*40;ctRect(g,pick(['#f4d8e0','#d8e8f4','#f4ecd0']),x+4,50,30,50);ctRect(g,'rgba(0,0,0,.2)',x+4,96,30,4);for(let i=0;i<5;i++){const c=pick(['#e84a7a','#4a7ae8','#f0c040','#303030','#ffffff']);ctRect(g,c,x+6+i*5.6,62,3.4,22);}}
  for(let x=4;x<128;x+=40){const b=[x,6,3,116];ctRect(g,'#9aa4ae',...b);ctRect(hg,'#c0c0c0',...b);ctRect(o,'rgb(0,90,220)',...b);ctRect(e,'#000',...b);}
  g.fillStyle='rgba(255,255,255,.12)';g.beginPath();g.moveTo(14,6);g.lineTo(40,6);g.lineTo(22,122);g.lineTo(4,122);g.fill();
},.32,{roughness:.15,metalness:.4},{grime:.25});

/* ---------- ground: sidewalk pavers ---------- */
function concreteTex(){const S=512,T=ctLayers(S,S,'#3c3e42',.98,0),{g,hg,og}=T,PW=64,PH=32;ctRect(hg,'#282828',0,0,S,S);
  for(let r=0;r<S/PH;r++){const off=r%2?PW/2:0;for(let k=0;k<S/PW;k++){const x0=k*PW+off,y=r*PH,o=Math.random(),t=rand(-9,9),wm=rand(-3,3),b=o<.05?80:o<.09?116:98;
    const col=`rgb(${b+t+wm|0},${b+t|0},${b+t-wm+3|0})`,rv=rand(200,228)|0;
    for(const x of (x0+PW>S?[x0,x0-S]:[x0])){ctRect(g,col,x+1,y+1,PW-2,PH-2);ctRect(g,'rgba(255,255,255,.06)',x+1,y+1,PW-2,1.1);ctRect(g,'rgba(0,0,0,.1)',x+1,y+PH-2.1,PW-2,1.1);
      ctRect(hg,'#9a9a9a',x+1,y+1,PW-2,PH-2);ctRect(hg,'#c6c6c6',x+2.6,y+2.6,PW-5.2,PH-5.2);ctRect(og,`rgb(0,${rv},0)`,x+1,y+1,PW-2,PH-2);
      if(o>.95){ctCrack({g,h:hg},x+rand(4,PW-4),y+1,PH,Math.PI/2+rand(-.5,.5),.7,'rgba(10,10,10,.7)',false);}}}}
  ctCloud(g,S,S,6,.5,'overlay',70,180);ctCloud(g,S,S,17,.22,'overlay',90,170);ctGrain(g,24);ctGrain(hg,34);
  for(let i=0;i<14;i++){const x=rand(0,S),y=rand(0,S),r=rand(12,46);for(const ox of [0,-S,S])for(const oy of [0,-S,S]){const gr=g.createRadialGradient(x+ox,y+oy,0,x+ox,y+oy,r);gr.addColorStop(0,'rgba(0,0,0,.13)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(x+ox-r,y+oy-r,r*2,r*2);}}
  for(let i=0;i<40;i++){g.fillStyle=`rgba(${rand(10,40)|0},${rand(10,40)|0},${rand(10,40)|0},${rand(.15,.35)})`;g.beginPath();g.ellipse(rand(0,S),rand(0,S),rand(.6,1.6),rand(.5,1.3),rand(0,3),0,7);g.fill();}
  for(let i=0;i<3;i++){const x=rand(30,S-30),y=rand(30,S-30),r=rand(18,40),gr=og.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,'rgb(0,120,0)');gr.addColorStop(1,'rgba(0,214,0,0)');og.fillStyle=gr;og.beginPath();og.ellipse(x,y,r*1.4,r,0,0,7);og.fill();
    const g2=g.createRadialGradient(x,y,0,x,y,r);g2.addColorStop(0,'rgba(0,0,0,.12)');g2.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=g2;g.beginPath();g.ellipse(x,y,r*1.4,r,0,0,7);g.fill();}
  const t=ctRep(tex(T.c));t.repeat.set(420/8,420/8);const n=ctNormal(T.hc,2.2),ro=ctData(T.o);n.repeat.copy(t.repeat);ro.repeat.copy(t.repeat);t.userData={normal:n,rough:ro};return t;}

/* ---------- roads ---------- */
function asphalt(L,S){const g=L.g;ctRect(g,'#2b2d31',0,0,S,S);ctCloud(g,S,S,5,.55,'overlay',60,190);ctCloud(g,S,S,15,.25,'overlay',80,170);ctGrain(g,30);
  for(let i=0;i<3000;i++){const v=rand(80,150)|0,r=rand(.35,1.1);ctRect(g,`rgba(${v},${v},${v-4},${rand(.2,.55)})`,rand(0,S),rand(0,S),r,r*rand(.6,1));}
  if(L.h){ctRect(L.h,'#7a7a7a',0,0,S,S);ctGrain(L.h,80);}
  for(let i=0;i<2;i++){const w=rand(40,110),h=rand(30,70),x=rand(0,S-w),y=rand(24,S-h-24);ctRect(g,`rgba(${Math.random()<.5?0:70},${Math.random()<.5?0:70},${Math.random()<.5?0:74},.16)`,x,y,w,h);
    g.strokeStyle='rgba(0,0,0,.45)';g.lineWidth=1.4;g.strokeRect(x,y,w,h);if(L.h){L.h.strokeStyle='rgba(220,220,220,.5)';L.h.lineWidth=1.2;L.h.strokeRect(x,y,w,h);}}
  for(let i=0;i<7;i++)ctCrack(L,rand(0,S),rand(10,S-10),rand(30,90),rand(0,7),rand(1.3,2.4),'rgba(8,8,10,.85)',true);}
// worn paint: drawn on its own layer, then nibbled away so the asphalt shows through
function ctPaint(L,S,draw,wear){const [pc,pg]=ctCv(S,S);draw(pg);pg.globalCompositeOperation='destination-out';
  for(let i=0;i<S*S*.02*wear;i++){pg.fillStyle=`rgba(0,0,0,${rand(.3,1)})`;pg.fillRect(rand(0,S),rand(0,S),rand(.4,1.6),rand(.4,1.6));}
  for(let i=0;i<26*wear;i++){const x=rand(0,S),y=rand(0,S),r=rand(8,40),gr=pg.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,`rgba(0,0,0,${rand(.25,.75)})`);gr.addColorStop(1,'rgba(0,0,0,0)');pg.fillStyle=gr;pg.fillRect(x-r,y-r,r*2,r*2);}
  L.g.save();L.g.setTransform(1,0,0,1,0,0);L.g.drawImage(pc,0,0);L.g.restore();
  if(L.h){L.h.save();L.h.setTransform(1,0,0,1,0,0);L.h.globalAlpha=.25;L.h.globalCompositeOperation='lighter';L.h.drawImage(pc,0,0);L.h.restore();}}
function roadTex(){const S=512,PX=S/14,T=ctLayers(S,S,'#2b2d31',.88,0),{g,og}=T,L=T.L;asphalt(L,S);
  // tyre tracks: darker, polished bands where the wheels run; oil drips down the middle of each lane
  [.7*PX+(S/2-.7*PX)/2,S-(.7*PX+(S/2-.7*PX)/2)].forEach(c=>{[-30,30].forEach(o=>{const y=c+o,gr=g.createLinearGradient(0,y-8,0,y+8);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(.5,'rgba(0,0,0,.2)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,y-8,S,16);
      const gr2=og.createLinearGradient(0,y-8,0,y+8);gr2.addColorStop(0,'rgba(0,225,0,0)');gr2.addColorStop(.5,'rgba(0,150,0,.8)');gr2.addColorStop(1,'rgba(0,225,0,0)');og.fillStyle=gr2;og.fillRect(0,y-8,S,16);});
    for(let i=0;i<5;i++){const x=rand(0,S),r=rand(4,12);for(const ox of [0,-S,S]){const gr=g.createRadialGradient(x+ox,c,0,x+ox,c,r*1.8);gr.addColorStop(0,'rgba(5,5,8,.5)');gr.addColorStop(1,'rgba(5,5,8,0)');g.fillStyle=gr;g.beginPath();g.ellipse(x+ox,c+rand(-6,6),r*1.8,r,0,0,7);g.fill();
      og.fillStyle='rgba(0,70,0,.5)';og.beginPath();og.ellipse(x+ox,c,r,r*.6,0,0,7);og.fill();}}});
  // kerb gutters
  [[0,8],[S-8,8]].forEach(([y,h])=>{ctRect(g,'#8b8d90',0,y,S,h);ctRect(T.hg,'#c8c8c8',0,y,S,h);ctRect(og,'rgb(0,220,0)',0,y,S,h);ctRect(g,'rgba(0,0,0,.4)',0,y?y-1.4:h,S,1.4);});
  ctGrain(g,10);
  ctPaint(L,S,p=>{p.fillStyle='rgba(222,222,216,.88)';p.fillRect(0,.7*PX,S,5);p.fillRect(0,S-.7*PX-5,S,5);p.fillStyle='#e6b72e';p.fillRect(0,S/2-6,S*.45,4);p.fillRect(0,S/2+2,S*.45,4);},1);
  // wet patches: low roughness puddles that mirror the sky
  for(let i=0;i<8;i++){const x=rand(0,S),y=40+rand(0,S-80),r=rand(10,30),gr=og.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,'rgb(0,22,0)');gr.addColorStop(.7,'rgb(0,60,0)');gr.addColorStop(1,'rgba(0,200,0,0)');og.fillStyle=gr;og.beginPath();og.ellipse(x,y,r*1.6,r,0,0,7);og.fill();}
  const t=ctRep(tex(T.c));t.userData={rough:ctData(T.o),normal:ctNormal(T.hc,1.6)};return t;}
let CT_XB=null;
function crossTex(center){const S=512,PX=S/14;
  if(!CT_XB){const T=ctLayers(S,S,'#2b2d31',.88,0);asphalt(T.L,S);CT_XB={T,rough:ctData(T.o),normal:ctNormal(T.hc,1.6)};}
  const B=CT_XB.T,[c,g]=cv(B.c.width,B.c.height);g.drawImage(B.c,0,0);g.scale(CTQ,CTQ);
  ctPaint({g},S,p=>{p.fillStyle='rgba(222,222,216,.86)';for(let k=1;k<13;k+=1.5){p.fillRect(k*PX,0,.75*PX,2.2*PX);p.fillRect(k*PX,S-2.2*PX,.75*PX,2.2*PX);p.fillRect(0,k*PX,2.2*PX,.75*PX);p.fillRect(S-2.2*PX,k*PX,2.2*PX,.75*PX);}
    if(center){p.save();p.translate(S/2,S/2);p.strokeStyle='rgba(120,220,255,.75)';p.lineWidth=10;p.beginPath();p.arc(0,0,4*PX,0,7);p.stroke();
      p.fillStyle='rgba(255,190,70,.8)';p.beginPath();for(let i=0;i<6;i++){const a=i/6*Math.PI*2-Math.PI/2;p.lineTo(Math.cos(a)*3*PX,Math.sin(a)*3*PX);}p.closePath();p.fill();
      p.globalCompositeOperation='destination-out';p.font=`bold ${2.6*PX}px sans-serif`;p.textAlign='center';p.textBaseline='middle';p.fillText('7',0,PX*.2);p.restore();}},1.2);
  const t=tex(c);t.userData={rough:CT_XB.rough,normal:CT_XB.normal};return t;}

/* ---------- smaller surfaces: storefronts, floors, roofs, precast concrete, props ---------- */
// ground-floor storefront (4 m wide tile): sign band, framed glass with a lit shop behind it, kick plate
function ctStoreTex(){const T=ctLayers(256,256,'#2a2c33',.5,.6),{g,eg,og,hg}=T;
  ctRect(g,'#1c1d22',0,0,256,30);for(let x=0;x<256;x+=4)ctRect(g,'rgba(255,255,255,.03)',x,0,2,30);
  const gr=g.createLinearGradient(0,40,0,212);gr.addColorStop(0,'#4a5a6a');gr.addColorStop(.5,'#2a3440');gr.addColorStop(1,'#141920');g.fillStyle=gr;g.fillRect(14,40,228,172);
  const wc=pick(['#ffd9a0','#fff0d8','#d8ecff']),PAL=['#8a4a4a','#4a5a8a','#a08a4a','#4a7a5a','#c8c4bc','#6a4a7a','#b87a4a','#d8d4cc'];
  ctRect(g,'rgba(0,0,0,.35)',14,190,228,22);[22,76,180,234].forEach(x=>ctRect(g,'#2a2b30',x,70,2.4,142));
  for(let r=0;r<4;r++){const sy=88+r*30;ctRect(g,'#3a3634',20,sy,216,2.4);ctRect(g,'rgba(0,0,0,.35)',20,sy+2.4,216,2);
    for(let x=21;x<234;){const pw=rand(2.2,6),ph=rand(5,14),c=ctShade(pick(PAL),rand(-.35,0));if(Math.random()<.15){x+=pw;continue;}ctRect(g,c,x,sy-ph,pw-.4,ph);ctRect(g,'rgba(255,255,255,.12)',x,sy-ph,pw-.4,.8);x+=pw;}}
  ctRect(g,'rgba(18,26,36,.38)',14,40,228,172);
  g.globalCompositeOperation='screen';const g2=g.createLinearGradient(0,40,0,212);g2.addColorStop(0,ctShade(wc,-.3));g2.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=g2;g.fillRect(14,40,228,172);g.globalCompositeOperation='source-over';
  const ge=eg.createLinearGradient(0,40,0,212);ge.addColorStop(0,ctShade(wc,-.55));ge.addColorStop(1,'#000');eg.fillStyle=ge;eg.fillRect(14,40,228,172);
  ctRect(og,'rgb(0,20,70)',14,40,228,172);ctRect(hg,'#303030',14,40,228,172);
  g.fillStyle='rgba(255,255,255,.1)';g.beginPath();g.moveTo(30,40);g.lineTo(72,40);g.lineTo(42,212);g.lineTo(18,212);g.fill();
  [[0,30,256,10],[0,212,256,4],[0,30,14,186],[242,30,14,186],[124,40,8,172]].forEach(b=>{ctRect(g,'#33353c',...b);ctRect(g,'rgba(255,255,255,.12)',b[0],b[1],b[2],.6);ctRect(hg,'#c0c0c0',...b);ctRect(og,'rgb(0,110,220)',...b);});
  ctRect(g,'#25262b',0,216,256,40);for(let y=218;y<256;y+=6)ctRect(g,'rgba(255,255,255,.04)',0,y,256,1);ctRect(hg,'#a0a0a0',0,216,256,40);ctRect(og,'rgb(0,90,220)',0,216,256,40);
  ctGrain(g,10);return {map:ctRep(tex(T.c)),emissiveMap:ctRep(tex(T.e)),orm:ctData(T.o),normal:ctNormal(T.hc,2.4)};}
// interior floor: polished stone tiles (tile 60 cm, texture spans 2.4 m)
function ctFloorTex(){const T=ctLayers(256,256,'#5a564e',.95,0),{g,og,hg}=T;for(let i=0;i<4;i++)for(let j=0;j<4;j++){const c=(i+j)%2?'#8a8478':'#9a9488',x=i*64,y=j*64;ctRect(g,ctShade(c,rand(-.06,.06)),x+.8,y+.8,62.4,62.4);
    g.strokeStyle='rgba(255,255,255,.08)';g.lineWidth=.6;for(let v=0;v<3;v++){g.beginPath();let px=x+rand(0,64),py=y;g.moveTo(px,py);for(let s=0;s<8;s++){px+=rand(-8,8);py+=8;g.lineTo(Math.min(x+63,Math.max(x+1,px)),py);}g.stroke();}
    ctRect(og,`rgb(0,${rand(55,85)|0},0)`,x+.8,y+.8,62.4,62.4);ctRect(hg,'#b0b0b0',x+.8,y+.8,62.4,62.4);}
  ctGrain(g,8);const m=ctRep(tex(T.c));return {map:m,orm:ctData(T.o),normal:ctNormal(T.hc,1.4)};}
// flat roof: bitumen membrane in overlapping sheets, gravel, patches and dried puddle marks (texture spans 6 m)
function ctRoofTex(){const S=256,T=ctLayers(S,S,'#3a3b3f',.92,0),{g,og,hg}=T;ctCloud(g,S,S,4,.5,'overlay',60,190);
  for(let y=0;y<S;y+=64){ctRect(g,'rgba(255,255,255,.07)',0,y,S,3);ctRect(g,'rgba(0,0,0,.3)',0,y+3,S,.8);ctRect(hg,'#a8a8a8',0,y,S,3);}
  for(let i=0;i<1800;i++){const v=rand(60,140)|0;ctRect(g,`rgba(${v},${v},${v},.5)`,rand(0,S),rand(0,S),rand(.5,1.3),rand(.5,1.3));}
  for(let i=0;i<3;i++){const x=rand(0,S-60),y=rand(0,S-50),w=rand(20,60),h=rand(16,44);ctRect(g,'rgba(10,10,12,.35)',x,y,w,h);ctRect(og,'rgb(0,150,0)',x,y,w,h);}
  for(let i=0;i<3;i++){const x=rand(20,S-20),y=rand(20,S-20),r=rand(14,34);g.strokeStyle='rgba(200,190,170,.12)';g.lineWidth=1;g.beginPath();g.ellipse(x,y,r*1.5,r,0,0,7);g.stroke();
    const gr=og.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,'rgb(0,90,0)');gr.addColorStop(1,'rgba(0,234,0,0)');og.fillStyle=gr;og.beginPath();og.ellipse(x,y,r*1.5,r,0,0,7);og.fill();}
  ctGrain(g,26);ctGrain(hg,60);return {map:ctRep(tex(T.c)),orm:ctData(T.o),normal:ctNormal(T.hc,1.8)};}
// precast concrete: form-tie holes, panel joints, rain marks (texture spans 4 m)
function ctConcTex(base){const S=256,T=ctLayers(S,S,base,.88,0),{g,hg}=T;ctCloud(g,S,S,5,.45,'overlay',70,190);ctCloud(g,S,S,13,.2,'soft-light',50,210);
  for(let y=32;y<S;y+=64)for(let x=32;x<S;x+=64){g.fillStyle='rgba(0,0,0,.35)';g.beginPath();g.arc(x,y,1.6,0,7);g.fill();g.fillStyle='rgba(255,255,255,.08)';g.beginPath();g.arc(x+.4,y+.4,2.4,0,7);g.fill();hg.fillStyle='#303030';hg.beginPath();hg.arc(x,y,1.6,0,7);hg.fill();}
  [0,128].forEach(p=>{ctRect(g,'rgba(0,0,0,.22)',p,0,1,S);ctRect(g,'rgba(0,0,0,.22)',0,p,S,1);ctRect(hg,'#404040',p,0,1.2,S);ctRect(hg,'#404040',0,p,S,1.2);});
  ctStreaks(g,0,S,0,14,120,.1);ctGrain(g,20);ctGrain(hg,40);return {map:ctRep(tex(T.c)),orm:ctData(T.o),normal:ctNormal(T.hc,1.8)};}
// rooftop condenser front: louvres and a fan grille
function ctAcTex(){const T=ctLayers(64,48,'#cfcfc8',.6,.1),{g,hg}=T;ctRect(g,'rgba(0,0,0,.15)',0,0,64,2);
  g.fillStyle='#2e3034';g.beginPath();g.arc(24,24,17,0,7);g.fill();g.strokeStyle='#8a8c8e';g.lineWidth=.8;for(let r=4;r<17;r+=3){g.beginPath();g.arc(24,24,r,0,7);g.stroke();}
  for(let a=0;a<4;a++){g.beginPath();g.moveTo(24,24);g.lineTo(24+Math.cos(a*1.57)*17,24+Math.sin(a*1.57)*17);g.stroke();}
  for(let y=8;y<42;y+=3)ctRect(g,'rgba(0,0,0,.25)',46,y,14,1);hg.fillStyle='#404040';hg.beginPath();hg.arc(24,24,17,0,7);hg.fill();
  ctStreaks(g,0,64,40,4,8,.25);ctGrain(g,12);return {map:tex(T.c),normal:ctNormal(T.hc,1.5)};}
// breakable props
function ctCrateTex(){const T=ctLayers(128,128,'#8a6232',.85,0),{g,hg,og}=T;
  for(let y=0;y<128;y+=16){ctRect(g,ctShade('#94683a',rand(-.12,.08)),0,y,128,15.2);ctRect(g,'rgba(0,0,0,.5)',0,y+15.2,128,.8);ctRect(hg,'#909090',0,y,128,15.2);
    g.strokeStyle='rgba(60,30,10,.25)';g.lineWidth=.5;for(let i=0;i<4;i++){const gy=y+rand(2,13),ph=rand(0,6);g.beginPath();for(let x=0;x<=128;x+=4)g.lineTo(x,gy+Math.sin(x*.08+ph)*1.2);g.stroke();}}
  g.lineWidth=11;g.strokeStyle='#6a4622';g.strokeRect(5.5,5.5,117,117);g.beginPath();g.moveTo(8,8);g.lineTo(120,120);g.stroke();hg.lineWidth=11;hg.strokeStyle='#d8d8d8';hg.strokeRect(5.5,5.5,117,117);hg.beginPath();hg.moveTo(8,8);hg.lineTo(120,120);hg.stroke();
  [[6,6],[122,6],[6,122],[122,122],[64,64]].forEach(([x,y])=>{g.fillStyle='#3a3a3a';g.beginPath();g.arc(x,y,1.6,0,7);g.fill();og.fillStyle='rgb(0,80,230)';og.beginPath();og.arc(x,y,1.6,0,7);og.fill();});
  g.font='bold 13px sans-serif';g.textAlign='center';g.fillStyle='rgba(20,10,0,.45)';g.fillText('SURGE CO.',64,50);g.fillText('▲ ▲',64,92);
  ctGrime(g,128,128,.6);return {map:tex(T.c),normal:ctNormal(T.hc,2.4),orm:ctData(T.o)};}
function ctBarrierTex(){const T=ctLayers(128,32,'#f2f2f2',.6,0),{g,hg}=T;for(let i=-1;i<9;i++){g.fillStyle=i%2?'#f2f2ee':'#ff7a1a';g.beginPath();g.moveTo(i*16,32);g.lineTo(i*16+16,0);g.lineTo(i*16+32,0);g.lineTo(i*16+16,32);g.fill();}
  for(let i=0;i<30;i++)ctRect(g,`rgba(40,30,20,${rand(.1,.3)})`,rand(0,128),rand(0,32),rand(1,6),rand(.4,1.4));ctRect(g,'rgba(0,0,0,.25)',0,0,128,1.2);ctRect(g,'rgba(0,0,0,.25)',0,30.8,128,1.2);
  ctRect(hg,'#b0b0b0',0,1.5,128,29);ctGrime(g,128,32,.7);return {map:tex(T.c),normal:ctNormal(T.hc,2)};}
// granite paving for plazas, planters and the shrine
function ctStoneTex(){const T=ctLayers(128,128,'#5a5c60',.8,0),{g,hg}=T;for(let y=0;y<128;y+=32)for(let x=((y/32)%2)*16;x<160;x+=32){ctRect(g,ctShade('#72747a',rand(-.1,.08)),x-16+.8,y+.8,30.4,30.4);ctRect(hg,'#a0a0a0',x-16+.8,y+.8,30.4,30.4);}
  ctGrain(g,30,true);ctCloud(g,128,128,4,.4,'overlay',70,190);ctGrain(hg,40);return {map:ctRep(tex(T.c)),normal:ctNormal(T.hc,2)};}
