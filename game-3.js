function sortedItems(){
  let arr=[...state.items];
  if(state.filter!=="all")arr=arr.filter(i=>rarity(i.tier).code===state.filter);
  if(state.sort==="power")arr.sort((a,b)=>calcStats(b).power-calcStats(a).power);
  else if(state.sort==="rarity")arr.sort((a,b)=>b.tier-a.tier||b.upgrade-a.upgrade);
  else arr.sort((a,b)=>b.obtained-a.obtained);
  return arr
}
function weaponCard(item){
  const f=family(item.family),r=rarity(item.tier),s=calcStats(item);
  const el=document.createElement("div");el.className="weapon-card"+(item.locked?" locked":"");el.dataset.uid=item.uid;el.dataset.tier=item.tier;el.style.cssText=rarityStyle(item.tier);
  el.innerHTML=`<div class="cardRarity">${r.code}</div><div class="cardArt">${weaponSVG(item)}</div><div class="cardInfo"><b>${f.names[item.tier]}</b><span>${f.class}</span><span class="powerLine">PWR ${s.power.toLocaleString("it-IT")}</span></div><div class="cardUpgrade">+${item.upgrade}</div>`;
  bindCardPointer(el,item);return el
}
function renderInventory(){
  const g=$("inventoryGrid");g.innerHTML="";const arr=sortedItems();
  arr.forEach(i=>g.appendChild(weaponCard(i)));
  $("inventoryCount").textContent=state.items.length;$("emptyArmory").classList.toggle("hidden",state.items.length>0);
}
function updateTop(){
  $("credits").textContent=fmt(state.credits);$("scrap").textContent=fmt(state.scrap);
  $("packMeter").style.width=clamp(state.packProgress,0,100)+"%";
  $("packStatus").textContent=state.packTokens>0?`${state.packTokens} PRONTO`:Math.floor(state.packProgress)+"%";
  $("packTokens").textContent=state.packTokens;
  $("packNavBadge").classList.toggle("hidden",state.packTokens<=0);$("packNavBadge").textContent=state.packTokens;
  const lv=1+Math.floor((state.collectorXp||0)/100);$("collectorLevel").textContent=`COLLEZIONISTA Lv. ${lv}`;
  $("codexCount").textContent=`${Object.keys(state.discovered).length}/64`;
}
function renderAll(){updateTop();renderInventory();renderCodex();renderRangeWeapon();save()}

function bindCardPointer(el,item){
  el.addEventListener("pointerdown",e=>{
    if(e.button!==undefined&&e.button!==0)return;
    drag.candidate=item;drag.dragging=false;drag.startX=e.clientX;drag.startY=e.clientY;drag.sourceEl=el;el.setPointerCapture?.(e.pointerId)
  });
  el.addEventListener("pointermove",e=>{
    if(!drag.candidate||drag.candidate.uid!==item.uid)return;
    if(!drag.dragging&&Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)>9)startDrag(item,el,e);
    if(drag.dragging)moveGhost(e.clientX,e.clientY)
  });
  el.addEventListener("pointerup",e=>{
    if(!drag.candidate||drag.candidate.uid!==item.uid)return;
    if(drag.dragging)finishDrag(e.clientX,e.clientY,item);else openDetail(item.uid);
    clearDrag()
  });
  el.addEventListener("pointercancel",clearDrag)
}
function startDrag(item,el,e){
  drag.dragging=true;el.classList.add("drag-source");
  const ghost=el.cloneNode(true);ghost.classList.add("dragGhost");ghost.style.width=Math.min(130,el.getBoundingClientRect().width)+"px";document.body.appendChild(ghost);drag.ghost=ghost;moveGhost(e.clientX,e.clientY);
  document.querySelectorAll(".weapon-card").forEach(c=>{
    const other=state.items.find(i=>i.uid===c.dataset.uid);
    if(other&&other.uid!==item.uid&&canMerge(item,other))c.classList.add("valid-target")
  })
}
function moveGhost(x,y){if(drag.ghost){drag.ghost.style.left=x+"px";drag.ghost.style.top=y+"px"}}
function finishDrag(x,y,item){
  if(item.locked){showToast("Sblocca l'arma prima di fonderla");return}
  drag.ghost?.remove();drag.ghost=null;
  if(drag.sourceEl)drag.sourceEl.style.display="none";
  const targetEl=document.elementFromPoint(x,y)?.closest?.(".weapon-card");
  if(drag.sourceEl)drag.sourceEl.style.display="";
  if(!targetEl)return;
  const other=state.items.find(i=>i.uid===targetEl.dataset.uid);
  if(other&&other.uid!==item.uid){
    if(canMerge(item,other))mergeItems(item.uid,other.uid,true);
    else showToast("Servono due armi identiche")
  }
}
function clearDrag(){
  drag.ghost?.remove();document.querySelectorAll(".weapon-card").forEach(c=>c.classList.remove("valid-target","drag-source"));
  drag={candidate:null,dragging:false,startX:0,startY:0,ghost:null,sourceEl:null}
}
function canMerge(a,b){return !a.locked&&!b.locked&&a.family===b.family&&a.tier===b.tier&&a.tier<7}
function mergeItems(aUid,bUid,fx=true){
  const a=state.items.find(i=>i.uid===aUid),b=state.items.find(i=>i.uid===bUid);if(!a||!b||!canMerge(a,b))return false;
  const newUp=Math.min(10,Math.floor((a.upgrade+b.upgrade)/2)+((a.upgrade+b.upgrade)>0?1:0));
  const out=newItem(a.family,a.tier+1,newUp);const wasNew=!state.discovered[weaponKey(out.family,out.tier)];
  state.items=state.items.filter(i=>i.uid!==aUid&&i.uid!==bUid);state.items.push(out);markDiscovered(out);
  state.merges++;state.scrap+=2+(a.tier+1)*2;state.collectorXp+=8+(a.tier*3);addPackProgress(12+a.tier*3);
  if(fx){showMerge(out);buzz(45)}if(wasNew)showToast("Nuova arma scoperta");
  state.selectedUid=out.uid;renderAll();return true
}
function autoMerge(){
  let count=0,changed=true;
  while(changed){
    changed=false;const map=new Map();
    for(const i of state.items){
      if(i.locked||i.tier>=7)continue;
      const k=weaponKey(i.family,i.tier);
      if(map.has(k)){const a=map.get(k);if(mergeItems(a.uid,i.uid,false)){count++;changed=true;break}}else map.set(k,i)
    }
  }
  if(count){showToast(`${count} fusion${count===1?"e":"i"} completat${count===1?"a":"e"}`);showMerge(state.items[state.items.length-1]);buzz([30,40,30])}
  else showToast("Nessuna coppia identica disponibile");
  renderAll()
}
$("autoMergeBtn").onclick=autoMerge;

function showMerge(item){
  const box=$("mergeBurst"),f=family(item.family),r=rarity(item.tier);$("mergeBurstName").textContent=`${r.code} · ${f.names[item.tier]}`;box.classList.remove("hidden");box.style.color=r.color;
  setTimeout(()=>box.classList.add("hidden"),900)
}

function addPackProgress(n){
  state.packProgress+=n;
  while(state.packProgress>=100){state.packProgress-=100;state.packTokens++;showToast("Pacchetto misterioso ottenuto")}
}
function rollTier(){
  const x=Math.random()*100;let acc=0;
  for(let i=0;i<RARITIES.length;i++){acc+=RARITIES[i].odds;if(x<acc)return i}return 0
}
function rollWeapon(){
  const tier=rollTier(),fam=FAMILIES[Math.floor(Math.random()*FAMILIES.length)].id;
  return newItem(fam,tier,0)
}
function openPack(){
  if(state.packTokens<=0){showToast("Nessun pacchetto pronto");return}
  state.packTokens--;$("packWrapper").classList.add("shake");buzz([25,35,25]);
  setTimeout(()=>{
    $("packWrapper").classList.remove("shake");
    packSession=Array.from({length:5},()=>{const item=rollWeapon();const isNew=!state.discovered[weaponKey(item.family,item.tier)];state.items.push(item);markDiscovered(item);return{item,revealed:false,isNew}});
    $("packStage").classList.add("hidden");$("revealArea").classList.remove("hidden");$("openPackBtn").disabled=true;renderPackCards();renderAll()
  },520)
}
function renderPackCards(){
  const g=$("packCards");g.innerHTML="";
  packSession?.forEach((p,idx)=>{
    const item=p.item,f=family(item.family),r=rarity(item.tier),el=document.createElement("div");el.className="packCard"+(p.revealed?" revealed":"");el.style.cssText=rarityStyle(item.tier);
    el.innerHTML=`<div class="packCardInner"><div class="packFace packBack">◇</div><div class="packFace packFront">${p.isNew?'<span class="newBadge">NUOVA</span>':""}<div class="rarityReveal">${r.name}</div><div class="revealArt">${weaponSVG(item)}</div><b>${f.names[item.tier]}</b><small>${f.class}</small></div></div>`;
    el.onclick=()=>revealCard(idx);g.appendChild(el)
  });
  const all=packSession?.every(p=>p.revealed);$("packDoneBtn").classList.toggle("hidden",!all);$("revealAllBtn").style.visibility=all?"hidden":"visible"
}
function revealCard(idx){
  const p=packSession?.[idx];if(!p||p.revealed)return;p.revealed=true;const r=rarity(p.item.tier);state.collectorXp+=4+p.item.tier*2;
  if(p.item.tier>=5)buzz([20,40,20,60]);else buzz(20);renderPackCards();updateTop();save()
}
$("openPackBtn").onclick=openPack;
$("revealAllBtn").onclick=()=>{packSession?.forEach(p=>p.revealed=true);renderPackCards();buzz(40)};
$("packDoneBtn").onclick=()=>{packSession=null;$("revealArea").classList.add("hidden");$("packStage").classList.remove("hidden");$("openPackBtn").disabled=false;switchView("armory")};

function tickFreePack(){
  const now=Date.now();
  if(now>=state.nextFreePack){state.packTokens++;state.nextFreePack=now+180000;showToast("Pacchetto gratuito disponibile");updateTop();save()}
  const sec=Math.max(0,Math.ceil((state.nextFreePack-now)/1000)),m=String(Math.floor(sec/60)).padStart(2,"0"),s=String(sec%60).padStart(2,"0");
  $("freePackTimer").textContent=`Prossimo gratuito tra ${m}:${s}`
}
setInterval(tickFreePack,1000);tickFreePack();

