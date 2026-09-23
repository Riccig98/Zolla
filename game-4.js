function openDetail(uidv){
  const item=state.items.find(i=>i.uid===uidv);if(!item)return;state.selectedUid=uidv;
  const f=family(item.family),r=rarity(item.tier),s=calcStats(item),nextCost=upgradeCost(item);
  const pct=(v,max)=>clamp(v/max*100,3,100);
  const stat=(label,val,max,suffix="")=>`<div class="statBox"><div class="statTop"><span>${label}</span><b>${val}${suffix}</b></div><div class="statBar"><i style="width:${pct(val,max)}%"></i></div></div>`;
  $("detailContent").innerHTML=`<div class="detailHero" style="${rarityStyle(item.tier)}"><div class="detailArt">${weaponSVG(item)}</div><div class="detailMeta"><span class="rarity">${r.name} · ${f.class}</span><h2>${f.names[item.tier]}</h2><p>${f.desc}</p><span class="traitTag">${f.traits[item.tier]}</span></div></div>
    <div class="detailPower"><span>POTENZA COMPLESSIVA</span><b>${s.power.toLocaleString("it-IT")}</b></div>
    <div class="statsGrid">${stat("Danno",s.damage,500)}${stat("Cadenza",s.rpm,900," rpm")}${stat("Precisione",s.accuracy,100,"%")}${stat("Portata",s.range,100,"%")}${stat("Maneggevolezza",s.handling,100,"%")}${stat("Caricatore",s.mag||1,70,s.mag?"":" —")}</div>
    <div class="upgradeBlock"><div class="upgradeHead"><b>UPGRADE INDIVIDUALE</b><span>+${item.upgrade}/10</span></div><div class="upgradePips">${Array.from({length:10},(_,i)=>`<i class="${i<item.upgrade?"on":""}"></i>`).join("")}</div><div style="font-size:8px;color:#8995a7">${item.upgrade>=10?"Potenziale massimo raggiunto":`Costo: ◈ ${fmt(nextCost.credits)} · ✦ ${nextCost.scrap}`}</div></div>
    <div class="detailActions"><button id="upgradeWeaponBtn" class="upgradeBtn" ${item.upgrade>=10||state.credits<nextCost.credits||state.scrap<nextCost.scrap?"disabled":""}>POTENZIA</button><button id="tryWeaponBtn" class="tryBtn">PROVA ARMA</button><button id="lockWeaponBtn" class="lockBtn">${item.locked?"◆":"◇"}</button></div>`;
  $("detailSheet").classList.add("open");
  $("upgradeWeaponBtn").onclick=()=>upgradeWeapon(uidv);
  $("tryWeaponBtn").onclick=()=>{state.rangeUid=uidv;$("detailSheet").classList.remove("open");switchView("range");renderRangeWeapon()};
  $("lockWeaponBtn").onclick=()=>{item.locked=!item.locked;save();renderInventory();openDetail(uidv)}
}
$("closeSheet").onclick=()=>$("detailSheet").classList.remove("open");
function upgradeCost(item){const n=item.upgrade+1;return{credits:Math.ceil(60*(item.tier+1)*Math.pow(n,1.32)),scrap:Math.ceil(3.5*(item.tier+1)*n)}}
function upgradeWeapon(uidv){
  const item=state.items.find(i=>i.uid===uidv);if(!item||item.upgrade>=10)return;const c=upgradeCost(item);if(state.credits<c.credits||state.scrap<c.scrap)return;
  state.credits-=c.credits;state.scrap-=c.scrap;item.upgrade++;state.collectorXp+=5;addPackProgress(4);buzz(35);showToast(`${family(item.family).names[item.tier]} +${item.upgrade}`);renderAll();openDetail(uidv)
}

$("sortBtn").onclick=()=>{
  const order=["power","rarity","new"];state.sort=order[(order.indexOf(state.sort)+1)%order.length];
  $("sortBtn").textContent=`ORDINA: ${state.sort==="power"?"POTENZA":state.sort==="rarity"?"RARITÀ":"RECENTI"}`;renderInventory();save()
};
$("filterBtn").onclick=()=>{
  const opts=["all","C","U","R","E","L","S","SS","SSS"];state.filter=opts[(opts.indexOf(state.filter)+1)%opts.length];
  $("filterBtn").textContent=state.filter==="all"?"TUTTE LE RARITÀ":`RARITÀ ${state.filter}`;renderInventory();save()
};
