import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, collection, getDocs } from "firebase/firestore";

// ─── FIREBASE CONFIG ──────────────────────────────────────────────────────────
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

// ─── DATA ─────────────────────────────────────────────────────────────────────
const GROUPS = {
  A: { teams: ["Mexico", "South Korea", "Czechia", "South Africa"] },
  B: { teams: ["Switzerland", "Canada", "Qatar", "Bosnia & Herz."] },
  C: { teams: ["Brazil", "Morocco", "Scotland", "Haiti"] },
  D: { teams: ["USA", "Turkey", "Australia", "Paraguay"] },
  E: { teams: ["Germany", "Ecuador", "Ivory Coast", "Curaçao"] },
  F: { teams: ["Netherlands", "Japan", "Sweden", "Tunisia"] },
  G: { teams: ["Belgium", "Egypt", "Iran", "New Zealand"] },
  H: { teams: ["Spain", "Uruguay", "Saudi Arabia", "Cape Verde"] },
  I: { teams: ["France", "Senegal", "Norway", "Iraq"] },
  J: { teams: ["Argentina", "Austria", "Algeria", "Jordan"] },
  K: { teams: ["Portugal", "Colombia", "DR Congo", "Uzbekistan"] },
  L: { teams: ["England", "Croatia", "Ghana", "Panama"] },
};

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
  "England":"🏴󠁧󠁢󠁥󠁮󠁧󠁿","Croatia":"🇭🇷","Ghana":"🇬🇭","Panama":"🇵🇦","TBD":"⬜",
};

const ADMIN_EMAIL = "daniel@gmail.com"; // ← CHANGE THIS to your Google email

function generateGroupMatches() {
  const matches = [];
  let id = 1;
  for (const [group, { teams }] of Object.entries(GROUPS))
    for (let i = 0; i < teams.length; i++)
      for (let j = i + 1; j < teams.length; j++)
        matches.push({ id: `G${id++}`, group, home: teams[i], away: teams[j], stage: "group" });
  return matches;
}

const GROUP_MATCHES = generateGroupMatches();
const KNOCKOUT_SLOTS = [
  ...Array.from({length:16},(_,i)=>({ id:`R32-${String(i+1).padStart(2,"0")}`, stage:"r32", home:"TBD", away:"TBD" })),
  ...Array.from({length:8},(_,i)=>({ id:`R16-${String(i+1).padStart(2,"0")}`, stage:"r16", home:"TBD", away:"TBD" })),
  ...Array.from({length:4},(_,i)=>({ id:`QF-${String(i+1).padStart(2,"0")}`, stage:"qf", home:"TBD", away:"TBD" })),
  ...Array.from({length:2},(_,i)=>({ id:`SF-${String(i+1).padStart(2,"0")}`, stage:"sf", home:"TBD", away:"TBD" })),
  { id:"3RD", stage:"3rd", home:"TBD", away:"TBD" },
  { id:"FINAL", stage:"final", home:"TBD", away:"TBD" },
];
const ALL_MATCHES = [...GROUP_MATCHES, ...KNOCKOUT_SLOTS];
const STAGE_LABELS = { group:"Group Stage", r32:"Round of 32", r16:"Round of 16", qf:"Quarter-Finals", sf:"Semi-Finals", "3rd":"3rd Place", final:"Final" };
const STAGE_ORDER = ["group","r32","r16","qf","sf","3rd","final"];

// ─── SCORING ──────────────────────────────────────────────────────────────────
function calcScore(pred, actual) {
  if (!actual || actual.h==null || actual.a==null) return 0;
  if (!pred || pred.h==null || pred.a==null) return 0;
  const ph=Number(pred.h), pa=Number(pred.a), ah=Number(actual.h), aa=Number(actual.a);
  if (isNaN(ph)||isNaN(pa)||isNaN(ah)||isNaN(aa)) return 0;
  if (ph===ah && pa===aa) return 3;
  const pw=ph>pa?"h":ph<pa?"a":"d", aw=ah>aa?"h":ah<aa?"a":"d";
  return pw===aw?1:0;
}

// ─── THEME ────────────────────────────────────────────────────────────────────
const T = {
  bg:"#0a1a0f", bgCard:"#0d2114", bgDeep:"#061209",
  grass:"#1a4d2e", grassLight:"#1e5c35",
  gold:"#f5c842", goldDim:"#c9a030",
  green:"#2ecc71", red:"#e74c3c",
  white:"#f0f4f0", muted:"#4a7a5a", border:"#1a3d25",
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

function ScoreInput({ h, a, onChange, disabled }) {
  const s = {
    width:42, textAlign:"center", padding:"7px 2px",
    background: disabled?"#0a1a0f":T.grass,
    border:`2px solid ${disabled?"#1a3a20":T.goldDim}`,
    borderRadius:8, color:disabled?"#2a4a30":T.gold,
    fontSize:18, fontWeight:900, outline:"none",
    cursor:disabled?"not-allowed":"text",
    fontFamily:"'Courier New',monospace",
  };
  return (
    <div style={{display:"flex",alignItems:"center",gap:6}}>
      <input type="number" min="0" max="99" value={h??""} disabled={disabled}
        onChange={e=>onChange({h:e.target.value,a})} style={s}/>
      <span style={{color:T.gold,fontWeight:900,fontSize:18,fontFamily:"monospace"}}>:</span>
      <input type="number" min="0" max="99" value={a??""} disabled={disabled}
        onChange={e=>onChange({h,a:e.target.value})} style={s}/>
    </div>
  );
}

function MatchCard({ match, pred, actual, onChange }) {
  const hasActual = actual && actual.h!=null && actual.a!=null && actual.h!=="" && actual.a!=="";
  const pts = hasActual ? calcScore(pred||{}, actual) : null;
  const borderColor = pts===3?T.gold:pts===1?T.green:pts===0&&hasActual?"#c0392b":T.border;

  return (
    <div style={{
      background:pts===3?"#1a2a0a":T.bgCard,
      border:`1px solid ${borderColor}`, borderRadius:12,
      padding:"14px 16px", marginBottom:10,
      boxShadow:pts===3?`0 0 12px ${T.gold}44`:"none",
    }}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
        <div style={{display:"flex",alignItems:"center",gap:8,flex:1}}>
          <span style={{fontSize:22}}>{FLAGS[match.home]||"🏳️"}</span>
          <span style={{color:T.white,fontSize:13,fontWeight:700}}>{match.home}</span>
        </div>
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
          {hasActual&&<div style={{fontSize:11,color:T.muted}}>Result: <span style={{color:T.gold,fontWeight:700}}>{actual.h}:{actual.a}</span></div>}
          <ScoreInput h={pred?.h??""} a={pred?.a??""} onChange={onChange} disabled={false}/>
          {!hasActual&&<div style={{fontSize:10,color:T.muted,letterSpacing:1}}>YOUR PICK</div>}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8,flex:1,justifyContent:"flex-end"}}>
          <span style={{color:T.white,fontSize:13,fontWeight:700,textAlign:"right"}}>{match.away}</span>
          <span style={{fontSize:22}}>{FLAGS[match.away]||"🏳️"}</span>
        </div>
      </div>
      {pts!==null&&(
        <div style={{textAlign:"center",marginTop:8}}>
          <span style={{
            display:"inline-block",
            background:pts===3?"#f5c84222":pts===1?"#2ecc7122":"#e74c3c22",
            color:pts===3?T.gold:pts===1?T.green:"#e74c3c",
            padding:"3px 14px",borderRadius:20,fontSize:12,fontWeight:800,
          }}>
            {pts===3?"🎯 Exact score! +3 pts":pts===1?"✓ Correct winner +1 pt":"✗ No points"}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [screen, setScreen] = useState("predictions");
  const [predictions, setPredictions] = useState({});
  const [actuals, setActuals] = useState({});
  const [allUsers, setAllUsers] = useState([]);
  const [activeGroup, setActiveGroup] = useState("A");
  const [activeStage, setActiveStage] = useState("group");
  const [adminStage, setAdminStage] = useState("group");
  const [adminGroup, setAdminGroup] = useState("A");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAdminPw, setShowAdminPw] = useState(false);
  const [adminPw, setAdminPw] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const ADMIN_PW = "wc2026admin";

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async u => {
      setUser(u);
      setAuthLoading(false);
      if (u) {
        const snap = await getDoc(doc(db,"predictions",u.uid));
        if (snap.exists()) setPredictions(snap.data());
        const aSnap = await getDoc(doc(db,"actuals","results"));
        if (aSnap.exists()) setActuals(aSnap.data());
      }
    });
    return unsub;
  }, []);

  async function handleGoogleLogin() {
    try { await signInWithPopup(auth, provider); }
    catch(e) { console.error(e); }
  }

  async function handleLogout() {
    await signOut(auth);
    setUser(null); setPredictions({}); setIsAdmin(false);
  }

  async function loadLeaderboard() {
    setLoading(true);
    const aSnap = await getDoc(doc(db,"actuals","results"));
    const currentActuals = aSnap.exists()?aSnap.data():{};
    const snap = await getDocs(collection(db,"predictions"));
    const users = [];
    snap.forEach(d => {
      const preds = d.data();
      const name = preds._displayName||d.id;
      const photo = preds._photoURL||null;
      let total = 0;
      for (const m of ALL_MATCHES) total += calcScore(preds[m.id]||{}, currentActuals[m.id]||{});
      users.push({ uid:d.id, name, photo, total });
    });
    users.sort((a,b)=>b.total-a.total);
    setAllUsers(users);
    setLoading(false);
  }

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    await setDoc(doc(db,"predictions",user.uid), {
      ...predictions,
      _displayName: user.displayName||user.email,
      _photoURL: user.photoURL||null,
    });
    setSaveMsg("✓ Saved!");
    setTimeout(()=>setSaveMsg(""),2500);
    setSaving(false);
  }

  async function handleSaveActuals() {
    setSaving(true);
    await setDoc(doc(db,"actuals","results"), actuals);
    setSaveMsg("✓ Results saved!");
    setTimeout(()=>setSaveMsg(""),2500);
    setSaving(false);
  }

  function myTotal() {
    return ALL_MATCHES.reduce((s,m)=>s+calcScore(predictions[m.id]||{},actuals[m.id]||{}),0);
  }

  const gMatches = GROUP_MATCHES.filter(m=>m.group===activeGroup);
  const kMatches = KNOCKOUT_SLOTS.filter(m=>m.stage===activeStage);
  const agMatches = GROUP_MATCHES.filter(m=>m.group===adminGroup);
  const akMatches = KNOCKOUT_SLOTS.filter(m=>m.stage===adminStage);

  // ── LOGIN SCREEN ────────────────────────────────────────────────────────────
  if (authLoading) return (
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{color:T.gold,fontSize:32}}>⚽</div>
    </div>
  );

  if (!user) return (
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20,position:"relative",overflow:"hidden"}}>
      <FieldStripes/>
      <div style={{position:"relative",zIndex:1,textAlign:"center",maxWidth:420,width:"100%"}}>
        <div style={{fontSize:72,marginBottom:8,filter:`drop-shadow(0 0 20px ${T.gold}66)`}}>🏆</div>
        <div style={{fontSize:11,color:T.gold,letterSpacing:6,textTransform:"uppercase",fontWeight:700,marginBottom:8}}>FIFA</div>
        <h1 style={{fontSize:38,fontWeight:900,color:T.white,margin:"0 0 4px",letterSpacing:-1}}>World Cup</h1>
        <div style={{
          fontSize:32,fontWeight:900,marginBottom:6,
          background:`linear-gradient(135deg,${T.gold},#fff176)`,
          WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",
        }}>2026</div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:32}}>
          {["🇺🇸","🇨🇦","🇲🇽"].map(f=><span key={f} style={{fontSize:20}}>{f}</span>)}
          <span style={{color:T.muted,fontSize:13,fontWeight:600}}>USA · Canada · Mexico</span>
        </div>

        <div style={{background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:16,padding:"28px 24px",boxShadow:"0 20px 60px #00000066"}}>
          <div style={{color:T.muted,fontSize:14,marginBottom:20,fontWeight:600}}>Sign in to join the quiniela</div>

          <button onClick={handleGoogleLogin} style={{
            width:"100%",padding:"14px",fontSize:15,fontWeight:800,
            background:"#fff",color:"#1a1a1a",border:"none",
            borderRadius:10,cursor:"pointer",
            display:"flex",alignItems:"center",justifyContent:"center",gap:12,
          }}>
            <svg width="20" height="20" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Sign in with Google
          </button>

          <div style={{marginTop:20,borderTop:`1px solid ${T.border}`,paddingTop:16}}>
            {!showAdminPw?(
              <button onClick={()=>setShowAdminPw(true)}
                style={{background:"none",border:"none",color:"#1a3d25",fontSize:11,cursor:"pointer",letterSpacing:2}}>
                ···
              </button>
            ):(
              <div style={{display:"flex",gap:8}}>
                <input type="password" placeholder="Admin password"
                  value={adminPw} onChange={e=>setAdminPw(e.target.value)}
                  onKeyDown={e=>{if(e.key==="Enter"){if(adminPw===ADMIN_PW){setIsAdmin(true);setShowAdminPw(false);}else{alert("Wrong password");setAdminPw("");}}}  }
                  style={{flex:1,padding:"10px 12px",fontSize:13,background:T.bgDeep,border:`1px solid ${T.border}`,borderRadius:8,color:T.white,outline:"none"}}
                />
                <button onClick={()=>{
                  if(adminPw===ADMIN_PW){setIsAdmin(true);setShowAdminPw(false);}
                  else{alert("Wrong password");setAdminPw("");}
                }} style={{padding:"10px 16px",background:T.grass,border:`1px solid ${T.border}`,borderRadius:8,color:T.gold,fontWeight:700,cursor:"pointer"}}>
                  Go
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // ── MAIN APP ─────────────────────────────────────────────────────────────────
  return (
    <div style={{minHeight:"100vh",background:T.bg,color:T.white,fontFamily:"'Inter','Segoe UI',sans-serif",position:"relative"}}>
      <FieldStripes/>

      {/* Header */}
      <div style={{background:T.bgDeep,borderBottom:`1px solid ${T.border}`,padding:"10px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8,position:"sticky",top:0,zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:20}}>🏆</span>
          <div>
            <div style={{color:T.gold,fontWeight:900,fontSize:14}}>WC 2026 Quiniela</div>
            <div style={{color:T.muted,fontSize:11}}>{isAdmin?"⚙️ Admin":`${user.displayName||user.email}`}</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {user.photoURL&&<img src={user.photoURL} style={{width:28,height:28,borderRadius:"50%",border:`2px solid ${T.gold}`}} alt=""/>}
          {!isAdmin&&(
            <div style={{background:T.grass,border:`1px solid ${T.goldDim}`,padding:"5px 14px",borderRadius:20,color:T.gold,fontWeight:900,fontSize:15}}>
              {myTotal()} pts
            </div>
          )}
          <button onClick={handleLogout} style={{background:"none",border:`1px solid ${T.border}`,color:T.muted,borderRadius:6,padding:"5px 12px",cursor:"pointer",fontSize:12}}>
            Sign out
          </button>
        </div>
      </div>

      {/* Nav */}
      <div style={{display:"flex",gap:2,padding:"10px 12px",background:T.bgDeep,borderBottom:`1px solid ${T.border}`,overflowX:"auto"}}>
        {[
          {key:"predictions",icon:"📋",label:"Predictions"},
          {key:"leaderboard",icon:"🏅",label:"Leaderboard"},
          ...(isAdmin?[{key:"admin",icon:"⚙️",label:"Results"}]:[]),
        ].map(tab=>(
          <button key={tab.key}
            onClick={()=>{setScreen(tab.key);if(tab.key==="leaderboard")loadLeaderboard();}}
            style={{
              padding:"8px 18px",borderRadius:8,border:"none",cursor:"pointer",
              fontSize:13,fontWeight:700,whiteSpace:"nowrap",
              background:screen===tab.key?T.grass:"transparent",
              color:screen===tab.key?T.gold:T.muted,
              borderBottom:screen===tab.key?`2px solid ${T.gold}`:"2px solid transparent",
            }}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ── PREDICTIONS ── */}
      {screen==="predictions"&&(
        <div style={{maxWidth:660,margin:"0 auto",padding:"16px",position:"relative",zIndex:1}}>
          <div style={{display:"flex",gap:6,marginBottom:14,overflowX:"auto",paddingBottom:4}}>
            {STAGE_ORDER.map(s=>(
              <button key={s} onClick={()=>setActiveStage(s)}
                style={{padding:"6px 14px",borderRadius:20,border:`1px solid ${activeStage===s?T.goldDim:T.border}`,cursor:"pointer",fontSize:12,fontWeight:700,whiteSpace:"nowrap",background:activeStage===s?T.grass:"transparent",color:activeStage===s?T.gold:T.muted}}>
                {STAGE_LABELS[s]}
              </button>
            ))}
          </div>

          {activeStage==="group"&&(
            <>
              <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
                {Object.keys(GROUPS).map(g=>(
                  <button key={g} onClick={()=>setActiveGroup(g)}
                    style={{width:36,height:36,borderRadius:8,border:`1px solid ${activeGroup===g?T.gold:T.border}`,cursor:"pointer",fontWeight:900,fontSize:14,background:activeGroup===g?T.grass:"transparent",color:activeGroup===g?T.gold:T.muted}}>
                    {g}
                  </button>
                ))}
              </div>
              <div style={{background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:10,padding:"10px 14px",marginBottom:14,display:"flex",flexWrap:"wrap",gap:10}}>
                {GROUPS[activeGroup].teams.map(t=>(
                  <span key={t} style={{fontSize:13,color:T.white,display:"flex",alignItems:"center",gap:4}}>
                    <span style={{fontSize:18}}>{FLAGS[t]}</span>{t}
                  </span>
                ))}
              </div>
              {gMatches.map(m=>(
                <MatchCard key={m.id} match={m} pred={predictions[m.id]} actual={actuals[m.id]}
                  onChange={val=>setPredictions(p=>({...p,[m.id]:{...p[m.id],...val}}))}/>
              ))}
            </>
          )}

          {activeStage!=="group"&&kMatches.map(m=>(
            <MatchCard key={m.id} match={m} pred={predictions[m.id]} actual={actuals[m.id]}
              onChange={val=>setPredictions(p=>({...p,[m.id]:{...p[m.id],...val}}))}/>
          ))}

          <div style={{marginTop:20,display:"flex",alignItems:"center",gap:12,position:"sticky",bottom:12}}>
            <button onClick={handleSave} disabled={saving}
              style={{flex:1,padding:"14px",fontSize:15,fontWeight:900,background:`linear-gradient(135deg,${T.gold},${T.goldDim})`,color:T.bgDeep,border:"none",borderRadius:12,cursor:"pointer",opacity:saving?0.6:1}}>
              {saving?"Saving...":"💾 Save Predictions"}
            </button>
            {saveMsg&&<span style={{color:T.green,fontWeight:800}}>{saveMsg}</span>}
          </div>
          <div style={{color:T.muted,fontSize:11,textAlign:"center",marginTop:10,letterSpacing:0.5}}>
            ✓ Correct winner = 1 pt · 🎯 Exact score = 3 pts
          </div>
        </div>
      )}

      {/* ── LEADERBOARD ── */}
      {screen==="leaderboard"&&(
        <div style={{maxWidth:600,margin:"0 auto",padding:"20px 16px",position:"relative",zIndex:1}}>
          <div style={{textAlign:"center",marginBottom:24}}>
            <div style={{fontSize:36}}>🏅</div>
            <h2 style={{color:T.gold,fontWeight:900,margin:"4px 0 2px",fontSize:22}}>Leaderboard</h2>
            <div style={{color:T.muted,fontSize:13}}>World Cup 2026 Quiniela</div>
          </div>
          {loading?(
            <div style={{textAlign:"center",color:T.muted,padding:40}}>Loading standings...</div>
          ):allUsers.length===0?(
            <div style={{textAlign:"center",color:T.muted,padding:40}}>
              <div style={{fontSize:40,marginBottom:12}}>⚽</div>No predictions yet. Be first!
            </div>
          ):allUsers.map((u,i)=>{
            const isMe=u.uid===user.uid;
            const medals=["🥇","🥈","🥉"];
            return (
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
          <button onClick={loadLeaderboard} style={{marginTop:16,width:"100%",padding:"12px",fontSize:13,fontWeight:700,background:"transparent",border:`1px solid ${T.border}`,borderRadius:10,color:T.muted,cursor:"pointer"}}>
            🔄 Refresh
          </button>
        </div>
      )}

      {/* ── ADMIN ── */}
      {screen==="admin"&&isAdmin&&(
        <div style={{maxWidth:660,margin:"0 auto",padding:"16px",position:"relative",zIndex:1}}>
          <div style={{background:"#1a0a00",border:"1px solid #5a3000",borderRadius:12,padding:"12px 16px",marginBottom:20,display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:20}}>⚙️</span>
            <div>
              <div style={{color:T.gold,fontWeight:800,fontSize:14}}>Admin — Enter Real Results</div>
              <div style={{color:"#8a6030",fontSize:12}}>Scores update everyone's points automatically.</div>
            </div>
          </div>
          <div style={{display:"flex",gap:6,marginBottom:14,overflowX:"auto"}}>
            {STAGE_ORDER.map(s=>(
              <button key={s} onClick={()=>setAdminStage(s)}
                style={{padding:"6px 14px",borderRadius:20,border:`1px solid ${adminStage===s?"#c09030":T.border}`,cursor:"pointer",fontSize:12,fontWeight:700,whiteSpace:"nowrap",background:adminStage===s?"#2a1a00":"transparent",color:adminStage===s?T.gold:T.muted}}>
                {STAGE_LABELS[s]}
              </button>
            ))}
          </div>
          {adminStage==="group"&&(
            <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
              {Object.keys(GROUPS).map(g=>(
                <button key={g} onClick={()=>setAdminGroup(g)}
                  style={{width:36,height:36,borderRadius:8,border:`1px solid ${adminGroup===g?T.gold:T.border}`,cursor:"pointer",fontWeight:900,fontSize:14,background:adminGroup===g?"#2a1a00":"transparent",color:adminGroup===g?T.gold:T.muted}}>
                  {g}
                </button>
              ))}
            </div>
          )}
          {(adminStage==="group"?agMatches:akMatches).map(m=>(
            <div key={m.id} style={{background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:12,padding:"12px 16px",marginBottom:8}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
                <div style={{display:"flex",alignItems:"center",gap:6,flex:1}}>
                  <span style={{fontSize:18}}>{FLAGS[m.home]||"🏳️"}</span>
                  <span style={{color:T.white,fontSize:13,fontWeight:600}}>{m.home}</span>
                </div>
                <ScoreInput h={actuals[m.id]?.h??""} a={actuals[m.id]?.a??""}
                  onChange={val=>setActuals(p=>({...p,[m.id]:{...p[m.id],...val}}))} disabled={false}/>
                <div style={{display:"flex",alignItems:"center",gap:6,flex:1,justifyContent:"flex-end"}}>
                  <span style={{color:T.white,fontSize:13,fontWeight:600}}>{m.away}</span>
                  <span style={{fontSize:18}}>{FLAGS[m.away]||"🏳️"}</span>
                </div>
              </div>
            </div>
          ))}
          <div style={{marginTop:20,display:"flex",alignItems:"center",gap:12}}>
            <button onClick={handleSaveActuals} disabled={saving}
              style={{flex:1,padding:"14px",fontSize:15,fontWeight:900,background:"linear-gradient(135deg,#c09030,#8a6020)",color:"#fff",border:"none",borderRadius:12,cursor:"pointer",opacity:saving?0.6:1}}>
              {saving?"Saving...":"💾 Save Results"}
            </button>
            {saveMsg&&<span style={{color:T.green,fontWeight:800}}>{saveMsg}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
