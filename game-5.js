function renderCodex(){
  const box=$("codexFamilies");if(!box)return;box.innerHTML="";
  for(const f of FAMILIES){
    const known=Array.from({length:8},(_,t)=>!!state.discovered[weaponKey(f.id,t)]).filter(Boolean).length;
    const sec=document.createElement("section");sec.className="codexFamily";sec.innerHTML=`<div class="codexFamilyHead"><b>${f.label}</b><span>${known}/8 scoperte</span></div><div class="codexRow"></div>`;
    const row=sec.querySelector(".codexRow");
    for(let t=0;t<8;t++){
      const found=!!state.discovered[weaponKey(f.id,t)],fake={family:f.id,tier:t,upgrade:0},el=document.createElement("div");el.className="codexItem"+(found?"":" locked");el.style.cssText=rarityStyle(t);
      el.innerHTML=`<div class="codexArt">${weaponSVG(fake)}</div><b>${found?f.names[t]:"????????"}</b><span>${rarity(t).code} · ${found?f.traits[t]:"non scoperta"}</span>`;row.appendChild(el)
    }
    box.appendChild(sec)
  }
}

function switchView(name){
  currentView=name;document.querySelectorAll(".view").forEach(v=>v.classList.toggle("active",v.id===`view-${name}`));document.querySelectorAll(".navBtn").forEach(b=>b.classList.toggle("active",b.dataset.view===name));$("detailSheet").classList.remove("open");
  if(name==="range"){renderRangeWeapon();ensureRangeLoop()}if(name==="codex")renderCodex()
}
document.querySelectorAll(".navBtn").forEach(b=>b.onclick=()=>switchView(b.dataset.view));

function renderRangeWeapon(){
  const item=state.items.find(i=>i.uid===state.rangeUid)||state.items[0];
  if(!item){$("rangeMiniArt").innerHTML="";$("rangeWeaponName").textContent="Nessuna arma";return}
  state.rangeUid=item.uid;const f=family(item.family),r=rarity(item.tier),s=calcStats(item);
  $("rangeMiniArt").innerHTML=weaponSVG(item);$("rangeRarity").textContent=`${r.name} · +${item.upgrade}`;$("rangeRarity").style.color=r.color;$("rangeWeaponName").textContent=f.names[item.tier];$("rangeWeaponMeta").textContent=`${f.class} · PWR ${s.power}`;
  if(!range||range.weaponUid!==item.uid)$("ammoText").textContent=s.mag?`${s.mag}/${s.mag}`:"∞";
}
$("rangeWeaponBtn").onclick=openRangePicker;
function openRangePicker(){
  const g=$("pickerGrid");g.innerHTML="";[...state.items].sort((a,b)=>calcStats(b).power-calcStats(a).power).forEach(item=>{
    const f=family(item.family),r=rarity(item.tier),b=document.createElement("button");b.className="pickerItem";b.style.cssText=rarityStyle(item.tier);
    b.innerHTML=`<div class="art">${weaponSVG(item)}</div><div><b>${f.names[item.tier]}</b><span>${r.code} · +${item.upgrade} · PWR ${calcStats(item).power}</span></div>`;
    b.onclick=()=>{state.rangeUid=item.uid;$("rangePicker").classList.add("hidden");renderRangeWeapon();save()};g.appendChild(b)
  });$("rangePicker").classList.remove("hidden")
}
$("closePicker").onclick=()=>$("rangePicker").classList.add("hidden");
