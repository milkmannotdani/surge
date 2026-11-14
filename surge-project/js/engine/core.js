/* Renderer, camera, post-processing (anime shader lives in FinalShader), audio, input, shared helpers */
'use strict';
if(!window.THREE){document.getElementById('err').textContent='Could not load the 3D engine. Check your connection and reload.';throw new Error('no three');}
const V3=THREE.Vector3, $=id=>document.getElementById(id);
const rand=(a,b)=>a+Math.random()*(b-a), clamp=(v,a,b)=>Math.max(a,Math.min(b,v)), lerp=(a,b,t)=>a+(b-a)*t;
const pick=a=>a[Math.floor(Math.random()*a.length)];
function angLerp(a,b,t){let d=b-a;while(d>Math.PI)d-=Math.PI*2;while(d<-Math.PI)d+=Math.PI*2;return a+d*t;}
function angDiff(a,b){let d=b-a;while(d>Math.PI)d-=Math.PI*2;while(d<-Math.PI)d+=Math.PI*2;return d;}
const TMP=new V3(), TMP2=new V3(), TMP3=new V3(), UP=new V3(0,1,0);
const BOUND=138;
// seeded RNG for the shared map (identical for every player)
let _s=0x5eed7;function srnd(){_s|=0;_s=_s+0x6D2B79F5|0;let t=Math.imul(_s^_s>>>15,1|_s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;}
const sr=(a,b)=>a+srnd()*(b-a);
const store={get(k){try{return localStorage.getItem(k);}catch(e){return null;}},set(k,v){try{localStorage.setItem(k,v);}catch(e){}}};

/* ================= AUDIO (synthesized) ================= */
// which fighter a piece of kit comes from: built-in fighters use their own id;
// created fighters borrow each slot (look, element, weapon, alt ultimate) from a built-in one
// event hooks: add-on files listen with onEv('name',fn) instead of editing core code.
// events: input(dt) before player controls are read, tick(dt) each sim step in a match, frame(dt) every frame,
// hit(att,def,dmg,o), kill(def,att), ult(f), matchStart(), matchEnd(), win(w)
const EVH={};
function normRules(r){return r==='arena'||r==='raid'?r:'br';}function onEv(n,fn){(EVH[n]||(EVH[n]=[])).push(fn);}
function emitEv(n,a,b,c,d){const L=EVH[n];if(!L)return;for(const fn of L){try{fn(a,b,c,d);}catch(e){console.error('['+n+']',e);}}}
function KIT(h,slot){return h.as?(h.as[slot]||h.as.elem||h.id):h.id;}
function HAS(h,x){return h.id===x||(!!h.as&&(h.as.look===x||(h.as.parts||[]).indexOf(x)>=0));}
const AU={ctx:null,on:true,music:true,timer:null,scale:1,pan:0,intensity:0};
AU.init=function(){
  if(this.ctx){if(this.ctx.state==='suspended')this.ctx.resume();return;}
  try{this.ctx=new (window.AudioContext||window.webkitAudioContext)();}catch(e){return;}
  const c=this.ctx;
  this.master=c.createGain();this.master.gain.value=.75;
  const comp=c.createDynamicsCompressor();comp.threshold.value=-16;comp.ratio.value=5;
  this.master.connect(comp);comp.connect(c.destination);
  this.sfx=c.createGain();this.sfx.connect(this.master);
  const len=c.sampleRate*1.6, ib=c.createBuffer(2,len,c.sampleRate);
  for(let ch=0;ch<2;ch++){const d=ib.getChannelData(ch);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.6);}
  this.rev=c.createConvolver();this.rev.buffer=ib;const rg=c.createGain();rg.gain.value=.25;
  this.sfx.connect(this.rev);this.rev.connect(rg);rg.connect(this.master);
  this.mus=c.createGain();this.mus.gain.value=.2;this.mus.connect(this.master);
  const nb=c.createBuffer(1,c.sampleRate*2,c.sampleRate),nd=nb.getChannelData(0);for(let i=0;i<nd.length;i++)nd[i]=Math.random()*2-1;this.nb=nb;
};
AU.tone=function(type,f0,f1,dur,vol,delay,dest){
  const c=this.ctx;if(!c||!this.on)return;const sc=dest?1:this.scale;if(sc<.03||(!dest&&this.live>160))return;vol*=sc;const t=c.currentTime+(delay||0);if(!dest)this._track(1,dur+(delay||0));
  if(!dest){const pv=1+(Math.random()-.5)*.07;f0*=pv;f1*=pv;}
  const o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(Math.max(f1,1),t+dur);
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(vol,.0002),t+.006);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  o.connect(g);this.out(g,dest);o.start(t);o.stop(t+dur+.05);
};
AU.noise=function(dur,vol,ft,f0,f1,Q,delay,dest){
  const c=this.ctx;if(!c||!this.on)return;const sc=dest?1:this.scale;if(sc<.03||(!dest&&this.live>160))return;vol*=sc;const t=c.currentTime+(delay||0);if(!dest)this._track(1,dur+(delay||0));
  const s=c.createBufferSource();s.buffer=this.nb;const f=c.createBiquadFilter();f.type=ft;f.Q.value=Q||1;
  f.frequency.setValueAtTime(f0,t);f.frequency.exponentialRampToValueAtTime(Math.max(f1,20),t+dur);
  const g=c.createGain();g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(vol,.0002),t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  if(!dest)s.playbackRate.value=1+(Math.random()-.5)*.1;
  s.connect(f);f.connect(g);this.out(g,dest);s.start(t,Math.random()*Math.max(0,1.9-dur));s.stop(t+dur+.05);
};
AU.out=function(node,dest){if(dest){node.connect(dest);return;}if(this.pan&&this.ctx.createStereoPanner){const p=this.ctx.createStereoPanner();p.pan.value=clamp(this.pan,-.9,.9);node.connect(p);p.connect(this.sfx);}else node.connect(this.sfx);};
AU.foot=function(w,hard){const k=hard?1.4:1;this.noise(.055,.09*w*k,'lowpass',1500/w,350,1);this.tone('sine',150/w,60/w,.07,.1*w*k);};
AU.landW=function(w,hard){this.tone('sine',110/w,38/w,.16,(hard?.55:.38)*w);this.noise(.14,(hard?.3:.18)*w,'lowpass',900/w,140,1);};
AU.startAmb=function(){if(!this.ctx||this.amb)return;const c=this.ctx;
  const src=c.createBufferSource();src.buffer=this.nb;src.loop=true;const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=240;const g=c.createGain();g.gain.value=.05;src.connect(lp);lp.connect(g);g.connect(this.master);src.start();
  const src2=c.createBufferSource();src2.buffer=this.nb;src2.loop=true;src2.playbackRate.value=.7;const bp=c.createBiquadFilter();bp.type='bandpass';bp.frequency.value=650;bp.Q.value=.7;const g2=c.createGain();g2.gain.value=.012;src2.connect(bp);bp.connect(g2);g2.connect(this.master);src2.start();
  const lfo=c.createOscillator();lfo.frequency.value=.07;const lg=c.createGain();lg.gain.value=.012;lfo.connect(lg);lg.connect(g2.gain);lfo.start();
  const zo=c.createOscillator();zo.type='sawtooth';zo.frequency.value=55;const zo2=c.createOscillator();zo2.type='sine';zo2.frequency.value=220;const zl=c.createBiquadFilter();zl.type='lowpass';zl.frequency.value=260;const zg=c.createGain();zg.gain.value=0;
  zo.connect(zl);zo2.connect(zl);zl.connect(zg);zg.connect(this.master);zo.start();zo2.start();
  this.amb={src,src2,lfo,zo,zo2,zg};
  this.hornT=setInterval(()=>{if(!this.on||Math.random()<.55)return;const s=this.scale,p=this.pan;this.scale=.16;this.pan=rand(-.8,.8);const f=pick([311,349,392]);
    if(Math.random()<.5){this.tone('square',f,f,.32,.1);this.tone('square',f*1.26,f*1.26,.32,.08);}else{for(let i=0;i<4;i++)this.tone('sine',740,960,.5,.05,i*.55);}this.scale=s;this.pan=p;},7000);};
AU.stopAmb=function(){if(!this.amb)return;try{this.amb.src.stop();this.amb.src2.stop();this.amb.lfo.stop();this.amb.zo.stop();this.amb.zo2.stop();}catch(e){}clearInterval(this.hornT);this.amb=null;};
AU.zoneHum=function(k){if(this.amb)this.amb.zg.gain.setTargetAtTime(k*.07,this.ctx.currentTime,.2);};
AU.hit=function(p){this.noise(.14,.55*p,'lowpass',3500,300,1);this.tone('sine',170,42,.2,.9*p);this.tone('square',1300,240,.035,.14);if(p>1.2){this.tone('sine',90,30,.45,.8);this.noise(.4,.35,'lowpass',900,80,1);}};
AU.whoosh=function(h){this.noise(h?.26:.16,h?.4:.25,'bandpass',h?350:700,h?2200:3000,1.3);};
AU.block=function(){this.tone('triangle',1500,1150,.1,.28);this.tone('square',2300,2000,.05,.06);this.noise(.07,.3,'highpass',4000,3000,1);};
AU.jump=function(){this.tone('sine',260,620,.12,.18);this.noise(.1,.12,'bandpass',800,2400,1);};
AU.land=function(){this.tone('sine',100,40,.14,.45);this.noise(.12,.2,'lowpass',900,150,1);};
AU.dash=function(){this.noise(.24,.45,'highpass',800,5000,.8);this.tone('sine',500,1400,.12,.08);};
AU.fire=function(){this.noise(.55,.5,'lowpass',3200,250,1);this.tone('sawtooth',220,70,.35,.12);};
AU.water=function(){this.noise(.45,.5,'bandpass',2400,500,2.5);this.tone('sine',900,180,.3,.15);};
AU.wind=function(){this.noise(.9,.45,'bandpass',300,1800,4);this.noise(.9,.25,'bandpass',1800,400,4,.05);};
AU.rock=function(){this.noise(.35,.6,'lowpass',700,90,1);this.tone('square',75,38,.3,.22);};
AU.boom=function(big){const d=big?1.6:.9;this.noise(d,1,'lowpass',2400,50,.7);this.tone('sine',85,25,d,1);this.noise(.12,.6,'highpass',1500,800,1);};
AU.crash=function(){this.noise(.35,.6,'bandpass',1400,250,1.2);this.tone('square',220,55,.18,.15);this.noise(.5,.25,'highpass',3000,6000,1,.05);};
AU.charge=function(d){this.tone('sawtooth',110,880,d,.18);this.tone('sine',220,1760,d,.14);this.noise(d,.3,'bandpass',200,3000,3);};
AU.zap=function(p){this.noise(.18*p,.45,'highpass',2500,6000,1);this.tone('square',120,60,.12*p,.12);this.tone('sawtooth',1800,400,.1,.08);};
AU.shutter=function(n){for(let i=0;i<(n||1);i++){this.tone('square',2600,2400,.018,.14,i*.045);this.noise(.03,.2,'highpass',5000,6000,1,i*.045);}};
AU.glass=function(){this.noise(.4,.5,'highpass',3000,8000,2);for(let i=0;i<5;i++)this.tone('triangle',rand(2500,5200),rand(1800,4000),.15,.08,i*.03);};
AU.pick=function(){const s=this.scale;this.tone('sine',660,660,.08,.25);this.tone('sine',990,990,.12,.2,.07);};
AU.ui=function(){const s=this.scale;this.scale=1;this.pan=0;this.tone('square',880,880,.05,.08);this.tone('square',1320,1320,.06,.06,.05);this.scale=s;};
AU.ko=function(){this.boom(true);this.tone('triangle',440,55,1.5,.3,.1);};
AU.bell=function(){[523,659,784].forEach((f,i)=>this.tone('triangle',f,f,.7,.18,i*.02));};
AU.startMusic=function(){if(!this.ctx||this.timer)return;this.step=0;this.nextT=this.ctx.currentTime+.1;this.timer=setInterval(()=>this.sched(),25);};
AU.stopMusic=function(){clearInterval(this.timer);this.timer=null;};
AU.sched=function(){const c=this.ctx,spb=60/138/4;while(this.nextT<c.currentTime+.12){this.play(this.step,this.nextT-c.currentTime);this.nextT+=spb;this.step=(this.step+1)%64;}};
AU.play=function(s,d){
  if(!this.music||!this.on||d<0)return;const st=s%16,bar=Math.floor(s/16),M=this.mus;
  const r=[55,43.65,65.41,49][bar];
  const I=this.intensity||0;
  if(st%4===0)this.tone('sine',150,38,.22,.9,d,M);
  if(I>.55&&(st===10||st===14))this.tone('sine',140,40,.18,.45,d,M);
  if(st===4||st===12){this.noise(.16,.5,'bandpass',1800,900,.8,d,M);this.tone('triangle',220,160,.08,.2,d,M);if(I>.7)this.noise(.1,.25,'highpass',2500,1500,1,d+.012,M);}
  if(st%2===1)this.noise(.04,.18,'highpass',8000,7000,1,d,M);
  if(I>.3&&st%2===0)this.noise(.025,.07,'highpass',9500,8500,1,d,M);
  if([0,3,6,8,10,11,14].indexOf(st)>=0){const f=(st===6||st===14)?r*2:r;this.tone('sawtooth',f,f*.99,.16,.22,d,M);}
  if(st===0){[1,1.189,1.498,2].forEach(m=>{this.tone('triangle',r*4*m,r*4*m*1.004,1.85,.05,d,M);this.tone('triangle',r*4*m*.996,r*4*m,1.85,.04,d,M);});}
  if(I>.15){const ar=[1,1.498,2,2.378,2,1.498];const f=r*8*ar[st%6];this.tone('square',f,f,.065,.012+I*.014,d,M);}
};

/* ================= RENDERER / SCENE ================= */
const GFX={high:true};
{const pref=store.get('surge.gfx');if(pref)GFX.high=pref!=='low';else{try{const c=document.createElement('canvas').getContext('webgl');const e=c&&c.getExtension('WEBGL_debug_renderer_info');
  const r=e?String(c.getParameter(e.UNMASKED_RENDERER_WEBGL)):'';if(/intel|swiftshader|llvmpipe|mali|adreno|powervr|uhd|iris/i.test(r))GFX.high=false;const lc=c&&c.getExtension('WEBGL_lose_context');if(lc)lc.loseContext();}catch(err){}}}
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio,GFX.high?1.75:1));
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
document.body.insertBefore(renderer.domElement,document.body.firstChild);
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(60,innerWidth/innerHeight,.1,1200);
camera.position.set(60,40,60);
scene.fog=new THREE.FogExp2(0x6a4a5a,.0048);

let composer=null,bloom=null;
const FinalShader={uniforms:{tDiffuse:{value:null},exposure:{value:1.0},time:{value:0},sunUV:{value:new THREE.Vector2(.5,.5)},sunVis:{value:0},anime:{value:0},impact:{value:0},px:{value:new THREE.Vector2(1/1280,1/720)},tint:{value:new THREE.Vector3(1,1,1)}},
  vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:`uniform sampler2D tDiffuse;uniform float exposure,time,sunVis,anime,impact;uniform vec2 sunUV,px;uniform vec3 tint;varying vec2 vUv;
  float lu(vec2 u){vec3 s=texture2D(tDiffuse,u).rgb;float l=dot(s,vec3(.2126,.7152,.0722));return l/(1.+l);}
  float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
  void main(){vec2 o=(vUv-.5)*.0016;vec3 c;c.r=texture2D(tDiffuse,vUv+o).r;c.g=texture2D(tDiffuse,vUv).g;c.b=texture2D(tDiffuse,vUv-o).b;
  if(sunVis>0.){vec2 dl=(vUv-sunUV)/28.;vec2 su=vUv;float w=1.,acc=0.;for(int i=0;i<28;i++){su-=dl;vec3 s=texture2D(tDiffuse,su).rgb;acc+=max(max(s.r,max(s.g,s.b))-1.15,0.)*w;w*=.95;}c+=vec3(1.,.62,.36)*min(acc,30.)*.03*sunVis;}
  c*=exposure;c=(c*(2.51*c+.03))/(c*(2.43*c+.59)+.14);
  float l=dot(c,vec3(.2126,.7152,.0722));c=mix(vec3(l),c,1.08);
  c=mix(c,c*vec3(.92,.97,1.08),(1.-smoothstep(.0,.45,l))*.35);c=mix(c,c*vec3(1.06,1.,.92),smoothstep(.45,1.,l)*.3);
  c=smoothstep(-.02,1.02,c);c=pow(clamp(c,0.,1.),vec3(1./2.2));
  c+=(h(vUv*vec2(1920.,1080.)+fract(time)*91.)-.5)*.025;
  float v=smoothstep(1.,.32,length((vUv-.5)*vec2(1.1,1.)));c*=mix(.58,1.,v);
  if(anime>0.){
    // anime look: flat cel bands, punchier color, ink outlines from edges, halftone dots in the shadows
    vec2 d=px*1.5;float tl=lu(vUv+vec2(-d.x,d.y)),t=lu(vUv+vec2(0.,d.y)),tr=lu(vUv+d),l0=lu(vUv-vec2(d.x,0.)),r0=lu(vUv+vec2(d.x,0.)),bl=lu(vUv-d),b=lu(vUv-vec2(0.,d.y)),br=lu(vUv+vec2(d.x,-d.y));
    float gx=-tl-2.*l0-bl+tr+2.*r0+br,gy=tl+2.*t+tr-bl-2.*b-br;float e=smoothstep(.07,.22,sqrt(gx*gx+gy*gy));
    float L=dot(c,vec3(.2126,.7152,.0722));vec3 sat=mix(vec3(L),c,1.35);float q=floor(L*4.+.5)/4.;vec3 cel=sat*(q+.08)/(L+.08);
    vec2 g=fract(vUv/px/6.)-.5;float dot_=step(length(g),.45*(1.-smoothstep(.0,.35,L)));
    vec3 a=mix(cel,cel*.55,dot_*.6);a=mix(a,vec3(.03,.02,.05),e*.9);a*=tint;
    c=mix(c,clamp(a,0.,1.),anime);}
  if(impact>0.){float L2=dot(c,vec3(.299,.587,.114));vec3 bw=vec3(step(.42,L2));c=mix(c,1.-bw,impact);}
  gl_FragColor=vec4(c,1.);}`};
// removes broken pixels (NaN / infinity) and clamps extreme brightness before bloom, so one bad pixel can't blur into a black screen
const SanitizeShader={uniforms:{tDiffuse:{value:null}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:`uniform sampler2D tDiffuse;varying vec2 vUv;
  void main(){vec4 c=texture2D(tDiffuse,vUv);
  #if __VERSION__>=300
  if(any(isnan(c))||any(isinf(c)))c=vec4(0.,0.,0.,1.);
  #else
  if(!(c.r<1e5&&c.g<1e5&&c.b<1e5&&c.r>-1e5&&c.g>-1e5&&c.b>-1e5))c=vec4(0.,0.,0.,1.);
  #endif
  gl_FragColor=vec4(clamp(c.rgb,0.,40.),1.);}`};
try{
  if(THREE.EffectComposer&&THREE.UnrealBloomPass&&THREE.ShaderPass){
    let rt;const pr=renderer.getPixelRatio();
    if(GFX.high&&renderer.capabilities.isWebGL2&&THREE.WebGLMultisampleRenderTarget){rt=new THREE.WebGLMultisampleRenderTarget(innerWidth*pr,innerHeight*pr,{format:THREE.RGBAFormat,type:THREE.HalfFloatType});rt.samples=4;}
    composer=new THREE.EffectComposer(renderer,rt);
    composer.addPass(new THREE.RenderPass(scene,camera));
    composer.addPass(new THREE.ShaderPass(SanitizeShader));
    bloom=new THREE.UnrealBloomPass(new THREE.Vector2(innerWidth/2,innerHeight/2),.62,.5,.96);
    composer.addPass(bloom);
    window.FINAL=new THREE.ShaderPass(FinalShader);composer.addPass(FINAL);FINAL.uniforms.px.value.set(1/(innerWidth*pr),1/(innerHeight*pr));
  }
}catch(e){composer=null;}
if(!composer){renderer.outputEncoding=THREE.sRGBEncoding;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;}
let ENV=null;try{if(THREE.RoomEnvironment){const pm=new THREE.PMREMGenerator(renderer);ENV=pm.fromScene(new THREE.RoomEnvironment(),.04).texture;}}catch(e){ENV=null;}
// procedural normal maps from height canvases
function normalFromHeight(hc,str){const w=hc.width,h=hc.height,src=hc.getContext('2d').getImageData(0,0,w,h).data;const [c,g]=cv(w,h);const out=g.createImageData(w,h);
  const H=(x,y)=>src[(((y+h)%h)*w+((x+w)%w))*4]/255;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const dx=(H(x-1,y)-H(x+1,y))*str,dy=(H(x,y-1)-H(x,y+1))*str;const l=Math.hypot(dx,dy,1);const i=(y*w+x)*4;
    out.data[i]=(dx/l*.5+.5)*255;out.data[i+1]=(dy/l*.5+.5)*255;out.data[i+2]=(1/l*.5+.5)*255;out.data[i+3]=255;}
  g.putImageData(out,0,0);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;return t;}
const PART=[];
addEventListener('resize',()=>{renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
  if(composer)composer.setSize(innerWidth,innerHeight);if(window.FINAL)FINAL.uniforms.px.value.set(1/(innerWidth*renderer.getPixelRatio()),1/(innerHeight*renderer.getPixelRatio()));PART.forEach(p=>p.mat.uniforms.scale.value=innerHeight*renderer.getPixelRatio()*.95);});

const sunDir=new V3(-.62,.34,-.72).normalize();
scene.add(new THREE.HemisphereLight(0x8090ff,0x3a2418,.3));
const sun=new THREE.DirectionalLight(0xffb27a,2.9);
sun.position.copy(sunDir).multiplyScalar(80);sun.castShadow=true;
{const ms=GFX.high?Math.min(4096,renderer.capabilities.maxTextureSize):2048;sun.shadow.mapSize.set(ms,ms);}{const sc=sun.shadow.camera;sc.left=-42;sc.right=42;sc.top=42;sc.bottom=-42;sc.near=1;sc.far=260;}
sun.shadow.bias=-.00025;sun.shadow.normalBias=.025;sun.shadow.radius=3;scene.add(sun);scene.add(sun.target);
const rim=new THREE.DirectionalLight(0x6fb6ff,.8);rim.position.set(30,25,40);scene.add(rim);

const sky=new THREE.Mesh(new THREE.SphereGeometry(700,32,16),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,
  uniforms:{sd:{value:sunDir},tint:{value:0},dayk:{value:0},nightk:{value:0},cloudk:{value:0}},vertexShader:'varying vec3 vW;void main(){vW=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(vW,1.);}',
  fragmentShader:`uniform vec3 sd;uniform float tint,dayk,nightk,cloudk;varying vec3 vW;
  void main(){vec3 d=normalize(vW-cameraPosition*0.);float h=d.y;vec3 top=vec3(.02,.03,.11),mid=vec3(.22,.1,.3),hor=vec3(1.,.38,.18);
  vec3 c=mix(hor,mid,smoothstep(0.,.22,h));c=mix(c,top,smoothstep(.18,.7,h));
  float s=max(dot(d,sd),0.);c+=vec3(1.,.55,.25)*pow(s,300.)*12.+vec3(1.,.4,.15)*pow(s,8.)*.55;
  if(h<0.)c=mix(hor*.5,vec3(.06,.04,.07),smoothstep(0.,-.15,h));
  float st=fract(sin(dot(floor(d*420.),vec3(12.9898,78.233,37.719)))*43758.5453);c+=vec3(step(.9985,st))*smoothstep(.25,.6,h)*1.5;
  if(h>0.){vec2 uv=d.xz/(h+.12)*1.4;float n=0.,a=.5;vec2 q=uv;for(int i=0;i<5;i++){vec2 ip=floor(q),fp=fract(q);fp=fp*fp*(3.-2.*fp);
      float v00=fract(sin(dot(ip,vec2(127.1,311.7)))*43758.5),v10=fract(sin(dot(ip+vec2(1,0),vec2(127.1,311.7)))*43758.5),v01=fract(sin(dot(ip+vec2(0,1),vec2(127.1,311.7)))*43758.5),v11=fract(sin(dot(ip+vec2(1,1),vec2(127.1,311.7)))*43758.5);
      n+=a*mix(mix(v00,v10,fp.x),mix(v01,v11,fp.x),fp.y);q*=2.1;a*=.5;}
    float cl=smoothstep(.52,.78,n)*smoothstep(0.,.12,h)*(1.-smoothstep(.45,.8,h));
    vec3 cc=mix(vec3(.32,.16,.3),vec3(1.,.55,.32),pow(s,3.)*.8+.25*(1.-h));c=mix(c,cc,cl*.85);}
  vec3 dayc=mix(vec3(.62,.78,.95),vec3(.18,.42,.85),smoothstep(0.,.6,h))+vec3(1.,.95,.8)*pow(s,200.)*8.;if(h<0.)dayc=vec3(.35,.38,.42);c=mix(c,dayc,dayk);
  c=mix(c,c*vec3(.12,.14,.3)+vec3(step(.9975,st))*smoothstep(.1,.5,h)*1.2,nightk);
  c=mix(c,mix(vec3(.2,.21,.25),vec3(.36,.38,.42),smoothstep(-.1,.5,h))*(1.-nightk*.75),cloudk);
  c=mix(c,c*vec3(1.3,.28,.24)+vec3(.14,0.,.01),tint);
  gl_FragColor=vec4(c,1.);}`}));
const TINT={k:0,target:0},FOG0=scene.fog.color.clone(),FOGR=new THREE.Color(0x5a0a0c),SUN0=new THREE.Color(0xffb27a),SUNR=new THREE.Color(0xff3a2a);
scene.add(sky);
// image-based lighting from the sunset sky, so metal, glass and armor reflect the real sky
let SKYENV=null;
function makeSkyEnv(){try{const pm=new THREE.PMREMGenerator(renderer);const es=new THREE.Scene();const s2=sky.clone();s2.material=sky.material.clone();es.add(s2);
  const gnd=new THREE.Mesh(new THREE.CircleGeometry(400,32),new THREE.MeshBasicMaterial({color:0x2a2228}));gnd.rotation.x=-Math.PI/2;gnd.position.y=-2;es.add(gnd);
  const old=SKYENV;SKYENV=pm.fromScene(es,.02).texture;pm.dispose();scene.environment=SKYENV;
  if(old)scene.traverse(o=>{const ms=o.material?(Array.isArray(o.material)?o.material:[o.material]):[];ms.forEach(m=>{if(m.envMap===old){m.envMap=SKYENV;m.needsUpdate=true;}});});}catch(e){}}
makeSkyEnv();
// if the browser drops the graphics context (driver reset, low video memory), recover instead of staying black
renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();window.__ctxLost=true;},false);
renderer.domElement.addEventListener('webglcontextrestored',()=>{window.__ctxLost=false;
  if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null;}makeSkyEnv();
  if(composer)composer.setSize(innerWidth,innerHeight);
  if(GFX.high&&!window.__ctxDowngraded&&window.applyGfxLow){window.__ctxDowngraded=true;window.applyGfxLow();}},false);

function cv(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return [c,c.getContext('2d')];}
function tex(c,srgb){const t=new THREE.CanvasTexture(c);if(srgb!==false)t.encoding=THREE.sRGBEncoding;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());return t;}
function addMat(hex,b,op){const m=new THREE.MeshBasicMaterial({transparent:true,opacity:op||1,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide});m.color.setHex(hex).multiplyScalar(b||2);return m;}

/* ---- richer synthesis building blocks for character sounds ---- */
AU.live=0;
AU._ok=function(){return this.ctx&&this.on&&this.scale>=.03&&this.live<160;};
AU._track=function(n,dur){this.live++;setTimeout(()=>{this.live--;},(dur+.1)*1000);};
// reversed-feel swell: fades IN then cuts (shadow, void, portals, sucking)
AU.swell=function(dur,vol,ft,f0,f1,Q,delay){if(!this._ok())return;const c=this.ctx;vol*=this.scale;const t=c.currentTime+(delay||0);
  const s=c.createBufferSource();s.buffer=this.nb;const f=c.createBiquadFilter();f.type=ft;f.Q.value=Q||1;f.frequency.setValueAtTime(f0,t);f.frequency.exponentialRampToValueAtTime(Math.max(f1,20),t+dur);
  const g=c.createGain();g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(vol,.0002),t+dur*.9);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  s.connect(f);f.connect(g);this.out(g);s.start(t,Math.random()*.3);s.stop(t+dur+.05);this._track(1,dur+(delay||0));};
// FM voice: metal clangs, bells, buzz, sci-fi
AU.fm=function(fc,ratio,idx,dur,vol,delay,f1,type){if(!this._ok())return;const c=this.ctx;vol*=this.scale;const t=c.currentTime+(delay||0),pv=1+(Math.random()-.5)*.05;fc*=pv;
  const car=c.createOscillator(),mod=c.createOscillator(),mg=c.createGain(),g=c.createGain();car.type=type||'sine';
  car.frequency.setValueAtTime(fc,t);mod.frequency.setValueAtTime(fc*ratio,t);if(f1){car.frequency.exponentialRampToValueAtTime(f1*pv,t+dur);mod.frequency.exponentialRampToValueAtTime(f1*pv*ratio,t+dur);}
  mg.gain.setValueAtTime(fc*idx,t);mg.gain.exponentialRampToValueAtTime(Math.max(fc*idx*.04,1),t+dur);
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(vol,.0002),t+.004);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  mod.connect(mg);mg.connect(car.frequency);car.connect(g);this.out(g);car.start(t);mod.start(t);car.stop(t+dur+.05);mod.stop(t+dur+.05);this._track(1,dur+(delay||0));};
// distorted growl with tremolo (beasts, demons, flesh groans)
AU.growl=function(f0,f1,dur,vol,delay,rate,cut){if(!this._ok())return;const c=this.ctx;vol*=this.scale;const t=c.currentTime+(delay||0);
  if(!this.shp){this.shp=c.createWaveShaper();const n=1024,cu=new Float32Array(n);for(let i=0;i<n;i++){const x=i/n*2-1;cu[i]=Math.tanh(x*4);}this.shpC=cu;}
  const o=c.createOscillator(),o2=c.createOscillator(),ws=c.createWaveShaper(),lp=c.createBiquadFilter(),g=c.createGain(),tr=c.createOscillator(),tg=c.createGain(),am=c.createGain();
  o.type='sawtooth';o2.type='sawtooth';o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(f1,t+dur);o2.frequency.setValueAtTime(f0*1.013,t);o2.frequency.exponentialRampToValueAtTime(f1*1.02,t+dur);
  ws.curve=this.shpC;lp.type='lowpass';lp.frequency.value=cut||700;lp.Q.value=3;
  tr.frequency.value=rate||22;tg.gain.value=.5;am.gain.value=.5;tr.connect(tg);tg.connect(am.gain);
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(vol,.0002),t+Math.min(.08,dur*.3));g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  o.connect(ws);o2.connect(ws);ws.connect(lp);lp.connect(am);am.connect(g);this.out(g);[o,o2,tr].forEach(x=>{x.start(t);x.stop(t+dur+.05);});this._track(1,dur+(delay||0));};
// wet resonant blips (blood, guts, bubbling)
AU.gurgle=function(n,vol,lo,hi,span,delay){for(let i=0;i<n;i++){const f=rand(lo,hi);this.noise(rand(.025,.06),vol*rand(.5,1),'bandpass',f,f*rand(.45,.8),rand(10,22),(delay||0)+Math.random()*span);}};
AU.squelch=function(dur,vol,delay){const d=delay||0;this.noise(dur,vol,'bandpass',rand(1400,2100),rand(200,320),7,d);this.noise(dur*.8,vol*.6,'bandpass',rand(600,900),rand(130,200),9,d+.015);
  this.tone('sine',rand(180,240),rand(65,90),dur*.7,vol*.45,d);this.gurgle(3,vol*.5,500,1600,dur,d);};
AU.splat=function(vol,delay){const d=delay||0;this.noise(.16,vol,'lowpass',3200,240,2,d);this.noise(.09,vol*.6,'bandpass',950,300,5,d);this.tone('sine',140,45,.14,vol*.8,d);this.gurgle(4,vol*.45,700,2400,.2,d+.03);};
AU.crunch=function(vol,delay){for(let i=0;i<5;i++)this.noise(.014,vol*rand(.5,1),'bandpass',rand(1500,3600),rand(900,2000),2,(delay||0)+i*rand(.008,.02));};
AU.tear=function(dur,vol,delay){const n=Math.max(2,Math.round(dur/.02));for(let i=0;i<n;i++)this.noise(.03,vol*rand(.4,1)*(1-i/n*.5),'bandpass',rand(800,2600),rand(450,1300),rand(2,5),(delay||0)+i*.02);};
AU.crackle=function(dur,vol,rate,delay){const n=Math.round(dur*rate);for(let i=0;i<n;i++)this.noise(.01,vol*rand(.3,1),'highpass',rand(2500,6500),3000,1,(delay||0)+Math.random()*dur);};
AU.bubbles=function(n,vol,lo,hi,span,delay){for(let i=0;i<n;i++){const f=rand(lo,hi);this.tone('sine',f,f*rand(1.8,2.6),rand(.035,.07),vol*rand(.4,1),(delay||0)+Math.random()*span);}};
AU.beat=function(vol,delay){const d=delay||0;this.tone('sine',62,38,.13,vol,d);this.tone('sine',58,36,.12,vol*.7,d+.17);this.noise(.08,vol*.25,'lowpass',260,80,1,d);};
AU.whistle=function(f0,f1,dur,vol,delay){this.noise(dur,vol,'bandpass',f0,f1,25,delay);this.tone('sine',f0,f1,dur,vol*.12,delay);};
AU.sub=function(f0,f1,dur,vol,delay){this.tone('sine',f0,f1,dur,vol,delay);this.tone('triangle',f0*2,f1*2,dur*.6,vol*.25,delay);};
AU.chord=function(fs,dur,vol,type,delay,bend){fs.forEach((f,i)=>this.tone(type||'sawtooth',f,f*(bend||1),dur,vol,(delay||0)+i*.01));};
AU.flutter=function(n,vol,delay){for(let i=0;i<n;i++)this.noise(.03,vol*rand(.5,1),'bandpass',rand(1200,2400),900,3,(delay||0)+i*.032);};
AU.clicks=function(n,gap,vol,f,delay){for(let i=0;i<n;i++)this.tone('square',f*rand(.9,1.1),f*.5,.012,vol,(delay||0)+i*gap);};
/* ================= PER-CHARACTER SOUND PROFILES ================= */
// every fighter's swings, hits, dashes, charge-ups, special and ultimate are built from their power
const SND={
  // CINDER: roaring flame, popping embers
  fire:{thud:.6,
    swing(h){AU.noise(h?.32:.22,h?.42:.3,'lowpass',2800,420,1.2);AU.crackle(h?.3:.2,.12,40);},
    hit(p){AU.noise(.3,.45*p,'lowpass',2400,260,1);AU.noise(.12,.25*p,'bandpass',600,200,2);AU.crackle(.4,.16*p,45,.02);AU.sub(110,50,.2,.4*p);},
    dash(){AU.noise(.35,.45,'lowpass',2600,350,1);AU.crackle(.35,.12,40);},
    charge(){AU.swell(.9,.45,'lowpass',400,3200,1);AU.crackle(.9,.12,30);},
    spec(){AU.noise(.4,.45,'lowpass',3400,500,1);AU.swell(.18,.3,'lowpass',500,2500,1);AU.crackle(.5,.14,40);},
    ult(){AU.sub(70,24,1.4,.9);AU.noise(1.6,.7,'lowpass',1800,90,1);AU.noise(.6,.4,'bandpass',900,200,1.5);AU.crackle(1.6,.2,60);}},
  // RIPTIDE: splashes, bubbles, rushing water
  water:{thud:.5,
    swing(h){AU.noise(h?.3:.22,.32,'bandpass',3000,800,2.2);AU.bubbles(3,.06,300,700,.15);},
    hit(p){AU.noise(.28,.45*p,'highpass',1200,500,.8);AU.noise(.2,.3*p,'lowpass',900,200,1);AU.tone('sine',420,120,.12,.2*p);AU.bubbles(7,.08*p,250,900,.25,.03);},
    dash(){AU.noise(.45,.42,'bandpass',2800,500,1.6);AU.bubbles(6,.07,300,900,.35);},
    charge(){AU.swell(.9,.4,'bandpass',300,2600,2.5);AU.bubbles(14,.08,200,800,.85);},
    spec(){AU.noise(.12,.45,'highpass',4500,2500,1);AU.noise(.35,.3,'bandpass',2600,700,2);AU.bubbles(5,.07,400,1000,.2);},
    ult(){AU.swell(.5,.5,'bandpass',200,1600,1.2);AU.noise(1.8,.75,'lowpass',2200,140,.8,.45);AU.noise(1.4,.35,'highpass',2500,1200,.7,.5);AU.bubbles(24,.08,150,800,1.6,.5);AU.sub(80,35,1,.6,.45);}},
  // GALE: whistling air, gusts, howls
  wind:{thud:.5,
    swing(h){AU.whistle(h?600:900,h?2600:3600,h?.3:.2,.32);},
    hit(p){AU.noise(.22,.4*p,'bandpass',1500,300,2.5);AU.whistle(2400,900,.18,.12*p);AU.sub(120,60,.12,.25*p);},
    dash(){AU.whistle(500,3200,.4,.4);AU.noise(.4,.2,'lowpass',800,200,1);},
    charge(){AU.whistle(300,2400,.9,.3);AU.whistle(2600,500,.9,.25);},
    spec(){for(let i=0;i<4;i++)AU.whistle(700+i*300,2200+i*200,.35,.18,i*.09);AU.noise(.6,.25,'bandpass',300,1200,1.5);},
    ult(){AU.whistle(200,3600,1,.45);AU.whistle(3600,600,1,.3,.2);AU.noise(1.2,.4,'lowpass',600,120,1,.1);}},
  // NITRO: sharp detonations, sizzling fuses
  blast:{thud:.4,
    swing(h){AU.noise(.06,.35,'highpass',2500,4000,1);AU.sub(150,60,.08,.3);if(h){AU.noise(.12,.4,'lowpass',2000,200,1,.04);AU.crackle(.15,.15,60,.04);}},
    hit(p){AU.sub(140,32,.3,.8*p);AU.noise(.25,.55*p,'lowpass',3000,150,1);AU.noise(.04,.4*p,'highpass',3000,5000,1);AU.crackle(.35,.15*p,50,.05);},
    dash(){AU.sub(120,40,.22,.6);AU.noise(.2,.45,'lowpass',2500,200,1);AU.crackle(.25,.15,50);},
    charge(){AU.crackle(.9,.18,70);AU.noise(.9,.25,'highpass',3000,7000,1);AU.tone('sawtooth',70,140,.9,.08);},
    spec(){AU.sub(110,30,.4,.8);AU.noise(.5,.55,'lowpass',2600,120,1);AU.noise(.5,.3,'bandpass',800,2400,1.2,.05);AU.crackle(.4,.15,50);},
    ult(){AU.crackle(.5,.2,90);for(let i=0;i<3;i++){AU.sub(100,28,.45,.7,.1+i*.18);AU.noise(.5,.5,'lowpass',2600,120,1,.1+i*.18);}}},
  // TITAN: heavy displacement, bone-shaking punches
  power:{thud:1.1,
    swing(h){AU.noise(h?.4:.26,h?.55:.35,'bandpass',180,700,1.1);AU.sub(h?70:90,40,.25,h?.3:.15);},
    hit(p){AU.sub(85,26,.45,1*p);AU.noise(.3,.5*p,'lowpass',1100,60,1);AU.crunch(.25*p,.01);},
    dash(){AU.sub(70,35,.25,.5);AU.noise(.3,.45,'lowpass',700,150,1);},
    charge(){AU.growl(45,90,.9,.3,0,14,350);AU.noise(.9,.3,'lowpass',250,1300,1);},
    spec(){AU.sub(90,30,.5,.9);AU.noise(.6,.5,'bandpass',250,1400,1.2);AU.swell(.15,.35,'lowpass',300,1500,1);},
    ult(){AU.sub(60,20,1.6,1);AU.noise(1.5,.75,'lowpass',900,40,1);AU.crunch(.4,.05);AU.crunch(.3,.2);AU.noise(1,.3,'bandpass',300,1500,1.2,.1);}},
  // VOLTA: buzzing arcs, snapping zaps, thunder
  electric:{thud:.5,
    swing(h){AU.fm(120,3.01,4,.15,.07,0,90,'sawtooth');AU.crackle(.15,.14,90);},
    hit(p){AU.zap(1);AU.fm(1800,1.5,6,.12,.12*p,0,300,'square');AU.noise(.03,.35*p,'highpass',3000,6000,1);},
    dash(){AU.fm(200,2.01,5,.25,.1,0,2400,'sawtooth');AU.crackle(.25,.18,100);},
    charge(){AU.fm(60,2,3,.9,.12,0,900,'sawtooth');AU.crackle(.9,.18,80);},
    spec(){AU.noise(.05,.6,'highpass',2500,5000,1);AU.zap(2);AU.noise(.9,.4,'lowpass',500,60,1,.08);AU.fm(90,3.5,8,.4,.12,0,60,'sawtooth');},
    ult(){AU.fm(55,2,4,1.4,.14,0,110,'sawtooth');for(let i=0;i<5;i++){AU.noise(.05,.45,'highpass',2500,5000,1,i*.3);AU.noise(.7,.35,'lowpass',450,50,1,i*.3+.04);}AU.crackle(1.6,.2,70);}},
  // UMBRA: breathy darkness, reversed whooshes, a beast's growl
  shadow:{thud:.6,
    swing(h){AU.swell(h?.3:.2,.32,'lowpass',200,900,1.4);AU.tone('sawtooth',70,50,.25,.06);},
    hit(p){AU.noise(.3,.4*p,'lowpass',500,70,1);AU.noise(.25,.14*p,'bandpass',1200,700,8,.02);AU.sub(90,35,.3,.5*p);},
    dash(){AU.swell(.3,.4,'lowpass',150,1000,1.2);AU.noise(.2,.2,'bandpass',800,300,6,.28);},
    charge(){AU.growl(40,55,.95,.22,0,9,300);[700,1150].forEach((f,i)=>AU.noise(.9,.08,'bandpass',f,f*.9,14,i*.05));},
    spec(){AU.growl(70,45,.6,.35,0,26,600);AU.swell(.25,.4,'lowpass',150,1200,1);},
    ult(){AU.swell(1,.6,'lowpass',60,600,1);AU.growl(38,30,1.6,.35,.9,8,400);AU.sub(50,25,1.5,.6,.9);[650,1100,1700].forEach((f,i)=>AU.noise(1.2,.06,'bandpass',f,f*.8,16,.9+i*.1));}},
  // DRIFT: warped pitch, bell-like gravity wells
  gravity:{thud:.5,
    swing(h){AU.tone('sine',260,90,.22,.18);AU.fm(220,1.5,1.5,.2,.05,0,110);},
    hit(p){AU.fm(330,1.41,3,.5,.14*p,0,300);AU.sub(150,40,.25,.45*p);},
    dash(){AU.tone('sine',200,900,.25,.15);AU.fm(400,.5,2,.25,.06,0,1200);},
    charge(){AU.tone('sine',80,900,.9,.16);AU.tone('triangle',900,80,.9,.08);},
    spec(){AU.tone('sine',300,1000,.25,.14);AU.fm(600,2,1,.4,.06,.05);},
    ult(){AU.whistle(3000,400,1.6,.35);AU.sub(120,30,1.2,.5,.5);AU.fm(110,1.41,4,1.4,.12,.3,55);}},
  // BASTION: steel clangs and ringing armor
  metal:{thud:.7,
    swing(h){AU.noise(h?.3:.2,.35,'bandpass',260,1100,1.2);AU.clicks(3,.03,.04,900);},
    hit(p){AU.fm(420,1.41,4,.6,.18*p);AU.fm(1130,2.76,2,.4,.08*p);AU.noise(.06,.35*p,'highpass',3000,4000,1);AU.sub(110,50,.2,.4*p);},
    dash(){AU.noise(.3,.4,'lowpass',900,180,1);AU.clicks(4,.04,.05,700);AU.fm(300,1.41,2,.25,.06);},
    charge(){AU.fm(150,1.41,3,1,.16);AU.fm(450,2.76,1.5,1,.06);},
    spec(){AU.fm(220,1.41,5,1.1,.22);AU.fm(660,2.76,2,.8,.1);AU.noise(.08,.4,'highpass',2500,4000,1);},
    ult(){AU.fm(98,1.41,6,2.2,.28);AU.fm(196,2.76,3,1.8,.12);AU.sub(60,40,1.5,.5);}},
  // QUILL: glassy chimes and fluttering feathers
  crystal:{thud:.45,
    swing(h){AU.flutter(h?5:3,.1);AU.fm(2600,3.5,1,.25,.04);},
    hit(p){[2093,2637,3136].forEach((f,i)=>AU.fm(f,3.5,1.2,.4,.05*p,i*.02));AU.noise(.15,.25*p,'highpass',5000,8000,1);AU.crunch(.15*p);},
    dash(){AU.flutter(8,.12);AU.noise(.3,.2,'highpass',3000,8000,1);},
    charge(){[1047,1319,1568,2093].forEach((f,i)=>AU.fm(f,3.5,1,.6,.06,i*.12));AU.flutter(14,.08,.1);},
    spec(){AU.flutter(6,.14);[1568,2093].forEach((f,i)=>AU.fm(f,3.5,1,.4,.06,i*.05));},
    ult(){AU.flutter(24,.14);for(let i=0;i<8;i++)AU.fm(1047*Math.pow(1.122,i),3.5,1,.5,.05,.4+i*.12);}},
  // QUAKE: grinding gravel, cracking stone, earth rumble
  rock:{thud:1,
    swing(h){AU.noise(h?.32:.24,.4,'lowpass',700,160,1);AU.crunch(.08);},
    hit(p){AU.noise(.35,.55*p,'lowpass',800,70,1);AU.crunch(.35*p);AU.crunch(.25*p,.06);AU.sub(70,35,.3,.5*p);},
    dash(){AU.rock();AU.crunch(.12,.05);},
    charge(){AU.noise(1,.5,'lowpass',180,900,1);AU.growl(35,50,1,.15,0,6,200);AU.crunch(.15,.4);},
    spec(){AU.noise(1,.55,'lowpass',600,60,1);for(let i=0;i<6;i++)AU.crunch(.25,i*.1);AU.sub(60,30,.8,.5);},
    ult(){AU.sub(45,22,2,.9);AU.noise(2,.7,'lowpass',500,40,1);for(let i=0;i<10;i++)AU.crunch(.3,i*.15);}},
  // MARROW: wet flesh whips, squelches, bone cracks, gushing blood
  flesh:{thud:.4,
    swing(h,f){if(f&&f.bladeT>0){AU.noise(h?.18:.12,.35,'highpass',1800,5000,1.2);AU.tear(h?.14:.09,.12);AU.squelch(.16,.16,.04);}
      else{AU.noise(h?.3:.22,.3,'lowpass',1100,300,1.5);AU.tear(h?.2:.14,.1,.03);AU.noise(.02,.45,'highpass',2500,3500,1,h?.2:.14);AU.gurgle(3,.07,600,1600,.2,.05);}},
    hit(p,f){if(f&&f.bladeT>0){AU.noise(.05,.45*p,'highpass',2200,4000,1);AU.squelch(.22,.38*p,.01);AU.crunch(.22*p,.04);}
      else{AU.splat(.42*p);AU.squelch(.2,.25*p,.02);}if(p>1.2)AU.crunch(.3,.03);},
    dash(){AU.squelch(.28,.28);AU.gurgle(6,.08,400,1400,.3,.05);},
    charge(){AU.beat(.55);AU.beat(.6,.45);AU.gurgle(10,.08,300,1200,.9);AU.growl(55,45,.9,.12,0,18,400);},
    spec(){for(let i=0;i<4;i++)AU.crunch(.3,i*.06);AU.tear(.35,.18,.05);AU.squelch(.35,.35,.1);AU.beat(.45,.15);},
    ult(){AU.sub(70,30,.5,.8);AU.splat(.6);AU.noise(2.3,.5,'bandpass',500,350,1.5,.05);AU.noise(2.3,.3,'lowpass',900,300,1,.05);AU.gurgle(40,.12,250,1500,2.2,.05);
      for(let i=0;i<5;i++)AU.beat(.4,.1+i*.45);}},
  // ENTROPY: dry crumbling, hissing dust, disintegration
  decay:{thud:.5,
    swing(h){AU.noise(h?.3:.22,.25,'bandpass',3200,1400,2.5);AU.crackle(.25,.08,50);},
    hit(p){AU.noise(.45,.35*p,'bandpass',1500,250,1.4);AU.crackle(.5,.15*p,70,.03);AU.noise(.4,.15*p,'highpass',5000,3000,1,.05);},
    dash(){AU.noise(.45,.3,'bandpass',2200,350,2);AU.crackle(.4,.1,60);},
    charge(){AU.swell(1,.35,'bandpass',300,3000,2);AU.crackle(1,.12,60);},
    spec(){AU.noise(1,.5,'bandpass',800,120,1.3);AU.crackle(1,.18,80);AU.crunch(.2,.1);},
    ult(){AU.sub(55,25,1.8,.7);AU.noise(2,.6,'lowpass',1000,50,1);AU.crackle(2,.22,90);for(let i=0;i<6;i++)AU.crunch(.25,.1+i*.25);}},
  // SOVEREIGN: ominous minor chords, sucking pulls, a dark choir
  theft:{thud:.7,
    swing(h){AU.chord([110,131],.25,.05,'sawtooth',0,.6);AU.noise(.2,.2,'bandpass',800,300,3);},
    hit(p){AU.sub(110,50,.35,.45*p);AU.chord([220,262,311],.4,.05*p,'sawtooth',0,.5);},
    dash(){AU.swell(.25,.3,'bandpass',300,1500,2);AU.chord([147,175],.3,.04,'sawtooth',.2,.5);},
    charge(){[110,131,165].forEach(f=>AU.growl(f,f*1.01,1,.07,0,5,900));[700,1100].forEach(f=>AU.noise(1,.07,'bandpass',f,f,14));},
    spec(){AU.swell(.35,.35,'bandpass',2000,250,4);AU.chord([98,117,147],.45,.06,'sawtooth',.3,.5);},
    ult(){[55,65,82,98].forEach(f=>AU.growl(f,f,2.3,.08,0,4,800));[600,1000,1500].forEach(f=>AU.noise(2.2,.06,'bandpass',f,f*1.05,16));AU.sub(55,30,2,.5);}},
  // STROBE: camera shutters, ticks, rewinding film
  frame:{thud:.5,
    swing(h){AU.shutter(1);AU.noise(.1,.22,'highpass',2500,6000,1);},
    hit(p){AU.shutter(2);AU.tone('square',1800,900,.05,.12*p);AU.noise(.03,.3*p,'highpass',4000,7000,1,.06);},
    dash(){AU.clicks(8,.025,.06,1400);AU.tone('sawtooth',300,2400,.22,.05);},
    charge(){AU.clicks(16,.05,.05,1200);AU.tone('sine',400,1600,.9,.1);},
    spec(){AU.clicks(12,.018,.08,1600);AU.tone('square',2400,1200,.06,.1,.22);AU.noise(.04,.3,'highpass',4000,7000,1,.22);},
    ult(){for(let i=0;i<10;i++)AU.tone('square',2000,2000,.02,.1,i*.24);AU.clicks(30,.03,.05,1300,.3);AU.tone('sine',1600,200,1.2,.08,.6);}},
  // PYRE: hissing blue gas flame, whip cracks of fire
  bluefire:{thud:.55,
    swing(h){AU.noise(h?.32:.24,.4,'bandpass',2600,700,1.1);AU.noise(.2,.12,'highpass',5000,7000,1);},
    hit(p){AU.noise(.3,.5*p,'bandpass',2000,350,1);AU.noise(.25,.2*p,'highpass',5000,3500,1);AU.crackle(.25,.12*p,40);AU.sub(120,55,.2,.3*p);},
    dash(){AU.noise(.4,.5,'bandpass',3000,500,1);AU.noise(.4,.15,'highpass',6000,4000,1);},
    charge(){AU.swell(.9,.5,'bandpass',400,3500,1);AU.noise(.9,.15,'highpass',5000,7000,1);},
    spec(){AU.noise(.35,.4,'bandpass',2600,600,1);AU.noise(.02,.45,'highpass',3000,4500,1,.25);},
    ult(){AU.swell(.6,.5,'bandpass',300,2500,1);AU.noise(1.8,.6,'bandpass',1500,400,.8,.55);AU.noise(1.8,.2,'highpass',6000,4000,1,.55);AU.sub(60,30,1.4,.6,.55);}},
  // WARP: phasing swooshes, warbling portals
  portal:{thud:.5,
    swing(h){AU.noise(h?.3:.22,.3,'bandpass',2600,350,7);},
    hit(p){AU.fm(120,2.5,4,.25,.16*p,0,400);AU.noise(.22,.25,'bandpass',500,2000,6);},
    dash(){AU.swell(.18,.35,'bandpass',300,2400,5);AU.fm(800,.5,3,.2,.08,.17,200);},
    charge(){AU.noise(1,.35,'bandpass',100,1600,8);AU.fm(60,1.5,5,1,.14,0,40);},
    spec(){AU.swell(.3,.4,'bandpass',200,1500,4);AU.fm(200,1.5,6,.5,.14,.25,600);},
    ult(){AU.swell(.8,.5,'bandpass',100,900,3);AU.fm(45,1.5,8,1.6,.2,.2,30);AU.noise(1.4,.3,'bandpass',300,80,6,.6);}},
  // VOID: deep hums, implosions, starry shimmer
  void:{thud:.5,
    swing(h){AU.tone('sine',110,80,.28,.18);AU.tone('sine',220,160,.25,.07);AU.fm(1800,2,1,.2,.02);},
    hit(p){AU.swell(.12,.3*p,'lowpass',200,1600,1);AU.sub(60,25,.35,.6*p,.1);},
    dash(){AU.swell(.25,.3,'bandpass',2000,200,3);AU.tone('sine',400,70,.3,.18);},
    charge(){AU.sub(40,40,1,.45);for(let i=0;i<6;i++)AU.fm(1500+i*300,2,1,.3,.03,i*.14);},
    spec(){AU.sub(55,55,1.2,.4);AU.tone('sine',220,110,.5,.12);AU.fm(880,1.5,1,.8,.04);},
    ult(){AU.swell(1.2,.55,'lowpass',80,900,1);AU.sub(45,18,2,.8,1);for(let i=0;i<10;i++)AU.fm(1200+i*250,2,1,.4,.025,i*.1);}},
  // HEX: ghostly whispers and cursed chimes
  curse:{thud:.5,
    swing(h){AU.noise(.25,.22,'bandpass',3200,2400,6);AU.noise(.25,.06,'bandpass',900,800,18);},
    hit(p){AU.noise(.05,.5*p,'highpass',4000,7000,1);AU.tone('triangle',1900,800,.12,.12*p);AU.tone('triangle',1960,830,.14,.08*p);},
    dash(){AU.noise(.3,.28,'bandpass',4000,1500,4);[700,1150].forEach(f=>AU.noise(.3,.06,'bandpass',f,f*.8,18));},
    charge(){[300,700,1100,2400].forEach((f,i)=>AU.noise(1,.08,'bandpass',f,f*1.04,18,i*.04));AU.tone('sawtooth',55,52,1,.1);},
    spec(){AU.fm(1320,3.5,1.5,.6,.07);AU.fm(1245,3.5,1.5,.6,.05,.03);AU.noise(.4,.2,'bandpass',3600,1200,5);},
    ult(){AU.fm(110,1.41,5,2.2,.22);[600,950,1400].forEach((f,i)=>AU.noise(2,.07,'bandpass',f,f*1.05,18,i*.2));AU.tone('sawtooth',55,50,2,.1);}},
  // SCATHE: demonic growls, wet claw cuts
  demon:{thud:.6,
    swing(h){AU.noise(h?.3:.2,.38,'lowpass',900,180,1.2);AU.noise(.08,.25,'bandpass',2600,1800,4,.02);if(h)AU.growl(80,60,.3,.12,0,30,500);},
    hit(p){AU.noise(.05,.5*p,'highpass',3500,7000,1);AU.squelch(.16,.2*p,.02);AU.sub(110,40,.25,.5*p);},
    dash(){AU.noise(.35,.45,'lowpass',700,120,1);AU.growl(70,50,.25,.1,0,25,450);},
    charge(){AU.growl(36,52,1.1,.3,0,10,500);AU.growl(54,40,1.1,.2,0,13,400);AU.noise(1.1,.35,'lowpass',200,1200,1);},
    cut(){AU.noise(.045,.45,'highpass',4000,8000,1);AU.tone('triangle',2400,1400,.06,.08);AU.squelch(.1,.1,.03);},
    rend(){for(let i=0;i<5;i++)AU.noise(.05,.4,'highpass',3500,8000,1,i*.035);AU.growl(80,40,.5,.25,0,24,500);AU.noise(.6,.3,'lowpass',600,80,1,.05);},
    ult(){AU.growl(40,28,2.2,.4,0,7,600);AU.sub(45,22,2,.7);AU.fm(73,1.41,5,2,.12,.3);}},
  // RONIN: katana rings, clean slices
  blade:{thud:.5,
    swing(h){AU.noise(h?.22:.15,.35,'highpass',2500,7000,1.5);AU.fm(3400,1.41,.5,.2,.03);},
    hit(p){AU.noise(.06,.55*p,'highpass',3000,6000,1);AU.fm(2600,1.41,1,.4,.07*p);AU.sub(150,60,.12,.3*p);},
    dash(){AU.noise(.25,.4,'highpass',2000,8000,1);AU.fm(3200,1.41,.5,.35,.04);},
    charge(){AU.fm(3000,1.41,.6,1,.05);AU.noise(1,.22,'highpass',1500,5000,1);},
    spec(){AU.fm(2800,1.41,.8,.9,.07);AU.sub(70,45,.6,.4);AU.noise(.3,.2,'highpass',2000,6000,1);},
    ult(){for(let i=0;i<14;i++)AU.noise(.04,.35,'highpass',3500,8000,1,i*.11);AU.fm(2600,1.41,1,1.6,.06);}},
};
const HERO_SND={cinder:'fire',riptide:'water',gale:'wind',nitro:'blast',titan:'power',volta:'electric',umbra:'shadow',drift:'gravity',bastion:'metal',
  quill:'crystal',quake:'rock',marrow:'flesh',entropy:'decay',sovereign:'theft',strobe:'frame',pyre:'bluefire',warp:'portal',void:'void',hex:'curse',ronin:'blade',scathe:'demon'};
// a special keeps its own sound even when Sovereign steals it
const SPEC_SND={};
function specSnd(sp){if(!SPEC_SND[sp]&&typeof HEROES!=='undefined')HEROES.forEach(h=>{SPEC_SND[h.special]=HERO_SND[KIT(h,'elem')];});return SND[SPEC_SND[sp]];}
// loudness balance per sound type, measured offline so every fighter sits at a similar level
const SND_GAIN={"fire":{"hit":1.31,"charge":0.81,"spec":2.04,"ult":0.65},"water":{"swing":2.31,"dash":1.2,"charge":1.76},"wind":{"swing":5,"hit":1.77,"dash":2.5,"charge":4.29,"spec":5,"ult":5},"blast":{"swing":0.71,"hit":0.56,"dash":0.5,"spec":0.65},"power":{"swing":1.88,"hit":0.55,"dash":0.62,"spec":0.59,"ult":0.66},"electric":{"swing":1.76,"hit":0.82,"dash":1.67,"charge":1.43,"spec":0.5,"ult":1.63},"shadow":{"swing":3.0,"dash":1.5,"charge":1.88,"spec":1.41,"ult":1.39},"gravity":{"swing":1.43,"dash":1.5,"charge":1.3,"spec":3.93,"ult":1.55},"metal":{"swing":5,"hit":0.71,"dash":1.88,"charge":1.36},"crystal":{"swing":5,"hit":1.72,"dash":1.2,"charge":3.75,"spec":5,"ult":5},"rock":{"swing":2.31,"dash":1.3,"charge":2.73},"flesh":{"swing":0.5,"hit":1.45,"dash":2.14,"charge":0.71,"spec":1.28,"ult":0.75},"decay":{"swing":2.5,"hit":3.06,"dash":2.73,"charge":1.58,"spec":2.62},"theft":{"swing":5,"dash":2.5,"charge":1.58,"spec":5,"ult":1.67},"frame":{"swing":0.79,"hit":1.83,"dash":4.29,"charge":2.5,"spec":1.9,"ult":5},"bluefire":{"spec":1.57},"portal":{"swing":5,"hit":3.44,"dash":3.33,"charge":2.14,"spec":3.06,"ult":4.25},"void":{"swing":1.3,"dash":1.67,"charge":0.62},"curse":{"swing":5,"dash":3.0,"charge":3.0,"spec":5,"ult":2.93},"demon":{"swing":2.0,"hit":0.7,"dash":3.0},"blade":{"swing":0.71,"dash":0.7,"ult":1.81}};
function sfx(f,kind,a){const pk=HERO_SND[KIT(f.hero,'elem')],p=SND[pk];const th=p&&p.thud!=null?p.thud:1;
  const gk=kind==='spec'?((specSnd(a)&&SPEC_SND[a])||pk):pk,gv=(SND_GAIN[gk]&&SND_GAIN[gk][kind])||1,sv=AU.scale;AU.scale*=gv;try{sfx2(f,kind,a,p,th,gv);}finally{AU.scale=sv;}}
function sfx2(f,kind,a,p,th,gv){
  if(kind==='swing'){p?p.swing(a,f):AU.whoosh(a);}
  else if(kind==='hit'){AU.noise(.1,.3*a*th/gv,'lowpass',3000,300,1);AU.tone('sine',160,45,.16,.5*a*th/gv);if(a>1.2)AU.tone('sine',85,30,.4,.5*th/gv);if(p)p.hit(a,f);}
  else if(kind==='dash'){AU.noise(.16,.18,'highpass',800,4000,.8);if(p)p.dash(f);}
  else if(kind==='charge'){AU.charge(.6);if(p)p.charge(f);}
  else if(kind==='ult'){if(p&&p.ult)p.ult(f);}
  else if(kind==='spec'){const q=specSnd(a)||p;if(q&&q.spec)q.spec(f);else if(q===SND.demon)q.rend();}
  else if(kind==='jump'){AU.jump();}
}

