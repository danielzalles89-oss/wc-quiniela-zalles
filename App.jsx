import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, addDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAE_GXAmfPbKtQsHRVZl28zitk3oYHfSWI",
  authDomain: "wc-quiniela-4d474.firebaseapp.com",
  projectId: "wc-quiniela-4d474",
  storageBucket: "wc-quiniela-4d474.firebasestorage.app",
  messagingSenderId: "631051017810",
  appId: "1:631051017810:web:cf4afd7f0cadd52292c98b"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// ─── MATCHES WITH KICKOFF TIMES (UTC) ────────────────────────────────────────
const GROUP_MATCHES = [
  { id:"G1",  date:"Jun 11", kickoff:"2026-06-11T19:00:00Z", home:"Mexico",       away:"South Africa",   group:"A" },
  { id:"G2",  date:"Jun 11", kickoff:"2026-06-12T02:00:00Z", home:"South Korea",  away:"Czechia",        group:"A" },
  { id:"G3",  date:"Jun 12", kickoff:"2026-06-12T19:00:00Z", home:"Canada",       away:"Bosnia & Herz.", group:"B" },
  { id:"G4",  date:"Jun 12", kickoff:"2026-06-13T01:00:00Z", home:"USA",          away:"Paraguay",       group:"D" },
  { id:"G5",  date:"Jun 13", kickoff:"2026-06-13T19:00:00Z", home:"Qatar",        away:"Switzerland",    group:"B" },
  { id:"G6",  date:"Jun 13", kickoff:"2026-06-13T22:00:00Z", home:"Brazil",       away:"Morocco",        group:"C" },
  { id:"G7",  date:"Jun 13", kickoff:"2026-06-14T01:00:00Z", home:"Haiti",        away:"Scotland",       group:"C" },
  { id:"G8",  date:"Jun 13", kickoff:"2026-06-14T04:00:00Z", home:"Australia",    away:"Turkey",         group:"D" },
  { id:"G9",  date:"Jun 14", kickoff:"2026-06-14T17:00:00Z", home:"Germany",      away:"Curaçao",        group:"E" },
  { id:"G10", date:"Jun 14", kickoff:"2026-06-14T20:00:00Z", home:"Netherlands",  away:"Japan",          group:"F" },
  { id:"G11", date:"Jun 14", kickoff:"2026-06-14T23:00:00Z", home:"Ivory Coast",  away:"Ecuador",        group:"E" },
  { id:"G12", date:"Jun 15", kickoff:"2026-06-15T02:00:00Z", home:"Sweden",       away:"Tunisia",        group:"F" },
  { id:"G13", date:"Jun 15", kickoff:"2026-06-15T17:00:00Z", home:"Spain",        away:"Cape Verde",     group:"H" },
  { id:"G14", date:"Jun 15", kickoff:"2026-06-15T20:00:00Z", home:"Belgium",      away:"Egypt",          group:"G" },
  { id:"G15", date:"Jun 15", kickoff:"2026-06-15T22:00:00Z", home:"Saudi Arabia", away:"Uruguay",        group:"H" },
  { id:"G16", date:"Jun 16", kickoff:"2026-06-16T01:00:00Z", home:"Iran",         away:"New Zealand",    group:"G" },
  { id:"G17", date:"Jun 16", kickoff:"2026-06-16T19:00:00Z", home:"France",       away:"Senegal",        group:"I" },
  { id:"G18", date:"Jun 16", kickoff:"2026-06-16T22:00:00Z", home:"Iraq",         away:"Norway",         group:"I" },
  { id:"G19", date:"Jun 17", kickoff:"2026-06-17T01:00:00Z", home:"Argentina",    away:"Algeria",        group:"J" },
  { id:"G20", date:"Jun 17", kickoff:"2026-06-17T04:00:00Z", home:"Austria",      away:"Jordan",         group:"J" },
  { id:"G21", date:"Jun 17", kickoff:"2026-06-17T17:00:00Z", home:"Portugal",     away:"DR Congo",       group:"K" },
  { id:"G22", date:"Jun 17", kickoff:"2026-06-17T20:00:00Z", home:"Uzbekistan",   away:"Colombia",       group:"K" },
  { id:"G23", date:"Jun 17", kickoff:"2026-06-17T22:00:00Z", home:"England",      away:"Panama",         group:"L" },
  { id:"G24", date:"Jun 18", kickoff:"2026-06-18T01:00:00Z", home:"Ghana",        away:"Croatia",        group:"L" },
  { id:"G25", date:"Jun 18", kickoff:"2026-06-18T17:00:00Z", home:"Mexico",       away:"South Korea",    group:"A" },
  { id:"G26", date:"Jun 18", kickoff:"2026-06-18T20:00:00Z", home:"Czechia",      away:"South Africa",   group:"A" },
  { id:"G27", date:"Jun 18", kickoff:"2026-06-18T23:00:00Z", home:"Switzerland",  away:"Bosnia & Herz.", group:"B" },
  { id:"G28", date:"Jun 19", kickoff:"2026-06-19T02:00:00Z", home:"Canada",       away:"Qatar",          group:"B" },
  { id:"G29", date:"Jun 19", kickoff:"2026-06-19T17:00:00Z", home:"USA",          away:"Australia",      group:"D" },
  { id:"G30", date:"Jun 19", kickoff:"2026-06-19T20:00:00Z", home:"Turkey",       away:"Paraguay",       group:"D" },
  { id:"G31", date:"Jun 19", kickoff:"2026-06-19T23:00:00Z", home:"Morocco",      away:"Haiti",          group:"C" },
  { id:"G32", date:"Jun 20", kickoff:"2026-06-20T02:00:00Z", home:"Brazil",       away:"Scotland",       group:"C" },
  { id:"G33", date:"Jun 20", kickoff:"2026-06-20T17:00:00Z", home:"Germany",      away:"Ivory Coast",    group:"E" },
  { id:"G34", date:"Jun 20", kickoff:"2026-06-20T20:00:00Z", home:"Ecuador",      away:"Curaçao",        group:"E" },
  { id:"G35", date:"Jun 20", kickoff:"2026-06-20T23:00:00Z", home:"Netherlands",  away:"Sweden",         group:"F" },
  { id:"G36", date:"Jun 21", kickoff:"2026-06-21T02:00:00Z", home:"Japan",        away:"Tunisia",        group:"F" },
  { id:"G37", date:"Jun 21", kickoff:"2026-06-21T17:00:00Z", home:"Belgium",      away:"Iran",           group:"G" },
  { id:"G38", date:"Jun 21", kickoff:"2026-06-21T20:00:00Z", home:"New Zealand",  away:"Egypt",          group:"G" },
  { id:"G39", date:"Jun 21", kickoff:"2026-06-21T23:00:00Z", home:"Spain",        away:"Saudi Arabia",   group:"H" },
  { id:"G40", date:"Jun 22", kickoff:"2026-06-22T02:00:00Z", home:"Uruguay",      away:"Cape Verde",     group:"H" },
  { id:"G41", date:"Jun 22", kickoff:"2026-06-22T17:00:00Z", home:"Argentina",    away:"Austria",        group:"J" },
  { id:"G42", date:"Jun 22", kickoff:"2026-06-22T20:00:00Z", home:"Jordan",       away:"Algeria",        group:"J" },
  { id:"G43", date:"Jun 22", kickoff:"2026-06-22T23:00:00Z", home:"France",       away:"Iraq",           group:"I" },
  { id:"G44", date:"Jun 23", kickoff:"2026-06-23T02:00:00Z", home:"Norway",       away:"Senegal",        group:"I" },
  { id:"G45", date:"Jun 23", kickoff:"2026-06-23T17:00:00Z", home:"Portugal",     away:"Uzbekistan",     group:"K" },
  { id:"G46", date:"Jun 23", kickoff:"2026-06-23T20:00:00Z", home:"Colombia",     away:"DR Congo",       group:"K" },
  { id:"G47", date:"Jun 23", kickoff:"2026-06-23T23:00:00Z", home:"England",      away:"Ghana",          group:"L" },
  { id:"G48", date:"Jun 24", kickoff:"2026-06-24T02:00:00Z", home:"Croatia",      away:"Panama",         group:"L" },
  { id:"G49", date:"Jun 24", kickoff:"2026-06-24T17:00:00Z", home:"South Korea",  away:"South Africa",   group:"A" },
  { id:"G50", date:"Jun 24", kickoff:"2026-06-24T20:00:00Z", home:"Mexico",       away:"Czechia",        group:"A" },
  { id:"G51", date:"Jun 24", kickoff:"2026-06-24T23:00:00Z", home:"Bosnia & Herz.",away:"Qatar",         group:"B" },
  { id:"G52", date:"Jun 25", kickoff:"2026-06-25T02:00:00Z", home:"Switzerland",  away:"Canada",         group:"B" },
  { id:"G53", date:"Jun 25", kickoff:"2026-06-25T17:00:00Z", home:"Scotland",     away:"Morocco",        group:"C" },
  { id:"G54", date:"Jun 25", kickoff:"2026-06-25T20:00:00Z", home:"Haiti",        away:"Brazil",         group:"C" },
  { id:"G55", date:"Jun 25", kickoff:"2026-06-25T20:00:00Z", home:"Ecuador",       away:"Germany",        group:"E" },
  { id:"G56", date:"Jun 25", kickoff:"2026-06-25T20:00:00Z", home:"Curaçao",       away:"Ivory Coast",    group:"E" },
  { id:"G57", date:"Jun 25", kickoff:"2026-06-25T23:00:00Z", home:"Japan",         away:"Sweden",         group:"F" },
  { id:"G58", date:"Jun 25", kickoff:"2026-06-25T23:00:00Z", home:"Tunisia",       away:"Netherlands",    group:"F" },
  { id:"G59", date:"Jun 25", kickoff:"2026-06-26T02:00:00Z", home:"Turkey",        away:"USA",            group:"D" },
  { id:"G60", date:"Jun 25", kickoff:"2026-06-26T02:00:00Z", home:"Paraguay",      away:"Australia",      group:"D" },
  { id:"G61", date:"Jun 26", kickoff:"2026-06-26T19:00:00Z", home:"Norway",        away:"France",         group:"I" },
  { id:"G62", date:"Jun 26", kickoff:"2026-06-26T19:00:00Z", home:"Senegal",       away:"Iraq",           group:"I" },
  { id:"G63", date:"Jun 26", kickoff:"2026-06-26T22:00:00Z", home:"Spain",         away:"Uruguay",        group:"H" },
  { id:"G64", date:"Jun 26", kickoff:"2026-06-26T22:00:00Z", home:"Saudi Arabia",  away:"Cape Verde",     group:"H" },
  { id:"G65", date:"Jun 26", kickoff:"2026-06-27T01:00:00Z", home:"Belgium",       away:"New Zealand",    group:"G" },
  { id:"G66", date:"Jun 26", kickoff:"2026-06-27T01:00:00Z", home:"Egypt",         away:"Iran",           group:"G" },
  { id:"G67", date:"Jun 27", kickoff:"2026-06-27T21:00:00Z", home:"Panama",       away:"England",        group:"L" },
  { id:"G68", date:"Jun 27", kickoff:"2026-06-27T21:00:00Z", home:"Croatia",      away:"Ghana",          group:"L" },
  { id:"G69", date:"Jun 27", kickoff:"2026-06-27T23:30:00Z", home:"Colombia",     away:"Portugal",       group:"K" },
  { id:"G70", date:"Jun 27", kickoff:"2026-06-27T23:30:00Z", home:"DR Congo",     away:"Uzbekistan",     group:"K" },
  { id:"G71", date:"Jun 28", kickoff:"2026-06-28T02:00:00Z", home:"Algeria",      away:"Austria",        group:"J" },
  { id:"G72", date:"Jun 28", kickoff:"2026-06-28T02:00:00Z", home:"Jordan",       away:"Argentina",      group:"J" },
];

const KNOCKOUT_SLOTS = [
  // Round of 32 - all kickoffs in EST
  { id:"R32-01", stage:"r32", home:"South Africa", away:"Canada",        date:"Jun 28", kickoff:"2026-06-28T15:00:00-05:00" }, // 3pm ET
  { id:"R32-02", stage:"r32", home:"Brazil",       away:"Japan",         date:"Jun 29", kickoff:"2026-06-29T13:00:00-04:00" }, // 1pm ET
  { id:"R32-03", stage:"r32", home:"Germany",      away:"Paraguay",      date:"Jun 29", kickoff:"2026-06-29T16:30:00-04:00" }, // 4:30pm ET
  { id:"R32-04", stage:"r32", home:"Netherlands",  away:"Morocco",       date:"Jun 29", kickoff:"2026-06-29T21:00:00-04:00" }, // 9pm ET
  { id:"R32-05", stage:"r32", home:"Ivory Coast",  away:"Norway",        date:"Jun 30", kickoff:"2026-06-30T13:00:00-04:00" }, // 1pm ET
  { id:"R32-06", stage:"r32", home:"France",       away:"Sweden",        date:"Jun 30", kickoff:"2026-06-30T17:00:00-04:00" }, // 5pm ET
  { id:"R32-07", stage:"r32", home:"Mexico",       away:"Ecuador",       date:"Jun 30", kickoff:"2026-06-30T21:00:00-04:00" }, // 9pm ET
  { id:"R32-08", stage:"r32", home:"England",      away:"DR Congo",      date:"Jul 1",  kickoff:"2026-07-01T12:00:00-04:00" }, // 12pm ET
  { id:"R32-09", stage:"r32", home:"Belgium",      away:"Senegal",       date:"Jul 1",  kickoff:"2026-07-01T21:00:00-04:00" }, // 9pm ET
  { id:"R32-10", stage:"r32", home:"USA",          away:"Bosnia & Herz.", date:"Jul 2", kickoff:"2026-07-02T01:00:00-04:00" }, // 1am ET (late Jul 1)
  { id:"R32-11", stage:"r32", home:"Spain",        away:"Austria",       date:"Jul 2",  kickoff:"2026-07-02T15:00:00-04:00" }, // 3pm ET
  { id:"R32-12", stage:"r32", home:"Portugal",     away:"Croatia",       date:"Jul 2",  kickoff:"2026-07-02T19:00:00-04:00" }, // 7pm ET
  { id:"R32-13", stage:"r32", home:"Switzerland",  away:"Algeria",       date:"Jul 2",  kickoff:"2026-07-02T23:00:00-04:00" }, // 11pm ET
  { id:"R32-14", stage:"r32", home:"Australia",    away:"Egypt",         date:"Jul 3",  kickoff:"2026-07-03T14:00:00-04:00" }, // 2pm ET
  { id:"R32-15", stage:"r32", home:"Argentina",    away:"Cape Verde",    date:"Jul 3",  kickoff:"2026-07-03T18:00:00-04:00" }, // 6pm ET
  { id:"R32-16", stage:"r32", home:"Colombia",     away:"Ghana",         date:"Jul 3",  kickoff:"2026-07-03T21:30:00-04:00" }, // 9:30pm ET
  // Round of 16
  { id:"R16-01", stage:"r16", home:"Canada",     away:"Morocco",   date:"Jul 4",  kickoff:"2026-07-04T17:00:00-04:00" },
  { id:"R16-02", stage:"r16", home:"Paraguay",   away:"France",    date:"Jul 4",  kickoff:"2026-07-04T21:00:00-04:00" },
  { id:"R16-03", stage:"r16", home:"Brazil",     away:"Norway",    date:"Jul 5",  kickoff:"2026-07-05T20:00:00-04:00" },
  { id:"R16-04", stage:"r16", home:"Mexico",     away:"England",   date:"Jul 5",  kickoff:"2026-07-06T00:00:00-04:00" },
  { id:"R16-05", stage:"r16", home:"Portugal",   away:"Spain",     date:"Jul 6",  kickoff:"2026-07-06T19:00:00-04:00" },
  { id:"R16-06", stage:"r16", home:"USA",        away:"Belgium",   date:"Jul 6",  kickoff:"2026-07-07T00:00:00-04:00" },
  { id:"R16-07", stage:"r16", home:"Argentina",  away:"Egypt",     date:"Jul 7",  kickoff:"2026-07-07T16:00:00-04:00" },
  { id:"R16-08", stage:"r16", home:"Switzerland",away:"Colombia",  date:"Jul 7",  kickoff:"2026-07-07T20:00:00-04:00" },
  // Quarter-Finals
  ...Array.from({length:4},(_,i)=>({ id:`QF-${String(i+1).padStart(2,"0")}`, stage:"qf", home:"TBD", away:"TBD", date:"Jul 9 – 11", kickoff:"2026-07-09T19:00:00Z" })),
  // Semi-Finals
  ...Array.from({length:2},(_,i)=>({ id:`SF-${String(i+1).padStart(2,"0")}`, stage:"sf", home:"TBD", away:"TBD", date:"Jul 14 – 15", kickoff:"2026-07-14T19:00:00Z" })),
  { id:"3RD",   stage:"3rd",   home:"TBD", away:"TBD", date:"Jul 18", kickoff:"2026-07-18T19:00:00Z" },
  { id:"FINAL", stage:"final", home:"TBD", away:"TBD", date:"Jul 19", kickoff:"2026-07-19T19:00:00Z" },
];

const ALL_MATCHES = [...GROUP_MATCHES, ...KNOCKOUT_SLOTS];

const BLOCKED_UIDS = ["FXxzxIOi98YIVmXfhWhuNKwg6cn2","IZ0zJImSUAUU7YCbCXp8k5UVOLs1"];

function isLocked(match) {
  const now = new Date();
  if (now >= new Date(match.kickoff)) return true;
  // Lock if any later match has already kicked off (anticheat)
  const matchTime = new Date(match.kickoff);
  return ALL_MATCHES.some(m => {
    const t = new Date(m.kickoff);
    return t > matchTime && now >= t;
  });
}

const FLAGS = {
  "Mexico":"🇲🇽","South Korea":"🇰🇷","Czechia":"🇨🇿","South Africa":"🇿🇦",
  "Switzerland":"🇨🇭","Canada":"🇨🇦","Qatar":"🇶🇦","Bosnia & Herz.":"🇧🇦",
  "Brazil":"🇧🇷","Morocco":"🇲🇦","Scotland":"🏴󠁧󠁢󠁳󠁣󠁴󠁿","Haiti":"🇭🇹",
  "USA":"🇺🇸","Turkey":"🇹🇷","Australia":"🇦🇺","Paraguay":"🇵🇾",
  "Germany":"🇩🇪","Ecuador":"🇪🇨","Ivory Coast":"🇨🇮","Curaçao":"🇨🇼",
  "Netherlands":"🇳🇱","Japan":"🇯🇵","Sweden":"🇸🇪","Tunisia":"🇹🇳",
  "Belgium":"🇧🇪","Egypt":"🇪🇬","Iran":"🇮🇷","New Zealand":"🇳🇿",
  "Spain":"🇪🇸","Uruguay":"🇺🇾","Saudi Arabia":"🇸🇦","Cape Verde":"🇨🇻",
  "France":"🇫🇷","Senegal":"🇸🇳","Norway":"🇳🇴","Iraq":"🇮🇶",
  "Argentina":"🇦🇷","Austria":"🇦🇹","Algeria":"🇩🇿","Jordan":"🇯🇴",
  "Portugal":"🇵🇹","Colombia":"🇨🇴","DR Congo":"🇨🇩","Uzbekistan":"🇺🇿",
  "England":"🏴󠁧󠁢󠁥󠁮󠁧󠁿","Croatia":"🇭🇷","Ghana":"🇬🇭","Panama":"🇵🇦",
  "TBD":"⬜",
};

const GROUPS = {
  A:["Mexico","South Korea","Czechia","South Africa"],
  B:["Switzerland","Canada","Qatar","Bosnia & Herz."],
  C:["Brazil","Morocco","Scotland","Haiti"],
  D:["USA","Turkey","Australia","Paraguay"],
  E:["Germany","Ecuador","Ivory Coast","Curaçao"],
  F:["Netherlands","Japan","Sweden","Tunisia"],
  G:["Belgium","Egypt","Iran","New Zealand"],
  H:["Spain","Uruguay","Saudi Arabia","Cape Verde"],
  I:["France","Senegal","Norway","Iraq"],
  J:["Argentina","Austria","Algeria","Jordan"],
  K:["Portugal","Colombia","DR Congo","Uzbekistan"],
  L:["England","Croatia","Ghana","Panama"],
};

const ADMIN_PW = "wc2026admin";
const STAGE_LABELS = { group:"Group Stage", r32:"Round of 32", r16:"Round of 16", qf:"Quarter-Finals", sf:"Semi-Finals", "3rd":"3rd Place", final:"Final" };
const STAGE_ORDER = ["group","r32","r16"];
const ALL_32_TEAMS = ["South Africa","Canada","Brazil","Japan","Germany","Paraguay","Netherlands","Morocco","Ivory Coast","Norway","France","Sweden","Mexico","Ecuador","England","DR Congo","Belgium","Senegal","USA","Bosnia & Herz.","Spain","Austria","Portugal","Croatia","Switzerland","Algeria","Australia","Egypt","Argentina","Cape Verde","Colombia","Ghana"];
const CHAMPION_BONUS_PTS = 10;

function groupByDate(matches) {
  const map = {};
  for (const m of matches) {
    if (!map[m.date]) map[m.date] = [];
    map[m.date].push(m);
  }
  return map;
}

function calcScore(pred, actual) {
  if (!actual||actual.h==null||actual.a==null||actual.h===""||actual.a==="") return 0;
  if (!pred||pred.h==null||pred.a==null||pred.h===""||pred.a==="") return 0;
  const ph=Number(pred.h),pa=Number(pred.a),ah=Number(actual.h),aa=Number(actual.a);
  if (isNaN(ph)||isNaN(pa)||isNaN(ah)||isNaN(aa)) return 0;
  if (ph===ah&&pa===aa) return 3;
  const pw=ph>pa?"h":ph<pa?"a":"d",aw=ah>aa?"h":ah<aa?"a":"d";
  return pw===aw?1:0;
}

const T = {
  bg:"#0a1a0f",bgCard:"#0d2114",bgDeep:"#061209",
  grass:"#1a4d2e",gold:"#f5c842",goldDim:"#c9a030",
  green:"#2ecc71",white:"#f0f4f0",muted:"#4a7a5a",border:"#1a3d25",
};

function FieldStripes() {
  return (
    <div style={{position:"fixed",inset:0,zIndex:0,overflow:"hidden",pointerEvents:"none",opacity:0.06}}>
      <svg width="100%" height="100%">
        {Array.from({length:20},(_,i)=>(
          <rect key={i} x="0" y={`${i*5}%`} width="100%" height="2.5%" fill={i%2===0?"#2ecc71":"#27ae60"}/>
        ))}
      </svg>
    </div>
  );
}

function ScoreInput({h,a,onChange,disabled}) {
  const s={width:42,textAlign:"center",padding:"7px 2px",background:disabled?"#0a1a0f":T.grass,border:`2px solid ${disabled?"#1a3a20":T.goldDim}`,borderRadius:8,color:disabled?"#2a4a30":T.gold,fontSize:18,fontWeight:900,outline:"none",cursor:disabled?"not-allowed":"text",fontFamily:"'Courier New',monospace"};
  return (
    <div style={{display:"flex",alignItems:"center",gap:6}}>
      <input type="number" min="0" max="99" value={h??""} disabled={disabled} onChange={e=>onChange({h:e.target.value,a})} style={s}/>
      <span style={{color:disabled?"#2a4a30":T.gold,fontWeight:900,fontSize:18,fontFamily:"monospace"}}>:</span>
      <input type="number" min="0" max="99" value={a??""} disabled={disabled} onChange={e=>onChange({h,a:e.target.value})} style={s}/>
    </div>
  );
}

function MatchCard({match,pred,actual,onChange,adminMode}) {
  const locked = !adminMode && isLocked(match);
  const hasActual=actual&&actual.h!=null&&actual.a!=null&&actual.h!==""&&actual.a!=="";
  const pts=hasActual?calcScore(pred||{},actual):null;
  const borderColor=pts===3?T.gold:pts===1?T.green:pts===0&&hasActual?"#c0392b":locked?"#132a1a":T.border;

  return (
    <div style={{background:pts===3?"#1a2a0a":T.bgCard,border:`1px solid ${borderColor}`,borderRadius:12,padding:"14px 16px",marginBottom:8,boxShadow:pts===3?`0 0 12px ${T.gold}44`:"none",opacity:locked&&!hasActual?0.75:1}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
        <div style={{display:"flex",alignItems:"center",gap:8,flex:1}}>
          <span style={{fontSize:22}}>{FLAGS[match.home]||"🏳️"}</span>
          <span style={{color:locked?T.muted:T.white,fontSize:13,fontWeight:700}}>{match.home}</span>
        </div>
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
          {hasActual&&<div style={{fontSize:11,color:T.muted}}>Result: <span style={{color:T.gold,fontWeight:700}}>{actual.h}:{actual.a}</span></div>}
          <ScoreInput h={pred?.h??""} a={pred?.a??""} onChange={onChange} disabled={locked}/>
          {locked&&!hasActual&&(
            <div style={{fontSize:10,color:"#e74c3c",letterSpacing:1,fontWeight:700,display:"flex",alignItems:"center",gap:3}}>
              🔒 LOCKED
            </div>
          )}
          {!locked&&<div style={{fontSize:10,color:T.muted,letterSpacing:1}}>YOUR PICK</div>}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8,flex:1,justifyContent:"flex-end"}}>
          <span style={{color:locked?T.muted:T.white,fontSize:13,fontWeight:700,textAlign:"right"}}>{match.away}</span>
          <span style={{fontSize:22}}>{FLAGS[match.away]||"🏳️"}</span>
        </div>
      </div>
      {pts!==null&&(
        <div style={{textAlign:"center",marginTop:8}}>
          <span style={{display:"inline-block",background:pts===3?"#f5c84222":pts===1?"#2ecc7122":"#e74c3c22",color:pts===3?T.gold:pts===1?T.green:"#e74c3c",padding:"3px 14px",borderRadius:20,fontSize:12,fontWeight:800}}>
            {pts===3?"🎯 Exact score! +3 pts":pts===1?"✓ Correct winner +1 pt":"✗ No points"}
          </span>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [user,setUser]=useState(null);
  const [authLoading,setAuthLoading]=useState(true);
  const [screen,setScreen]=useState("predictions");
  const [predictions,setPredictions]=useState({});
  const [actuals,setActuals]=useState({});
  const [allUsers,setAllUsers]=useState([]);
  const [activeStage,setActiveStage]=useState("group");
  const [adminStage,setAdminStage]=useState("group");
  const [saving,setSaving]=useState(false);
  const [saveMsg,setSaveMsg]=useState("");
  const [loading,setLoading]=useState(false);
  const [showAdminPw,setShowAdminPw]=useState(false);
  const [adminPw,setAdminPw]=useState("");
  const [isAdmin,setIsAdmin]=useState(false);
  const [activeGroup,setActiveGroup]=useState("ALL");
  const [adminGroup,setAdminGroup]=useState("ALL");
  const [allUserPreds,setAllUserPreds]=useState([]);
  const [loadingPreds,setLoadingPreds]=useState(false);
  const [auditLogs,setAuditLogs]=useState([]);
  const [loadingLogs,setLoadingLogs]=useState(false);

  async function loadAuditLog(){
    setLoadingLogs(true);
    const snap = await getDocs(collection(db,"pick_logs"));
    const logs = [];
    snap.forEach(d=>logs.push({id:d.id,...d.data()}));
    logs.sort((a,b)=>b.timestamp.localeCompare(a.timestamp));
    setAuditLogs(logs);
    setLoadingLogs(false);
  }

  // Autosave whenever predictions change + log every change
  useEffect(()=>{
    if(!user||Object.keys(predictions).length===0)return;
    const timer=setTimeout(async()=>{
      // Get previous predictions to detect changes
      const prevSnap = await getDoc(doc(db,"predictions",user.uid));
      const prev = prevSnap.exists() ? prevSnap.data() : {};

      // Save all predictions (no lock filter)
      await setDoc(doc(db,"predictions",user.uid),{
        ...predictions,
        _displayName:user.displayName||user.email,
        _photoURL:user.photoURL||null,
      },{merge:true});

      // Log any changed picks
      const now = new Date();
      for (const [key, val] of Object.entries(predictions)) {
        if (key.startsWith("_")) continue;
        const match = ALL_MATCHES.find(m=>m.id===key);
        if (!match) continue;
        const prevVal = prev[key];
        const changed = !prevVal || prevVal.h !== val.h || prevVal.a !== val.a;
        if (changed && val.h !== "" && val.a !== "") {
          const locked = now >= new Date(match.kickoff);
          await addDoc(collection(db,"pick_logs"),{
            uid: user.uid,
            name: user.displayName||user.email,
            matchId: key,
            match: `${match.home} vs ${match.away}`,
            date: match.date,
            oldPick: prevVal ? `${prevVal.h}-${prevVal.a}` : "none",
            newPick: `${val.h}-${val.a}`,
            timestamp: now.toISOString(),
            wasLocked: locked,
            kickoff: match.kickoff,
          });
        }
      }

      setSaveMsg("✓ Auto-saved");
      setTimeout(()=>setSaveMsg(""),2000);
    },300);
    return ()=>clearTimeout(timer);
  },[predictions]);

  useEffect(()=>{
    const unsub=onAuthStateChanged(auth,async u=>{
      setAuthLoading(false);
      if(u && BLOCKED_UIDS.includes(u.uid)){
        // Blocked user — sign them out immediately
        await signOut(auth);
        setUser(null);
        alert("Your account no longer has access to this app.");
        return;
      }
      setUser(u);
      if(u){
        // Auto-grant admin to Daniel's account, no password needed
        if(u.email==="danielzalles89@gmail.com"){
          setIsAdmin(true);
        }
        const snap=await getDoc(doc(db,"predictions",u.uid));
        if(snap.exists())setPredictions(snap.data());
        const aSnap=await getDoc(doc(db,"actuals","results"));
        if(aSnap.exists())setActuals(aSnap.data());
      }
    });
    return unsub;
  },[]);

  async function handleGoogleLogin(){try{await signInWithPopup(auth,provider);}catch(e){console.error(e);}}
  async function handleLogout(){await signOut(auth);setUser(null);setPredictions({});setIsAdmin(false);}

  async function loadLeaderboard(){
    setLoading(true);
    const aSnap=await getDoc(doc(db,"actuals","results"));
    const cur=aSnap.exists()?aSnap.data():{};
    const snap=await getDocs(collection(db,"predictions"));
    const users=[];
    snap.forEach(d=>{
      if(BLOCKED_UIDS.includes(d.id)) return;
      const p=d.data();
      let total=0;
      for(const m of ALL_MATCHES)total+=calcScore(p[m.id]||{},cur[m.id]||{});
      // Champion bonus
      if(p._champion && cur._champion && p._champion===cur._champion) total+=CHAMPION_BONUS_PTS;
      users.push({uid:d.id,name:p._displayName||d.id,photo:p._photoURL||null,total,champion:p._champion||null});
    });
    users.sort((a,b)=>b.total-a.total);
    setAllUsers(users);setLoading(false);
  }

  async function loadAllUserPreds(){
    setLoadingPreds(true);
    // Always reload actuals fresh from Firebase
    const aSnap = await getDoc(doc(db,"actuals","results"));
    if(aSnap.exists()) setActuals(aSnap.data());
    const snap=await getDocs(collection(db,"predictions"));
    const users=[];
    snap.forEach(d=>{
      if(BLOCKED_UIDS.includes(d.id)) return;
      const p=d.data();
      users.push({uid:d.id,name:p._displayName||d.id,photo:p._photoURL||null,preds:p});
    });
    setAllUserPreds(users);
    setLoadingPreds(false);
  }

  async function handleSave(){
    if(!user)return;setSaving(true);
    // Only save unlocked picks - prevent backdating
    const safePreds = {};
    await setDoc(doc(db,"predictions",user.uid),{...predictions,_displayName:user.displayName||user.email,_photoURL:user.photoURL||null},{merge:true});
    setSaveMsg("✓ Saved!");setTimeout(()=>setSaveMsg(""),2500);setSaving(false);
  }

  async function handleSaveActuals(){
    setSaving(true);
    await setDoc(doc(db,"actuals","results"),actuals);
    setSaveMsg("✓ Results saved!");setTimeout(()=>setSaveMsg(""),2500);setSaving(false);
  }

  function exportCSV() {
    // Use ORIGINAL calendar (what users saw when making picks)
    const ORIGINAL_MATCHES = GROUP_MATCHES;

    const rows = [];
    const userNames = allUserPreds.map(u => u.name);
    rows.push(["G-ID","Date","Home","Away","Result H","Result A",
      ...userNames.flatMap(n=>[`${n} H`,`${n} A`,`${n} Pts`])]);

    for (const m of ORIGINAL_MATCHES) {
      const actual = actuals[m.id];
      const hasResult = actual && actual.h !== "" && actual.a !== "";
      const resultH = hasResult ? actual.h : "";
      const resultA = hasResult ? actual.a : "";

      const userCols = allUserPreds.flatMap(u => {
        const pred = u.preds[m.id];
        const h = pred && pred.h !== "" ? pred.h : "";
        const a = pred && pred.a !== "" ? pred.a : "";
        let pts = "";
        if (hasResult && h !== "" && a !== "") {
          const ph=Number(h),pa=Number(a),ah=Number(actual.h),aa=Number(actual.a);
          if (ph===ah&&pa===aa) pts="3 ⭐";
          else {
            const pw=ph>pa?"h":ph<pa?"a":"d", aw=ah>aa?"h":ah<aa?"a":"d";
            pts = pw===aw ? "1 ✓" : "0";
          }
        }
        return [h, a, pts];
      });

      rows.push([m.id, m.date, m.home, m.away, resultH, resultA, ...userCols]);
    }

    const csv = rows.map(row =>
      row.map(cell => `"${String(cell).replace(/"/g,'""')}"`).join(",")
    ).join("\n");

    const blob = new Blob(["\uFEFF" + csv], {type:"text/csv;charset=utf-8;"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `quiniela_zalles_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function myTotal(){
    const matchPts = ALL_MATCHES.reduce((s,m)=>s+calcScore(predictions[m.id]||{},actuals[m.id]||{}),0);
    const championPts = (predictions._champion && actuals._champion && predictions._champion===actuals._champion) ? CHAMPION_BONUS_PTS : 0;
    return matchPts + championPts;
  }

  const filteredGroupMatches = activeGroup==="ALL"?GROUP_MATCHES:GROUP_MATCHES.filter(m=>m.group===activeGroup);
  const filteredAdminMatches = adminGroup==="ALL"?GROUP_MATCHES:GROUP_MATCHES.filter(m=>m.group===adminGroup);
  const groupedByDate = groupByDate(filteredGroupMatches);
  const adminGroupedByDate = groupByDate(filteredAdminMatches);
  const kMatches = KNOCKOUT_SLOTS.filter(m=>m.stage===activeStage);
  const akMatches = KNOCKOUT_SLOTS.filter(m=>m.stage===adminStage);

  if(authLoading)return(<div style={{minHeight:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{color:T.gold,fontSize:40}}>⚽</div></div>);

  if(!user)return(
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20,position:"relative",overflow:"hidden"}}>
      <FieldStripes/>
      <div style={{position:"relative",zIndex:1,textAlign:"center",maxWidth:420,width:"100%"}}>
        <div style={{fontSize:72,marginBottom:8,filter:`drop-shadow(0 0 20px ${T.gold}66)`}}>🏆</div>
        <div style={{fontSize:11,color:T.gold,letterSpacing:6,textTransform:"uppercase",fontWeight:700,marginBottom:8}}>FIFA</div>
        <h1 style={{fontSize:38,fontWeight:900,color:T.white,margin:"0 0 4px",letterSpacing:-1}}>World Cup</h1>
        <div style={{fontSize:32,fontWeight:900,marginBottom:6,background:`linear-gradient(135deg,${T.gold},#fff176)`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>2026</div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:32}}>
          {["🇺🇸","🇨🇦","🇲🇽"].map(f=><span key={f} style={{fontSize:20}}>{f}</span>)}
          <span style={{color:T.muted,fontSize:13,fontWeight:600}}>USA · Canada · Mexico</span>
        </div>
        <div style={{background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:16,padding:"28px 24px",boxShadow:"0 20px 60px #00000066"}}>
          <div style={{color:T.muted,fontSize:14,marginBottom:20,fontWeight:600}}>Sign in to join the quiniela</div>
          <button onClick={handleGoogleLogin} style={{width:"100%",padding:"14px",fontSize:15,fontWeight:800,background:"#fff",color:"#1a1a1a",border:"none",borderRadius:10,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:12}}>
            <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
            Sign in with Google
          </button>
          <div style={{marginTop:20,borderTop:`1px solid ${T.border}`,paddingTop:16}}>
            {!showAdminPw?(
              <button onClick={()=>setShowAdminPw(true)} style={{background:"none",border:"none",color:"#1a3d25",fontSize:11,cursor:"pointer",letterSpacing:2}}>···</button>
            ):(
              <div style={{display:"flex",gap:8}}>
                <input type="password" placeholder="Admin password" value={adminPw} onChange={e=>setAdminPw(e.target.value)}
                  onKeyDown={e=>{if(e.key==="Enter"){if(adminPw===ADMIN_PW){setIsAdmin(true);setShowAdminPw(false);}else{alert("Wrong password");setAdminPw("");}}}}
                  style={{flex:1,padding:"10px 12px",fontSize:13,background:T.bgDeep,border:`1px solid ${T.border}`,borderRadius:8,color:T.white,outline:"none"}}/>
                <button onClick={()=>{if(adminPw===ADMIN_PW){setIsAdmin(true);setShowAdminPw(false);}else{alert("Wrong password");setAdminPw("");}}}
                  style={{padding:"10px 16px",background:T.grass,border:`1px solid ${T.border}`,borderRadius:8,color:T.gold,fontWeight:700,cursor:"pointer"}}>Go</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return(
    <div style={{minHeight:"100vh",background:T.bg,color:T.white,fontFamily:"'Inter','Segoe UI',sans-serif",position:"relative"}}>
      <FieldStripes/>
      <div style={{background:T.bgDeep,borderBottom:`1px solid ${T.border}`,padding:"10px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8,position:"sticky",top:0,zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:20}}>🏆</span>
          <div>
            <div style={{color:T.gold,fontWeight:900,fontSize:14}}>Zalles WC 2026 Quiniela</div>
            <div style={{color:T.muted,fontSize:11}}>{isAdmin?`⚙️ Admin · ${user.displayName||user.email}`:`${user.displayName||user.email}`}</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {user.photoURL&&<img src={user.photoURL} style={{width:28,height:28,borderRadius:"50%",border:`2px solid ${T.gold}`}} alt=""/>}
          <div style={{background:T.grass,border:`1px solid ${T.goldDim}`,padding:"5px 14px",borderRadius:20,color:T.gold,fontWeight:900,fontSize:15}}>{myTotal()} pts</div>
          <button onClick={handleLogout} style={{background:"none",border:`1px solid ${T.border}`,color:T.muted,borderRadius:6,padding:"5px 12px",cursor:"pointer",fontSize:12}}>Sign out</button>
        </div>
      </div>

      <div style={{display:"flex",gap:2,padding:"10px 12px",background:T.bgDeep,borderBottom:`1px solid ${T.border}`,overflowX:"auto"}}>
        {[
          {key:"predictions",icon:"📋",label:"Predictions"},
          {key:"leaderboard",icon:"🏅",label:"Leaderboard"},
          ...(isAdmin?[
            {key:"viewpreds",icon:"🔍",label:"View All"},
            {key:"admin",icon:"⚙️",label:"Results"},
            {key:"auditlog",icon:"🕵️",label:"Audit Log"},
          ]:[]),
        ].map(tab=>(
          <button key={tab.key} onClick={()=>{setScreen(tab.key);if(tab.key==="leaderboard")loadLeaderboard();if(tab.key==="viewpreds")loadAllUserPreds();if(tab.key==="auditlog")loadAuditLog();}}
            style={{padding:"8px 18px",borderRadius:8,border:"none",cursor:"pointer",fontSize:13,fontWeight:700,whiteSpace:"nowrap",background:screen===tab.key?T.grass:"transparent",color:screen===tab.key?T.gold:T.muted,borderBottom:screen===tab.key?`2px solid ${T.gold}`:"2px solid transparent"}}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {screen==="predictions"&&(
        <div style={{maxWidth:660,margin:"0 auto",padding:"16px",position:"relative",zIndex:1}}>
          {/* Stage selector */}
          <div style={{display:"flex",gap:6,marginBottom:16,background:T.bgDeep,padding:6,borderRadius:10,border:`1px solid ${T.border}`}}>
            {STAGE_ORDER.map(s=>(
              <button key={s} onClick={()=>setActiveStage(s)}
                style={{flex:1,padding:"8px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:800,fontSize:12,
                  background:activeStage===s?T.grass:"transparent",color:activeStage===s?T.gold:T.muted}}>
                {s==="group"?"⚽ Grupos":s==="r32"?"⚔️ R32":"🏆 R16"}
              </button>
            ))}
          </div>
          {activeStage==="group"&&(
            <>
              <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
                <button onClick={()=>setActiveGroup("ALL")} style={{padding:"6px 14px",borderRadius:8,border:`1px solid ${activeGroup==="ALL"?T.gold:T.border}`,cursor:"pointer",fontWeight:900,fontSize:12,background:activeGroup==="ALL"?T.grass:"transparent",color:activeGroup==="ALL"?T.gold:T.muted}}>All</button>
                {Object.keys(GROUPS).map(g=>(
                  <button key={g} onClick={()=>setActiveGroup(g)} style={{width:36,height:36,borderRadius:8,border:`1px solid ${activeGroup===g?T.gold:T.border}`,cursor:"pointer",fontWeight:900,fontSize:14,background:activeGroup===g?T.grass:"transparent",color:activeGroup===g?T.gold:T.muted}}>{g}</button>
                ))}
              </div>
              <div style={{background:"#0a1a10",border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 14px",marginBottom:14,display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:14}}>🔒</span>
                <span style={{color:T.muted,fontSize:12}}>Predictions lock automatically at kickoff time</span>
              </div>
              {Object.entries(groupedByDate).map(([date,matches])=>(
                <div key={date}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8,marginTop:16}}>
                    <div style={{height:1,flex:1,background:T.border}}/>
                    <div style={{color:T.gold,fontSize:12,fontWeight:800,letterSpacing:1,textTransform:"uppercase",background:T.bgDeep,padding:"3px 12px",borderRadius:20,border:`1px solid ${T.border}`}}>📅 {date}</div>
                    <div style={{height:1,flex:1,background:T.border}}/>
                  </div>
                  {matches.map(m=>(
                    <MatchCard key={m.id} match={m} pred={predictions[m.id]} actual={actuals[m.id]}
                      onChange={val=>setPredictions(p=>({...p,[m.id]:{...p[m.id],...val}}))} adminMode={false}/>
                  ))}
                </div>
              ))}
            </>
          )}

          {activeStage==="r32"&&(
            <>
              {/* Champion Picker */}
              <div style={{background:`linear-gradient(135deg,#1a1200,#0d2200)`,border:`2px solid ${T.gold}`,borderRadius:14,padding:"16px",marginBottom:20}}>
                <div style={{color:T.gold,fontWeight:900,fontSize:15,marginBottom:4}}>🏆 ¿Quién ganará el Mundial?</div>
                <div style={{color:T.muted,fontSize:12,marginBottom:12}}>Bonus de <span style={{color:T.gold,fontWeight:900}}>+10 pts</span> si aciertas al Campeón. Se bloquea cuando empiece el primer partido del R32.</div>
                {new Date() >= new Date("2026-06-28T19:00:00Z") ? (
                  <div style={{color:predictions._champion?T.gold:T.muted,fontWeight:800,fontSize:14}}>
                    {predictions._champion ? `🏆 Tu pick: ${FLAGS[predictions._champion]||""} ${predictions._champion}` : "No elegiste campeón"}
                  </div>
                ) : (
                  <select
                    value={predictions._champion||""}
                    onChange={e=>setPredictions(p=>({...p,_champion:e.target.value}))}
                    style={{width:"100%",padding:"10px",borderRadius:8,border:`1px solid ${T.gold}`,background:T.bgCard,color:T.text,fontSize:14,fontWeight:700}}
                  >
                    <option value="">-- Elige un equipo --</option>
                    {ALL_32_TEAMS.sort().map(t=>(
                      <option key={t} value={t}>{FLAGS[t]||""} {t}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* R32 Matches */}
              <div style={{background:"#0a1a10",border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 14px",marginBottom:14,display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:14}}>🔒</span>
                <span style={{color:T.muted,fontSize:12}}>Predictions lock at each match's kickoff time</span>
              </div>
              {KNOCKOUT_SLOTS.filter(m=>m.stage==="r32").map(m=>(
                <MatchCard key={m.id} match={m} pred={predictions[m.id]} actual={actuals[m.id]}
                  onChange={val=>setPredictions(p=>({...p,[m.id]:{...p[m.id],...val}}))} adminMode={false}/>
              ))}
            </>
          )}

          {activeStage==="r16"&&(
            <>
              <div style={{background:"#0a1a10",border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 14px",marginBottom:14,display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:14}}>🔒</span>
                <span style={{color:T.muted,fontSize:12}}>Predictions lock at each match's kickoff time</span>
              </div>
              {KNOCKOUT_SLOTS.filter(m=>m.stage==="r16").map(m=>(
                <MatchCard key={m.id} match={m} pred={predictions[m.id]} actual={actuals[m.id]}
                  onChange={val=>setPredictions(p=>({...p,[m.id]:{...p[m.id],...val}}))} adminMode={false}/>
              ))}
            </>
          )}



          <div style={{marginTop:20,display:"flex",alignItems:"center",gap:12,position:"sticky",bottom:12}}>
            <button onClick={handleSave} disabled={saving} style={{flex:1,padding:"14px",fontSize:15,fontWeight:900,background:`linear-gradient(135deg,${T.gold},${T.goldDim})`,color:T.bgDeep,border:"none",borderRadius:12,cursor:"pointer",opacity:saving?0.6:1}}>
              {saving?"Saving...":"💾 Save Predictions"}
            </button>
            {saveMsg&&<span style={{color:T.green,fontWeight:800}}>{saveMsg}</span>}
          </div>
          <div style={{color:T.muted,fontSize:11,textAlign:"center",marginTop:10,letterSpacing:0.5}}>
            ✓ Correct winner = 1 pt · 🎯 Exact score = 3 pts
            <span style={{marginLeft:8,color:"#2ecc71"}}>💾 Auto-saves as you type</span>
          </div>
        </div>
      )}

      {/* ── VIEW ALL PREDICTIONS (admin only) ── */}
      {screen==="viewpreds"&&isAdmin&&(
        <div style={{maxWidth:720,margin:"0 auto",padding:"16px",position:"relative",zIndex:1}}>
          <div style={{color:T.gold,fontWeight:900,fontSize:18,marginBottom:4}}>🔍 All Predictions</div>
          <div style={{color:T.muted,fontSize:12,marginBottom:12}}>You can edit any player's prediction directly. Changes save immediately.</div>

          {/* Stage selector */}
          <div style={{display:"flex",gap:6,marginBottom:16,background:T.bgDeep,padding:6,borderRadius:10,border:`1px solid ${T.border}`}}>
            {STAGE_ORDER.map(s=>(
              <button key={s} onClick={()=>setActiveStage(s)}
                style={{flex:1,padding:"8px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:800,fontSize:12,
                  background:activeStage===s?T.grass:"transparent",color:activeStage===s?T.gold:T.muted}}>
                {s==="group"?"⚽ Grupos":s==="r32"?"⚔️ R32":"🏆 R16"}
              </button>
            ))}
          </div>

          {loadingPreds?(
            <div style={{textAlign:"center",color:T.muted,padding:40}}>Loading...</div>
          ):allUserPreds.length===0?(
            <div style={{textAlign:"center",color:T.muted,padding:40}}>No predictions saved yet.</div>
          ):(()=>{
            const allMatches = activeStage==="group" ? GROUP_MATCHES : KNOCKOUT_SLOTS.filter(m=>m.stage===activeStage);
            return (<>
              {/* Champion picks - only in R32 tab */}
              {activeStage==="r32"&&(
                <div style={{background:T.bgCard,border:`2px solid ${T.gold}`,borderRadius:12,padding:14,marginBottom:12}}>
                  <div style={{color:T.gold,fontWeight:900,fontSize:14,marginBottom:10}}>🏆 Campeón del Mundial</div>
                  {allUserPreds.map(u=>{
                    const champion = u.preds._champion||null;
                    const actualChampion = actuals._champion||null;
                    const hit = champion && actualChampion && champion===actualChampion;
                    return (
                      <div key={u.uid} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 0",borderTop:`1px solid ${T.border}33`,gap:8,flexWrap:"wrap"}}>
                        <div style={{display:"flex",alignItems:"center",gap:8,minWidth:120}}>
                          {u.photo&&<img src={u.photo} style={{width:24,height:24,borderRadius:"50%"}} alt=""/>}
                          <span style={{color:T.white,fontSize:13,fontWeight:600}}>{u.name}</span>
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <select
                            value={champion||""}
                            onChange={async e=>{
                              const val = e.target.value;
                              const newPreds = {...u.preds, _champion: val};
                              setAllUserPreds(prev=>prev.map(x=>x.uid===u.uid?{...x,preds:newPreds}:x));
                              await setDoc(doc(db,"predictions",u.uid),{_champion:val},{merge:true});
                            }}
                            style={{padding:"4px 8px",borderRadius:6,border:`1px solid ${hit?T.gold:T.border}`,background:T.bgDeep,color:champion?T.white:T.muted,fontSize:12,fontWeight:700}}
                          >
                            <option value="">-- Sin pick --</option>
                            {ALL_32_TEAMS.sort().map(t=>(
                              <option key={t} value={t}>{FLAGS[t]||""} {t}</option>
                            ))}
                          </select>
                          {hit&&<span style={{color:T.gold,fontWeight:900,fontSize:12,background:"#f5c84222",padding:"2px 8px",borderRadius:10}}>+{CHAMPION_BONUS_PTS} 🏆</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {allMatches.map(m=>{
              const actual = actuals[m.id];
              const hasActual = actual&&actual.h!==""&&actual.a!=="";
              const locked = isLocked(m);
              return (
                <div key={m.id} style={{background:T.bgCard,border:`1px solid ${locked?T.border:"#1a4a2e"}`,borderRadius:12,padding:14,marginBottom:12}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10,flexWrap:"wrap",gap:8}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <span style={{fontSize:20}}>{FLAGS[m.home]||"🏳️"}</span>
                      <span style={{color:T.white,fontWeight:800,fontSize:14}}>{m.home} vs {m.away}</span>
                      <span style={{fontSize:20}}>{FLAGS[m.away]||"🏳️"}</span>
                      <span style={{color:T.muted,fontSize:11}}>· {m.date}</span>
                      {!locked&&<span style={{background:"#1a4a2e",color:"#2ecc71",padding:"2px 8px",borderRadius:20,fontSize:10,fontWeight:700}}>OPEN</span>}
                      {locked&&!hasActual&&<span style={{background:"#1a1a00",color:"#f5c842",padding:"2px 8px",borderRadius:20,fontSize:10,fontWeight:700}}>🔒 LOCKED</span>}
                    </div>
                    {hasActual?(
                      <span style={{background:"#f5c84222",color:T.gold,padding:"3px 12px",borderRadius:20,fontWeight:900,fontSize:13,fontFamily:"monospace"}}>
                        Result: {actual.h}:{actual.a}
                      </span>
                    ):(
                      <span style={{background:T.bgDeep,color:T.muted,padding:"3px 12px",borderRadius:20,fontSize:11}}>No result yet</span>
                    )}
                  </div>

                  {allUserPreds.map((u,i)=>{
                    const p = u.preds[m.id]||{h:"",a:""};
                    const hasPred = p.h!==""&&p.a!=="";
                    const pts = hasPred&&hasActual ? calcScore(p,actual) : null;
                    return (
                      <div key={u.uid} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 0",borderTop:`1px solid ${T.border}33`,gap:12,flexWrap:"wrap"}}>
                        <div style={{display:"flex",alignItems:"center",gap:8,minWidth:120}}>
                          {u.photo&&<img src={u.photo} style={{width:24,height:24,borderRadius:"50%"}} alt=""/>}
                          <span style={{color:hasPred?T.white:T.muted,fontSize:13,fontWeight:600}}>{u.name}</span>
                          {!hasPred&&<span style={{color:"#e74c3c",fontSize:10,fontWeight:700,background:"#e74c3c22",padding:"1px 6px",borderRadius:10}}>NO PICK</span>}
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <div style={{display:"flex",alignItems:"center",gap:4}}>
                            <input type="number" min="0" max="99"
                              value={p.h??""}
                              onChange={async e=>{
                                const newH = e.target.value;
                                const newPreds = {...u.preds,[m.id]:{...p,h:newH}};
                                setAllUserPreds(prev=>prev.map(x=>x.uid===u.uid?{...x,preds:newPreds}:x));
                                await setDoc(doc(db,"predictions",u.uid),{...newPreds,_displayName:u.name,_photoURL:u.photo||null},{merge:true});
                              }}
                              style={{width:40,textAlign:"center",padding:"5px 2px",background:T.grass,border:`1px solid ${T.goldDim}`,borderRadius:6,color:T.gold,fontSize:16,fontWeight:900,fontFamily:"monospace",outline:"none"}}
                            />
                            <span style={{color:T.gold,fontWeight:900}}>:</span>
                            <input type="number" min="0" max="99"
                              value={p.a??""}
                              onChange={async e=>{
                                const newA = e.target.value;
                                const newPreds = {...u.preds,[m.id]:{...p,a:newA}};
                                setAllUserPreds(prev=>prev.map(x=>x.uid===u.uid?{...x,preds:newPreds}:x));
                                await setDoc(doc(db,"predictions",u.uid),{...newPreds,_displayName:u.name,_photoURL:u.photo||null},{merge:true});
                              }}
                              style={{width:40,textAlign:"center",padding:"5px 2px",background:T.grass,border:`1px solid ${T.goldDim}`,borderRadius:6,color:T.gold,fontSize:16,fontWeight:900,fontFamily:"monospace",outline:"none"}}
                            />
                          </div>
                          {pts!==null&&(
                            <span style={{background:pts===3?"#f5c84222":pts===1?"#2ecc7122":"#e74c3c22",color:pts===3?T.gold:pts===1?"#2ecc71":"#e74c3c",padding:"2px 10px",borderRadius:20,fontSize:12,fontWeight:800,minWidth:32,textAlign:"center"}}>
                              +{pts}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
            </>);
          })()}
          <div style={{display:"flex",gap:8,marginTop:8}}>
            <button onClick={loadAllUserPreds} style={{flex:1,padding:"12px",fontSize:13,fontWeight:700,background:"transparent",border:`1px solid ${T.border}`,borderRadius:10,color:T.muted,cursor:"pointer"}}>🔄 Refresh</button>
            <button onClick={exportCSV} disabled={allUserPreds.length===0} style={{flex:1,padding:"12px",fontSize:13,fontWeight:700,background:allUserPreds.length===0?"transparent":`linear-gradient(135deg,${T.grass},#1a5a30)`,border:`1px solid ${T.gold}`,borderRadius:10,color:T.gold,cursor:"pointer",opacity:allUserPreds.length===0?0.4:1}}>📥 Export CSV</button>
          </div>
        </div>
      )}

      {screen==="leaderboard"&&(
        <div style={{maxWidth:600,margin:"0 auto",padding:"20px 16px",position:"relative",zIndex:1}}>
          <div style={{textAlign:"center",marginBottom:24}}>
            <div style={{fontSize:36}}>🏅</div>
            <h2 style={{color:T.gold,fontWeight:900,margin:"4px 0 2px",fontSize:22}}>Leaderboard</h2>
            <div style={{color:T.muted,fontSize:13}}>Zalles World Cup 2026 Quiniela</div>
          </div>
          {loading?(<div style={{textAlign:"center",color:T.muted,padding:40}}>Loading...</div>
          ):allUsers.length===0?(<div style={{textAlign:"center",color:T.muted,padding:40}}><div style={{fontSize:40,marginBottom:12}}>⚽</div>No predictions yet!</div>
          ):allUsers.map((u,i)=>{
            const isMe=u.uid===user.uid;
            const medals=["🥇","🥈","🥉"];
            return(
              <div key={u.uid} style={{background:isMe?T.grass:T.bgCard,border:`1px solid ${isMe?T.gold:T.border}`,borderRadius:12,padding:"14px 18px",marginBottom:8,display:"flex",alignItems:"center",justifyContent:"space-between",boxShadow:isMe?`0 0 16px ${T.gold}33`:"none"}}>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <span style={{fontSize:22,minWidth:32}}>{medals[i]||`#${i+1}`}</span>
                  {u.photo&&<img src={u.photo} style={{width:32,height:32,borderRadius:"50%",border:`2px solid ${isMe?T.gold:T.border}`}} alt=""/>}
                  <div>
                    <div style={{color:isMe?T.gold:T.white,fontWeight:800,fontSize:15}}>{u.name}{isMe&&" (you)"}</div>
                    <div style={{color:T.muted,fontSize:11}}>Rank #{i+1}</div>
                  </div>
                </div>
                <div style={{background:isMe?"#f5c84222":T.bgDeep,border:`1px solid ${isMe?T.gold:T.border}`,padding:"6px 18px",borderRadius:20,color:isMe?T.gold:T.white,fontWeight:900,fontSize:18}}>
                  {u.total}<span style={{fontSize:11,fontWeight:400,color:T.muted,marginLeft:3}}>pts</span>
                </div>
              </div>
            );
          })}
          <button onClick={loadLeaderboard} style={{marginTop:16,width:"100%",padding:"12px",fontSize:13,fontWeight:700,background:"transparent",border:`1px solid ${T.border}`,borderRadius:10,color:T.muted,cursor:"pointer"}}>🔄 Refresh</button>
        </div>
      )}

      {screen==="admin"&&isAdmin&&(
        <div style={{maxWidth:660,margin:"0 auto",padding:"16px",position:"relative",zIndex:1}}>
          <div style={{background:"#1a0a00",border:"1px solid #5a3000",borderRadius:12,padding:"12px 16px",marginBottom:20,display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:20}}>⚙️</span>
            <div>
              <div style={{color:T.gold,fontWeight:800,fontSize:14}}>Admin — Enter Real Results</div>
              <div style={{color:"#8a6030",fontSize:12}}>Scores update everyone's points automatically.</div>
            </div>
          </div>
          {/* Admin stage selector */}
          <div style={{display:"flex",gap:6,marginBottom:16,background:T.bgDeep,padding:6,borderRadius:10,border:`1px solid ${T.border}`}}>
            {STAGE_ORDER.map(s=>(
              <button key={s} onClick={()=>setAdminStage(s)}
                style={{flex:1,padding:"8px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:800,fontSize:12,
                  background:adminStage===s?"#2a1a00":"transparent",color:adminStage===s?T.gold:T.muted}}>
                {s==="group"?"⚽ Grupos":s==="r32"?"⚔️ R32":"🏆 R16"}
              </button>
            ))}
          </div>

          {adminStage==="group"&&(
            <>
              <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
                <button onClick={()=>setAdminGroup("ALL")} style={{padding:"6px 14px",borderRadius:8,border:`1px solid ${adminGroup==="ALL"?T.gold:T.border}`,cursor:"pointer",fontWeight:900,fontSize:12,background:adminGroup==="ALL"?T.grass:"transparent",color:adminGroup==="ALL"?T.gold:T.muted}}>All</button>
                {Object.keys(GROUPS).map(g=>(
                  <button key={g} onClick={()=>setAdminGroup(g)} style={{width:36,height:36,borderRadius:8,border:`1px solid ${adminGroup===g?T.gold:T.border}`,cursor:"pointer",fontWeight:900,fontSize:14,background:adminGroup===g?"#2a1a00":"transparent",color:adminGroup===g?T.gold:T.muted}}>{g}</button>
                ))}
              </div>
              {Object.entries(adminGroupedByDate).map(([date,matches])=>(
                <div key={date}>
                  <div style={{color:T.gold,fontSize:11,fontWeight:800,letterSpacing:1,marginBottom:6,marginTop:12,textTransform:"uppercase"}}>📅 {date}</div>
                  {matches.map(m=>(
                    <div key={m.id} style={{background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:12,padding:"12px 16px",marginBottom:8}}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
                        <div style={{display:"flex",alignItems:"center",gap:6,flex:1}}>
                          <span style={{fontSize:18}}>{FLAGS[m.home]||"🏳️"}</span>
                          <span style={{color:T.white,fontSize:13,fontWeight:600}}>{m.home}</span>
                        </div>
                        <ScoreInput h={actuals[m.id]?.h??""} a={actuals[m.id]?.a??""} onChange={val=>setActuals(p=>({...p,[m.id]:{...p[m.id],...val}}))} disabled={false}/>
                        <div style={{display:"flex",alignItems:"center",gap:6,flex:1,justifyContent:"flex-end"}}>
                          <span style={{color:T.white,fontSize:13,fontWeight:600}}>{m.away}</span>
                          <span style={{fontSize:18}}>{FLAGS[m.away]||"🏳️"}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </>
          )}

          {adminStage==="r32"&&(
            <>
              {/* Champion admin */}
              <div style={{background:"#1a1200",border:`1px solid ${T.gold}`,borderRadius:12,padding:"14px",marginBottom:16}}>
                <div style={{color:T.gold,fontWeight:900,fontSize:14,marginBottom:8}}>🏆 Campeón del Mundial (resultado real)</div>
                <select
                  value={actuals._champion||""}
                  onChange={e=>setActuals(p=>({...p,_champion:e.target.value}))}
                  style={{width:"100%",padding:"10px",borderRadius:8,border:`1px solid ${T.gold}`,background:T.bgCard,color:T.text,fontSize:14,fontWeight:700}}
                >
                  <option value="">-- Sin resultado aún --</option>
                  {ALL_32_TEAMS.sort().map(t=>(
                    <option key={t} value={t}>{FLAGS[t]||""} {t}</option>
                  ))}
                </select>
              </div>

              {/* R32 results */}
              {KNOCKOUT_SLOTS.filter(m=>m.stage==="r32").map(m=>(
                <div key={m.id} style={{background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:12,padding:"12px 16px",marginBottom:8}}>
                  <div style={{color:T.muted,fontSize:10,marginBottom:6}}>{m.date}</div>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
                    <div style={{display:"flex",alignItems:"center",gap:6,flex:1}}>
                      <span style={{fontSize:18}}>{FLAGS[m.home]||"🏳️"}</span>
                      <span style={{color:T.white,fontSize:13,fontWeight:600}}>{m.home}</span>
                    </div>
                    <ScoreInput h={actuals[m.id]?.h??""} a={actuals[m.id]?.a??""} onChange={val=>setActuals(p=>({...p,[m.id]:{...p[m.id],...val}}))} disabled={false}/>
                    <div style={{display:"flex",alignItems:"center",gap:6,flex:1,justifyContent:"flex-end"}}>
                      <span style={{color:T.white,fontSize:13,fontWeight:600}}>{m.away}</span>
                      <span style={{fontSize:18}}>{FLAGS[m.away]||"🏳️"}</span>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}

          {adminStage==="r16"&&(
            <>
              {KNOCKOUT_SLOTS.filter(m=>m.stage==="r16").map(m=>(
                <div key={m.id} style={{background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:12,padding:"12px 16px",marginBottom:8}}>
                  <div style={{color:T.muted,fontSize:10,marginBottom:6}}>{m.date}</div>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
                    <div style={{display:"flex",alignItems:"center",gap:6,flex:1}}>
                      <span style={{fontSize:18}}>{FLAGS[m.home]||"🏳️"}</span>
                      <span style={{color:T.white,fontSize:13,fontWeight:600}}>{m.home}</span>
                    </div>
                    <ScoreInput h={actuals[m.id]?.h??""} a={actuals[m.id]?.a??""} onChange={val=>setActuals(p=>({...p,[m.id]:{...p[m.id],...val}}))} disabled={false}/>
                    <div style={{display:"flex",alignItems:"center",gap:6,flex:1,justifyContent:"flex-end"}}>
                      <span style={{color:T.white,fontSize:13,fontWeight:600}}>{m.away}</span>
                      <span style={{fontSize:18}}>{FLAGS[m.away]||"🏳️"}</span>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}

          <div style={{marginTop:20,display:"flex",alignItems:"center",gap:12}}>
            <button onClick={handleSaveActuals} disabled={saving} style={{flex:1,padding:"14px",fontSize:15,fontWeight:900,background:"linear-gradient(135deg,#c09030,#8a6020)",color:"#fff",border:"none",borderRadius:12,cursor:"pointer",opacity:saving?0.6:1}}>
              {saving?"Saving...":"💾 Save Results"}
            </button>
            {saveMsg&&<span style={{color:T.green,fontWeight:800}}>{saveMsg}</span>}
          </div>
        </div>
      )}

      {screen==="auditlog"&&isAdmin&&(
        <div style={{maxWidth:720,margin:"0 auto",padding:"16px",position:"relative",zIndex:1}}>
          <div style={{color:T.gold,fontWeight:900,fontSize:18,marginBottom:4}}>🕵️ Audit Log</div>
          <div style={{color:T.muted,fontSize:12,marginBottom:16}}>Every pick change logged with timestamp. Red = changed after kickoff.</div>
          <button onClick={loadAuditLog} style={{marginBottom:16,padding:"8px 16px",borderRadius:8,border:`1px solid ${T.border}`,background:"transparent",color:T.muted,cursor:"pointer",fontSize:12,fontWeight:700}}>🔄 Refresh</button>
          {loadingLogs?(
            <div style={{textAlign:"center",color:T.muted,padding:40}}>Loading...</div>
          ):auditLogs.length===0?(
            <div style={{textAlign:"center",color:T.muted,padding:40}}>No logs yet. Changes will appear here once users edit picks.</div>
          ):auditLogs.map(log=>{
            const ts = new Date(log.timestamp);
            const suspicious = log.wasLocked;
            return (
              <div key={log.id} style={{background:suspicious?"#3a000022":T.bgCard,border:`1px solid ${suspicious?"#e74c3c":T.border}`,borderRadius:10,padding:"10px 14px",marginBottom:8}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:6}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    {suspicious&&<span style={{background:"#e74c3c",color:"#fff",fontSize:10,fontWeight:900,padding:"2px 6px",borderRadius:6}}>⚠️ AFTER KICKOFF</span>}
                    <span style={{color:suspicious?"#e74c3c":T.white,fontWeight:800,fontSize:13}}>{log.name}</span>
                    <span style={{color:T.muted,fontSize:12}}>changed</span>
                    <span style={{color:T.gold,fontWeight:700,fontSize:12}}>{log.match}</span>
                    <span style={{color:T.muted,fontSize:12}}>({log.date})</span>
                  </div>
                  <span style={{color:T.muted,fontSize:11}}>{ts.toLocaleString()}</span>
                </div>
                <div style={{marginTop:4,display:"flex",alignItems:"center",gap:8}}>
                  <span style={{color:T.muted,fontSize:12,fontFamily:"monospace"}}>{log.oldPick}</span>
                  <span style={{color:T.muted}}>→</span>
                  <span style={{color:T.white,fontSize:12,fontWeight:700,fontFamily:"monospace"}}>{log.newPick}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
