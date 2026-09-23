function initRangeSession(){
  const item=state.items.find(i=>i.uid===state.rangeUid);if(!item)return null;const s=calcStats(item);
  return{weaponUid:item.uid,running:false,start:0,duration:20000,score:0,hits:0,shots:0,damage:0,lastShot:0,lastSpawn:0,ammo:s.mag||999,reloadingUntil:0,crossX:.5,crossY:.5,targets:[],tracers:[],impacts:[]}
}
function startRange(){
  if(!state.items.length){openRangePicker();return}
  range=initRangeSession();range.running=true;range.start=performance.now();$("rangeResult").classList.add("hidden");$("startRangeBtn").textContent="TEST IN CORSO";$("startRangeBtn").disabled=true;ensureRangeLoop();buzz(30)
}
$("startRangeBtn").onclick=startRange;
function ensureRangeLoop(){if(!rangeRAF){lastRangeFrame=performance.now();rangeRAF=requestAnimationFrame(rangeLoop)}}
function rangeLoop(now){
  const canvas=$("rangeCanvas"),rect=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,1.5),w=Math.max(300,Math.round(rect.width*dpr)),h=Math.max(260,Math.round(rect.height*dpr));
  if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}
  const ctx=canvas.getContext("2d"),dt=Math.min(.033,(now-lastRangeFrame)/1000);lastRangeFrame=now;
  drawRange(ctx,w,h,now,dt);
  if(currentView==="range")rangeRAF=requestAnimationFrame(rangeLoop);else rangeRAF=null
}
function drawRange(ctx,w,h,now,dt){
  const g=ctx.createLinearGradient(0,0,0,h);g.addColorStop(0,"#17202b");g.addColorStop(.55,"#0c1118");g.addColorStop(1,"#090c11");ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
  ctx.strokeStyle="#25303c";ctx.lineWidth=1;for(let y=h*.42;y<h;y+=h*.09){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke()}for(let x=0;x<w;x+=w*.12){ctx.beginPath();ctx.moveTo(w/2,h*.35);ctx.lineTo(x,h);ctx.stroke()}
  ctx.fillStyle="#263544";ctx.fillRect(0,h*.36,w,h*.035);
  if(!range){ctx.fillStyle="#8b98a9";ctx.textAlign="center";ctx.font=`${14*(devicePixelRatio||1)}px system-ui`;ctx.fillText("Scegli un'arma e avvia il test",w/2,h/2);return}
  const item=state.items.find(i=>i.uid===range.weaponUid),s=item?calcStats(item):null;if(!s)return;
  if(range.running){
    const remain=range.duration-(now-range.start);if(remain<=0){endRange();return}
    if(now-range.lastSpawn>650&&range.targets.length<5){spawnTarget(w,h,item);range.lastSpawn=now}
    for(const t of range.targets){t.x+=t.vx*dt;t.y+=t.vy*dt;if(t.x<t.r||t.x>w-t.r)t.vx*=-1;if(t.y<h*.43+t.r||t.y>h*.86)t.vy*=-1}
    range.targets=range.targets.filter(t=>t.hp>0);
    if(fireHeld)fireRange(now,w,h);
    if(range.reloadingUntil&&now>=range.reloadingUntil){range.ammo=s.mag||999;range.reloadingUntil=0;showToast("Caricata")}
  }
  for(const t of range.targets){
    ctx.fillStyle="#0b1017";ctx.strokeStyle=t.color;ctx.lineWidth=5;ctx.beginPath();ctx.arc(t.x,t.y,t.r,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.strokeStyle="#ffffff33";ctx.lineWidth=2;ctx.beginPath();ctx.arc(t.x,t.y,t.r*.55,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.arc(t.x,t.y,t.r*.18,0,Math.PI*2);ctx.stroke();
    ctx.fillStyle="#24303b";ctx.fillRect(t.x-t.r*.7,t.y+t.r+7,t.r*1.4,4);ctx.fillStyle=t.color;ctx.fillRect(t.x-t.r*.7,t.y+t.r+7,t.r*1.4*clamp(t.hp/t.maxHp,0,1),4)
  }
  range.tracers=range.tracers.filter(tr=>now-tr.t<110);for(const tr of range.tracers){ctx.globalAlpha=1-(now-tr.t)/110;ctx.strokeStyle=tr.c;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(w*.5,h);ctx.lineTo(tr.x,tr.y);ctx.stroke()}ctx.globalAlpha=1;
  range.impacts=range.impacts.filter(p=>now-p.t<300);for(const p of range.impacts){ctx.globalAlpha=1-(now-p.t)/300;ctx.fillStyle=p.c;ctx.beginPath();ctx.arc(p.x,p.y,3+(now-p.t)*.03,0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1;
  positionCrosshair();
  $("rangeScore").textContent=Math.floor(range.score);$("rangeAccuracy").textContent=range.shots?Math.round(range.hits/range.shots*100)+"%":"0%";
  $("rangeTime").textContent=range.running?Math.max(0,(range.duration-(now-range.start))/1000).toFixed(1):"20.0";
  $("ammoText").textContent=s.mag?(range.reloadingUntil?"RIC":`${range.ammo}/${s.mag}`):"∞";
}
function spawnTarget(w,h,item){
  const tier=item.tier,r=(26+Math.random()*18)*(devicePixelRatio||1),hp=calcStats(item).damage*(1.4+tier*.22);
  range.targets.push({x:r+Math.random()*(w-r*2),y:h*.46+Math.random()*h*.34,r,vx:(Math.random()-.5)*w*.12,vy:(Math.random()-.5)*h*.05,hp,maxHp:hp,color:["#ff687d","#69d9ff","#ffd268","#8cff9e"][Math.floor(Math.random()*4)]})
}
function positionCrosshair(){
  const frame=$("rangeCanvas").getBoundingClientRect(),c=$("crosshair");c.style.left=(range.crossX*100)+"%";c.style.top=(range.crossY*100)+"%"
}
function fireRange(now,w,h){
  if(!range?.running)return;const item=state.items.find(i=>i.uid===range.weaponUid);if(!item)return;const f=family(item.family),s=calcStats(item);
  if(range.reloadingUntil)return;if(s.mag&&range.ammo<=0){reloadRange(now);return}
  const delay=60000/s.rpm;if(now-range.lastShot<delay)return;range.lastShot=now;range.shots++;if(s.mag)range.ammo--;
  const pellets=s.pellets||1;let anyHit=false;
  for(let p=0;p<pellets;p++){
    const spread=(100-s.accuracy)/100*(f.id==="shotgun"?.12:.055),ax=clamp(range.crossX+(Math.random()-.5)*spread,0,1),ay=clamp(range.crossY+(Math.random()-.5)*spread,0,1),x=ax*w,y=ay*h;
    range.tracers.push({x,y,t:now,c:rarity(item.tier).color});
    let hit=null,best=1e9;for(const t of range.targets){const d=Math.hypot(x-t.x,y-t.y);if(d<t.r&&d<best){best=d;hit=t}}
    if(hit){
      const center=1-clamp(best/hit.r,0,1),dmg=s.damage*(.72+center*.55)/(pellets>1?1:1);hit.hp-=dmg;range.damage+=dmg;anyHit=true;range.impacts.push({x,y,t:now,c:rarity(item.tier).color});
      if(hit.hp<=0)range.score+=80+item.tier*25+Math.round(center*55);else range.score+=Math.round(dmg*.8)
    }
  }
  if(anyHit)range.hits++;buzz(8)
}
function reloadRange(now=performance.now()){
  if(!range?.running)return;const item=state.items.find(i=>i.uid===range.weaponUid),s=item?calcStats(item):null;if(!s||!s.mag||range.reloadingUntil)return;
  range.reloadingUntil=now+s.reload*1000;showToast("Ricarica…")
}
$("reloadBtn").onclick=()=>reloadRange();
$("fireBtn").addEventListener("pointerdown",e=>{e.preventDefault();fireHeld=true;if(range){const c=$("rangeCanvas");fireRange(performance.now(),c.width,c.height)}});
["pointerup","pointercancel","pointerleave"].forEach(ev=>$("fireBtn").addEventListener(ev,()=>fireHeld=false));
const rc=$("rangeCanvas");
rc.addEventListener("pointerdown",e=>{const r=rc.getBoundingClientRect();if(range){range.crossX=clamp((e.clientX-r.left)/r.width,0,1);range.crossY=clamp((e.clientY-r.top)/r.height,0,1)}});
rc.addEventListener("pointermove",e=>{if(e.buttons||e.pointerType==="touch"){const r=rc.getBoundingClientRect();if(range){range.crossX=clamp((e.clientX-r.left)/r.width,0,1);range.crossY=clamp((e.clientY-r.top)/r.height,0,1)}}});
function endRange(){
  if(!range?.running)return;range.running=false;fireHeld=false;$("startRangeBtn").disabled=false;$("startRangeBtn").textContent="RIPETI TEST";
  const credits=100+Math.floor(range.score*1.3),scrap=12+Math.floor(range.score/45),pack=Math.min(42,12+range.score/90);
  state.credits+=credits;state.scrap+=scrap;state.totalTests++;state.totalDamage+=range.damage;state.collectorXp+=12;addPackProgress(pack);
  $("rangeResult").innerHTML=`<h3>Test completato · ${Math.floor(range.score)} punti</h3><p>Ricompensa: ◈ ${credits} crediti · ✦ ${scrap} nuclei · +${Math.floor(pack)}% progresso pacchetto. Precisione ${range.shots?Math.round(range.hits/range.shots*100):0}%.</p>`;$("rangeResult").classList.remove("hidden");renderAll()
}
