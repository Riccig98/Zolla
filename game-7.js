function updateFilterLabels(){
  $("sortBtn").textContent=`ORDINA: ${state.sort==="power"?"POTENZA":state.sort==="rarity"?"RARITÀ":"RECENTI"}`;
  $("filterBtn").textContent=state.filter==="all"?"TUTTE LE RARITÀ":`RARITÀ ${state.filter}`
}
addEventListener("beforeunload",save);
setInterval(save,5000);
updateFilterLabels();renderAll();switchView("armory");
