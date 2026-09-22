(() => {
"use strict";
const $=id=>document.getElementById(id),canvas=$("world"),ctx=canvas.getContext("2d"),wrap=$("worldWrap");
const GRID=11,SAVE_KEY="zolla_island_v5",LEGACY_SAVE_KEY="zolla_island_v4",clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
let W=900,H=600,DPR=1,baseTileW=78,baseTileH=39,tileW=78,tileH=39,originX=450,originY=100;
let selected=null,lastFrame=performance.now(),lastUi=0,toastTimer=0;
const camera={x:0,y:0,zoom:1.16,minZoom:.72,maxZoom:2.65};
const pointers=new Map();let gesture={drag:false,moved:false,startX:0,startY:0,camX:0,camY:0,lastDist:0,startZoom:1};
const cityEvents=[];let nextCityEventAt=performance.now()+2500;
const CITY_EVENT_TYPES=[
  {id:"harvest",icon:"◆",label:"Raccolto pronto",color:"#78a55f"},
  {id:"crate",icon:"▰",label:"Cassa trovata",color:"#9b754d"},
  {id:"merchant",icon:"●",label:"Mercante",color:"#d99c38"},
  {id:"gift",icon:"⬢",label:"Dono del borgo",color:"#986fa7"}
];


const TERRAIN={
 plains:{name:"Prato",top:"#9fbd72",side:"#6a824d",bonus:"Case +12%"},
 fertile:{name:"Terra fertile",top:"#b2bf70",side:"#7a8249",bonus:"Fattorie +50%"},
 forest:{name:"Bosco",top:"#739a66",side:"#4f6948",bonus:"Silvicoltura +55%"},
 rock:{name:"Roccia",top:"#8f9792",side:"#626a67",bonus:"Cave +60%"},
 coast:{name:"Costa",top:"#c7b57d",side:"#908157",bonus:"Porti e Pesca"}
};
const BUILDINGS={
 farm:{name:"Fattoria",icon:"◆",unlock:1,desc:"Produce soprattutto grano e un po' di cibo.",cost:{coins:80,wood:8},raw:{grain:1.02,food:.14},terrain:{fertile:1.5},adj:{windmill:.22,market:.04},specs:[{id:"orchard",name:"Frutteto",desc:"Raddoppia il cibo diretto.",effect:"food"},{id:"estate",name:"Tenuta cerealicola",desc:"+30% grano e piccole rendite.",effect:"grain"}]},
 lumber:{name:"Silvicoltura",icon:"♣",unlock:1,desc:"Produce legno per cantieri e Officine.",cost:{coins:95},raw:{wood:.82},terrain:{forest:1.55},adj:{workshop:.14},specs:[{id:"forester",name:"Foresta gestita",desc:"+40% legno.",effect:"raw"},{id:"resin",name:"Resine",desc:"Produce anche un po' di merci.",effect:"goods"}]},
 quarry:{name:"Cava",icon:"⬟",unlock:1,desc:"Produce pietra per edifici e Officine.",cost:{coins:110,wood:10},raw:{stone:.56},terrain:{rock:1.6},adj:{workshop:.14},specs:[{id:"deep",name:"Scavo profondo",desc:"+42% pietra.",effect:"raw"},{id:"masonry",name:"Scalpellini",desc:"Produce anche merci.",effect:"goods"}]},
 house:{name:"Casa",icon:"⌂",unlock:1,desc:"Aumenta popolazione e tasse.",cost:{coins:120,wood:18,stone:5},raw:{coins:.18},population:3,terrain:{plains:1.12},adj:{park:.16,market:.08,bakery:.06},specs:[{id:"apartments",name:"Appartamenti",desc:"+4 abitanti.",effect:"pop"},{id:"villa",name:"Ville",desc:"+30% tasse e +2 felicità.",effect:"tax"}]},
 windmill:{name:"Mulino",icon:"✣",unlock:2,desc:"Grano → farina. Vicino alle Fattorie lavora meglio.",cost:{coins:175,wood:22,stone:8},process:{inputs:{grain:.62},outputs:{flour:.50}},adj:{farm:.24,bakery:.12},aura:{types:["farm"],value:.10},specs:[{id:"millers",name:"Mastri mugnai",desc:"Aura sulle Fattorie raddoppiata.",effect:"aura"},{id:"finegrind",name:"Macinazione fine",desc:"+30% farina.",effect:"flour"}]},
 bakery:{name:"Panificio",icon:"♨",unlock:2,desc:"Farina → cibo. È il cuore della catena alimentare.",cost:{coins:210,wood:20,stone:10},process:{inputs:{flour:.38},outputs:{food:.82,coins:.10}},adj:{windmill:.24,market:.12,house:.06},specs:[{id:"breadline",name:"Forno comunitario",desc:"+38% cibo.",effect:"food"},{id:"patisserie",name:"Pasticceria",desc:"Meno cibo, molte più monete.",effect:"coins"}]},
 workshop:{name:"Officina",icon:"⚒",unlock:3,desc:"Legno + pietra → merci.",cost:{coins:280,wood:30,stone:18},process:{inputs:{wood:.22,stone:.12},outputs:{goods:.18}},adj:{lumber:.12,quarry:.12,market:.08},aura:{types:["lumber","quarry"],value:.08},specs:[{id:"factory",name:"Fabbrica",desc:"+35% merci, +15% consumi.",effect:"factory"},{id:"artisan",name:"Artigiani",desc:"+0,35 monete/s senza consumi.",effect:"artisan"}]},
 market:{name:"Mercato",icon:"▦",unlock:4,desc:"Cibo + merci → monete. Funziona meglio nei quartieri vivi.",cost:{coins:350,wood:25,stone:16},process:{inputs:{goods:.16,food:.10},outputs:{coins:1.55}},adj:{house:.13,park:.08,harbor:.12,bakery:.16,workshop:.16},specs:[{id:"bazaar",name:"Bazar",desc:"+35% ricavi.",effect:"bazaar"},{id:"wholesale",name:"Ingrosso",desc:"-25% consumo di input.",effect:"efficient"}]},
 park:{name:"Parco",icon:"✿",unlock:5,desc:"Aumenta felicità e valore dei quartieri.",cost:{coins:360,wood:20,stone:14},happiness:5,aura:{types:["house","market"],value:.10},specs:[{id:"botanical",name:"Orto botanico",desc:"+8 felicità extra.",effect:"happy"},{id:"plaza",name:"Piazza",desc:"Mercati adiacenti +20%.",effect:"plaza"}]},
 harbor:{name:"Porto",icon:"⚓",unlock:8,desc:"Cibo + merci → commercio marittimo.",cost:{coins:650,wood:55,stone:30},coastOnly:true,process:{inputs:{goods:.13,food:.09},outputs:{coins:2.15}},adj:{market:.16,workshop:.10,bakery:.08},specs:[{id:"fleet",name:"Flotta mercantile",desc:"+45% ricavi.",effect:"fleet"},{id:"fishery",name:"Pescherecci",desc:"Produce anche cibo.",effect:"fish"}]},
 monument:{name:"Monumento",icon:"✦",unlock:10,desc:"Prestigio, felicità e produttività globale.",cost:{coins:950,wood:35,stone:70},happiness:8,global:.025,specs:[{id:"garden",name:"Giardini",desc:"+10 felicità.",effect:"happy"},{id:"academy",name:"Accademia",desc:"+5% produzione globale.",effect:"global"}]}
};
const MISSIONS=[
 {title:"Costruisci una Fattoria",progress:s=>[countBuilding("farm"),1],reward:{coins:120}},
 {title:"Costruisci una Casa",progress:s=>[countBuilding("house"),1],reward:{wood:35,coins:80}},
 {title:"Costruisci un Mulino",progress:s=>[countBuilding("windmill"),1],reward:{coins:170,grain:12}},
 {title:"Costruisci un Panificio",progress:s=>[countBuilding("bakery"),1],reward:{coins:210,flour:8}},
 {title:"Raggiungi 12 abitanti",progress:s=>[population(),12],reward:{coins:240,stone:18}},
 {title:"Produci 5 merci",progress:s=>[s.resources.goods,5],reward:{coins:300}},
 {title:"Costruisci un Mercato",progress:s=>[countBuilding("market"),1],reward:{coins:440,food:20}},
 {title:"Espandi a 18 zolle",progress:s=>[s.tiles.filter(t=>t.unlocked).length,18],reward:{wood:60,stone:32}},
 {title:"Costruisci un Porto",progress:s=>[countBuilding("harbor"),1],reward:{coins:850,goods:20}}
];

function fmt(n){if(!Number.isFinite(n))n=0;if(n<1000)return n<10?n.toFixed(1).replace(".0",""):Math.floor(n).toLocaleString("it-IT");const u=["K","M","B","T"];let i=-1;while(n>=1000&&i<u.length-1){n/=1000;i++}return n.toFixed(n<10?1:0)+u[i]}
function hash(x,y){let n=(x*374761393+y*668265263)|0;n=(n^(n>>>13))*1274126177;return ((n^(n>>>16))>>>0)/4294967295}
function terrainFor(x,y){const n=hash(x+17,y-31);if(n<.20)return"fertile";if(n<.42)return"forest";if(n<.60)return"rock";if(n<.80)return"plains";return"coast"}
function defaultState(){const tiles=[];for(let y=0;y<GRID;y++)for(let x=0;x<GRID;x++){const dx=x-5,dy=y-5,unlocked=Math.abs(dx)<=1&&Math.abs(dy)<=1;tiles.push({x,y,unlocked,terrain:terrainFor(x,y),building:null,level:0,spec:null})}return{version:5,resources:{coins:420,food:30,grain:0,flour:0,wood:48,stone:24,goods:0},tiles,lastSave:Date.now(),happiness:68,totalEarned:0,totalBuilt:0,mission:0,claimed:0,jobs:{gather:0,civic:0,festival:0,salvage:0}}}
function load(){try{
  const raw=localStorage.getItem(SAVE_KEY)||localStorage.getItem(LEGACY_SAVE_KEY);
  if(!raw)return defaultState();
  const s=JSON.parse(raw),b=defaultState();
  s.version=5;s.resources={...b.resources,...s.resources};s.tiles=s.tiles||b.tiles;
  s.happiness=Number.isFinite(s.happiness)?s.happiness:68;s.mission=s.mission||0;
  s.jobs={...b.jobs,...(s.jobs||{})};
  for(const t of s.tiles){if(t.spec===undefined)t.spec=null;if(t.fxUntil===undefined)t.fxUntil=0}
  return s
}catch{return defaultState()}}
let state=load();
function tileAt(x,y){return state.tiles.find(t=>t.x===x&&t.y===y)}
function neighbors(t){return[[1,0],[-1,0],[0,1],[0,-1]].map(([dx,dy])=>tileAt(t.x+dx,t.y+dy)).filter(Boolean)}
function isFrontier(t){return!t.unlocked&&neighbors(t).some(n=>n.unlocked)}
function countBuilding(type){return state.tiles.filter(t=>t.unlocked&&t.building===type).length}
function distinctBuildings(){return new Set(state.tiles.filter(t=>t.building).map(t=>t.building)).size}
function totalLevels(){return state.tiles.reduce((s,t)=>s+(t.level||0),0)}
function townLevel(){return Math.max(1,1+Math.floor((totalLevels()+state.tiles.filter(t=>t.unlocked).length*.35+distinctBuildings()*1.5)/6))}
function population(){let n=3;for(const t of state.tiles){if(t.building!=="house")continue;n+=BUILDINGS.house.population+(t.level-1)*2+(t.spec==="apartments"?4:0)}return n}
function parkHappiness(){let n=0;for(const t of state.tiles){if(!t.building)continue;const d=BUILDINGS[t.building];n+=(d.happiness||0)*Math.max(1,t.level*.45);if(t.spec==="botanical"||t.spec==="garden")n+=8;if(t.spec==="villa")n+=2}return n}
function happinessTarget(){const pop=population(),food=state.resources.food;let h=56+parkHappiness();if(food>pop*4)h+=15;else if(food>pop*1.5)h+=7;else if(food<pop*.35)h-=28;else if(food<pop*.8)h-=12;const density=pop/Math.max(1,state.tiles.filter(t=>t.unlocked).length);if(density>2.8)h-=(density-2.8)*6;return clamp(h,15,100)}
function levelMul(l){return 1+Math.max(0,l-1)*.64}
function globalMul(){let m=.86+state.happiness*.0034;for(const t of state.tiles){if(t.building==="monument")m+=(BUILDINGS.monument.global||0)*t.level;if(t.spec==="academy")m+=.05}return m}
function terrainMul(t){const d=t.building&&BUILDINGS[t.building];return d?.terrain?.[t.terrain]||1}
function adjacencyMul(t){if(!t.building)return 1;const d=BUILDINGS[t.building],around=neighbors(t);let m=1;if(d.adj)for(const n of around)if(n.building&&d.adj[n.building])m+=d.adj[n.building];for(const n of around){if(!n.building)continue;const nd=BUILDINGS[n.building];if(nd.aura?.types.includes(t.building)){let a=nd.aura.value*n.level;if(n.spec==="millers"&&n.building==="windmill")a*=2;m+=a}if(n.spec==="plaza"&&t.building==="market")m+=.20}return m}
function specRawMul(t,r){if(t.spec==="orchard"&&r==="food")return 2.0;if(t.spec==="estate"&&r==="grain")return 1.30;if(t.spec==="forester"&&r==="wood")return 1.40;if(t.spec==="deep"&&r==="stone")return 1.42;if(t.spec==="villa"&&r==="coins")return 1.30;return 1}
function tileBaseMul(t){return levelMul(t.level)*terrainMul(t)*adjacencyMul(t)*globalMul()}
function rawRates(){const out={coins:0,food:0,grain:0,flour:0,wood:0,stone:0,goods:0};for(const t of state.tiles){if(!t.unlocked||!t.building)continue;const d=BUILDINGS[t.building],m=tileBaseMul(t);for(const[r,v]of Object.entries(d.raw||{}))out[r]+=v*m*specRawMul(t,r);if(t.spec==="estate")out.coins+=.14*levelMul(t.level);if(t.spec==="resin"||t.spec==="masonry")out.goods+=.07*levelMul(t.level);if(t.spec==="artisan")out.coins+=.35*levelMul(t.level);if(t.spec==="fishery")out.food+=.55*levelMul(t.level)}out.coins+=population()*.025*(.6+state.happiness/100*.65);return out}
function processDefs(t){const d=BUILDINGS[t.building];if(!d?.process)return null;const p=JSON.parse(JSON.stringify(d.process));if(t.spec==="factory"){for(const r in p.outputs)p.outputs[r]*=1.35;for(const r in p.inputs)p.inputs[r]*=1.15}if(t.spec==="artisan")return null;if(t.spec==="bazaar")for(const r in p.outputs)p.outputs[r]*=1.35;if(t.spec==="wholesale")for(const r in p.inputs)p.inputs[r]*=.75;if(t.spec==="fleet")for(const r in p.outputs)p.outputs[r]*=1.45;if(t.spec==="finegrind"&&t.building==="windmill")for(const r in p.outputs)p.outputs[r]*=1.30;if(t.spec==="breadline"&&t.building==="bakery")p.outputs.food*=1.38;if(t.spec==="patisserie"&&t.building==="bakery"){p.outputs.food*=.62;p.outputs.coins=(p.outputs.coins||0)+.62}return p}
function economyPreview(){const out=rawRates();const inputs={food:population()*.032,grain:0,flour:0,wood:0,stone:0,goods:0};const procOut={coins:0,food:0,grain:0,flour:0,wood:0,stone:0,goods:0};for(const t of state.tiles){if(!t.building)continue;const p=processDefs(t);if(!p)continue;const m=tileBaseMul(t);for(const[r,v]of Object.entries(p.inputs))inputs[r]=(inputs[r]||0)+v*m;for(const[r,v]of Object.entries(p.outputs))procOut[r]=(procOut[r]||0)+v*m}for(const r in procOut)out[r]=(out[r]||0)+procOut[r]-(inputs[r]||0);return out}
function simulateStep(dt){const raw=rawRates();for(const r in raw){state.resources[r]=(state.resources[r]||0)+raw[r]*dt;if(r==="coins")state.totalEarned+=raw[r]*dt}const foodNeed=population()*.032*dt;state.resources.food=Math.max(0,state.resources.food-foodNeed);for(const t of state.tiles){if(!t.unlocked||!t.building)continue;const p=processDefs(t);if(!p)continue;const m=tileBaseMul(t);let ratio=1;for(const[r,v]of Object.entries(p.inputs))ratio=Math.min(ratio,(state.resources[r]||0)/(v*m*dt||1));ratio=clamp(ratio,0,1);for(const[r,v]of Object.entries(p.inputs))state.resources[r]=Math.max(0,state.resources[r]-v*m*dt*ratio);for(const[r,v]of Object.entries(p.outputs)){const gain=v*m*dt*ratio;state.resources[r]=(state.resources[r]||0)+gain;if(r==="coins")state.totalEarned+=gain}}const target=happinessTarget(),speed=clamp(dt*.025,0,1);state.happiness+=(target-state.happiness)*speed}
function simulate(seconds){let left=seconds;while(left>0){const d=Math.min(15,left);simulateStep(d);left-=d}}
function canAfford(c){return Object.entries(c).every(([r,v])=>(state.resources[r]||0)>=v)}
function pay(c){if(!canAfford(c))return false;for(const[r,v]of Object.entries(c))state.resources[r]-=v;return true}
const symbols={coins:"●",food:"◆",grain:"♢",flour:"○",wood:"▰",stone:"⬟",goods:"⬢"};
const CHAIN_LINKS={
 "farm>windmill":{resource:"grain",color:"#c9a24f"},
 "windmill>bakery":{resource:"flour",color:"#d8cdb5"},
 "bakery>market":{resource:"food",color:"#75a263"},
 "bakery>harbor":{resource:"food",color:"#75a263"},
 "lumber>workshop":{resource:"wood",color:"#916a47"},
 "quarry>workshop":{resource:"stone",color:"#747e82"},
 "workshop>market":{resource:"goods",color:"#936fa2"},
 "workshop>harbor":{resource:"goods",color:"#936fa2"}
};
functio