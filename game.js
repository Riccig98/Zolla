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
function chainLabel(t){ const m={farm:"Grano → Mulino",windmill:"Grano → Farina",bakery:"Farina → Cibo",lumber:"Legno → Officina",quarry:"Pietra → Officina",workshop:"Legno + Pietra → Merci",market:"Cibo + Merci → Monete",harbor:"Cibo + Merci → Commercio",house:"Cibo → Abitanti + tasse",park:"Supporto → Quartiere",monument:"Prestigio → Produzione globale"};
 return m[t.building]||"Supporto al borgo"
}
function chainBetween(a,b){
 let d=CHAIN_LINKS[`${a.building}>${b.building}`];if(d)return{from:a,to:b,...d};
 d=CHAIN_LINKS[`${b.building}>${a.building}`];if(d)return{from:b,to:a,...d};
 return null
}
function activityFor(t){
 const p=processDefs(t);if(!p)return 1;let q=1;
 for(const[r,v]of Object.entries(p.inputs))q=Math.min(q,(state.resources[r]||0)/Math.max(.5,v*4));
 return clamp(q,0,1)
}
function costText(c){return Object.entries(c).filter(([,v])=>v>0).map(([r,v])=>`${symbols[r]||r} ${fmt(v)}`).join(" · ")}
function missingText(c){const m=Object.entries(c).filter(([r,v])=>(state.resources[r]||0)<v).map(([r,v])=>`${symbols[r]||r} ${fmt(Math.ceil(v-(state.resources[r]||0)))}`);return m.join(" · ")}
function efficiencyPct(t){return Math.round((terrainMul(t)*adjacencyMul(t)-1)*100)}
function productionStatus(t){const p=processDefs(t);if(!p)return "Attiva";const lacking=Object.entries(p.inputs).filter(([r,v])=>(state.resources[r]||0)<Math.max(1,v*5)).map(([r])=>r);return lacking.length?`Scorte basse: ${lacking.join(", ")}`:"Attiva"}

function buildCost(type){const d=BUILDINGS[type],scale=1+countBuilding(type)*.16,o={};for(const[r,v]of Object.entries(d.cost))o[r]=Math.ceil(v*scale);return o}
function upgradeCost(t){const d=BUILDINGS[t.building],o={};for(const[r,v]of Object.entries(d.cost))o[r]=Math.ceil(v*.68*Math.pow(1.55,t.level-1));if(!o.stone&&t.level>=3)o.stone=Math.ceil(4*Math.pow(1.35,t.level-3));return o}
function expansionCost(t){const n=state.tiles.filter(t=>t.unlocked).length,dist=Math.abs(t.x-5)+Math.abs(t.y-5);return{coins:Math.ceil(85*Math.pow(1.095,n-9)*(1+dist*.05)),wood:Math.ceil(5+Math.max(0,n-10)*.52),stone:Math.ceil(Math.max(0,n-17)*.35)}}

function iso(x,y){return{x:originX+(x-y)*tileW/2,y:originY+(x+y)*tileH/2}}
function shade(hex,amt){const n=parseInt(hex.slice(1),16),r=clamp((n>>16)+amt,0,255),g=clamp(((n>>8)&255)+amt,0,255),b=clamp((n&255)+amt,0,255);return`rgb(${r},${g},${b})`}
function diamond(cx,cy,w,h,fill,stroke,lw=1){ctx.beginPath();ctx.moveTo(cx,cy-h/2);ctx.lineTo(cx+w/2,cy);ctx.lineTo(cx,cy+h/2);ctx.lineTo(cx-w/2,cy);ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lw;ctx.stroke()}}
function drawWater(now){const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,"#a9dce5");g.addColorStop(1,"#76bfd2");ctx.fillStyle=g;ctx.fillRect(0,0,W,H);ctx.globalAlpha=.14;ctx.strokeStyle="#fff";const t=now*.00045;for(let y=14;y<H;y+=24*DPR){ctx.beginPath();for(let x=-20;x<W+30;x+=22*DPR){const yy=y+Math.sin(x*.015+t*4+y*.025)*1.8*DPR;x<0?ctx.moveTo(x,yy):ctx.lineTo(x,yy)}ctx.stroke()}ctx.globalAlpha=1}
function drawTile(t){const p=iso(t.x,t.y),sel=selected===t;if(!t.unlocked){if(isFrontier(t)){diamond(p.x,p.y,tileW-5,tileH-3,"rgba(76,145,161,.28)","rgba(255,255,255,.58)",1.2*DPR);ctx.fillStyle="rgba(255,255,255,.84)";ctx.font=`bold ${Math.max(9,tileH*.30)}px system-ui`;ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("+",p.x,p.y)}return}const terr=TERRAIN[t.terrain],depth=Math.max(5,tileH*.21);ctx.beginPath();ctx.moveTo(p.x-tileW/2+3,p.y);ctx.lineTo(p.x,p.y+tileH/2);ctx.lineTo(p.x,p.y+tileH/2+depth);ctx.lineTo(p.x-tileW/2+3,p.y+depth);ctx.closePath();ctx.fillStyle=shade(terr.side,-15);ctx.fill();ctx.beginPath();ctx.moveTo(p.x+tileW/2-3,p.y);ctx.lineTo(p.x,p.y+tileH/2);ctx.lineTo(p.x,p.y+tileH/2+depth);ctx.lineTo(p.x+tileW/2-3,p.y+depth);ctx.closePath();ctx.fillStyle=terr.side;ctx.fill();diamond(p.x,p.y,tileW-5,tileH-4,terr.top,sel?"#fff4bd":"rgba(47,70,64,.18)",sel?2.5*DPR:1*DPR);terrainDetail(t,p)}
function terrainDetail(t,p){ctx.save();ctx.globalAlpha=.46;if(t.terrain==="forest"&&!t.building){ctx.fillStyle="#3f6b49";for(let i=-1;i<=1;i++){ctx.beginPath();ctx.arc(p.x+i*tileW*.13,p.y-3+Math.abs(i)*2,Math.max(2,tileH*.08),0,Math.PI*2);ctx.fill()}}else if(t.terrain==="rock"&&!t.building){ctx.fillStyle="#747d78";for(let i=-1;i<=1;i++){ctx.beginPath();ctx.ellipse(p.x+i*tileW*.14,p.y+i*2,Math.max(2,tileH*.08),Math.max(1.5,tileH*.05),0,0,Math.PI*2);ctx.fill()}}else if(t.terrain==="fertile"&&!t.building){ctx.strokeStyle="#6f834f";for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(p.x-18*camera.zoom,p.y+i*3*camera.zoom);ctx.lineTo(p.x+18*camera.zoom,p.y+i*3*camera.zoom);ctx.stroke()}}else if(t.terrain==="coast"){ctx.strokeStyle="#f2dfa8";ctx.beginPath();ctx.moveTo(p.x-tileW*.26,p.y+4);ctx.lineTo(p.x+tileW*.26,p.y+4);ctx.stroke()}ctx.restore()}
function buildingDraw(t,p,now=performance.now()){
  const d=BUILDINGS[t.building],tier=Math.min(3,Math.floor((t.level-1)/3));let s=clamp(tileH/39,.78,2.15)*(1+tier*.035);ctx.save();
  ctx.fillStyle="rgba(45,56,49,.18)";ctx.beginPath();ctx.ellipse(p.x+5*s,p.y+8*s,20*s,7*s,0,0,Math.PI*2);ctx.fill();
  const colors={farm:"#ddb969",lumber:"#507151",quarry:"#77807d",house:"#e8dfc6",workshop:"#71808a",market:"#d8895e",park:"#6f9968",windmill:"#eee9d7",bakery:"#d8aa72",harbor:"#587f90",monument:"#c6b686"},c=colors[t.building]||"#ddd";
  if(t.building==="farm"){
    ctx.fillStyle="#c8a64f";for(let i=-2-tier;i<=2+tier;i++)for(let j=-1;j<=1;j++){const sway=Math.sin(now*.002+i+j)*1.2*s;ctx.fillRect(p.x+i*4.2*s+sway,p.y+j*4*s-4*s,1.5*s,7*s)}if(t.spec==="orchard"){ctx.fillStyle="#6f8f56";for(let i=-1;i<=1;i++){ctx.beginPath();ctx.arc(p.x+i*10*s,p.y-10*s,6*s,0,Math.PI*2);ctx.fill()}}
    ctx.fillStyle="#e6d4a1";ctx.fillRect(p.x-7*s,p.y-10*s,14*s,14*s);ctx.fillStyle="#a36c49";ctx.beginPath();ctx.moveTo(p.x-9*s,p.y-10*s);ctx.lineTo(p.x,p.y-18*s);ctx.lineTo(p.x+9*s,p.y-10*s);ctx.closePath();ctx.fill();
  }else if(t.building==="lumber"){
    for(let i=-1;i<=1;i++){ctx.fillStyle="#426948";ctx.beginPath();ctx.arc(p.x+i*8*s,p.y-10*s+Math.abs(i)*2*s,8*s,0,Math.PI*2);ctx.fill();ctx.fillStyle="#73583f";ctx.fillRect(p.x+i*8*s-1.5*s,p.y-4*s,3*s,10*s)}
    ctx.fillStyle="#a87a4f";ctx.fillRect(p.x-13*s,p.y+4*s,26*s,4*s);
  }else if(t.building==="quarry"){
    ctx.fillStyle="#686f6d";for(let i=-1;i<=1;i++){ctx.beginPath();ctx.moveTo(p.x+i*8*s-5*s,p.y+4*s);ctx.lineTo(p.x+i*8*s,p.y-12*s);ctx.lineTo(p.x+i*8*s+6*s,p.y+4*s);ctx.closePath();ctx.fill()}
    ctx.strokeStyle="#555d5a";ctx.lineWidth=2*s;ctx.beginPath();ctx.moveTo(p.x+11*s,p.y+5*s);ctx.lineTo(p.x+11*s,p.y-18*s);ctx.lineTo(p.x+22*s,p.y-18*s);ctx.stroke();
  }else if(t.building==="park"){
    ctx.fillStyle=c;for(let i=-1;i<=1;i++){ctx.beginPath();ctx.arc(p.x+i*7*s,p.y-8*s+(i%2)*2*s,8*s,0,Math.PI*2);ctx.fill()}ctx.fillStyle="#705742";ctx.fillRect(p.x-2*s,p.y-3*s,4*s,12*s);
    ctx.strokeStyle="#d7caa2";ctx.beginPath();ctx.arc(p.x,p.y+3*s,9*s,0,Math.PI);ctx.stroke();
  }else if(t.building==="windmill"){
    ctx.fillStyle=c;ctx.fillRect(p.x-6*s,p.y-13*s,12*s,23*s);ctx.fillStyle="#c7bda8";ctx.beginPath();ctx.moveTo(p.x-8*s,p.y-13*s);ctx.lineTo(p.x,p.y-20*s);ctx.lineTo(p.x+8*s,p.y-13*s);ctx.closePath();ctx.fill();
    ctx.strokeStyle="#746b5b";ctx.lineWidth=Math.max(1,1.8*s);const a=now*.0011;for(let i=0;i<4;i++){const ang=a+i*Math.PI/2;ctx.beginPath();ctx.moveTo(p.x,p.y-8*s);ctx.lineTo(p.x+Math.cos(ang)*19*s,p.y-8*s+Math.sin(ang)*19*s);ctx.stroke()}
  }else if(t.building==="bakery"){
    const w=30*s,h=18*s;ctx.fillStyle=c;ctx.fillRect(p.x-w/2,p.y-h/2-4*s,w,h);
    ctx.fillStyle="#a96849";ctx.beginPath();ctx.moveTo(p.x-w*.58,p.y-h/2-4*s);ctx.lineTo(p.x,p.y-h-12*s);ctx.lineTo(p.x+w*.58,p.y-h/2-4*s);ctx.closePath();ctx.fill();
    ctx.fillStyle="#6d5142";ctx.fillRect(p.x+7*s,p.y-19*s,5*s,15*s);
    const puff=(now*.00042+hash(t.x+9,t.y-2))%1;
    for(let i=0;i<3;i++){const q=(puff+i*.25)%1;ctx.globalAlpha=(1-q)*.28;ctx.fillStyle="#fff6df";ctx.beginPath();ctx.arc(p.x+10*s+q*3*s,p.y-20*s-q*18*s,(3+q*4)*s,0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1;
    ctx.fillStyle="#f1d39b";for(let i=-1;i<=1;i++){ctx.beginPath();ctx.ellipse(p.x+i*7*s,p.y+7*s,4*s,2.5*s,0,0,Math.PI*2);ctx.fill()}
}else if(t.building==="harbor"){
    ctx.strokeStyle="#725b42";ctx.lineWidth=5*s;ctx.beginPath();ctx.moveTo(p.x-22*s,p.y+8*s);ctx.lineTo(p.x+18*s,p.y-7*s);ctx.stroke();
    ctx.fillStyle=c;ctx.fillRect(p.x-12*s,p.y-11*s,19*s,13*s);ctx.fillStyle=shade(c,-24);ctx.beginPath();ctx.moveTo(p.x-15*s,p.y-11*s);ctx.lineTo(p.x-2*s,p.y-18*s);ctx.lineTo(p.x+10*s,p.y-11*s);ctx.closePath();ctx.fill();
  }else if(t.building==="monument"){
    ctx.fillStyle=c;ctx.fillRect(p.x-5*s,p.y-21*s,10*s,29*s);ctx.beginPath();ctx.arc(p.x,p.y-23*s,8*s,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=.24;ctx.fillStyle="#fff6cf";ctx.beginPath();ctx.arc(p.x,p.y-23*s,12*s+Math.sin(now*.002)*2*s,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
  }else{
    const w=30*s,h=17*s;ctx.fillStyle=c;ctx.fillRect(p.x-w/2,p.y-h/2-4*s,w,h);
    ctx.fillStyle=shade(c,-27);ctx.beginPath();ctx.moveTo(p.x-w*.58,p.y-h/2-4*s);ctx.lineTo(p.x,p.y-h-11*s);ctx.lineTo(p.x+w*.58,p.y-h/2-4*s);ctx.closePath();ctx.fill();
    if(t.building==="market"){
      ctx.strokeStyle="#f6e4c2";ctx.lineWidth=2.2*s;for(let i=-1;i<=1;i++){ctx.beginPath();ctx.moveTo(p.x+i*8*s,p.y-h/2-4*s);ctx.lineTo(p.x+i*8*s,p.y+5*s);ctx.stroke()}
      ctx.fillStyle="#f4d18b";ctx.fillRect(p.x-14*s,p.y+3*s,28*s,3*s);
    }
    if(t.building==="workshop"){
      const puff=(now*.00035+hash(t.x,t.y))%1;
      for(let i=0;i<3;i++){const q=(puff+i*.28)%1;ctx.globalAlpha=(1-q)*.24;ctx.fillStyle="#e9eee9";ctx.beginPath();ctx.arc(p.x+9*s+q*4*s,p.y-20*s-q*16*s,(3+q*4)*s,0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1;
      ctx.fillStyle="#5f686d";ctx.fillRect(p.x+7*s,p.y-17*s,5*s,13*s);for(let i=0;i<3;i++){const q=(now*.004+i*.31+hash(t.x,t.y))%1;ctx.globalAlpha=(1-q)*.8;ctx.fillStyle="#f5b24c";ctx.fillRect(p.x-5*s+q*14*s,p.y+2*s-q*10*s,2*s,2*s)}ctx.globalAlpha=1;
    }
    if(t.building==="house"){
      const puff=(now*.00022+hash(t.x+2,t.y-4))%1;ctx.globalAlpha=(1-puff)*.18;ctx.fillStyle="#f5f2e8";ctx.beginPath();ctx.arc(p.x+9*s,p.y-20*s-puff*12*s,(2+puff*3)*s,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
    }
  }
  if(tier>=1&&t.building!=="park"){
    ctx.strokeStyle="rgba(250,238,190,.85)";ctx.lineWidth=Math.max(1,1.2*s);ctx.beginPath();ctx.moveTo(p.x-15*s,p.y+8*s);ctx.lineTo(p.x+15*s,p.y+8*s);ctx.stroke()
  }
  if(tier>=2){ctx.fillStyle="#c56555";ctx.beginPath();ctx.moveTo(p.x-15*s,p.y-20*s);ctx.lineTo(p.x-4*s,p.y-16*s);ctx.lineTo(p.x-15*s,p.y-12*s);ctx.closePath();ctx.fill()}
  if(tier>=3){ctx.globalAlpha=.18;ctx.fillStyle="#fff3b4";ctx.beginPath();ctx.arc(p.x,p.y-10*s,25*s+Math.sin(now*.003)*2*s,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1}
  if(t.fxUntil&&Date.now()<t.fxUntil){
    ctx.strokeStyle="rgba(140,104,62,.75)";ctx.lineWidth=Math.max(1,1.4*s);for(let i=-1;i<=1;i++){ctx.beginPath();ctx.moveTo(p.x+i*10*s,p.y+10*s);ctx.lineTo(p.x+i*10*s,p.y-22*s);ctx.stroke()}ctx.beginPath();ctx.moveTo(p.x-15*s,p.y-4*s);ctx.lineTo(p.x+15*s,p.y-4*s);ctx.stroke()
  }
  const act=activityFor(t);
  if(processDefs(t)&&act<.18){ctx.fillStyle="#fff4e6";ctx.beginPath();ctx.arc(p.x-20*s,p.y-14*s,7*s,0,Math.PI*2);ctx.fill();ctx.fillStyle="#a45b47";ctx.font=`bold ${Math.max(7,8*s)}px system-ui`;ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("!",p.x-20*s,p.y-14*s)}
  ctx.fillStyle="rgba(255,253,242,.95)";ctx.beginPath();ctx.arc(p.x+20*s,p.y-14*s,7*s,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#405057";ctx.font=`bold ${Math.max(7,7.5*s)}px system-ui`;ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(t.level,p.x+20*s,p.y-14*s);
  if(t.spec){ctx.fillStyle="#5d8062";ctx.beginPath();ctx.arc(p.x-20*s,p.y-14*s,6*s,0,Math.PI*2);ctx.fill();ctx.fillStyle="#fff";ctx.font=`bold ${Math.max(6,7*s)}px system-ui`;ctx.fillText("★",p.x-20*s,p.y-14*s)}
  ctx.restore()
}
function drawRoads(){
  ctx.save();ctx.lineCap="round";
  for(const t of state.tiles){
    if(!t.unlocked||!t.building)continue;
    const a=iso(t.x,t.y);
    for(const [dx,dy] of [[1,0],[0,1]]){
      const n=tileAt(t.x+dx,t.y+dy);if(!n?.unlocked||!n.building)continue;
      const b=iso(n.x,n.y);
      ctx.strokeStyle="rgba(126,105,74,.52)";ctx.lineWidth=Math.max(3,6*camera.zoom);ctx.beginPath();ctx.moveTo(a.x,a.y+5*camera.zoom);ctx.lineTo(b.x,b.y+5*camera.zoom);ctx.stroke();      ctx.strokeStyle="rgba(227,207,164,.62)";ctx.lineWidth=Math.max(1,2.2*camera.zoom);ctx.beginPath();ctx.moveTo(a.x,a.y+5*camera.zoom);ctx.lineTo(b.x,b.y+5*camera.zoom);ctx.stroke();
    }
  }ctx.restore()
}
function drawSupplyFlows(now){
  ctx.save();
  for(const t of state.tiles){
    if(!t.unlocked||!t.building)continue;
    for(const[dx,dy]of[[1,0],[0,1]]){
      const n=tileAt(t.x+dx,t.y+dy);if(!n?.unlocked||!n.building)continue;
      const link=chainBetween(t,n);if(!link)continue;
      const a=iso(link.from.x,link.from.y),b=iso(link.to.x,link.to.y),active=activityFor(link.to)>.05||!processDefs(link.to);
      ctx.globalAlpha=active?.55:.18;ctx.strokeStyle=link.color;ctx.lineWidth=Math.max(2,3.2*camera.zoom);ctx.beginPath();ctx.moveTo(a.x,a.y+2*camera.zoom);ctx.lineTo(b.x,b.y+2*camera.zoom);ctx.stroke();
      const speed=.00016+(hash(link.from.x*7+link.to.x,link.from.y*9+link.to.y)*.00005);
      for(let k=0;k<2;k++){
        let u=(now*speed+k*.5+hash(link.from.x+3,link.to.y+11))%1;
        const x=a.x+(b.x-a.x)*u,y=a.y+(b.y-a.y)*u-3*camera.zoom,r=clamp(6.5*camera.zoom,4.2,11);
        ctx.globalAlpha=active?.94:.35;ctx.fillStyle="#fffdf4";ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle=link.color;ctx.lineWidth=Math.max(1,1.2*camera.zoom);ctx.stroke();
        ctx.fillStyle=link.color;ctx.font=`bold ${Math.max(7,7.5*camera.zoom)}px system-ui`;ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(symbols[link.resource]||"•",x,y)
      }
    }
  }
  ctx.globalAlpha=1;ctx.restore()
}
function drawCityLife(now){
  const built=state.tiles.filter(t=>t.unlocked&&t.building);if(built.length<2)return;
  const edges=[];
  for(const t of built)for(const [dx,dy] of [[1,0],[0,1]]){
    const n=tileAt(t.x+dx,t.y+dy);if(n?.unlocked&&n.building)edges.push([t,n])
  }
  if(edges.length){
    const count=Math.min(20,Math.max(3,Math.floor(population()/2)));
    for(let i=0;i<count;i++){
      const edge=edges[Math.floor(hash(i,17)*edges.length)],a=edge[0],b=edge[1],pa=iso(a.x,a.y),pb=iso(b.x,b.y);
      let u=(now*(.000026+(i%4)*.000004)+hash(i,43))%2;u=u>1?2-u:u;
      const x=pa.x+(pb.x-pa.x)*u,y=pa.y+(pb.y-pa.y)*u+5*camera.zoom,s=clamp(3.8*camera.zoom,2.8,8);
      ctx.fillStyle=i%3===0?"#c76f55":i%3===1?"#466b76":"#6e865b";ctx.beginPath();ctx.arc(x,y-s*1.5,s*.58,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle="#4a4f4c";ctx.lineWidth=Math.max(1,s*.36);ctx.beginPath();ctx.moveTo(x,y-s);ctx.lineTo(x,y+s*.8);ctx.stroke()
    }
    for(let i=0;i<Math.min(4,Math.floor(edges.length/2));i++){
      const edge=edges[Math.floor(hash(i+50,2)*edges.length)],pa=iso(edge[0].x,edge[0].y),pb=iso(edge[1].x,edge[1].y);
      let u=(now*(.000014+i*.0000015)+hash(i,91))%2;u=u>1?2-u:u;
      const x=pa.x+(pb.x-pa.x)*u,y=pa.y+(pb.y-pa.y)*u+6*camera.zoom,s=clamp(4.8*camera.zoom,3.2,9.5);
      ctx.fillStyle="#8c6846";ctx.fillRect(x-s,y-s*.45,s*2,s*.9);ctx.fillStyle="#303638";ctx.beginPath();ctx.arc(x-s*.6,y+s*.55,s*.35,0,Math.PI*2);ctx.arc(x+s*.6,y+s*.55,s*.35,0,Math.PI*2);ctx.fill()
    }
  }
  for(const t of built.filter(t=>t.building==="harbor")){
    const p=iso(t.x,t.y),phase=now*.001+hash(t.x,t.y)*10,s=clamp(5*camera.zoom,3,10),bx=p.x+Math.cos(phase*.35)*tileW*.46,by=p.y+tileH*.72+Math.sin(phase)*3*camera.zoom;
    ctx.fillStyle="#684f3c";ctx.beginPath();ctx.moveTo(bx-s*1.6,by);ctx.lineTo(bx+s*1.6,by);ctx.lineTo(bx+s*.8,by+s*.8);ctx.lineTo(bx-s*.8,by+s*.8);ctx.closePath();ctx.fill();
    ctx.strokeStyle="#e5e0d0";ctx.beginPath();ctx.moveTo(bx,by);ctx.lineTo(bx,by-s*2);ctx.stroke()
  }
  for(const t of built){
    const phase=(now*.00028+hash(t.x*3,t.y*7))%1;if(phase>.32)continue;
    const d=BUILDINGS[t.building],p=iso(t.x,t.y),r=d.raw?Object.keys(d.raw)[0]:(d.process?Object.keys(d.process.outputs)[0]:null);if(!r)continue;
    const icon=symbols[r]||"•",alpha=1-phase/.32;
    ctx.globalAlpha=alpha*.8;ctx.fillStyle="#fffdf2";ctx.beginPath();ctx.arc(p.x,p.y-30*camera.zoom-phase*28*camera.zoom,8*camera.zoom,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#53636a";ctx.font=`bold ${Math.max(7,9*camera.zoom)}px system-ui`;ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(icon,p.x,p.y-30*camera.zoom-phase*28*camera.zoom);ctx.globalAlpha=1
  }
}
function spawnCityEvent(now){
  const candidates=state.tiles.filter(t=>t.unlocked);
  if(!candidates.length)return;
  const tile=candidates[Math.floor(Math.random()*candidates.length)],type=CITY_EVENT_TYPES[Math.floor(Math.random()*CITY_EVENT_TYPES.length)];
  cityEvents.push({id:Math.random().toString(36).slice(2),type:type.id,icon:type.icon,label:type.label,color:type.color,x:tile.x,y:tile.y,spawn:now,expires:now+18000});
  nextCityEventAt=now+9000+Math.random()*9000;
}
function drawCityEvents(now){
  for(const e of cityEvents){
    const p=iso(e.x,e.y),age=now-e.spawn,bob=Math.sin(now*.004+e.x)*4*camera.zoom,y=p.y-38*camera.zoom+bob,r=clamp(14*camera.zoom,10*DPR,21*DPR);
    ctx.globalAlpha=clamp((e.expires-now)/2200,0,1);ctx.fillStyle="rgba(255,253,247,.96)";ctx.beginPath();ctx.arc(p.x,y,r,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle=e.color;ctx.lineWidth=Math.max(2,2.5*camera.zoom);ctx.stroke();ctx.fillStyle=e.color;ctx.font=`bold ${Math.max(10,12*camera.zoom)}px system-ui`;ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(e.icon,p.x,y);ctx.globalAlpha=1;
  }
}
function updateCityEvents(now){
  for(let i=cityEvents.length-1;i>=0;i--)if(cityEvents[i].expires<=now)cityEvents.splice(i,1);
  if(now>=nextCityEventAt&&cityEvents.length<3)spawnCityEvent(now);
}
function cityEventAt(px,py){
  for(let i=cityEvents.length-1;i>=0;i--){const e=cityEvents[i],p=iso(e.x,e.y),y=p.y-38*camera.zoom+Math.sin(performance.now()*.004+e.x)*4*camera.zoom,r=clamp(22*camera.zoom,18*DPR,30*DPR);if(Math.hypot(px-p.x,py-y)<=r)return e}return null
}
function collectCityEvent(e){
  const lv=townLevel(),amount=Math.ceil(8+lv*2.4);let msg="";
  if(e.type==="harvest"){const grain=Math.ceil(amount*.75);state.resources.grain=(state.resources.grain||0)+grain;state.resources.food+=Math.ceil(amount*.35);msg=`Raccolto +${grain} grano`}
  else if(e.type==="crate"){const wood=Math.ceil(amount*.7),stone=Math.ceil(amount*.4);state.resources.wood+=wood;state.resources.stone+=stone;msg=`Cassa +${wood} legno · +${stone} pietra`}
  else if(e.type==="merchant"){const coins=Math.ceil(35+lv*11);state.resources.coins+=coins;msg=`Mercante +${coins} monete`}
  else{const goods=Math.max(1,Math.ceil(lv*.45));state.resources.goods+=goods;state.happiness=clamp(state.happiness+3,0,100);msg=`Dono +${goods} merci · felicità +3`}
  const i=cityEvents.indexOf(e);if(i>=0)cityEvents.splice(i,1);showToast(msg);save();updateUI()
}
function render(now){
  drawWater(now);
  const ordered=[...state.tiles].sort((a,b)=>(a.x+a.y)-(b.x+b.y));
  ordered.forEach(drawTile);
  drawRoads();
  drawSupplyFlows(now);
  ordered.filter(t=>t.unlocked&&t.building).forEach(t=>buildingDraw(t,iso(t.x,t.y),now));
  drawCityLife(now);drawCityEvents(now)
}
function recalcGeometry(){tileW=baseTileW*camera.zoom;tileH=baseTileH*camera.zoom;originX=W/2+camera.x;originY=Math.max(58*DPR,H*.11)+camera.y}
function focusTile(t){if(!t)return;recalcGeometry();const p=iso(t.x,t.y),targetY=H*.31;camera.x+=W/2-p.x;camera.y+=targetY-p.y;recalcGeometry()}function focusCity(){const unlocked=state.tiles.filter(t=>t.unlocked);if(!unlocked.length)return;camera.x=0;camera.y=0;const xs=unlocked.map(t=>t.x),ys=unlocked.map(t=>t.y),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);const cssW=wrap.getBoundingClientRect().width;const span=(maxX-minX+maxY-minY+2);const desiredCss=Math.min(cssW*.88,Math.max(cssW*.62,span*68));const naturalCss=span*(baseTileW/DPR)/2;camera.zoom=clamp(desiredCss/Math.max(1,naturalCss),.95,1.55);recalcGeometry();const center=iso((minX+maxX)/2,(minY+maxY)/2);camera.x+=W/2-center.x;camera.y+=H*.38-center.y;recalcGeometry()}
function fit(){
  document.documentElement.style.setProperty("--app-h",window.innerHeight+"px");const r=wrap.getBoundingClientRect();
  DPR=Math.min(window.devicePixelRatio||1,1.5);W=Math.max(320,Math.round(r.width*DPR));H=Math.max(240,Math.round(r.height*DPR));canvas.width=W;canvas.height=H;
  const cssW=r.width,portrait=r.height>r.width,desiredTile=clamp(cssW*.225,84,132);baseTileW=desiredTile*DPR;baseTileH=baseTileW*.50;camera.minZoom=.72;camera.maxZoom=2.65;
  if(!fit.didInitial){focusCity();fit.didInitial=true}else{camera.zoom=clamp(camera.zoom,camera.minZoom,camera.maxZoom);recalcGeometry()}
}
function screenToTile(clientX,clientY){const r=canvas.getBoundingClientRect(),sx=(clientX-r.left)*W/r.width,sy=(clientY-r.top)*H/r.height,a=(sx-originX)/(tileW/2),b=(sy-originY)/(tileH/2),gx=Math.floor((a+b)/2+.5),gy=Math.floor((b-a)/2+.5);if(gx<0||gy<0||gx>=GRID||gy>=GRID)return null;const p=iso(gx,gy),dx=Math.abs(sx-p.x)/(tileW/2),dy=Math.abs(sy-p.y)/(tileH/2);return dx+dy<=1.05?tileAt(gx,gy):null}
function pointerPos(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height}}
canvas.addEventListener("pointerdown",e=>{canvas.setPointerCapture(e.pointerId);const p=pointerPos(e);pointers.set(e.pointerId,p);if(pointers.size===1){gesture={drag:true,moved:false,startX:p.x,startY:p.y,camX:camera.x,camY:camera.y,lastDist:0,startZoom:camera.zoom}}else if(pointers.size===2){const a=[...pointers.values()];gesture.lastDist=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);gesture.startZoom=camera.zoom;gesture.moved=true}})
canvas.addEventListener("pointermove",e=>{if(!pointers.has(e.pointerId))return;const p=pointerPos(e);pointers.set(e.pointerId,p);if(pointers.size===1&&gesture.drag){const dx=p.x-gesture.startX,dy=p.y-gesture.startY;if(Math.hypot(dx,dy)>7*DPR)gesture.moved=true;camera.x=gesture.camX+dx;camera.y=gesture.camY+dy;recalcGeometry()}else if(pointers.size===2){const a=[...pointers.values()],dist=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);if(gesture.lastDist>0){camera.zoom=clamp(gesture.startZoom*dist/gesture.lastDist,camera.minZoom,camera.maxZoom);recalcGeometry()}}})
function pointerEnd(e){if(!pointers.has(e.pointerId))return;const wasSingle=pointers.size===1&&!gesture.moved,p=pointerPos(e);pointers.delete(e.pointerId);if(wasSingle){const evt=cityEventAt(p.x,p.y);if(evt){collectCityEvent(evt)}else{const t=screenToTile(e.clientX,e.clientY);if(t){selected=t;openSheet(t)}else{selected=null;closeSheet()}}}if(pointers.size===1){const q=[...pointers.values()][0];gesture={drag:true,moved:true,startX:q.x,startY:q.y,camX:camera.x,camY:camera.y,lastDist:0,startZoom:camera.zoom}}}
canvas.addEventListener("pointerup",pointerEnd);canvas.addEventListener("pointercancel",e=>pointers.delete(e.pointerId));canvas.addEventListener("wheel",e=>{e.preventDefault();camera.zoom=clamp(camera.zoom*(e.deltaY>0?.9:1.1),camera.minZoom,camera.maxZoom);recalcGeometry()},{passive:false});

function buildCost(type){const d=BUILDINGS[type],scale=1+countBuilding(type)*.16,o={};for(const[r,v]of Object.entries(d.cost))o[r]=Math.ceil(v*scale);return o}
function openSheet(t){renderSheet(t);$("sheet").classList.add("open");$("sheet").classList.remove("expanded");wrap.classList.add("sheetOpen");$("sheetStateLabel").textContent="Tocca la maniglia per espandere";focusTile(t)}
function closeSheet(){$("sheet").classList.remove("open","expanded");wrap.classList.remove("sheetOpen")}
$("sheetHandle").onclick=()=>{if(!$("sheet").classList.contains("open"))return;const ex=$("sheet").classList.toggle("expanded");$("sheetStateLabel").textContent=ex?"Vista dettagliata":"Tocca la maniglia per espandere"};
$("sheetClose").onclick=closeSheet;
function prodSummary(t){const d=BUILDINGS[t.building];if(!d)return"—";const m=tileBaseMul(t),parts=[];for(const[r,v]of Object.entries(d.raw||{}))parts.push(`+${(v*m*specRawMul(t,r)).toFixed(2)} ${symbols[r]}/s`);const p=processDefs(t);if(p){const o=Object.entries(p.outputs).map(([r,v])=>`+${(v*m).toFixed(2)} ${symbols[r]}`).join(" ");parts.push(o+" /s")}if(t.spec==="estate")parts.push("+0,25 ●/s");if(t.spec==="artisan")parts.push("+0,35 ●/s");return parts.join(" · ")||"Supporto"}
function specName(t){return t.spec?(BUILDINGS[t.building].specs.find(s=>s.id===t.spec)?.name||"Specializzata"):"Nessuna"}
function flowSummary(t){
 const p=processDefs(t);if(!p)return chainLabel(t);
 const ins=Object.entries(p.inputs).map(([r,v])=>`${symbols[r]} ${v.toFixed(2)}`).join(" + ");
 const outs=Object.entries(p.outputs).map(([r,v])=>`${symbols[r]} ${v.toFixed(2)}`).join(" + ");
 return `${ins} → ${outs}`
}
function sheetHeader(icon,title,subtitle,badge){return `<div class="sheetHead"><div class="sheetTitleWrap"><div class="sheetIcon">${icon}</div><div><h2>${title}</h2><p>${subtitle}</p></div></div><span class="levelBadge">${badge}</span></div>`}
function renderSheet(t){
  const box=$("sheetContent");
  if(!t.unlocked){
    if(!isFrontier(t)){closeSheet();return}
    const c=expansionCost(t),ok=canAfford(c),missing=missingText(c);
    box.innerHTML=`${sheetHeader("＋","Nuova zolla",`${TERRAIN[t.terrain].name} · ${TERRAIN[t.terrain].bonus}`,"ESPANSIONE")}<div class="keyMetrics"><div class="keyMetric accent"><b>${TERRAIN[t.terrain].name}</b><span>terreno</span></div><div class="keyMetric"><b>${state.tiles.filter(x=>x.unlocked).length+1}</b><span>zolle dopo l'acquisto</span></div><div class="keyMetric good"><b>${townLevel()}</b><span>livello borgo</span></div></div><div class="synergy">Espandere crea spazio per nuovi quartieri e catene produttive.</div>${ok?"":`<div class="needLine">Ti mancano: <b>${missing}</b></div>`}<div class="actions ${ok?"one":""}"><button id="expandBtn" class="primary" ${ok?"":"disabled"}>ESPANDI · ${costText(c)}</button>${ok?"":'<button id="needWorkBtn" class="secondary">OTTIENI RISORSE</button>'}</div>`;
    $("expandBtn").onclick=()=>{if(pay(c)){t.unlocked=true;showToast("Isola ampliata");save();renderSheet(t);updateUI();setTimeout(()=>focusTile(t),30)}};
    if($("needWorkBtn"))$("needWorkBtn").onclick=()=>{renderJobs();$("workPanel").classList.remove("hidden")};return
  }
  if(!t.building){
    const lv=townLevel();box.innerHTML=`${sheetHeader("◇",TERRAIN[t.terrain].name,TERRAIN[t.terrain].bonus,"ZOLLA LIBERA")}<div class="synergy">Scegli cosa costruire. Gli edifici compatibili con questa zolla rendono di più.</div><div class="buildGrid" id="buildGrid"></div>`;
    const grid=$("buildGrid");
    const entries=Object.entries(BUILDINGS).sort(([ta,a],[tb,b])=>{const aa=(lv>=a.unlock&&(!a.coastOnly||t.terrain==="coast"))?0:1,bb=(lv>=b.unlock&&(!b.coastOnly||t.terrain==="coast"))?0:1;return aa-bb});
    for(const[type,d]of entries){
      const locked=lv<d.unlock,invalid=d.coastOnly&&t.terrain!=="coast",c=buildCost(type),can=!locked&&!invalid&&canAfford(c),why=locked?`Sblocca al Borgo Lv.${d.unlock}`:invalid?"Richiede una zolla Costa":d.desc;
      const b=document.createElement("button");b.className="buildCard"+(locked||invalid?" locked":"");b.disabled=locked||invalid||!can;
      b.innerHTML=`<div class="buildingIcon">${d.icon}</div><div class="buildCopy"><strong>${d.name}</strong><span>${why}</span><span class="buildChain">${chainLabel({building:type})}</span><div class="buildCost">${costText(c)}${!can&&!locked&&!invalid?` · manca ${missingText(c)}`:""}</div></div><div class="buildAction">${locked||invalid?"BLOCCATO":can?"COSTRUISCI":"MANCANO RISORSE"}</div>`;
      b.onclick=()=>build(type,t);grid.appendChild(b)
    }
    return
  }
  const d=BUILDINGS[t.building],c=upgradeCost(t),atCap=t.level>=10,ok=!atCap&&canAfford(c),missing=missingText(c),prod=prodSummary(t),eff=efficiencyPct(t),status=productionStatus(t),statusClass=status==="Attiva"?"good":"warn";
  box.innerHTML=`${sheetHeader(d.icon,d.name,d.desc,`Lv. ${t.level}/10`)}<div class="chainStrip"><span>CATENA</span><b>${flowSummary(t)}</b></div><div class="keyMetrics"><div class="keyMetric accent"><b>${prod}</b><span>produzione</span></div><div class="keyMetric ${eff>=20?"good":""}"><b>${eff>=0?"+":""}${eff}%</b><span>bonus zolla + quartiere</span></div><div class="keyMetric ${statusClass}"><b>${status}</b><span>stato</span></div></div>${t.level>=5&&!t.spec?'<div class="synergy"><b>Specializzazione disponibile.</b> Scegli una direzione permanente per questa zolla.</div>':`<div class="synergy">Specialità: <b>${specName(t)}</b></div>`}${!atCap&&!ok?`<div class="needLine">Per il prossimo livello ti mancano: <b>${missing}</b></div>`:""}<div class="actions"><button id="upgradeBtn" class="primary" ${ok?"":"disabled"}>${atCap?"LIVELLO MASSIMO":"POTENZIA · "+costText(c)}</button>${t.level>=5&&!t.spec?'<button id="specBtn" class="secondary">SPECIALIZZA</button>':!ok&&!atCap?'<button id="needWorkBtn" class="secondary">OTTIENI RISORSE</button>':'<button id="detailBtn" class="secondary">DETTAGLI</button>'}</div><button id="detailsToggle" class="detailsToggle">Mostra dettagli e gestione</button><div id="detailsBox" class="detailsBox"><div class="detailsGrid"><div class="detailCard"><b>×${terrainMul(t).toFixed(2)}</b><span>bonus terreno</span></div><div class="detailCard"><b>×${adjacencyMul(t).toFixed(2)}</b><span>bonus quartiere</span></div><div class="detailCard"><b>×${levelMul(t.level).toFixed(2)}</b><span>moltiplicatore livello</span></div><div class="detailCard"><b>${specName(t)}</b><span>specializzazione</span></div></div><div class="actions"><button id="demoBtn" class="danger">DEMOLISCI</button><button id="centerTileBtn" class="secondary">CENTRA ZOLLA</button></div></div>`;
  if($("upgradeBtn"))$("upgradeBtn").onclick=()=>upgrade(t);
  if($("specBtn"))$("specBtn").onclick=()=>openSpecialization(t);
  if($("needWorkBtn"))$("needWorkBtn").onclick=()=>{renderJobs();$("workPanel").classList.remove("hidden")};
  if($("detailBtn"))$("detailBtn").onclick=()=>{$("detailsBox").classList.add("open");$("sheet").classList.add("expanded");$("sheetStateLabel").textContent="Vista dettagliata"};
  $("detailsToggle").onclick=()=>{$("detailsBox").classList.toggle("open");if($("detailsBox").classList.contains("open"))$("sheet").classList.add("expanded")};
  $("demoBtn").onclick=()=>demolish(t);$("centerTileBtn").onclick=()=>focusTile(t)
}
function build(type,t){const d=BUILDINGS[type],c=buildCost(type);if(townLevel()<d.unlock||(d.coastOnly&&t.terrain!=="coast")||!pay(c))return;t.building=type;t.level=1;t.spec=null;t.fxUntil=Date.now()+2200;state.totalBuilt++;showToast(`${d.name} costruita`);save();renderSheet(t);updateUI();setTimeout(()=>focusTile(t),30)}
function upgrade(t){if(t.level>=10)return;const c=upgradeCost(t);if(!pay(c))return;t.level++;t.fxUntil=Date.now()+1600;showToast(`${BUILDINGS[t.building].name} · Lv. ${t.level}`);save();renderSheet(t);updateUI()}
function demolish(t){if(!t.building)return;const refund=Math.ceil(BUILDINGS[t.building].cost.coins*.22*t.level);state.resources.coins+=refund;t.building=null;t.level=0;t.spec=null;showToast(`Recuperate ${refund} monete`);save();renderSheet(t);updateUI()}
function openSpecialization(t){const d=BUILDINGS[t.building];$("choiceTitle").textContent=d.name;const box=$("choiceContent");box.innerHTML="";for(const s of d.specs){const b=document.createElement("button");b.className="choiceCard";b.innerHTML=`<b>${s.name}</b><span>${s.desc}</span><em>Scelta permanente per questa zolla</em>`;b.onclick=()=>{t.spec=s.id;$("choiceModal").classList.add("hidden");showToast(`${d.name}: ${s.name}`);save();renderSheet(t);updateUI()};box.appendChild(b)}$("choiceModal").classList.remove("hidden")}
$("closeChoice").onclick=()=>$("choiceModal").classList.add("hidden");


const JOBS={
  gather:{icon:"☘",name:"Squadra di raccolta",desc:"Manda una squadra nelle zolle naturali. Non costa nulla.",cooldown:7000},
  civic:{icon:"⚒",name:"Lavori civici",desc:"Piccoli lavori per il borgo: ricompensa immediata in monete.",cooldown:22000},
  festival:{icon:"♪",name:"Festa di piazza",desc:"Aumenta la felicità e porta qualche moneta.",cooldown:38000},
  salvage:{icon:"⚓",name:"Recupero costiero",desc:"Recupera una cassa di materiali dal mare.",cooldown:52000}
};
function jobReady(id){return Date.now()>=(state.jobs?.[id]||0)}
function jobRemain(id){return Math.max(0,(state.jobs?.[id]||0)-Date.now())}
function jobRewardText(id){
  const lv=townLevel();
  if(id==="gather")return `+${Math.ceil(5+lv*1.4)} risorse`;
  if(id==="civic")return `+${Math.ceil(45+population()*3+lv*7)} ●`;
  if(id==="festival")return `+8 felicità · +${Math.ceil(20+lv*5)} ●`;
  return `materiali misti`;
}
function performJob(id){
  if(!jobReady(id))return;
  const lv=townLevel();
  if(id==="gather"){
    const amount=Math.ceil(5+lv*1.4),terrains=state.tiles.filter(t=>t.unlocked&&!t.building).map(t=>t.terrain);
    const terr=terrains[Math.floor(Math.random()*Math.max(1,terrains.length))]||"plains";
    if(terr==="forest"){state.resources.wood+=amount;showToast(`Raccolta +${amount} legno`)}
    else if(terr==="rock"){state.resources.stone+=amount;showToast(`Raccolta +${amount} pietra`)}
    else if(terr==="fertile"||terr==="plains"){state.resources.grain=(state.resources.grain||0)+amount;showToast(`Raccolta +${amount} grano`)}else{state.resources.food+=amount;showToast(`Raccolta +${amount} cibo`)}
  }else if(id==="civic"){
    const c=Math.ceil(45+population()*3+lv*7);state.resources.coins+=c;showToast(`Lavori civici +${c} monete`)
  }else if(id==="festival"){
    const c=Math.ceil(20+lv*5);state.resources.coins+=c;state.happiness=clamp(state.happiness+8,0,100);showToast(`Festa +${c} monete · felicità +8`)
  }else{
    const wood=Math.ceil(5+lv*.8),stone=Math.ceil(3+lv*.55),goods=Math.max(1,Math.floor(lv/4));
    state.resources.wood+=wood;state.resources.stone+=stone;state.resources.goods+=goods;showToast(`Recupero +${wood} legno · +${stone} pietra · +${goods} merci`)
  }
  state.jobs[id]=Date.now()+JOBS[id].cooldown;save();renderJobs();updateUI()
}
function fmtTime(ms){const s=Math.ceil(ms/1000);return s<60?`${s}s`:`${Math.floor(s/60)}m ${s%60}s`}function renderJobs(){
  const box=$("jobsContent");if(!box)return;box.innerHTML="";
  for(const [id,j] of Object.entries(JOBS)){
    const ready=jobReady(id),b=document.createElement("button");b.className="jobCard"+(ready?" ready":"");b.disabled=!ready;
    b.innerHTML=`<div class="jobTop"><div><h3>${j.name}</h3></div><div class="jobIcon">${j.icon}</div></div><p>${j.desc}</p><div class="jobReward">${jobRewardText(id)}</div><div class="jobTimer">${ready?"PRONTO":`Ricarica ${fmtTime(jobRemain(id))}`}</div>`;
    b.onclick=()=>performJob(id);box.appendChild(b)
  }
  const readyCount=Object.keys(JOBS).filter(jobReady).length;$("workReady").textContent=readyCount?`${readyCount} ${readyCount===1?"attività pronta":"attività pronte"}`:"in ricarica"
}
$("workBtn").onclick=()=>{renderJobs();$("workPanel").classList.remove("hidden")};
$("closeWork").onclick=()=>$("workPanel").classList.add("hidden");
setInterval(()=>{renderJobs()},1000);

function missionState(){const m=MISSIONS[Math.min(state.mission,MISSIONS.length-1)],pr=m.progress(state);return{m,current:pr[0],target:pr[1],done:pr[0]>=pr[1]}}
function claimMission(){const ms=missionState();if(!ms.done)return;for(const[r,v]of Object.entries(ms.m.reward))state.resources[r]=(state.resources[r]||0)+v;state.claimed++;if(state.mission<MISSIONS.length-1)state.mission++;showToast("Obiettivo completato · premio ricevuto");save();updateUI()}
$("missionTop").onclick=claimMission;
function showToast(msg){$("toast").textContent=msg;$("toast").classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>$("toast").classList.remove("show"),1300)}

function statsHtml(){const e=economyPreview(),counts=Object.entries(BUILDINGS).map(([k,d])=>({name:d.name,n:countBuilding(k)})).filter(x=>x.n);return`<div class="statGrid"><div class="statCard"><b>Lv. ${townLevel()}</b><span>borgo</span></div><div class="statCard"><b>${state.tiles.filter(t=>t.unlocked).length}/${GRID*GRID}</b><span>zolle</span></div><div class="statCard"><b>${population()}</b><span>abitanti</span></div><div class="statCard"><b>${Math.round(state.happiness)}</b><span>felicità</span></div></div><div class="sectionTitle">BILANCIO / SECONDO</div><div class="list"><div class="listRow"><span>Monete</span><b>${e.coins>=0?"+":""}${e.coins.toFixed(2)}</b></div><div class="listRow"><span>Cibo</span><b>${e.food>=0?"+":""}${e.food.toFixed(2)}</b></div><div class="listRow"><span>Grano</span><b>${e.grain>=0?"+":""}${e.grain.toFixed(2)}</b></div><div class="listRow"><span>Farina</span><b>${e.flour>=0?"+":""}${e.flour.toFixed(2)}</b></div><div class="listRow"><span>Legno</span><b>${e.wood>=0?"+":""}${e.wood.toFixed(2)}</b></div><div class="listRow"><span>Pietra</span><b>${e.stone>=0?"+":""}${e.stone.toFixed(2)}</b></div><div class="listRow"><span>Merci</span><b>${e.goods>=0?"+":""}${e.goods.toFixed(2)}</b></div></div><div class="sectionTitle">EDIFICI</div><div class="list">${counts.length?counts.map(x=>`<div class="listRow"><span>${x.name}</span><b>${x.n}</b></div>`).join(""):'<div class="listRow"><span>Nessun edificio</span></div>'}</div><div class="actions" style="margin-top:9px"><button id="centerIsland" class="secondary">CENTRA ISOLA</button><button id="saveNow" class="secondary">SALVA</button><button id="resetGame" class="danger">RESET</button></div>`}
$("cityStatus").onclick=()=>{$("statsContent").innerHTML=statsHtml();$("statsPanel").classList.remove("hidden");bindStats()};
$("statsBtn").onclick=()=>{$("statsContent").innerHTML=statsHtml();$("statsPanel").classList.remove("hidden");bindStats()};$("closeStats").onclick=()=>$("statsPanel").classList.add("hidden");
function bindStats(){$("centerIsland").onclick=()=>{focusCity();$("statsPanel").classList.add("hidden")};$("saveNow").onclick=()=>{save();showToast("Partita salvata")};$("resetGame").onclick=()=>{if(confirm("Cancellare completamente l'isola?")){localStorage.removeItem(SAVE_KEY);state=defaultState();selected=null;camera.x=camera.y=0;camera.zoom=1.16;closeSheet();fit.didInitial=false;fit();$("statsPanel").classList.add("hidden");save();updateUI();showToast("Nuova isola")}}}
$("playBtn").onclick=()=>{$("welcome").classList.add("hidden");localStorage.setItem("zolla_seen_intro_v5","1")};

function save(){state.lastSave=Date.now();localStorage.setItem(SAVE_KEY,JSON.stringify(state))}
function applyOffline(){const secs=Math.min(8*3600,Math.max(0,(Date.now()-(state.lastSave||Date.now()))/1000));if(secs>20){const before={...state.resources};simulate(secs);const gains=Object.keys(before).map(r=>[r,(state.resources[r]||0)-before[r]]).filter(([,v])=>v>.5);if(gains.length)setTimeout(()=>showToast(`Produzione offline · +${fmt(Math.max(0,state.resources.coins-before.coins))} monete`),700)}state.lastSave=Date.now()}
function updateUI(){for(const r of["coins","food","grain","flour","wood","stone","goods"])$(r).textContent=fmt(state.resources[r]);$("population").textContent=fmt(population());$("happiness").textContent=Math.round(state.happiness);const lv=townLevel(),names=["Borgo","Villaggio","Paese","Cittadina","Città","Capoluogo","Metropoli"];$("townLevel").textContent=`${names[Math.min(names.length-1,Math.floor((lv-1)/3))]} · Lv. ${lv}`;const e=economyPreview();$("incomeText").textContent=`${e.coins>=0?"+":""}${e.coins.toFixed(1)} ●/s`;const ms=missionState();$("missionTopTitle").textContent=ms.done?`Riscatta: ${ms.m.title}`:ms.m.title;$("missionTop").classList.toggle("ready",ms.done);const readyJobs=Object.keys(JOBS).filter(jobReady).length;$("workReady").textContent=readyJobs?`${readyJobs} ${readyJobs===1?"attività pronta":"attività pronte"}`:"in ricarica";if(selected&&$("sheet").classList.contains("open"))renderSheet(selected)}
function loop(now){const dt=Math.min(.5,(now-lastFrame)/1000);lastFrame=now;simulateStep(dt);updateCityEvents(now);if(now-lastUi>300){updateUI();lastUi=now}render(now);requestAnimationFrame(loop)}

applyOffline();if(localStorage.getItem("zolla_seen_intro_v5")==="1"||localStorage.getItem("zolla_seen_intro_v4")==="1"||localStorage.getItem("zolla_seen_intro_v3")==="1"||localStorage.getItem("zolla_seen_intro_v2")==="1")$("welcome").classList.add("hidden");setInterval(save,5000);addEventListener("beforeunload",save);addEventListener("resize",fit,{passive:true});addEventListener("orientationchange",()=>setTimeout(fit,80),{passive:true});fit();updateUI();requestAnimationFrame(loop);
})();