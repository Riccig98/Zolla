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
function chainLabel(t){
 const m={farm:"Grano → Mulino",windmill:"Grano → Farina",bakery:"Farina → Cibo",lumber:"Legno → Officina",quarry:"Pietra → Officina",workshop:"Legno + Pietra → Merci",market:"Cibo + Merci → Monete",harbor:"Cibo + Merci → Commercio",house:"Cibo → Abitanti + tasse",park:"Supporto → Quartiere",monument:"Prestigio → Produzione globale"};
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
    ctx.strokeStyle="#d7caa2";ctx.beginPath();ctx.arc(p.x,p.y+3*s,9*s,0,Math.PI);ctx.fill()}
  }else if(t.building==="windmill"){
    ctx.fillStyle=c;ctx.fillRect(p.x-6*s,p.y-13*s,12*s,23*s);ctx.fillStyle="#c7bda8";ctx.beginPath();ctx.fillText=a;