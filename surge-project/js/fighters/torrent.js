/* TORRENT — a towering powerhouse whose whole style is raw energy OUTPUT: huge steerable beams and rapid finger-gun shots.
   Original design (dark high-collared long coat, tall pompadour, blue-white energy); credited in credits.js as inspired by
   Ryu Ishigori from Jujutsu Kaisen by Gege Akutami.
     1  OUTPUT CANNON   a huge beam you can steer (hold to charge it bigger)      2  FINGER GUNS  rapid energy shots
     3  OVERFLOW        energy bursts out all around him                           4  POINT BLANK  a blast that throws everything in front away
     Q  MAXIMUM OUTPUT  a colossal, long beam — strongest in beam clashes          Q+back  SATURATION FIRE  energy shots rain over an area
   Built on the ability engine (abilities.js), so his beams steer and clash like every other beam (beams.js). */
const TQ=0x4ab0ff,TW=0xe8f6ff;
(function(){const h=HEROES.find(x=>x.id==='torrent');if(!h)return;
  const ab=o=>sanitizeAbil(Object.assign({colors:[TQ,TW]},o));
  h.cab={sp:ab({name:'OUTPUT CANNON',form:'beam',style:'spirit',shape:'orb',size:1.7,range:30,dur:1.25,power:1.15,fx:['push']}),
    spAlt:ab({name:'FINGER GUNS',form:'volley',style:'spirit',shape:'bullet',count:7,speed:52,size:.8,power:.95,fx:['pierce']}),
    ult:ab({name:'MAXIMUM OUTPUT',form:'beam',style:'spirit',shape:'orb',size:2.2,range:36,dur:3,power:1.5,fx:['push','launch']}),
    ultAlt:ab({name:'SATURATION FIRE',form:'rain',style:'spirit',shape:'bullet',count:12,size:1.1,range:16,power:1.25,fx:['explode']})};
  h.specCD=cabSpecTime(h.cab.sp);
  h._xm=[ab({name:'OVERFLOW',form:'burst',style:'spirit',shape:'ring',size:1.4,power:1.05,fx:['push']}),ab({name:'POINT BLANK',form:'burst',style:'explosion',shape:'orb',size:1.6,power:1.2,fx:['push','launch']})];
  Object.assign(HERO_SND,{torrent:'power'});Object.assign(DULT_OF,{torrent:'barrage'});
  if(typeof PROJ_SIG!=='undefined')PROJ_SIG.torrent='bullet';
  if(typeof TRAIT_DESC!=='undefined')TRAIT_DESC.torrent='raw output: his beams win clashes more easily';
  setTimeout(()=>{try{VCRY.torrent=[['Maximum output!',0],['Let\'s see you handle THIS!',-.04]];}catch(e){}},0);
  // his punch combo: heavy finger-gun jabs into a point-blank command blast
  UATK.torrent={c:'jR jR pa cm',h:'cm',fx:'spirit'};
  const toks=UATK.torrent.c.split(' '),raw=toks.reduce((s,t)=>s+TPL[t].dmg,0),k=15/raw*1.08;
  toks.forEach((t,i)=>{const M=Object.assign({},TPL[t]);M.dmg=+(M.dmg*k).toFixed(1);const last=i===toks.length-1;
    if(last){M.launch=true;M.heavy=true;M.kb=Math.max(M.kb,9);M.up=Math.max(M.up,5);}else{delete M.launch;delete M.heavy;delete M.shock;M.kb=Math.min(M.kb,4);M.up=Math.min(M.up,2);M.next='u_torrent_'+(i+1);}
    MOVES['u_torrent_'+i]=M;});
  const H=Object.assign({},TPL.cm);H.dmg=13;H.rng=4;H.launch=true;H.heavy=true;H.kb=13;H.vfx=2;MOVES.u_torrent_H=H;
  // his second mode, FULL THROTTLE, is in the FORMS table (forms.js)
  if(typeof UO!=='undefined')UO.torrent=(f,t,c)=>{if(uo1(f,'a'))aura(f,TQ,TW,1.2);uoSwirl(f,c,TQ,TW,5,ADD);if(uo1(f,'r',.5))ring(c,TW,4,.3,false,2.6);};})();
