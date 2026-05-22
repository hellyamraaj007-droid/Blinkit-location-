import { useState, useEffect, useRef, useCallback } from "react";

// ─── DATA ───────────────────────────────────────────────────────────────────
const RAW_LOCATIONS = [
// A1 col
...Array.from({length:36},(,i)=>A1-${String(i+1).padStart(2,"0")}),
// A2
...Array.from({length:37},(,i)=>A2-${String(i+1).padStart(2,"0")}),
// A3
...Array.from({length:41},(,i)=>A3-${String(i+1).padStart(2,"0")}),
// A4
...Array.from({length:42},(,i)=>A4-${String(i+1).padStart(2,"0")}),
// A5
...Array.from({length:41},(,i)=>A5-${String(i+1).padStart(2,"0")}),
// A6
...Array.from({length:40},(,i)=>A6-${String(i+1).padStart(2,"0")}),
// A7
...Array.from({length:44},(,i)=>A7-${String(i+1).padStart(2,"0")}),
// A8
...Array.from({length:49},(,i)=>A8-${String(i+1).padStart(2,"0")}),
// A9
...Array.from({length:51},(,i)=>A9-${String(i+1).padStart(2,"0")}),
// A10
...Array.from({length:50},(,i)=>A10-${String(i+1).padStart(2,"0")}),
// A11
...Array.from({length:50},(,i)=>A11-${String(i+1).padStart(2,"0")}),
// A12
...Array.from({length:50},(,i)=>A12-${String(i+1).padStart(2,"0")}),
// A13
...Array.from({length:24},(,i)=>A13-${String(i+1).padStart(2,"0")}),
// A14
...Array.from({length:24},(,i)=>A14-${String(i+1).padStart(2,"0")}),
// A15
...Array.from({length:23},(,i)=>A15-${String(i+1).padStart(2,"0")}),
// A16
...Array.from({length:24},(,i)=>A16-${String(i+1).padStart(2,"0")}),
// A17
...Array.from({length:23},(,i)=>A17-${String(i+1).padStart(2,"0")}),
// A18
...Array.from({length:15},(,i)=>A18-${String(i+1).padStart(2,"0")}),
// A19
...Array.from({length:12},(,i)=>A19-${String(i+1).padStart(2,"0")}),
// P1
...Array.from({length:12},(,i)=>P1-${String(i+1).padStart(2,"0")}),
// A20
...Array.from({length:20},(,i)=>A20-${String(i+1).padStart(2,"0")}),
// A21
...Array.from({length:21},(,i)=>A21-${String(i+1).padStart(2,"0")}),
// A22
...Array.from({length:7},(,i)=>A22-${String(i+1).padStart(2,"0")}),
// A25
...Array.from({length:4},(,i)=>A25-${String(i+1).padStart(2,"0")}),
// A24
...Array.from({length:10},(_,i)=>A24-${String(i+1).padStart(2,"0")}),
];

const ADMIN_CREDS = { username: "hell", password: "hell001" };

const ALERT_TYPES = [
{ id: "picking",  label: "Picking Issue",  emoji: "📦", color: "#f59e0b" },
{ id: "audit",    label: "Audit Issue",    emoji: "🔍", color: "#3b82f6" },
{ id: "putaway",  label: "Putaway Issue",  emoji: "📥", color: "#8b5cf6" },
];

// ─── SOUND GENERATOR ────────────────────────────────────────────────────────
function playAlertSound() {
try {
const ctx = new (window.AudioContext || window.webkitAudioContext)();
const times = [0, 0.3, 0.6];
times.forEach(t => {
const osc = ctx.createOscillator();
const gain = ctx.createGain();
osc.connect(gain); gain.connect(ctx.destination);
osc.frequency.setValueAtTime(880, ctx.currentTime + t);
osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + t + 0.2);
gain.gain.setValueAtTime(0.4, ctx.currentTime + t);
gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.25);
osc.start(ctx.currentTime + t);
osc.stop(ctx.currentTime + t + 0.3);
});
} catch(e) {}
}

function vibrateDevice() {
if (navigator.vibrate) navigator.vibrate([300, 100, 300, 100, 500]);
}

// ─── STORAGE HELPERS ────────────────────────────────────────────────────────
const store = {
get: k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
set: (k,v) => localStorage.setItem(k, JSON.stringify(v)),
};

// ─── COMPONENTS ─────────────────────────────────────────────────────────────

function Pill({ children, color = "#10b981" }) {
return (
<span style={{
background: color + "22", color, border: 1px solid ${color}55,
borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700,
letterSpacing: 0.5,
}}>{children}</span>
);
}

// LOGIN SCREEN
function LoginScreen({ onLogin }) {
const [mode, setMode] = useState(null); // "admin" | "employee"
const [empId, setEmpId] = useState("");
const [empName, setEmpName] = useState("");
const [empStep, setEmpStep] = useState(1);
const [adminUser, setAdminUser] = useState("");
const [adminPass, setAdminPass] = useState("");
const [adminNewPass, setAdminNewPass] = useState("");
const [adminStep, setAdminStep] = useState(1); // 1=login, 2=reset
const [err, setErr] = useState("");

const savedAdmin = store.get("adminPass") || ADMIN_CREDS.password;

function handleEmpStep1() {
if (!empId.trim()) return setErr("Employee number required");
setErr(""); setEmpStep(2);
}
function handleEmpLogin() {
if (!empName.trim()) return setErr("Name required");
setErr("");
const employees = store.get("employees") || {};
employees[empId] = empName;
store.set("employees", employees);
onLogin({ role: "employee", id: empId, name: empName });
}
function handleAdminLogin() {
if (adminUser === ADMIN_CREDS.username && adminPass === savedAdmin) {
setErr(""); setAdminStep(2);
} else setErr("Invalid credentials");
}
function handleAdminReset() {
if (!adminNewPass || adminNewPass.length < 4) return setErr("Min 4 chars");
store.set("adminPass", adminNewPass);
setErr("");
onLogin({ role: "admin", id: "admin", name: "Admin" });
}
function skipReset() {
onLogin({ role: "admin", id: "admin", name: "Admin" });
}

return (
<div style={{
minHeight:"100vh", background:"#0a0e1a",
display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
fontFamily:"'DM Sans', sans-serif",
}}>
{/* Header */}
<div style={{ marginBottom: 40, textAlign:"center" }}>
<div style={{
fontSize: 48, fontWeight: 900, color: "#f0c419",
letterSpacing: -2, lineHeight: 1,
}}>⚡ BLINKIT</div>
<div style={{ color: "#64748b", fontSize: 13, marginTop: 6, letterSpacing: 2 }}>
STORE LOCATION SYSTEM
</div>
</div>

{!mode && (  
    <div style={{ display:"flex", gap: 16 }}>  
      {[  
        { key:"employee", label:"Employee", sub:"Enter your ID & Name", icon:"👷" },  
        { key:"admin",    label:"Admin",    sub:"Secure Admin Access",   icon:"🔐" },  
      ].map(m => (  
        <button key={m.key} onClick={() => { setMode(m.key); setErr(""); }}  
          style={{  
            background:"#111827", border:"2px solid #1e293b",  
            borderRadius: 16, padding:"32px 28px", cursor:"pointer",  
            color:"#f1f5f9", textAlign:"center", transition:"all .2s",  
            width: 160,  
          }}  
          onMouseEnter={e => { e.currentTarget.style.borderColor="#f0c419"; e.currentTarget.style.transform="translateY(-3px)"; }}  
          onMouseLeave={e => { e.currentTarget.style.borderColor="#1e293b"; e.currentTarget.style.transform=""; }}  
        >  
          <div style={{ fontSize: 36 }}>{m.icon}</div>  
          <div style={{ fontWeight: 700, fontSize: 16, marginTop: 10 }}>{m.label}</div>  
          <div style={{ color:"#64748b", fontSize: 12, marginTop: 4 }}>{m.sub}</div>  
        </button>  
      ))}  
    </div>  
  )}  

  {mode === "employee" && (  
    <Card>  
      <CardTitle>👷 Employee Login</CardTitle>  
      {empStep === 1 ? (  
        <>  
          <Input label="Employee Number" value={empId} onChange={setEmpId} placeholder="e.g. EMP001" />  
          {err && <Err>{err}</Err>}  
          <Btn onClick={handleEmpStep1}>Next →</Btn>  
        </>  
      ) : (  
        <>  
          <div style={{ color:"#64748b", fontSize:13, marginBottom:8 }}>ID: <b style={{color:"#f0c419"}}>{empId}</b></div>  
          <Input label="Your Full Name" value={empName} onChange={setEmpName} placeholder="e.g. Rahul Kumar" />  
          {err && <Err>{err}</Err>}  
          <Btn onClick={handleEmpLogin}>Login</Btn>  
        </>  
      )}  
      <Back onClick={() => { setMode(null); setEmpStep(1); setEmpId(""); setEmpName(""); setErr(""); }} />  
    </Card>  
  )}  

  {mode === "admin" && adminStep === 1 && (  
    <Card>  
      <CardTitle>🔐 Admin Login</CardTitle>  
      <Input label="Username" value={adminUser} onChange={setAdminUser} placeholder="hell" />  
      <Input label="Password" value={adminPass} onChange={setAdminPass} placeholder="••••••••" type="password" />  
      {err && <Err>{err}</Err>}  
      <Btn onClick={handleAdminLogin}>Login</Btn>  
      <Back onClick={() => { setMode(null); setErr(""); }} />  
    </Card>  
  )}  

  {mode === "admin" && adminStep === 2 && (  
    <Card>  
      <CardTitle>🔑 Reset Password</CardTitle>  
      <div style={{ color:"#64748b", fontSize:13, marginBottom:16 }}>  
        Set a new admin password (optional)  
      </div>  
      <Input label="New Password" value={adminNewPass} onChange={setAdminNewPass} placeholder="Min 4 chars" type="password" />  
      {err && <Err>{err}</Err>}  
      <Btn onClick={handleAdminReset}>Save & Login</Btn>  
      <button onClick={skipReset} style={{  
        background:"none", border:"none", color:"#64748b",  
        cursor:"pointer", marginTop:8, fontSize:13, textDecoration:"underline"  
      }}>Skip for now</button>  
    </Card>  
  )}  
</div>

);
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────
function MainApp({ user, onLogout }) {
const [search, setSearch] = useState("");
const [alerts, setAlerts] = useState(() => store.get("alerts") || []);
const [alertModal, setAlertModal] = useState(null); // location string
const [alertType, setAlertType] = useState("picking");
const [note, setNote] = useState("");
const [activeAlert, setActiveAlert] = useState(null); // for admin popup
const [tab, setTab] = useState("locations"); // "locations" | "alerts"
const [resolvedIds, setResolvedIds] = useState(() => store.get("resolvedIds") || []);
const soundRef = useRef(false);

// Poll for new alerts (simulate push)
useEffect(() => {
if (user.role !== "admin") return;
const interval = setInterval(() => {
const latest = store.get("alerts") || [];
const currentIds = alerts.map(a => a.id);
const newOnes = latest.filter(a => !currentIds.includes(a.id));
if (newOnes.length > 0) {
setAlerts(latest);
newOnes.forEach(a => {
playAlertSound();
vibrateDevice();
setActiveAlert(a);
});
}
}, 1500);
return () => clearInterval(interval);
}, [alerts, user.role]);

// Sync alerts for employee reads
useEffect(() => {
if (user.role === "employee") {
const interval = setInterval(() => {
setAlerts(store.get("alerts") || []);
}, 2000);
return () => clearInterval(interval);
}
}, [user.role]);

const filtered = RAW_LOCATIONS.filter(l =>
l.toLowerCase().includes(search.toLowerCase())
);

const pendingAlerts = alerts.filter(a => !resolvedIds.includes(a.id));

function sendAlert(location) {
const type = ALERT_TYPES.find(t => t.id === alertType);
const alert = {
id: Date.now() + Math.random(),
location,
type: alertType,
typeLabel: type.label,
typeEmoji: type.emoji,
color: type.color,
employee: user.name,
empId: user.id,
note,
time: new Date().toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit" }),
timestamp: Date.now(),
};
const existing = store.get("alerts") || [];
store.set("alerts", [...existing, alert]);
setAlerts([...existing, alert]);
setAlertModal(null);
setNote("");
}

function resolveAlert(id) {
const updated = [...resolvedIds, id];
setResolvedIds(updated);
store.set("resolvedIds", updated);
if (activeAlert?.id === id) setActiveAlert(null);
}

// Group by aisle
const groups = {};
filtered.forEach(loc => {
const aisle = loc.split("-")[0];
if (!groups[aisle]) groups[aisle] = [];
groups[aisle].push(loc);
});

const locationHasAlert = loc => pendingAlerts.some(a => a.location === loc);

return (
<div style={{
minHeight:"100vh", background:"#0a0e1a",
fontFamily:"'DM Sans', sans-serif", color:"#f1f5f9",
}}>
{/* ADMIN ALERT POPUP */}
{user.role === "admin" && activeAlert && (
<div style={{
position:"fixed", inset:0, background:"#000000cc",
zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center",
animation:"fadeIn .3s",
}}>
<div style={{
background:"#111827", border:"3px solid #ef4444",
borderRadius:20, padding:32, maxWidth:380, width:"90%",
boxShadow:"0 0 60px #ef444455",
animation:"pulse 1s infinite",
}}>
<div style={{ fontSize:40, textAlign:"center" }}>🚨</div>
<div style={{ fontSize:22, fontWeight:800, color:"#ef4444", textAlign:"center", marginTop:8 }}>
ALERT RECEIVED!
</div>
<div style={{
background:"#1e293b", borderRadius:12, padding:16, margin:"16px 0",
border:2px solid ${activeAlert.color},
}}>
<div style={{ fontSize:28, fontWeight:900, color:"#f0c419", textAlign:"center" }}>
📍 {activeAlert.location}
</div>
<div style={{ textAlign:"center", marginTop:8 }}>
<Pill color={activeAlert.color}>{activeAlert.typeEmoji} {activeAlert.typeLabel}</Pill>
</div>
<div style={{ marginTop:12, color:"#94a3b8", fontSize:13 }}>
<b style={{color:"#f1f5f9"}}>Employee:</b> {activeAlert.employee} ({activeAlert.empId})<br/>
<b style={{color:"#f1f5f9"}}>Time:</b> {activeAlert.time}<br/>
{activeAlert.note && <><b style={{color:"#f1f5f9"}}>Note:</b> {activeAlert.note}</>}
</div>
</div>
<Btn onClick={() => resolveAlert(activeAlert.id)} style={{ background:"#10b981" }}>
✅ Mark Resolved
</Btn>
<button onClick={() => setActiveAlert(null)} style={{
display:"block", width:"100%", marginTop:8, background:"none",
border:"1px solid #374151", borderRadius:10, padding:"10px",
color:"#64748b", cursor:"pointer", fontSize:13,
}}>Dismiss (keep in list)</button>
</div>
</div>
)}

{/* ALERT SEND MODAL */}  
  {alertModal && user.role === "employee" && (  
    <div style={{  
      position:"fixed", inset:0, background:"#000000bb", zIndex:900,  
      display:"flex", alignItems:"center", justifyContent:"center",  
    }}>  
      <div style={{  
        background:"#111827", border:"2px solid #374151",  
        borderRadius:20, padding:28, maxWidth:360, width:"90%",  
      }}>  
        <div style={{ fontWeight:800, fontSize:18, marginBottom:4 }}>⚠️ Send Alert</div>  
        <div style={{ color:"#f0c419", fontWeight:700, marginBottom:16 }}>📍 {alertModal}</div>  
        <div style={{ marginBottom:12 }}>  
          <div style={{ fontSize:12, color:"#64748b", marginBottom:8 }}>Issue Type:</div>  
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>  
            {ALERT_TYPES.map(t => (  
              <button key={t.id} onClick={() => setAlertType(t.id)} style={{  
                padding:"6px 14px", borderRadius:20, cursor:"pointer",  
                fontSize:13, fontWeight:600,  
                background: alertType === t.id ? t.color : "#1e293b",  
                color: alertType === t.id ? "#000" : "#94a3b8",  
                border: `1px solid ${alertType === t.id ? t.color : "#374151"}`,  
              }}>{t.emoji} {t.label}</button>  
            ))}  
          </div>  
        </div>  
        <textarea  
          placeholder="Optional note (e.g. product stuck, barcode issue...)"  
          value={note}  
          onChange={e => setNote(e.target.value)}  
          style={{  
            width:"100%", background:"#1e293b", border:"1px solid #374151",  
            borderRadius:10, padding:12, color:"#f1f5f9", fontSize:13,  
            resize:"vertical", minHeight:70, boxSizing:"border-box",  
            fontFamily:"inherit",  
          }}  
        />  
        <div style={{ display:"flex", gap:8, marginTop:12 }}>  
          <button onClick={() => { setAlertModal(null); setNote(""); }} style={{  
            flex:1, padding:12, background:"#1e293b", border:"1px solid #374151",  
            borderRadius:10, color:"#94a3b8", cursor:"pointer", fontSize:14,  
          }}>Cancel</button>  
          <button onClick={() => sendAlert(alertModal)} style={{  
            flex:2, padding:12, background:"#ef4444",  
            border:"none", borderRadius:10, color:"#fff",  
            cursor:"pointer", fontWeight:700, fontSize:14,  
          }}>🚨 Send Alert</button>  
        </div>  
      </div>  
    </div>  
  )}  

  {/* TOPBAR */}  
  <div style={{  
    background:"#111827", borderBottom:"1px solid #1e293b",  
    padding:"14px 20px", display:"flex", alignItems:"center", justifyContent:"space-between",  
    position:"sticky", top:0, zIndex:100,  
  }}>  
    <div style={{ fontWeight:900, fontSize:18, color:"#f0c419", letterSpacing:-0.5 }}>  
      ⚡ BLINKIT  
    </div>  
    <div style={{ display:"flex", alignItems:"center", gap:10 }}>  
      <div style={{ fontSize:12, color:"#64748b" }}>  
        <span style={{ color:"#10b981", fontWeight:700 }}>{user.name}</span>  
        {" · "}  
        <Pill color={user.role === "admin" ? "#ef4444" : "#10b981"}>  
          {user.role === "admin" ? "🔐 Admin" : "👷 Employee"}  
        </Pill>  
      </div>  
      <button onClick={onLogout} style={{  
        background:"none", border:"1px solid #374151", borderRadius:8,  
        padding:"4px 10px", color:"#64748b", cursor:"pointer", fontSize:12,  
      }}>Logout</button>  
    </div>  
  </div>  

  {/* TABS */}  
  <div style={{  
    display:"flex", gap:4, padding:"12px 20px 0",  
    borderBottom:"1px solid #1e293b",  
  }}>  
    {[  
      { id:"locations", label:"📍 Locations" },  
      { id:"alerts",    label:`🚨 Alerts ${pendingAlerts.length > 0 ? `(${pendingAlerts.length})` : ""}` },  
    ].map(t => (  
      <button key={t.id} onClick={() => setTab(t.id)} style={{  
        padding:"8px 18px", borderRadius:"10px 10px 0 0",  
        border:"none", cursor:"pointer", fontWeight:600, fontSize:13,  
        background: tab === t.id ? "#1e293b" : "none",  
        color: tab === t.id ? "#f0c419" : "#64748b",  
        borderBottom: tab === t.id ? "2px solid #f0c419" : "2px solid transparent",  
      }}>{t.label}</button>  
    ))}  
  </div>  

  <div style={{ padding: "16px 16px 40px" }}>  
    {tab === "locations" && (  
      <>  
        {/* SEARCH */}  
        <div style={{ marginBottom: 16 }}>  
          <input  
            value={search}  
            onChange={e => setSearch(e.target.value)}  
            placeholder="🔍  Search location (e.g. A1-05, P1...)"  
            style={{  
              width:"100%", background:"#111827", border:"1px solid #1e293b",  
              borderRadius:12, padding:"12px 16px", color:"#f1f5f9",  
              fontSize:14, boxSizing:"border-box", fontFamily:"inherit",  
              outline:"none",  
            }}  
          />  
        </div>  

        {/* LEGEND */}  
        {user.role === "employee" && (  
          <div style={{
