import { useState } from "react";

// ═══════════════════════════════════════════
// DESIGN TOKENS — Warm Editorial System
// ═══════════════════════════════════════════
const t = {
  base:"#FBF7F2",
  ink:"#3D231E",
  muted:"#8C6A64",
  faded:"#B0948F",
  accent:"#C25E4A",
  hero:"#FDDCC6",
  avatarBg:"#F2EBE5",
  line:"rgba(140,106,100,0.2)",
  success:"#5A8A5E",
  successBg:"#EBF2EC",
  danger:"#C25E4A",
  dangerBg:"#FDEDEA",
  callout:"#FFF5E6",
  card:"#FFFFFF",
};
const f = "'Sora',system-ui,sans-serif";

const topoSvg = `url("data:image/svg+xml,%3Csvg width='400' height='400' viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 200 Q 100 100 200 200 T 400 200' stroke='%233D231E' stroke-width='0.5' fill='none'/%3E%3Cpath d='M-50 250 Q 50 150 150 250 T 350 250' stroke='%233D231E' stroke-width='0.5' fill='none'/%3E%3Cpath d='M50 150 Q 150 50 250 150 T 450 150' stroke='%233D231E' stroke-width='0.5' fill='none'/%3E%3Cpath d='M0 300 Q 100 200 200 300 T 400 300' stroke='%233D231E' stroke-width='0.5' fill='none'/%3E%3Cpath d='M100 50 Q 200 -50 300 50 T 500 50' stroke='%233D231E' stroke-width='0.5' fill='none'/%3E%3Cpath d='M200 350 Q 250 250 350 300' stroke='%233D231E' stroke-width='0.5' fill='none'/%3E%3C/svg%3E")`;

// ═══════════════════════════════════════════
// SHARED COMPONENTS
// ═══════════════════════════════════════════

function Lbl({children,color=t.muted,style={}}){return(
  <span style={{fontFamily:f,fontSize:"11px",fontWeight:500,color,letterSpacing:"0.05em",textTransform:"uppercase",display:"block",...style}}>{children}</span>
)}

function Avatar({initials,size=40}){return(
  <div style={{width:size,height:size,borderRadius:"50%",background:t.avatarBg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:f,fontSize:size*0.3,fontWeight:500,color:t.muted,flexShrink:0}}>{initials}</div>
)}

function Divider(){return <div style={{height:"1px",background:t.line}}/>}

function ArrowIcon({size=20,color=t.accent}){return(
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M7 17L17 7M17 7H7M17 7V17" strokeLinecap="round" strokeLinejoin="round"/></svg>
)}

// ─── Share Links Component (Dashboard only) ───
function ShareLinks({handle="annywong"}){
  const [copied,setCopied]=useState(null);
  const [showQR,setShowQR]=useState(null);
  const bookUrl=`mykliques.com/book/${handle}`;
  const inviteUrl=`mykliques.com/join/${handle}`;
  const doCopy=(type)=>{setCopied(type);setTimeout(()=>setCopied(null),2000);};

  const QR=({url})=>(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"20px 0 8px"}}>
      <div style={{width:"130px",height:"130px",borderRadius:"16px",background:"#fff",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:"10px",border:"1px solid "+t.line}}>
        <svg width="96" height="96" viewBox="0 0 96 96">
          <rect x="6" y="6" width="24" height="24" rx="4" fill={t.ink}/><rect x="10" y="10" width="16" height="16" rx="2" fill="#fff"/><rect x="14" y="14" width="8" height="8" rx="1" fill={t.ink}/>
          <rect x="66" y="6" width="24" height="24" rx="4" fill={t.ink}/><rect x="70" y="10" width="16" height="16" rx="2" fill="#fff"/><rect x="74" y="14" width="8" height="8" rx="1" fill={t.ink}/>
          <rect x="6" y="66" width="24" height="24" rx="4" fill={t.ink}/><rect x="10" y="70" width="16" height="16" rx="2" fill="#fff"/><rect x="14" y="74" width="8" height="8" rx="1" fill={t.ink}/>
          <rect x="38" y="38" width="20" height="20" rx="4" fill={t.accent}/><text x="48" y="52" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="600" fontFamily={f}>k</text>
        </svg>
      </div>
      <p style={{fontFamily:f,fontSize:"11px",color:t.faded,margin:"0 0 8px"}}>{url}</p>
      <button onClick={()=>setShowQR(null)} style={{fontFamily:f,fontSize:"12px",color:t.accent,fontWeight:500,background:"none",border:"none",cursor:"pointer"}}>Close</button>
    </div>
  );

  const ActionBtns=({type,url})=>(
    <div style={{display:"flex",gap:"6px",marginTop:"10px"}}>
      {/* Copy */}
      <button onClick={()=>doCopy(type)} style={{flex:1,padding:"10px",borderRadius:"10px",border:"none",background:copied===type?t.successBg:t.ink,color:copied===type?t.success:"#fff",fontFamily:f,fontSize:"12px",fontWeight:500,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"5px"}}>
        {copied===type?<><svg width="13" height="13" fill="none" stroke={t.success} strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg>Copied</>:<><svg width="13" height="13" fill="none" stroke="#fff" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/></svg>Copy</>}
      </button>
      {/* QR */}
      <button onClick={()=>setShowQR(showQR===type?null:type)} style={{padding:"10px 14px",borderRadius:"10px",border:"1px solid "+t.line,background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <svg width="16" height="16" fill="none" stroke={t.ink} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM17 14v3h3m-3-6h3v3m-6 3h3" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
      {/* Share */}
      <button style={{padding:"10px 14px",borderRadius:"10px",border:"1px solid "+t.line,background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <svg width="16" height="16" fill="none" stroke={t.ink} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
    </div>
  );

  return(
    <div style={{marginTop:"28px"}}>
      <Lbl style={{marginBottom:"16px"}}>Grow Your Klique</Lbl>

      {/* Invite Link */}
      <div style={{padding:"20px",background:t.hero,borderRadius:"18px",marginBottom:"12px",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",inset:0,backgroundImage:topoSvg,backgroundSize:"cover",opacity:0.08,pointerEvents:"none"}}/>
        <div style={{position:"relative",zIndex:1}}>
          <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"8px"}}>
            <svg width="16" height="16" fill="none" stroke={t.accent} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M8.5 3a4 4 0 100 8 4 4 0 000-8zM20 8v6m3-3h-6" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <Lbl color={t.ink} style={{fontSize:"12px",fontWeight:500,margin:0}}>Invite Link</Lbl>
          </div>
          <p style={{fontFamily:f,fontSize:"14px",color:t.muted,margin:"0 0 12px",lineHeight:1.5}}>Send this to clients to join your klique. They'll be connected to you instantly once they sign up.</p>
          <div style={{display:"flex",alignItems:"center",gap:"6px",padding:"10px 12px",borderRadius:"10px",background:"rgba(255,255,255,0.6)",border:"1px solid rgba(61,35,30,0.08)"}}>
            <svg width="14" height="14" fill="none" stroke={t.muted} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span style={{fontFamily:f,fontSize:"12px",color:t.muted,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{inviteUrl}</span>
          </div>
          <ActionBtns type="invite" url={inviteUrl}/>
          {showQR==="invite"&&<QR url={inviteUrl}/>}
        </div>
      </div>

      {/* Booking Link */}
      <div style={{padding:"20px",background:t.avatarBg,borderRadius:"18px"}}>
        <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"8px"}}>
          <svg width="16" height="16" fill="none" stroke={t.accent} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <Lbl color={t.ink} style={{fontSize:"12px",fontWeight:500,margin:0}}>Booking Link</Lbl>
        </div>
        <p style={{fontFamily:f,fontSize:"14px",color:t.muted,margin:"0 0 12px",lineHeight:1.5}}>Your public booking page — clients can see your profile, services, and book directly.</p>
        <div style={{display:"flex",alignItems:"center",gap:"6px",padding:"10px 12px",borderRadius:"10px",background:"#fff",border:"1px solid "+t.line}}>
          <svg width="14" height="14" fill="none" stroke={t.muted} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <span style={{fontFamily:f,fontSize:"12px",color:t.muted,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{bookUrl}</span>
        </div>
        <ActionBtns type="booking" url={bookUrl}/>
        {showQR==="booking"&&<QR url={bookUrl}/>}
      </div>
    </div>
  );
}

function MenuBtn({onClick}){return(
  <button onClick={onClick} style={{background:"none",border:"none",cursor:"pointer",padding:"4px",display:"flex",flexDirection:"column",gap:"4px",width:"20px"}}>
    <div style={{width:"20px",height:"2px",background:t.accent}}/>
    <div style={{width:"14px",height:"2px",background:t.accent}}/>
    <div style={{width:"20px",height:"2px",background:t.accent}}/>
  </button>
)}

function NotifBell({count=0,onClick}){return(
  <button onClick={onClick} style={{position:"relative",background:"none",border:"none",cursor:"pointer",padding:"4px",display:"flex"}}>
    <svg width="20" height="20" fill="none" stroke={t.ink} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" strokeLinecap="round" strokeLinejoin="round"/></svg>
    {count>0&&<div style={{position:"absolute",top:"-2px",right:"-2px",minWidth:"16px",height:"16px",borderRadius:"8px",background:t.accent,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 4px",border:"2px solid "+t.base}}>
      <span style={{fontFamily:f,fontSize:"9px",fontWeight:600,color:"#fff",lineHeight:1}}>{count>99?"99+":count}</span>
    </div>}
  </button>
)}

function Header({onMenu,initials="ET",notifCount=0,onNotif,showAvatar=true}){return(
  <header style={{padding:"32px 24px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",position:"relative"}}>
    <MenuBtn onClick={onMenu}/>
    <Lbl color={t.accent} style={{fontSize:"13px",fontWeight:600,position:"absolute",left:"50%",transform:"translateX(-50%)"}}>Kliques</Lbl>
    <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
      <NotifBell count={notifCount} onClick={onNotif}/>
      {showAvatar&&<Avatar initials={initials} size={36}/>}
    </div>
  </header>
)}

function HeroCard({children,style={}}){return(
  <div style={{margin:"0 16px",background:t.hero,borderRadius:"28px",padding:"28px",position:"relative",overflow:"hidden",minHeight:"260px",display:"flex",flexDirection:"column",justifyContent:"space-between",...style}}>
    <div style={{position:"absolute",inset:0,backgroundImage:topoSvg,backgroundSize:"cover",opacity:0.15,pointerEvents:"none"}}/>
    <div style={{position:"relative",zIndex:1,display:"flex",flexDirection:"column",justifyContent:"space-between",flex:1}}>{children}</div>
  </div>
)}

function HeroPill({children}){return(
  <div style={{display:"inline-flex",alignItems:"center",gap:"6px",padding:"6px 12px",border:"1px solid rgba(61,35,30,0.1)",borderRadius:"9999px",background:"rgba(255,255,255,0.3)",backdropFilter:"blur(4px)",marginBottom:"24px",alignSelf:"flex-start"}}>
    <span style={{width:"6px",height:"6px",borderRadius:"50%",background:t.accent}}/>
    <Lbl color={t.ink} style={{fontSize:"11px",margin:0}}>{children}</Lbl>
  </div>
)}

function HeroDivider(){return <div style={{height:"1px",background:"rgba(61,35,30,0.1)",marginBottom:"16px"}}/>}

function Footer(){return(
  <div style={{padding:"40px 0 32px",marginTop:"auto"}}>
    <Divider/>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"24px 0 0"}}>
      <Lbl color={t.faded} style={{fontSize:"10px",letterSpacing:"0.08em"}}>© 2026 Kliques</Lbl>
      <div style={{display:"flex",gap:"16px"}}>
        {["Terms","Privacy","Help"].map(l=><Lbl key={l} color={t.faded} style={{fontSize:"10px",cursor:"pointer",letterSpacing:"0.08em"}}>{l}</Lbl>)}
      </div>
    </div>
  </div>
)}

function BackBtn({onClick}){return(
  <button onClick={onClick} style={{background:"none",border:"none",cursor:"pointer",padding:"4px",display:"flex"}}>
    <svg width="24" height="24" fill="none" stroke={t.ink} strokeWidth="2" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/></svg>
  </button>
)}

// ═══════════════════════════════════════════
// OFFCANVAS MENU
// ═══════════════════════════════════════════
function SideMenu({open,onClose,items,active,onNav,userName,userInitials}){
  if(!open) return null;
  return(
    <div style={{position:"absolute",inset:0,zIndex:50,display:"flex"}}>
      <div onClick={onClose} style={{position:"absolute",inset:0,background:"rgba(61,35,30,0.3)"}}/>
      <div style={{position:"relative",width:"280px",height:"100%",background:t.base,display:"flex",flexDirection:"column",boxShadow:"4px 0 24px rgba(61,35,30,0.08)"}}>
        <div style={{padding:"28px 24px 20px",borderBottom:"1px solid "+t.line}}>
          <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
            <Avatar initials={userInitials} size={40}/>
            <div>
              <p style={{fontFamily:f,fontSize:"15px",fontWeight:500,color:t.ink,margin:0}}>{userName}</p>
              <Lbl color={t.accent} style={{fontSize:"10px",marginTop:"2px"}}>Kliques</Lbl>
            </div>
          </div>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"12px 0"}}>
          {items.map(item=>(
            <button key={item.id} onClick={()=>{onNav(item.id);onClose()}} style={{
              display:"flex",alignItems:"center",padding:"14px 24px",
              background:active===item.id?"rgba(194,94,74,0.08)":"transparent",
              border:"none",cursor:"pointer",width:"100%",textAlign:"left",
              borderLeft:active===item.id?"3px solid "+t.accent:"3px solid transparent",
            }}>
              <span style={{fontFamily:f,fontSize:"13px",fontWeight:active===item.id?600:400,color:active===item.id?t.accent:t.muted,letterSpacing:"0.02em"}}>{item.label}</span>
            </button>
          ))}
        </div>
        <div style={{padding:"12px 24px",borderTop:"1px solid "+t.line}}>
          <button style={{display:"flex",alignItems:"center",gap:"10px",padding:"14px 0",background:"none",border:"none",cursor:"pointer",width:"100%",textAlign:"left"}}>
            <svg width="18" height="18" fill="none" stroke={t.danger} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span style={{fontFamily:f,fontSize:"13px",fontWeight:500,color:t.danger,letterSpacing:"0.02em"}}>Sign Out</span>
          </button>
        </div>
        <div style={{padding:"8px 24px 16px"}}>
          <Lbl color={t.faded} style={{fontSize:"10px",letterSpacing:"0.08em"}}>Kliques · Relationship OS</Lbl>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// PHONE FRAME
// ═══════════════════════════════════════════
function Phone({children,screen,setScreen,screenList,labels}){return(
  <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"1rem",width:"100%",maxWidth:"420px"}}>
    <div style={{width:"100%",maxWidth:"414px",height:"896px",background:t.base,position:"relative",overflow:"hidden",boxShadow:"0 0 40px rgba(61,35,30,0.05)",borderRadius:"40px",border:"1px solid "+t.line}}>
      <div style={{height:"100%",overflowY:"auto",overflowX:"hidden",position:"relative"}}>{children}</div>
    </div>
    <div style={{display:"flex",flexWrap:"wrap",gap:"4px",justifyContent:"center",maxWidth:"420px"}}>
      {screenList.map(s=><button key={s} onClick={()=>setScreen(s)} style={{padding:"5px 12px",borderRadius:"9999px",border:"none",fontSize:"10px",fontFamily:f,fontWeight:screen===s?600:400,background:screen===s?t.ink:t.avatarBg,color:screen===s?"#fff":t.muted,cursor:"pointer",letterSpacing:"0.02em"}}>{labels[s]}</button>)}
    </div>
  </div>
)}

// ═══════════════════════════════════════════
// CLIENT SCREENS
// ═══════════════════════════════════════════

const clientMenu=[
  {id:"c_providers",label:"My Kliques"},
  {id:"c_messages",label:"Messages"},
  {id:"c_profile",label:"Profile"},
];
const clientScreens=["c_providers","c_relationship","c_services","c_service_detail","c_intake","c_time","c_time_request","c_time_request_sent","c_payment","c_confirmed","c_review","c_messages","c_chat","c_notifications","c_all_notifications","c_profile"];
const clientLabels={c_providers:"My kliques",c_relationship:"Relationship",c_services:"Services",c_service_detail:"Service detail",c_intake:"Intake",c_time:"Time",c_time_request:"Request Time",c_time_request_sent:"Request Sent",c_payment:"Payment",c_confirmed:"Confirmed",c_review:"Review",c_messages:"Messages",c_chat:"Chat",c_notifications:"Notifications",c_all_notifications:"All Notifications",c_profile:"Profile"};

// ─── C1: My kliques ─────────────────────
function CProviders({go,onMenu,notifCount,onNotif}){
  const providers=[
    {name:"Anny Wong",role:"Vocal Trainer",rating:"4.9",visits:12,initials:"AW",lastVisit:"Mar 12"},
    {name:"Mia Chen",role:"Hairstylist",rating:"4.8",visits:8,initials:"MC",lastVisit:"Feb 28"},
    {name:"James Okafor",role:"Personal Trainer",rating:"4.7",visits:3,initials:"JO",lastVisit:"Jan 15"},
  ];
  return(
    <div style={{minHeight:"100%",background:t.base,display:"flex",flexDirection:"column"}}>
      <Header onMenu={onMenu} notifCount={notifCount} onNotif={onNotif} showAvatar={false}/>
      <div style={{padding:"0 24px 24px"}}>
        <Lbl style={{marginBottom:"6px"}}>Your relationships</Lbl>
        <h1 style={{fontFamily:f,fontSize:"32px",fontWeight:400,letterSpacing:"-0.03em",lineHeight:1.1,color:t.ink,margin:0}}>My kliques</h1>
      </div>
      <div style={{padding:"0 24px",flex:1,display:"flex",flexDirection:"column"}}>
        <Divider/>
        {providers.map(p=>(
          <div key={p.name}>
            <button onClick={()=>go("c_relationship")} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"20px 0",background:"none",border:"none",cursor:"pointer",width:"100%",textAlign:"left"}}>
              <div style={{display:"flex",alignItems:"center",gap:"16px",flex:1}}>
                <Avatar initials={p.initials} size={44}/>
                <div>
                  <p style={{fontFamily:f,fontSize:"16px",fontWeight:400,color:t.ink,margin:"0 0 4px"}}>{p.name}</p>
                  <p style={{fontFamily:f,fontSize:"13px",color:t.muted,margin:0}}>{p.role} · {p.visits} visits</p>
                </div>
              </div>
              <ArrowIcon size={18}/>
            </button>
            <Divider/>
          </div>
        ))}
        <Footer/>
      </div>
    </div>
  );
}

// ─── C2: Relationship ────────────────────
function CRelationship({go}){
  const timeline=[
    {date:"Mar 12, 2026",svc:"1-on-1 Vocal Lesson",dur:"60 min",price:"$85",note:"Worked on breath control and upper range. Ready for recital."},
    {date:"Feb 26, 2026",svc:"Performance Coaching",dur:"45 min",price:"$95",note:"Stage presence exercises. Reviewed video of last open mic."},
    {date:"Feb 12, 2026",svc:"1-on-1 Vocal Lesson",dur:"60 min",price:"$85",note:"Focus on vibrato technique. Assigned warm-up exercises."},
    {date:"Jan 29, 2026",svc:"Group Class",dur:"90 min",price:"$45",note:"Harmonies workshop. Great progress on ear training."},
  ];
  return(
    <div style={{minHeight:"100%",background:t.base,display:"flex",flexDirection:"column"}}>
      <div style={{padding:"32px 24px 16px"}}><BackBtn onClick={()=>go("c_providers")}/></div>

      <HeroCard>
        <div>
          <HeroPill>Connected · Jan 2026</HeroPill>
          <div style={{display:"flex",alignItems:"center",gap:"16px",marginBottom:"4px"}}>
            <div style={{width:"64px",height:"64px",borderRadius:"50%",background:"rgba(255,255,255,0.5)",border:"2px solid rgba(255,255,255,0.7)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:"0 4px 12px rgba(61,35,30,0.08)"}}>
              <span style={{fontFamily:f,fontSize:"20px",fontWeight:500,color:t.ink}}>AW</span>
            </div>
            <div>
              <h1 style={{fontFamily:f,fontSize:"28px",fontWeight:400,letterSpacing:"-0.03em",lineHeight:1.1,color:t.ink,margin:0}}>Anny Wong</h1>
              <p style={{fontFamily:f,fontSize:"15px",color:t.muted,margin:"6px 0 0"}}>Vocal Trainer · Ottawa</p>
            </div>
          </div>
        </div>
        <div>
          <HeroDivider/>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"end"}}>
            <div>
              <Lbl color={t.muted} style={{marginBottom:"4px"}}>Sessions</Lbl>
              <span style={{fontFamily:f,fontSize:"32px",fontWeight:400,letterSpacing:"-0.05em",color:t.accent}}>12</span>
            </div>
            <div style={{textAlign:"center"}}>
              <Lbl color={t.muted} style={{marginBottom:"4px"}}>Last Visit</Lbl>
              <span style={{fontFamily:f,fontSize:"32px",fontWeight:400,letterSpacing:"-0.05em",color:t.accent}}>Mar 12</span>
            </div>
            <ArrowIcon/>
          </div>
        </div>
      </HeroCard>

      <div style={{padding:"32px 24px 0",flex:1,display:"flex",flexDirection:"column"}}>
        <div style={{display:"flex",gap:"8px",marginBottom:"32px"}}>
          <button onClick={()=>go("c_services")} style={{flex:1,padding:"14px",borderRadius:"12px",border:"none",background:t.ink,color:"#fff",fontFamily:f,fontSize:"13px",fontWeight:500,cursor:"pointer",letterSpacing:"0.02em"}}>Book Appointment</button>
          <button onClick={()=>go("c_messages")} style={{flex:1,padding:"14px",borderRadius:"12px",border:"1px solid "+t.line,background:"transparent",color:t.ink,fontFamily:f,fontSize:"13px",fontWeight:500,cursor:"pointer",letterSpacing:"0.02em"}}>Message</button>
        </div>

        <div style={{display:"flex",justifyContent:"space-between",alignItems:"end",marginBottom:"12px"}}>
          <Lbl>Session History</Lbl>
          <Lbl color={t.accent} style={{cursor:"pointer"}}>View All</Lbl>
        </div>
        <Divider/>

        {timeline.map((item,i)=>(
          <div key={i}>
            <div style={{padding:"20px 0"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"8px"}}>
                <div>
                  <p style={{fontFamily:f,fontSize:"16px",fontWeight:400,color:t.ink,margin:"0 0 4px"}}>{item.svc}</p>
                  <Lbl>{item.date} · {item.dur}</Lbl>
                </div>
                <span style={{fontFamily:f,fontSize:"16px",fontWeight:400,color:t.ink}}>{item.price}</span>
              </div>
              <div style={{padding:"12px 16px",background:t.avatarBg,borderRadius:"10px",marginTop:"12px"}}>
                <Lbl color={t.muted} style={{marginBottom:"4px",fontSize:"10px"}}>Notes from Provider</Lbl>
                <p style={{fontFamily:f,fontSize:"14px",color:t.ink,margin:0,lineHeight:1.6,fontStyle:"italic"}}>"{item.note}"</p>
              </div>
            </div>
            <Divider/>
          </div>
        ))}
        <Footer/>
      </div>
    </div>
  );
}

// ─── C3: Select services ─────────────────
function CServices({go}){
  const [selected,setSelected]=useState([]);
  const groups=[
    {name:"Private Sessions",services:[
      {id:"s1",name:"1-on-1 Vocal Lesson",dur:"60 min",price:"$85"},
      {id:"s2",name:"Performance Coaching",dur:"45 min",price:"$95"},
      {id:"s3",name:"Song Arrangement",dur:"30–60 min",price:"from $65"},
    ]},
    {name:"Group Sessions",services:[
      {id:"s4",name:"Group Class",dur:"90 min",price:"$45"},
      {id:"s5",name:"Duet Workshop",dur:"60 min",price:"$60"},
    ]},
    {name:"Packages",services:[
      {id:"s6",name:"Starter Pack (4 sessions)",dur:"4 × 60 min",price:"$300"},
    ]},
  ];
  const toggle=(id)=>setSelected(prev=>prev.includes(id)?prev.filter(x=>x!==id):[...prev,id]);
  return(
    <div style={{minHeight:"100%",background:t.base,display:"flex",flexDirection:"column"}}>
      <div style={{padding:"32px 24px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <BackBtn onClick={()=>go("c_relationship")}/>
        <Lbl color={t.ink} style={{fontSize:"13px",fontWeight:500}}>Select Services</Lbl>
        <button onClick={()=>go("c_relationship")} style={{background:"none",border:"none",cursor:"pointer",padding:"4px"}}><svg width="24" height="24" fill="none" stroke={t.ink} strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/></svg></button>
      </div>

      <div style={{padding:"0 24px",flex:1,display:"flex",flexDirection:"column"}}>
        {groups.map((group,gi)=>(
          <div key={group.name}>
            <Lbl color={t.ink} style={{fontSize:"12px",fontWeight:500,padding:"16px 0 8px"}}>{group.name}</Lbl>
            <Divider/>
            {group.services.map(s=>(
              <div key={s.id}>
                <button onClick={()=>toggle(s.id)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"20px 0",background:"none",border:"none",cursor:"pointer",width:"100%",textAlign:"left"}}>
                  <div style={{flex:1}}>
                    <p style={{fontFamily:f,fontSize:"16px",fontWeight:400,color:t.ink,margin:"0 0 4px"}}>{s.name}</p>
                    <p style={{fontFamily:f,fontSize:"13px",color:t.muted,margin:0}}>{s.dur} · {s.price}</p>
                  </div>
                  <div style={{width:"28px",height:"28px",borderRadius:"50%",border:selected.includes(s.id)?"none":"1.5px solid "+t.line,background:selected.includes(s.id)?t.accent:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    {selected.includes(s.id)&&<svg width="14" height="14" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                </button>
                <Divider/>
              </div>
            ))}
          </div>
        ))}
        <Footer/>
      </div>

      {/* Sticky bottom bar */}
      {selected.length>0&&<div style={{position:"sticky",bottom:0,padding:"16px 24px",background:t.base,borderTop:"1px solid "+t.line,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <p style={{fontFamily:f,fontSize:"14px",color:t.muted,margin:0}}>{selected.length} service{selected.length>1?"s":""} selected</p>
        <button onClick={()=>go("c_service_detail")} style={{padding:"12px 28px",borderRadius:"12px",border:"none",background:t.ink,color:"#fff",fontFamily:f,fontSize:"13px",fontWeight:500,cursor:"pointer",letterSpacing:"0.02em"}}>Continue</button>
      </div>}
    </div>
  );
}

// ─── C4: Service detail (bottom sheet) ───
function CServiceDetail({go}){
  const [sel,setSel]=useState(null);
  const opts=[{l:"Standard",d:"60 min",p:"$85"},{l:"Extended",d:"90 min",p:"$120"},{l:"With Recording",d:"90 min",p:"$145"}];
  return(
    <div style={{minHeight:"100%",background:"rgba(0,0,0,0.4)",display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>
      <div style={{background:t.base,borderRadius:"24px 24px 0 0",maxHeight:"85%",overflow:"auto"}}>
        <div style={{display:"flex",justifyContent:"center",padding:"10px 0 0"}}><div style={{width:"40px",height:"4px",borderRadius:"2px",background:t.line}}/></div>
        <div style={{display:"flex",justifyContent:"flex-end",padding:"8px 24px 0"}}><button onClick={()=>go("c_services")} style={{background:"none",border:"none",cursor:"pointer",padding:"4px"}}><svg width="24" height="24" fill="none" stroke={t.ink} strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/></svg></button></div>
        <div style={{padding:"0 24px 32px"}}>
          <h1 style={{fontFamily:f,fontSize:"24px",fontWeight:400,letterSpacing:"-0.02em",color:t.ink,margin:"0 0 8px"}}>1-on-1 Vocal Lesson</h1>
          <p style={{fontFamily:f,fontSize:"14px",color:t.muted,margin:"0 0 24px",lineHeight:1.6}}>Personalized vocal training tailored to your range, technique, and performance goals.</p>
          
          <Divider/>
          {opts.map((o,i)=>(
            <div key={o.l}>
              <button onClick={()=>setSel(i)} style={{display:"flex",alignItems:"center",gap:"14px",padding:"20px 0",background:"none",border:"none",cursor:"pointer",width:"100%",textAlign:"left"}}>
                <div style={{width:"22px",height:"22px",borderRadius:"50%",border:sel===i?"none":"1.5px solid "+t.line,background:sel===i?t.accent:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  {sel===i&&<div style={{width:"8px",height:"8px",borderRadius:"50%",background:"#fff"}}/>}
                </div>
                <div style={{flex:1}}>
                  <p style={{fontFamily:f,fontSize:"16px",fontWeight:400,color:t.ink,margin:"0 0 2px"}}>{o.l}</p>
                  <p style={{fontFamily:f,fontSize:"13px",color:t.muted,margin:0}}>{o.d}</p>
                </div>
                <span style={{fontFamily:f,fontSize:"16px",fontWeight:400,color:t.ink}}>{o.p}</span>
              </button>
              <Divider/>
            </div>
          ))}
          <button onClick={()=>sel!==null&&go("c_intake")} style={{width:"100%",padding:"16px",borderRadius:"12px",border:"none",background:sel!==null?t.ink:t.faded,color:"#fff",marginTop:"20px",fontFamily:f,fontSize:"14px",fontWeight:500,cursor:sel!==null?"pointer":"default",letterSpacing:"0.02em"}}>Continue</button>
        </div>
      </div>
    </div>
  );
}

// ─── C4b: Intake questions ───────────────
function CIntake({go}){
  const [answers,setAnswers]=useState({});
  const [notes,setNotes]=useState("");
  const questions=[
    {id:"focus",q:"What area would you like to focus on?",type:"select",opts:["Breath control","Range extension","Performance prep","Song learning","Other"]},
    {id:"level",q:"Experience level?",type:"select",opts:["Beginner","Intermediate","Advanced"]},
  ];
  const selectOpt=(qid,opt)=>setAnswers(prev=>({...prev,[qid]:opt}));
  const allAnswered=questions.every(q=>answers[q.id]);
  return(
    <div style={{minHeight:"100%",background:t.base,display:"flex",flexDirection:"column"}}>
      <div style={{padding:"32px 24px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <BackBtn onClick={()=>go("c_service_detail")}/>
        <Lbl color={t.ink} style={{fontSize:"13px",fontWeight:500}}>A Few Questions</Lbl>
        <button onClick={()=>go("c_providers")} style={{background:"none",border:"none",cursor:"pointer",padding:"4px"}}><svg width="24" height="24" fill="none" stroke={t.ink} strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/></svg></button>
      </div>

      <div style={{padding:"0 24px 8px"}}>
        <p style={{fontFamily:f,fontSize:"15px",color:t.muted,margin:0,lineHeight:1.6}}>Help your provider prepare by answering a few quick questions.</p>
      </div>

      <div style={{padding:"0 24px",flex:1,display:"flex",flexDirection:"column"}}>
        {questions.map((q,qi)=>(
          <div key={q.id} style={{marginBottom:"28px"}}>
            <Lbl style={{marginBottom:"12px"}}>{q.q}</Lbl>
            <div style={{display:"flex",flexWrap:"wrap",gap:"8px"}}>
              {q.opts.map(opt=>{
                const selected=answers[q.id]===opt;
                return(
                  <button key={opt} onClick={()=>selectOpt(q.id,opt)} style={{padding:"10px 18px",borderRadius:"9999px",border:selected?"2px solid "+t.accent:"1px solid "+t.line,background:selected?t.hero:"transparent",fontFamily:f,fontSize:"13px",fontWeight:selected?500:400,color:selected?t.accent:t.ink,cursor:"pointer"}}>{opt}</button>
                );
              })}
            </div>
          </div>
        ))}

        <Divider/>

        {/* Client notes */}
        <div style={{padding:"20px 0"}}>
          <Lbl style={{marginBottom:"8px"}}>Anything else you'd like to share?</Lbl>
          <p style={{fontFamily:f,fontSize:"13px",color:t.muted,margin:"0 0 12px",lineHeight:1.5}}>Add any details, preferences, or things your provider should know before your session.</p>
          <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="E.g., I've been having trouble with high notes lately and would love to work on that..." rows={4} style={{width:"100%",padding:"14px 16px",borderRadius:"12px",border:"1px solid "+t.line,fontFamily:f,fontSize:"13px",color:t.ink,resize:"vertical",outline:"none",background:t.avatarBg,boxSizing:"border-box"}}/>
          <p style={{fontFamily:f,fontSize:"11px",color:t.faded,margin:"8px 0 0"}}>{notes.length}/500</p>
        </div>

        <Footer/>
      </div>

      {/* Sticky continue */}
      <div style={{position:"sticky",bottom:0,padding:"16px 24px",background:t.base,borderTop:"1px solid "+t.line}}>
        <button onClick={()=>go("c_time")} style={{width:"100%",padding:"16px",borderRadius:"12px",border:"none",background:allAnswered||notes.length>0?t.ink:t.faded,color:"#fff",fontFamily:f,fontSize:"14px",fontWeight:500,cursor:allAnswered||notes.length>0?"pointer":"default",letterSpacing:"0.02em"}}>{allAnswered||notes.length>0?"Continue":"Skip"}</button>
      </div>
    </div>
  );
}

// ─── C5: Select time ─────────────────────
function CTime({go}){
  const dates=[{d:"18",l:"Tue"},{d:"19",l:"Wed",today:true},{d:"20",l:"Thu"},{d:"21",l:"Fri"},{d:"22",l:"Sat"},{d:"23",l:"Sun"},{d:"24",l:"Mon"}];
  const times=["9:00 AM","10:30 AM","12:00 PM","2:00 PM","3:30 PM"];
  const [selDate,setSelDate]=useState(1);
  const [selTime,setSelTime]=useState(null);
  return(
    <div style={{minHeight:"100%",background:t.base,display:"flex",flexDirection:"column"}}>
      <div style={{padding:"32px 24px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <BackBtn onClick={()=>go("c_service_detail")}/>
        <Lbl color={t.ink} style={{fontSize:"13px",fontWeight:500}}>Select Time</Lbl>
        <button onClick={()=>go("c_providers")} style={{background:"none",border:"none",cursor:"pointer",padding:"4px"}}><svg width="24" height="24" fill="none" stroke={t.ink} strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/></svg></button>
      </div>

      {/* Date picker */}
      <div style={{padding:"0 24px 24px"}}>
        <Lbl style={{marginBottom:"12px"}}>March 2026</Lbl>
        <div style={{display:"flex",gap:"8px",overflowX:"auto"}}>
          {dates.map((d,i)=>(
            <button key={d.d} onClick={()=>setSelDate(i)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"6px",padding:"12px 14px",borderRadius:"14px",background:selDate===i?t.ink:"transparent",border:selDate===i?"none":"1px solid "+t.line,cursor:"pointer",minWidth:"52px"}}>
              <span style={{fontFamily:f,fontSize:"11px",fontWeight:500,color:selDate===i?"rgba(255,255,255,0.7)":t.muted,letterSpacing:"0.03em"}}>{d.l}</span>
              <span style={{fontFamily:f,fontSize:"20px",fontWeight:400,color:selDate===i?"#fff":t.ink}}>{d.d}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Time slots */}
      <div style={{padding:"0 24px",flex:1,display:"flex",flexDirection:"column"}}>
        <Lbl style={{marginBottom:"12px"}}>Available Times</Lbl>
        <Divider/>
        {times.map((time,i)=>(
          <div key={time}>
            <button onClick={()=>setSelTime(i)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"18px 0",background:"none",border:"none",cursor:"pointer",width:"100%",textAlign:"left"}}>
              <span style={{fontFamily:f,fontSize:"16px",fontWeight:400,color:selTime===i?t.accent:t.ink}}>{time}</span>
              {selTime===i&&<div style={{width:"10px",height:"10px",borderRadius:"50%",background:t.accent}}/>}
            </button>
            <Divider/>
          </div>
        ))}
        <button onClick={()=>go("c_time_request")} style={{fontFamily:f,fontSize:"14px",color:t.accent,margin:"16px 0",cursor:"pointer",fontWeight:500,background:"none",border:"none",textAlign:"left",padding:0}}>Can't find a time? Request one →</button>
        <Footer/>
      </div>

      {selTime!==null&&<div style={{position:"sticky",bottom:0,padding:"16px 24px",background:t.base,borderTop:"1px solid "+t.line}}>
        <button onClick={()=>go("c_payment")} style={{width:"100%",padding:"16px",borderRadius:"12px",border:"none",background:t.ink,color:"#fff",fontFamily:f,fontSize:"14px",fontWeight:500,cursor:"pointer",letterSpacing:"0.02em"}}>Confirm Booking</button>
      </div>}
    </div>
  );
}

// ─── C5b: Request a time ─────────────────
function CTimeRequest({go}){
  const [selDate,setSelDate]=useState("");
  const [selTime,setSelTime]=useState("");
  const [note,setNote]=useState("");
  const canSubmit=selDate&&selTime;
  return(
    <div style={{minHeight:"100%",background:t.base,display:"flex",flexDirection:"column"}}>
      <div style={{padding:"32px 24px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <BackBtn onClick={()=>go("c_time")}/>
        <Lbl color={t.ink} style={{fontSize:"13px",fontWeight:500}}>Request a Time</Lbl>
        <button onClick={()=>go("c_providers")} style={{background:"none",border:"none",cursor:"pointer",padding:"4px"}}><svg width="24" height="24" fill="none" stroke={t.ink} strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/></svg></button>
      </div>
      <div style={{padding:"0 24px",flex:1,display:"flex",flexDirection:"column"}}>
        <h1 style={{fontFamily:f,fontSize:"28px",fontWeight:400,letterSpacing:"-0.03em",color:t.ink,margin:"0 0 8px"}}>Request a time.</h1>
        <p style={{fontFamily:f,fontSize:"15px",color:t.muted,margin:"0 0 28px",lineHeight:1.6}}>Let Anny know when you'd like to meet. No payment is required until the request is accepted.</p>

        <div style={{padding:"14px 16px",background:t.callout,borderRadius:"12px",marginBottom:"24px",display:"flex",gap:"10px",alignItems:"flex-start"}}>
          <svg width="16" height="16" fill="none" stroke="#92400E" strokeWidth="1.5" viewBox="0 0 24 24" style={{flexShrink:0,marginTop:"2px"}}><path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <p style={{fontFamily:f,fontSize:"13px",color:"#92400E",margin:0,lineHeight:1.5}}>This is a request, not a confirmed booking. You'll only pay once Anny accepts your time.</p>
        </div>

        <Lbl style={{marginBottom:"8px"}}>Preferred Date</Lbl>
        <input type="date" value={selDate} onChange={e=>setSelDate(e.target.value)} style={{width:"100%",padding:"14px 16px",borderRadius:"12px",border:"1px solid "+t.line,fontFamily:f,fontSize:"14px",color:t.ink,outline:"none",background:t.avatarBg,boxSizing:"border-box",marginBottom:"20px"}}/>

        <Lbl style={{marginBottom:"8px"}}>Preferred Time</Lbl>
        <input type="time" value={selTime} onChange={e=>setSelTime(e.target.value)} style={{width:"100%",padding:"14px 16px",borderRadius:"12px",border:"1px solid "+t.line,fontFamily:f,fontSize:"14px",color:t.ink,outline:"none",background:t.avatarBg,boxSizing:"border-box",marginBottom:"20px"}}/>

        <Lbl style={{marginBottom:"8px"}}>Message to Provider (optional)</Lbl>
        <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Let them know why this time works best for you..." rows={3} style={{width:"100%",padding:"14px 16px",borderRadius:"12px",border:"1px solid "+t.line,fontFamily:f,fontSize:"13px",color:t.ink,resize:"vertical",outline:"none",background:t.avatarBg,boxSizing:"border-box"}}/>

        <div style={{marginTop:"auto",padding:"20px 0 32px"}}>
          <button onClick={()=>canSubmit&&go("c_time_request_sent")} style={{width:"100%",padding:"16px",borderRadius:"12px",border:"none",background:canSubmit?t.ink:t.faded,color:"#fff",fontFamily:f,fontSize:"14px",fontWeight:500,cursor:canSubmit?"pointer":"default"}}>Send Request</button>
        </div>
      </div>
    </div>
  );
}

// ─── C5c: Request sent confirmation ──────
function CTimeRequestSent({go}){return(
  <div style={{minHeight:"100%",background:t.base,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px"}}>
    <div style={{width:"72px",height:"72px",borderRadius:"20px",background:t.hero,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:"24px",position:"relative"}}>
      <div style={{position:"absolute",inset:0,borderRadius:"20px",backgroundImage:topoSvg,backgroundSize:"cover",opacity:0.1,pointerEvents:"none"}}/>
      <svg width="32" height="32" fill="none" stroke={t.accent} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/></svg>
    </div>
    <h1 style={{fontFamily:f,fontSize:"24px",fontWeight:400,letterSpacing:"-0.02em",color:t.ink,margin:"0 0 8px",textAlign:"center"}}>Request sent.</h1>
    <p style={{fontFamily:f,fontSize:"15px",color:t.muted,margin:"0 0 8px",textAlign:"center",lineHeight:1.6,maxWidth:"300px"}}>Anny will review your request and get back to you.</p>
    <p style={{fontFamily:f,fontSize:"14px",color:t.muted,margin:"0 0 32px",textAlign:"center",lineHeight:1.6,maxWidth:"300px"}}>You'll receive a notification once it's accepted. Payment is only collected after confirmation.</p>
    <button onClick={()=>go("c_providers")} style={{width:"100%",padding:"16px",borderRadius:"12px",border:"none",background:t.ink,color:"#fff",fontFamily:f,fontSize:"14px",fontWeight:500,cursor:"pointer"}}>Back to My Kliques</button>
  </div>
)}

// ─── C6: Payment ─────────────────────────
function CPayment({go}){
  const [payType]=useState("deposit"); // "full" or "deposit" — driven by provider settings
  const [savedCard]=useState(true);
  const [useNew,setUseNew]=useState(false);
  const total=85;const depositPct=30;const depositAmt=Math.round(total*depositPct/100);const remaining=total-depositAmt;
  return(
    <div style={{minHeight:"100%",background:t.base,display:"flex",flexDirection:"column"}}>
      <div style={{padding:"32px 24px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <BackBtn onClick={()=>go("c_time")}/>
        <Lbl color={t.ink} style={{fontSize:"13px",fontWeight:500}}>Payment</Lbl>
        <button onClick={()=>go("c_providers")} style={{background:"none",border:"none",cursor:"pointer",padding:"4px"}}><svg width="24" height="24" fill="none" stroke={t.ink} strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/></svg></button>
      </div>

      <div style={{padding:"0 24px",flex:1,display:"flex",flexDirection:"column"}}>
        {/* Booking summary */}
        <Lbl style={{marginBottom:"12px"}}>Booking Summary</Lbl>
        <div style={{padding:"20px",background:t.avatarBg,borderRadius:"14px",marginBottom:"28px"}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:"8px"}}>
            <p style={{fontFamily:f,fontSize:"16px",fontWeight:400,color:t.ink,margin:0}}>1-on-1 Vocal Lesson</p>
            <span style={{fontFamily:f,fontSize:"16px",fontWeight:400,color:t.ink}}>${total}</span>
          </div>
          <p style={{fontFamily:f,fontSize:"13px",color:t.muted,margin:"0 0 4px"}}>Wed, Mar 19 at 10:30 AM · 60 min</p>
          <p style={{fontFamily:f,fontSize:"13px",color:t.muted,margin:0}}>with Anny Wong</p>
        </div>

        {/* Payment breakdown — deposit vs full */}
        {payType==="deposit"&&<>
          <Lbl style={{marginBottom:"12px"}}>Payment Breakdown</Lbl>
          <Divider/>
          <div style={{display:"flex",justifyContent:"space-between",padding:"16px 0"}}>
            <div>
              <p style={{fontFamily:f,fontSize:"15px",fontWeight:500,color:t.ink,margin:"0 0 2px"}}>Due now</p>
              <p style={{fontFamily:f,fontSize:"13px",color:t.muted,margin:0}}>{depositPct}% deposit to confirm</p>
            </div>
            <span style={{fontFamily:f,fontSize:"24px",fontWeight:400,letterSpacing:"-0.03em",color:t.accent}}>${depositAmt}</span>
          </div>
          <Divider/>
          <div style={{display:"flex",justifyContent:"space-between",padding:"16px 0"}}>
            <div>
              <p style={{fontFamily:f,fontSize:"15px",fontWeight:400,color:t.muted,margin:"0 0 2px"}}>Due after service</p>
              <p style={{fontFamily:f,fontSize:"13px",color:t.faded,margin:0}}>Collected by provider</p>
            </div>
            <span style={{fontFamily:f,fontSize:"20px",fontWeight:400,letterSpacing:"-0.03em",color:t.muted}}>${remaining}</span>
          </div>
          <Divider/>
          <div style={{padding:"14px 16px",background:t.callout,borderRadius:"10px",margin:"16px 0 28px",display:"flex",gap:"10px",alignItems:"flex-start"}}>
            <svg width="16" height="16" fill="none" stroke="#92400E" strokeWidth="1.5" viewBox="0 0 24 24" style={{flexShrink:0,marginTop:"2px"}}><path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <p style={{fontFamily:f,fontSize:"13px",color:"#92400E",margin:0,lineHeight:1.5}}>A ${depositAmt} deposit is required to hold your spot. The remaining ${remaining} is collected after your appointment.</p>
          </div>
        </>}

        {payType==="full"&&<>
          <Lbl style={{marginBottom:"12px"}}>Amount Due</Lbl>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"end",padding:"16px 0 28px"}}>
            <p style={{fontFamily:f,fontSize:"15px",fontWeight:400,color:t.muted,margin:0}}>Full payment</p>
            <span style={{fontFamily:f,fontSize:"32px",fontWeight:400,letterSpacing:"-0.05em",color:t.accent}}>${total}</span>
          </div>
          <Divider/>
        </>}

        {/* Payment method */}
        <Lbl style={{margin:"28px 0 12px"}}>Payment Method</Lbl>
        <Divider/>

        {/* Saved card */}
        {savedCard&&!useNew&&<>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"20px 0"}}>
            <div style={{display:"flex",alignItems:"center",gap:"14px"}}>
              <div style={{width:"44px",height:"30px",borderRadius:"6px",background:t.avatarBg,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <svg width="24" height="16" viewBox="0 0 24 16" fill="none"><rect width="24" height="16" rx="2" fill={t.ink} opacity="0.1"/><circle cx="9" cy="8" r="5" fill="#EB001B" opacity="0.8"/><circle cx="15" cy="8" r="5" fill="#F79E1B" opacity="0.8"/></svg>
              </div>
              <div>
                <p style={{fontFamily:f,fontSize:"15px",fontWeight:400,color:t.ink,margin:"0 0 2px"}}>•••• 4242</p>
                <p style={{fontFamily:f,fontSize:"12px",color:t.muted,margin:0}}>Expires 08/27</p>
              </div>
            </div>
            <div style={{width:"10px",height:"10px",borderRadius:"50%",background:t.accent}}/>
          </div>
          <Divider/>
          <button onClick={()=>setUseNew(true)} style={{background:"none",border:"none",padding:"16px 0",cursor:"pointer",width:"100%",textAlign:"left"}}>
            <p style={{fontFamily:f,fontSize:"14px",color:t.accent,margin:0,fontWeight:500}}>Use a different card →</p>
          </button>
          <Divider/>
        </>}

        {/* New card input */}
        {(!savedCard||useNew)&&<>
          <div style={{padding:"20px 0"}}>
            <div style={{padding:"16px",borderRadius:"12px",border:"1px solid "+t.line,marginBottom:"12px"}}>
              <Lbl style={{marginBottom:"8px",fontSize:"10px"}}>Card Number</Lbl>
              <p style={{fontFamily:f,fontSize:"16px",color:t.faded,margin:0}}>1234 5678 9012 3456</p>
            </div>
            <div style={{display:"flex",gap:"12px"}}>
              <div style={{flex:1,padding:"16px",borderRadius:"12px",border:"1px solid "+t.line}}>
                <Lbl style={{marginBottom:"8px",fontSize:"10px"}}>Expiry</Lbl>
                <p style={{fontFamily:f,fontSize:"16px",color:t.faded,margin:0}}>MM / YY</p>
              </div>
              <div style={{flex:1,padding:"16px",borderRadius:"12px",border:"1px solid "+t.line}}>
                <Lbl style={{marginBottom:"8px",fontSize:"10px"}}>CVC</Lbl>
                <p style={{fontFamily:f,fontSize:"16px",color:t.faded,margin:0}}>123</p>
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:"10px",marginTop:"16px"}}>
              <div style={{width:"18px",height:"18px",borderRadius:"4px",border:"1.5px solid "+t.accent,background:t.hero,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <svg width="10" height="10" fill="none" stroke={t.accent} strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <p style={{fontFamily:f,fontSize:"13px",color:t.muted,margin:0}}>Save this card for future bookings</p>
            </div>
          </div>
          <Divider/>
          {savedCard&&<button onClick={()=>setUseNew(false)} style={{background:"none",border:"none",padding:"14px 0",cursor:"pointer",width:"100%",textAlign:"left"}}>
            <p style={{fontFamily:f,fontSize:"14px",color:t.accent,margin:0,fontWeight:500}}>← Back to saved card</p>
          </button>}
        </>}

        <Footer/>
      </div>

      {/* Sticky pay button */}
      <div style={{position:"sticky",bottom:0,padding:"16px 24px",background:t.base,borderTop:"1px solid "+t.line}}>
        <button onClick={()=>go("c_confirmed")} style={{width:"100%",padding:"16px",borderRadius:"12px",border:"none",background:t.ink,color:"#fff",fontFamily:f,fontSize:"14px",fontWeight:500,cursor:"pointer",letterSpacing:"0.02em"}}>
          {payType==="deposit"?`Pay $${depositAmt} Deposit`:`Pay $${total}`}
        </button>
      </div>
    </div>
  );
}

// ─── C7: Booking confirmed ───────────────
function CConfirmed({go}){
  const depositAmt=26;const remaining=59;
  return(
  <div style={{minHeight:"100%",background:t.base,display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center",padding:"24px"}}>
    {/* Celebration icon — provider avatar with connection ring */}
    <div style={{position:"relative",marginBottom:"28px"}}>
      <div style={{width:"88px",height:"88px",borderRadius:"50%",background:t.hero,display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}>
        <div style={{position:"absolute",inset:"-4px",borderRadius:"50%",border:"2px dashed "+t.accent,opacity:0.4}}/>
        <span style={{fontFamily:f,fontSize:"28px",fontWeight:400,color:t.ink}}>AW</span>
      </div>
      {/* Small confirmed badge */}
      <div style={{position:"absolute",bottom:"-2px",right:"-2px",width:"28px",height:"28px",borderRadius:"50%",background:t.accent,display:"flex",alignItems:"center",justifyContent:"center",border:"3px solid "+t.base}}>
        <svg width="14" height="14" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </div>
    </div>

    <h1 style={{fontFamily:f,fontSize:"28px",fontWeight:400,letterSpacing:"-0.03em",color:t.ink,margin:"0 0 8px",textAlign:"center"}}>You're booked.</h1>
    <p style={{fontFamily:f,fontSize:"15px",color:t.muted,margin:"0 0 32px",textAlign:"center",lineHeight:1.6}}>Wednesday, Mar 19 at 10:30 AM<br/>with Anny Wong</p>

    {/* Receipt */}
    <div style={{width:"100%",padding:"24px",background:t.avatarBg,borderRadius:"16px",marginBottom:"32px"}}>
      <Lbl style={{marginBottom:"16px"}}>Booking Summary</Lbl>
      <Divider/>
      {[{l:"Service",v:"1-on-1 Vocal Lesson"},{l:"Duration",v:"60 min"},{l:"Provider",v:"Anny Wong"}].map(r=>(
        <div key={r.l}><div style={{display:"flex",justifyContent:"space-between",padding:"14px 0"}}><span style={{fontFamily:f,fontSize:"14px",color:t.muted}}>{r.l}</span><span style={{fontFamily:f,fontSize:"14px",color:t.ink,fontWeight:500}}>{r.v}</span></div><Divider/></div>
      ))}
      <div style={{display:"flex",justifyContent:"space-between",padding:"14px 0 0"}}>
        <span style={{fontFamily:f,fontSize:"14px",color:t.muted}}>Deposit paid</span>
        <span style={{fontFamily:f,fontSize:"16px",color:t.accent,fontWeight:500,letterSpacing:"-0.03em"}}>${depositAmt}</span>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",padding:"8px 0 0"}}>
        <span style={{fontFamily:f,fontSize:"14px",color:t.faded}}>Remaining after service</span>
        <span style={{fontFamily:f,fontSize:"14px",color:t.faded}}>${remaining}</span>
      </div>
    </div>

    <button onClick={()=>go("c_messages")} style={{width:"100%",padding:"16px",borderRadius:"12px",border:"none",background:t.ink,color:"#fff",fontFamily:f,fontSize:"14px",fontWeight:500,cursor:"pointer",marginBottom:"10px",letterSpacing:"0.02em"}}>Message Anny Wong</button>
    <button onClick={()=>go("c_providers")} style={{width:"100%",padding:"16px",borderRadius:"12px",border:"1px solid "+t.line,background:"transparent",color:t.ink,fontFamily:f,fontSize:"14px",fontWeight:500,cursor:"pointer",letterSpacing:"0.02em"}}>Back to My Kliques</button>
  </div>
)}

// ─── C7: Messages ────────────────────────
// ─── C7b: Review + Tip ──────────────────
function CReview({go}){
  const [rating,setRating]=useState(0);
  const [hover,setHover]=useState(0);
  const [review,setReview]=useState("");
  const [tipType,setTipType]=useState(null); // null, "15", "20", "25", "custom"
  const [customTip,setCustomTip]=useState("");
  const tipAmounts=["15","20","25"];
  const serviceTotal=85;
  const tipVal=tipType==="custom"?(parseFloat(customTip)||0):tipType?Math.round(serviceTotal*parseInt(tipType)/100):0;

  return(
    <div style={{minHeight:"100%",background:t.base,display:"flex",flexDirection:"column"}}>
      <div style={{padding:"32px 24px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <BackBtn onClick={()=>go("c_providers")}/>
        <Lbl color={t.ink} style={{fontSize:"13px",fontWeight:500}}>Rate Your Session</Lbl>
        <button onClick={()=>go("c_providers")} style={{background:"none",border:"none",cursor:"pointer",padding:"4px",fontFamily:f,fontSize:"13px",color:t.accent,fontWeight:500}}>Skip</button>
      </div>

      <div style={{padding:"0 24px",flex:1,display:"flex",flexDirection:"column"}}>
        {/* Provider info */}
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",marginBottom:"28px"}}>
          <div style={{width:"64px",height:"64px",borderRadius:"50%",background:t.hero,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:"12px"}}>
            <span style={{fontFamily:f,fontSize:"20px",fontWeight:400,color:t.ink}}>AW</span>
          </div>
          <p style={{fontFamily:f,fontSize:"16px",fontWeight:400,color:t.ink,margin:"0 0 2px"}}>How was your session with</p>
          <p style={{fontFamily:f,fontSize:"20px",fontWeight:400,letterSpacing:"-0.02em",color:t.ink,margin:0}}>Anny Wong?</p>
        </div>

        {/* Star rating */}
        <div style={{display:"flex",justifyContent:"center",gap:"8px",marginBottom:"28px"}}>
          {[1,2,3,4,5].map(star=>(
            <button key={star} onClick={()=>setRating(star)} onMouseEnter={()=>setHover(star)} onMouseLeave={()=>setHover(0)} style={{background:"none",border:"none",cursor:"pointer",padding:"4px"}}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill={(hover||rating)>=star?t.accent:"none"} stroke={(hover||rating)>=star?t.accent:t.line} strokeWidth="1.5">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          ))}
        </div>

        {rating>0&&<>
          {/* Written review */}
          <Lbl style={{marginBottom:"8px"}}>Tell us more (optional)</Lbl>
          <textarea value={review} onChange={e=>setReview(e.target.value)} placeholder="What made this session great? Or what could be improved?" rows={3} style={{width:"100%",padding:"14px 16px",borderRadius:"12px",border:"1px solid "+t.line,fontFamily:f,fontSize:"13px",color:t.ink,resize:"vertical",outline:"none",background:t.avatarBg,boxSizing:"border-box",marginBottom:"28px"}}/>

          <Divider/>

          {/* Tip section */}
          <div style={{padding:"20px 0"}}>
            <Lbl style={{marginBottom:"4px"}}>Add a Tip</Lbl>
            <p style={{fontFamily:f,fontSize:"13px",color:t.muted,margin:"0 0 16px",lineHeight:1.5}}>100% of your tip goes directly to Anny.</p>

            <div style={{display:"flex",gap:"8px",marginBottom:"12px"}}>
              {tipAmounts.map(pct=>(
                <button key={pct} onClick={()=>setTipType(tipType===pct?null:pct)} style={{flex:1,padding:"14px 8px",borderRadius:"12px",border:tipType===pct?"2px solid "+t.accent:"1px solid "+t.line,background:tipType===pct?t.hero:"transparent",cursor:"pointer",textAlign:"center"}}>
                  <p style={{fontFamily:f,fontSize:"16px",fontWeight:500,color:tipType===pct?t.accent:t.ink,margin:"0 0 2px"}}>{pct}%</p>
                  <p style={{fontFamily:f,fontSize:"12px",color:t.muted,margin:0}}>${Math.round(serviceTotal*parseInt(pct)/100)}</p>
                </button>
              ))}
              <button onClick={()=>setTipType(tipType==="custom"?null:"custom")} style={{flex:1,padding:"14px 8px",borderRadius:"12px",border:tipType==="custom"?"2px solid "+t.accent:"1px solid "+t.line,background:tipType==="custom"?t.hero:"transparent",cursor:"pointer",textAlign:"center"}}>
                <p style={{fontFamily:f,fontSize:"14px",fontWeight:500,color:tipType==="custom"?t.accent:t.ink,margin:0}}>Custom</p>
              </button>
            </div>

            {tipType==="custom"&&<div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"12px"}}>
              <span style={{fontFamily:f,fontSize:"16px",color:t.muted}}>$</span>
              <input type="number" value={customTip} onChange={e=>setCustomTip(e.target.value)} placeholder="0" style={{width:"100px",padding:"12px 14px",borderRadius:"12px",border:"1px solid "+t.line,fontFamily:f,fontSize:"16px",color:t.ink,outline:"none",background:t.avatarBg,boxSizing:"border-box"}}/>
            </div>}

            {tipVal>0&&<div style={{padding:"12px 16px",background:t.callout,borderRadius:"10px"}}>
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <span style={{fontFamily:f,fontSize:"14px",color:"#92400E"}}>Tip amount</span>
                <span style={{fontFamily:f,fontSize:"14px",fontWeight:500,color:"#92400E"}}>${tipVal}</span>
              </div>
            </div>}

            <button onClick={()=>setTipType(null)} style={{background:"none",border:"none",padding:"12px 0",cursor:"pointer",width:"100%",textAlign:"center"}}>
              <span style={{fontFamily:f,fontSize:"13px",color:t.faded}}>No tip this time</span>
            </button>
          </div>
        </>}

        <div style={{marginTop:"auto",padding:"0 0 32px"}}>
          <button onClick={()=>go("c_providers")} style={{width:"100%",padding:"16px",borderRadius:"12px",border:"none",background:rating>0?t.ink:t.faded,color:"#fff",fontFamily:f,fontSize:"14px",fontWeight:500,cursor:rating>0?"pointer":"default"}}>
            {tipVal>0?`Submit Review & Pay $${tipVal} Tip`:"Submit Review"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CMessages({go,onMenu,notifCount,onNotif}){
  const convos=[
    {name:"Anny Wong",msg:"See you Wednesday!",time:"2m",unread:true,initials:"AW"},
    {name:"Mia Chen",msg:"Your next appointment is confirmed.",time:"3d",unread:false,initials:"MC"},
  ];
  return(
    <div style={{minHeight:"100%",background:t.base,display:"flex",flexDirection:"column"}}>
      <Header onMenu={onMenu} notifCount={notifCount} onNotif={onNotif} showAvatar={false}/>
      <div style={{padding:"0 24px 24px"}}>
        <h1 style={{fontFamily:f,fontSize:"32px",fontWeight:400,letterSpacing:"-0.03em",lineHeight:1.1,color:t.ink,margin:0}}>Messages</h1>
      </div>
      <div style={{padding:"0 24px",flex:1,display:"flex",flexDirection:"column"}}>
        <Divider/>
        {convos.map(c=>(
          <div key={c.name}>
            <button onClick={()=>go("c_chat")} style={{display:"flex",alignItems:"center",gap:"16px",padding:"20px 0",background:"none",border:"none",cursor:"pointer",width:"100%",textAlign:"left"}}>
              <div style={{position:"relative"}}>
                <Avatar initials={c.initials} size={44}/>
                {c.unread&&<div style={{position:"absolute",top:0,right:0,width:"10px",height:"10px",borderRadius:"50%",background:t.accent,border:"2px solid "+t.base}}/>}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:"3px"}}>
                  <p style={{fontFamily:f,fontSize:"15px",fontWeight:c.unread?500:400,color:t.ink,margin:0}}>{c.name}</p>
                  <span style={{fontFamily:f,fontSize:"12px",color:t.faded}}>{c.time}</span>
                </div>
                <p style={{fontFamily:f,fontSize:"14px",color:c.unread?t.ink:t.muted,margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.msg}</p>
              </div>
            </button>
            <Divider/>
          </div>
        ))}
        <Footer/>
      </div>
    </div>
  );
}

// ─── Chat Screen (shared between client/provider) ───
function ChatScreen({go,backTo,otherName,otherInitials,isProvider}){
  const [msg,setMsg]=useState("");
  const [messages,setMessages]=useState([
    {id:1,from:"them",text:"Hey! Just confirming our session on Wednesday at 10:30 AM.",time:"10:15 AM"},
    {id:2,from:"me",text:"Yes, confirmed! I've been practicing the breathing exercises you recommended.",time:"10:18 AM"},
    {id:3,from:"them",text:"That's great to hear. We'll pick up from where we left off with upper range work.",time:"10:20 AM"},
    {id:4,from:"them",text:"Also, bring that song you mentioned — we can start working on the arrangement.",time:"10:20 AM"},
    {id:5,from:"me",text:"Perfect, will do! Should I warm up before I come in?",time:"10:24 AM"},
    {id:6,from:"them",text:"A light warm-up would be great — 5 minutes of lip trills and humming scales. Don't push too hard before we start.",time:"10:26 AM"},
    {id:7,from:"me",text:"Got it. See you Wednesday!",time:"10:28 AM"},
    {id:8,from:"them",text:"See you then! 🎵",time:"10:28 AM"},
  ]);

  const send=()=>{
    if(!msg.trim())return;
    const now=new Date();
    const timeStr=now.toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"});
    setMessages(prev=>[...prev,{id:Date.now(),from:"me",text:msg.trim(),time:timeStr}]);
    setMsg("");
  };

  return(
    <div style={{minHeight:"100%",background:t.base,display:"flex",flexDirection:"column"}}>
      {/* Chat header */}
      <div style={{padding:"32px 24px 16px",display:"flex",alignItems:"center",gap:"12px",borderBottom:"1px solid "+t.line}}>
        <BackBtn onClick={()=>go(backTo)}/>
        <Avatar initials={otherInitials} size={36}/>
        <div style={{flex:1}}>
          <p style={{fontFamily:f,fontSize:"15px",fontWeight:500,color:t.ink,margin:0}}>{otherName}</p>
        </div>
        <button style={{background:"none",border:"none",cursor:"pointer",padding:"4px"}}>
          <svg width="20" height="20" fill="none" stroke={t.ink} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>

      {/* Messages */}
      <div style={{flex:1,overflowY:"auto",padding:"16px 16px 0",display:"flex",flexDirection:"column",gap:"4px"}}>
        {/* Date divider */}
        <div style={{textAlign:"center",padding:"8px 0 16px"}}><Lbl color={t.faded} style={{fontSize:"10px"}}>Today</Lbl></div>

        {messages.map((m,i)=>{
          const isMe=m.from==="me";
          const showAvatar=!isMe&&(i===0||messages[i-1].from==="me");
          const isLast=i===messages.length-1||messages[i+1]?.from!==m.from;
          return(
            <div key={m.id} style={{display:"flex",justifyContent:isMe?"flex-end":"flex-start",alignItems:"flex-end",gap:"8px",marginBottom:isLast?"12px":"2px"}}>
              {!isMe&&<div style={{width:"28px",flexShrink:0}}>{showAvatar&&<Avatar initials={otherInitials} size={28}/>}</div>}
              <div style={{maxWidth:"75%"}}>
                <div style={{
                  padding:"10px 14px",
                  borderRadius:isMe
                    ?(isLast?"18px 18px 4px 18px":"18px 18px 4px 18px")
                    :(isLast?"18px 18px 18px 4px":"18px 18px 18px 4px"),
                  background:isMe?t.ink:t.avatarBg,
                  color:isMe?"#fff":t.ink,
                }}>
                  <p style={{fontFamily:f,fontSize:"14px",margin:0,lineHeight:1.5}}>{m.text}</p>
                </div>
                {isLast&&<p style={{fontFamily:f,fontSize:"10px",color:t.faded,margin:"4px 4px 0",textAlign:isMe?"right":"left"}}>{m.time}</p>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Input bar */}
      <div style={{padding:"12px 16px",borderTop:"1px solid "+t.line,display:"flex",gap:"8px",alignItems:"flex-end",background:t.base}}>
        <button style={{width:"36px",height:"36px",borderRadius:"50%",border:"1px solid "+t.line,background:"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0}}>
          <svg width="18" height="18" fill="none" stroke={t.muted} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" strokeLinecap="round"/></svg>
        </button>
        <div style={{flex:1,position:"relative"}}>
          <input
            value={msg}
            onChange={e=>setMsg(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&send()}
            placeholder="Type a message..."
            style={{width:"100%",padding:"10px 14px",borderRadius:"20px",border:"1px solid "+t.line,fontFamily:f,fontSize:"14px",color:t.ink,outline:"none",background:t.avatarBg,boxSizing:"border-box"}}
          />
        </div>
        <button onClick={send} style={{width:"36px",height:"36px",borderRadius:"50%",border:"none",background:msg.trim()?t.accent:t.avatarBg,display:"flex",alignItems:"center",justifyContent:"center",cursor:msg.trim()?"pointer":"default",flexShrink:0}}>
          <svg width="16" height="16" fill="none" stroke={msg.trim()?"#fff":t.faded} strokeWidth="2" viewBox="0 0 24 24"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>
    </div>
  );
}

function CChat({go}){return <ChatScreen go={go} backTo="c_messages" otherName="Anny Wong" otherInitials="AW"/>}
function PChat({go}){return <ChatScreen go={go} backTo="p_messages" otherName="Sarah Mitchell" otherInitials="SM" isProvider/>}

// ─── C8: Notifications (limited preview) ─
const allClientNotifs=[
  {id:1,type:"accepted",title:"Booking confirmed",body:"Anny Wong accepted your booking for 1-on-1 Vocal Lesson on Wed, Mar 19 at 10:30 AM.",time:"2m ago",read:false,initials:"AW",action:"pay"},
  {id:2,type:"rejected",title:"Request declined",body:"Anny Wong couldn't accommodate your requested time on Sat, Mar 22.",time:"30m ago",read:false,initials:"AW",reason:"I'm away at a conference that weekend. How about Mon the 24th?"},
  {id:3,type:"connected",title:"New connection",body:"You're now connected with James Okafor. Your relationship journey begins.",time:"1h ago",read:false,initials:"JO"},
  {id:4,type:"accepted",title:"Booking confirmed",body:"Mia Chen accepted your booking for Signature Cut on Fri, Mar 21 at 2:00 PM.",time:"2d ago",read:true,initials:"MC",action:"pay"},
  {id:5,type:"reminder",title:"Upcoming session",body:"You have a session with Anny Wong tomorrow at 10:30 AM.",time:"3d ago",read:true,initials:"AW"},
  {id:6,type:"connected",title:"New connection",body:"You're now connected with Kai Thompson.",time:"5d ago",read:true,initials:"KT"},
  {id:7,type:"accepted",title:"Session completed",body:"Your session with James Okafor has been marked complete. Leave a review?",time:"1w ago",read:true,initials:"JO"},
];
const notifIcons={
  accepted:<svg width="14" height="14" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  connected:<svg width="14" height="14" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  rejected:<svg width="14" height="14" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/></svg>,
  reminder:<svg width="14" height="14" fill="none" stroke="#fff" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/></svg>,
};
const notifColors={accepted:t.success,connected:t.accent,rejected:"#B04040",reminder:t.muted};

function NotifItem({n,go}){return(
  <div>
    <div style={{display:"flex",gap:"14px",padding:"20px 0",opacity:n.read?0.55:1}}>
      <div style={{position:"relative",flexShrink:0}}>
        <Avatar initials={n.initials} size={44}/>
        <div style={{position:"absolute",bottom:"-2px",right:"-2px",width:"22px",height:"22px",borderRadius:"50%",background:notifColors[n.type],display:"flex",alignItems:"center",justifyContent:"center",border:"2px solid "+t.base}}>{notifIcons[n.type]}</div>
      </div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"4px"}}>
          <p style={{fontFamily:f,fontSize:"15px",fontWeight:n.read?400:500,color:t.ink,margin:0}}>{n.title}</p>
          {!n.read&&<div style={{width:"8px",height:"8px",borderRadius:"50%",background:t.accent,flexShrink:0,marginTop:"6px"}}/>}
        </div>
        <p style={{fontFamily:f,fontSize:"13px",color:t.muted,margin:"0 0 6px",lineHeight:1.5}}>{n.body}</p>
        {n.reason&&<div style={{padding:"10px 14px",background:t.avatarBg,borderRadius:"10px",margin:"6px 0"}}>
          <Lbl color={t.faded} style={{fontSize:"9px",marginBottom:"4px"}}>Reason</Lbl>
          <p style={{fontFamily:f,fontSize:"13px",color:t.ink,margin:0,lineHeight:1.5,fontStyle:"italic"}}>"{n.reason}"</p>
        </div>}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <Lbl color={t.faded} style={{fontSize:"10px"}}>{n.time}</Lbl>
          {n.action==="pay"&&!n.read&&<button onClick={()=>go("c_payment")} style={{padding:"6px 14px",borderRadius:"8px",border:"none",background:t.ink,fontFamily:f,fontSize:"11px",fontWeight:500,color:"#fff",cursor:"pointer"}}>Pay Now</button>}
        </div>
      </div>
    </div>
    <Divider/>
  </div>
)}

function CNotifications({go}){
  const preview=allClientNotifs.slice(0,3);
  return(
    <div style={{minHeight:"100%",background:t.base,display:"flex",flexDirection:"column"}}>
      <div style={{padding:"32px 24px 16px",display:"flex",alignItems:"center",gap:"12px"}}>
        <BackBtn onClick={()=>go("c_providers")}/>
        <Lbl color={t.ink} style={{fontSize:"13px",fontWeight:500,flex:1}}>Notifications</Lbl>
        <Lbl color={t.accent} style={{fontSize:"11px",cursor:"pointer"}}>Mark all read</Lbl>
      </div>
      <div style={{padding:"0 24px",flex:1,display:"flex",flexDirection:"column"}}>
        <Divider/>
        {preview.map(n=><NotifItem key={n.id} n={n} go={go}/>)}
        <button onClick={()=>go("c_all_notifications")} style={{width:"100%",padding:"16px",borderRadius:"12px",border:"1px solid "+t.line,background:"transparent",fontFamily:f,fontSize:"14px",fontWeight:500,color:t.ink,cursor:"pointer",marginTop:"8px",display:"flex",alignItems:"center",justifyContent:"center",gap:"6px"}}>
          View All Notifications
          <Lbl color={t.faded} style={{margin:0,fontSize:"10px"}}>{allClientNotifs.length}</Lbl>
        </button>
        <Footer/>
      </div>
    </div>
  );
}

// ─── C8b: All Notifications ──────────────
function CAllNotifications({go}){
  return(
    <div style={{minHeight:"100%",background:t.base,display:"flex",flexDirection:"column"}}>
      <div style={{padding:"32px 24px 16px",display:"flex",alignItems:"center",gap:"12px"}}>
        <BackBtn onClick={()=>go("c_notifications")}/>
        <Lbl color={t.ink} style={{fontSize:"13px",fontWeight:500,flex:1}}>All Notifications</Lbl>
        <Lbl color={t.accent} style={{fontSize:"11px",cursor:"pointer"}}>Mark all read</Lbl>
      </div>
      <div style={{padding:"0 24px",flex:1,display:"flex",flexDirection:"column"}}>
        <Divider/>
        {allClientNotifs.map(n=><NotifItem key={n.id} n={n} go={go}/>)}
        <Footer/>
      </div>
    </div>
  );
}

// ─── C9: Profile ─────────────────────────
function CProfileScreen({go,onMenu,notifCount,onNotif}){
  const settings=[{l:"Personal details",s:"Name, email, phone"},{l:"Payment methods",s:"Manage your cards"},{l:"Notifications",s:"Email, push, SMS"},{l:"Privacy & security",s:"Password, data"},{l:"Help & support",s:"FAQ, contact us"}];
  return(
    <div style={{minHeight:"100%",background:t.base,display:"flex",flexDirection:"column"}}>
      <Header onMenu={onMenu} notifCount={notifCount} onNotif={onNotif} showAvatar={false}/>
      <div style={{padding:"0 24px 32px"}}>
        <h1 style={{fontFamily:f,fontSize:"24px",fontWeight:400,letterSpacing:"-0.02em",color:t.ink,margin:"0 0 4px"}}>Eto</h1>
        <Lbl>Member since Jan 2025</Lbl>
      </div>
      <div style={{padding:"0 24px",flex:1,display:"flex",flexDirection:"column"}}>
        <Divider/>
        {settings.map(item=>(
          <div key={item.l}>
            <button style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"20px 0",background:"none",border:"none",cursor:"pointer",width:"100%",textAlign:"left"}}>
              <div>
                <p style={{fontFamily:f,fontSize:"16px",fontWeight:400,color:t.ink,margin:"0 0 3px"}}>{item.l}</p>
                <p style={{fontFamily:f,fontSize:"13px",color:t.muted,margin:0}}>{item.s}</p>
              </div>
              <ArrowIcon size={18}/>
            </button>
            <Divider/>
          </div>
        ))}
        <button style={{marginTop:"24px",padding:"14px",borderRadius:"12px",border:"none",background:t.dangerBg,fontFamily:f,fontSize:"13px",fontWeight:500,color:t.danger,cursor:"pointer",letterSpacing:"0.02em",width:"100%"}}>Sign Out</button>
        <Footer/>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// PROVIDER SCREENS
// ═══════════════════════════════════════════

const provMenu=[
  {id:"p_dashboard",label:"Home"},{id:"p_bookings",label:"Bookings",count:"3"},{id:"p_clients",label:"My Kliques"},
  {id:"p_services",label:"Services"},{id:"p_calendar",label:"Calendar"},{id:"p_messages",label:"Messages"},
  {id:"p_earnings",label:"Earnings"},{id:"p_profile",label:"Profile"},
];
const provScreens=["p_dashboard","p_bookings","p_clients","p_timeline","p_services","p_service_edit","p_calendar","p_availability","p_block_time","p_messages","p_chat","p_earnings","p_notifications","p_alerts","p_appt_detail","p_complete","p_profile"];
const provLabels={p_dashboard:"Dashboard",p_bookings:"Bookings",p_clients:"My kliques",p_timeline:"Timeline",p_services:"Services",p_service_edit:"Edit service",p_calendar:"Calendar",p_availability:"Availability",p_block_time:"Block Time",p_messages:"Messages",p_chat:"Chat",p_earnings:"Earnings",p_notifications:"Notifications",p_alerts:"Alerts",p_appt_detail:"Appointment",p_complete:"Completed",p_profile:"Profile"};

// ─── P1: Dashboard ───────────────────────
function PDashboard({go,onMenu,notifCount,onNotif}){
  const sched=[
    {n:"Sarah M.",svc:"Vocal Coaching",t:"10:00 AM",dur:"60 min",i:"SM"},
    {n:"Kai T.",svc:"Audition Prep",t:"1:30 PM",dur:"45 min",i:"KT"},
    {n:"Lisa R.",svc:"Vocal Coaching",t:"4:00 PM",dur:"60 min",i:"LR"},
  ];
  return(
    <div style={{minHeight:"100%",background:t.base,display:"flex",flexDirection:"column"}}>
      <Header onMenu={onMenu} initials="AW" notifCount={notifCount} onNotif={onNotif}/>

      <HeroCard>
        <div>
          <HeroPill>Thursday · Oct 24</HeroPill>
          <h1 style={{fontFamily:f,fontSize:"32px",fontWeight:400,letterSpacing:"-0.03em",lineHeight:1.1,color:t.ink,margin:0}}>Good morning,<br/>Anny</h1>
        </div>
        <div>
          <HeroDivider/>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"end"}}>
            <div><Lbl color={t.muted} style={{marginBottom:"4px"}}>Up Next</Lbl><p style={{fontFamily:f,fontSize:"15px",color:t.ink,margin:0}}>Sarah M. · Vocal Coaching</p></div>
            <ArrowIcon/>
          </div>
        </div>
      </HeroCard>

      {/* Stats */}
      <div style={{padding:"32px 24px 0",display:"flex",gap:"24px",position:"relative"}}>
        <div style={{position:"absolute",top:0,left:24,right:24,height:"1px",background:t.line}}/>
        <div style={{flex:1,paddingTop:"20px"}}>
          <Lbl style={{marginBottom:"8px"}}>Weekly Earnings</Lbl>
          <div style={{display:"flex",alignItems:"end",gap:"4px"}}>
            <ArrowIcon size={32}/>
            <span style={{fontFamily:f,fontSize:"56px",fontWeight:400,letterSpacing:"-0.05em",lineHeight:0.9,color:t.accent}}>$840</span>
          </div>
        </div>
        <div style={{width:"1px",background:t.line,alignSelf:"stretch",marginTop:"20px"}}/>
        <div style={{flex:1,paddingTop:"20px",display:"flex",flexDirection:"column",alignItems:"flex-end"}}>
          <Lbl style={{marginBottom:"8px"}}>New Clients</Lbl>
          <span style={{fontFamily:f,fontSize:"56px",fontWeight:400,letterSpacing:"-0.05em",lineHeight:0.9,color:t.accent}}>3</span>
        </div>
      </div>
      <p style={{fontFamily:f,fontSize:"15px",color:t.muted,padding:"16px 24px 0",margin:0}}>You're on track to beat last week's earnings.</p>

      {/* Schedule */}
      <div style={{padding:"32px 24px 0",flex:1,display:"flex",flexDirection:"column"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"end",marginBottom:"8px"}}>
          <Lbl>Today's Schedule</Lbl>
          <Lbl color={t.accent} style={{cursor:"pointer"}}>View All</Lbl>
        </div>
        <Divider/>
        {sched.map(u=>(
          <div key={u.n}>
            <button onClick={()=>go("p_appt_detail")} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px 0",background:"none",border:"none",cursor:"pointer",width:"100%",textAlign:"left"}}>
              <div style={{display:"flex",alignItems:"center",gap:"16px",flex:1}}>
                <Avatar initials={u.i} size={40}/>
                <div><p style={{fontFamily:f,fontSize:"16px",fontWeight:400,color:t.ink,margin:"0 0 3px"}}>{u.n}</p><p style={{fontFamily:f,fontSize:"13px",color:t.muted,margin:0}}>{u.svc} · {u.dur}</p></div>
              </div>
              <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:"6px"}}>
                <span style={{fontFamily:f,fontSize:"15px",color:t.ink}}>{u.t}</span>
                <ArrowIcon size={18}/>
              </div>
            </button>
            <Divider/>
          </div>
        ))}

        {/* Share Links Section */}
        <ShareLinks handle="annywong"/>

        <Footer/>
      </div>
    </div>
  );
}

// ─── P2: Bookings ────────────────────────
function PBookings({go,onMenu,notifCount,onNotif}){
  const [bookings,setBookings]=useState([
    {id:1,client:"Emma Wilson",initials:"EW",svc:"1-on-1 Vocal Lesson",date:"Thu, Mar 20 · 11:00 AM",dur:"60 min",price:"$85",note:"I'd like to work on my high notes.",status:"pending",type:"request"},
    {id:2,client:"Ryan Park",initials:"RP",svc:"Performance Coaching",date:"Fri, Mar 21 · 2:00 PM",dur:"45 min",price:"$95",note:"",status:"pending",type:"booking"},
    {id:3,client:"Nadia Khan",initials:"NK",svc:"Group Class",date:"Sat, Mar 22 · 10:00 AM",dur:"90 min",price:"$45",note:"My friend Maya will also be joining.",status:"pending",type:"request"},
  ]);
  const [declining,setDeclining]=useState(null);
  const [declineReason,setDeclineReason]=useState("");
  const doDecline=(id)=>{setBookings(prev=>prev.map(b=>b.id===id?{...b,status:"rejected",reason:declineReason}:b));setDeclining(null);setDeclineReason("");};
  const doAccept=(id)=>setBookings(prev=>prev.map(b=>b.id===id?{...b,status:"accepted"}:b));
  const pending=bookings.filter(b=>b.status==="pending");
  const handled=bookings.filter(b=>b.status!=="pending");
  return(
    <div style={{minHeight:"100%",background:t.base,display:"flex",flexDirection:"column"}}>
      <Header onMenu={onMenu} initials="AW" notifCount={notifCount} onNotif={onNotif}/>
      <div style={{padding:"0 24px 24px"}}>
        <Lbl style={{marginBottom:"6px"}}>{pending.length} pending · {handled.length} reviewed</Lbl>
        <h1 style={{fontFamily:f,fontSize:"32px",fontWeight:400,letterSpacing:"-0.03em",lineHeight:1.1,color:t.ink,margin:0}}>Bookings</h1>
      </div>
      <div style={{padding:"0 24px",flex:1,display:"flex",flexDirection:"column"}}>
        {pending.map(b=>(
          <div key={b.id} style={{marginBottom:"20px",padding:"24px",background:t.card,borderRadius:"20px",border:"1px solid "+t.line}}>
            <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"12px"}}>
              <Avatar initials={b.initials} size={44}/>
              <div style={{flex:1}}><p style={{fontFamily:f,fontSize:"16px",fontWeight:400,color:t.ink,margin:"0 0 3px"}}>{b.client}</p><Lbl>{b.date}</Lbl></div>
              <span style={{fontFamily:f,fontSize:"18px",fontWeight:400,color:t.accent,letterSpacing:"-0.03em"}}>{b.price}</span>
            </div>
            {b.type==="request"&&<div style={{display:"inline-flex",padding:"4px 10px",borderRadius:"9999px",background:t.callout,marginBottom:"12px"}}><Lbl color="#92400E" style={{fontSize:"10px",margin:0}}>Time Request</Lbl></div>}
            <div style={{padding:"12px 16px",background:t.avatarBg,borderRadius:"12px",marginBottom:"12px"}}>
              <p style={{fontFamily:f,fontSize:"14px",color:t.ink,margin:"0 0 2px",fontWeight:500}}>{b.svc}</p>
              <p style={{fontFamily:f,fontSize:"13px",color:t.muted,margin:0}}>{b.dur}</p>
            </div>
            {b.note&&<div style={{padding:"12px 16px",background:t.callout,borderRadius:"12px",marginBottom:"12px"}}>
              <Lbl color="#92400E" style={{marginBottom:"4px",fontSize:"10px"}}>Client Note</Lbl>
              <p style={{fontFamily:f,fontSize:"14px",color:t.ink,margin:0,lineHeight:1.5,fontStyle:"italic"}}>"{b.note}"</p>
            </div>}

            {/* Decline reason textbox */}
            {declining===b.id?<div style={{marginBottom:"12px"}}>
              <Lbl style={{marginBottom:"6px"}}>Reason for declining (optional)</Lbl>
              <textarea value={declineReason} onChange={e=>setDeclineReason(e.target.value)} placeholder="Let the client know why, or suggest an alternative time..." rows={2} style={{width:"100%",padding:"12px 14px",borderRadius:"10px",border:"1px solid "+t.line,fontFamily:f,fontSize:"13px",color:t.ink,resize:"vertical",outline:"none",background:t.avatarBg,boxSizing:"border-box",marginBottom:"8px"}}/>
              <div style={{display:"flex",gap:"8px"}}>
                <button onClick={()=>{setDeclining(null);setDeclineReason("");}} style={{flex:1,padding:"12px",borderRadius:"12px",border:"1px solid "+t.line,background:"transparent",fontFamily:f,fontSize:"13px",fontWeight:500,color:t.ink,cursor:"pointer"}}>Cancel</button>
                <button onClick={()=>doDecline(b.id)} style={{flex:1,padding:"12px",borderRadius:"12px",border:"none",background:"#B04040",color:"#fff",fontFamily:f,fontSize:"13px",fontWeight:500,cursor:"pointer"}}>Confirm Decline</button>
              </div>
            </div>:<div style={{display:"flex",gap:"8px"}}>
              <button onClick={()=>setDeclining(b.id)} style={{flex:1,padding:"12px",borderRadius:"12px",border:"1px solid "+t.line,background:"transparent",fontFamily:f,fontSize:"13px",fontWeight:500,color:t.ink,cursor:"pointer"}}>Decline</button>
              <button onClick={()=>doAccept(b.id)} style={{flex:2,padding:"12px",borderRadius:"12px",border:"none",background:t.ink,color:"#fff",fontFamily:f,fontSize:"13px",fontWeight:500,cursor:"pointer"}}>Accept</button>
            </div>}
          </div>
        ))}
        {pending.length===0&&<div style={{textAlign:"center",padding:"48px 0"}}><p style={{fontFamily:f,fontSize:"18px",color:t.ink,margin:"0 0 6px"}}>All caught up.</p><p style={{fontFamily:f,fontSize:"14px",color:t.muted,margin:0}}>No pending requests right now.</p></div>}
        {handled.length>0&&<><Lbl style={{margin:"8px 0 12px"}}>Reviewed</Lbl><Divider/>{handled.map(b=><div key={b.id}><div style={{display:"flex",alignItems:"center",gap:"12px",padding:"16px 0",opacity:0.5}}><Avatar initials={b.initials} size={40}/><p style={{fontFamily:f,fontSize:"15px",color:t.ink,margin:0,flex:1}}>{b.client}</p><Lbl color={b.status==="accepted"?t.success:"#B04040"} style={{fontSize:"10px"}}>{b.status==="accepted"?"Accepted":"Declined"}</Lbl></div><Divider/></div>)}</>}
        <Footer/>
      </div>
    </div>
  );
}

// ─── P3: My kliques ──────────────────────
function PClients({go,onMenu,notifCount,onNotif}){
  const clients=[
    {n:"Sarah Mitchell",visits:12,ltv:"$1,045",i:"SM",status:"Active",last:"Mar 12"},
    {n:"Kai Thompson",visits:6,ltv:"$510",i:"KT",status:"Active",last:"Mar 10"},
    {n:"Lisa Rivera",visits:8,ltv:"$680",i:"LR",status:"At risk",last:"Feb 20"},
    {n:"David Park",visits:3,ltv:"$195",i:"DP",status:"New",last:"Mar 15"},
  ];
  const statusColor={Active:t.success,"At risk":"#92400E",New:t.accent};
  return(
    <div style={{minHeight:"100%",background:t.base,display:"flex",flexDirection:"column"}}>
      <Header onMenu={onMenu} initials="AW" notifCount={notifCount} onNotif={onNotif}/>
      <div style={{padding:"0 24px 24px"}}>
        <Lbl style={{marginBottom:"6px"}}>{clients.length} clients</Lbl>
        <h1 style={{fontFamily:f,fontSize:"32px",fontWeight:400,letterSpacing:"-0.03em",lineHeight:1.1,color:t.ink,margin:0}}>My kliques</h1>
      </div>
      <div style={{padding:"0 24px",flex:1,display:"flex",flexDirection:"column"}}>
        <Divider/>
        {clients.map(c=>(
          <div key={c.n}>
            <button onClick={()=>go("p_timeline")} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"20px 0",background:"none",border:"none",cursor:"pointer",width:"100%",textAlign:"left"}}>
              <div style={{display:"flex",alignItems:"center",gap:"16px",flex:1}}>
                <Avatar initials={c.i} size={44}/>
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"3px"}}>
                    <p style={{fontFamily:f,fontSize:"16px",fontWeight:400,color:t.ink,margin:0}}>{c.n}</p>
                    <Lbl color={statusColor[c.status]} style={{fontSize:"10px",margin:0}}>{c.status}</Lbl>
                  </div>
                  <p style={{fontFamily:f,fontSize:"13px",color:t.muted,margin:0}}>{c.visits} visits · Last: {c.last}</p>
                </div>
              </div>
              <ArrowIcon size={18}/>
            </button>
            <Divider/>
          </div>
        ))}
        <ShareLinks handle="annywong"/>
        <Footer/>
      </div>
    </div>
  );
}

// ─── P4: Client timeline ─────────────────
function PTimeline({go}){
  const tl=[
    {ty:"confirmed",dt:"Mar 19",ti:"Upcoming: Vocal Lesson",sub:"Wed at 2:00 PM",amt:"$85"},
    {ty:"completed",dt:"Mar 12",ti:"Vocal Lesson",sub:"Breath control and upper range.",amt:"$85"},
    {ty:"milestone",dt:"Mar 5",ti:"10th session milestone",sub:"Consider offering a loyalty reward."},
    {ty:"completed",dt:"Feb 26",ti:"Performance Coaching",sub:"Stage presence exercises.",amt:"$95"},
  ];
  const dotColor={confirmed:t.accent,completed:t.success,milestone:"#D4A853"};
  return(
    <div style={{minHeight:"100%",background:t.base,display:"flex",flexDirection:"column"}}>
      <div style={{padding:"32px 24px 16px"}}><BackBtn onClick={()=>go("p_clients")}/></div>

      <HeroCard style={{minHeight:"220px"}}>
        <div>
          <HeroPill>Client since Jan 2025</HeroPill>
          <div style={{display:"flex",alignItems:"center",gap:"16px"}}>
            <div style={{width:"56px",height:"56px",borderRadius:"50%",background:"rgba(255,255,255,0.5)",border:"2px solid rgba(255,255,255,0.7)",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <span style={{fontFamily:f,fontSize:"18px",fontWeight:500,color:t.ink}}>SM</span>
            </div>
            <div>
              <h1 style={{fontFamily:f,fontSize:"24px",fontWeight:400,letterSpacing:"-0.02em",lineHeight:1.1,color:t.ink,margin:0}}>Sarah Mitchell</h1>
              <p style={{fontFamily:f,fontSize:"14px",color:t.muted,margin:"6px 0 0"}}>12 sessions · Last: Mar 12</p>
            </div>
          </div>
        </div>
      </HeroCard>

      <div style={{padding:"32px 24px 0",flex:1,display:"flex",flexDirection:"column"}}>
        <div style={{display:"flex",gap:"8px",marginBottom:"28px"}}>
          <button onClick={()=>go("p_messages")} style={{flex:1,padding:"14px",borderRadius:"12px",border:"1px solid "+t.line,background:"transparent",color:t.ink,fontFamily:f,fontSize:"13px",fontWeight:500,cursor:"pointer"}}>Message</button>
          <button style={{flex:1,padding:"14px",borderRadius:"12px",border:"none",background:t.ink,color:"#fff",fontFamily:f,fontSize:"13px",fontWeight:500,cursor:"pointer"}}>Book for Client</button>
        </div>

        <Lbl style={{marginBottom:"12px"}}>Session History</Lbl>
        <Divider/>

        {tl.map((item,i)=>(
          <div key={i}>
            <div style={{display:"flex",gap:"14px",padding:"20px 0"}}>
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",width:"12px",flexShrink:0,paddingTop:"4px"}}>
                <div style={{width:"10px",height:"10px",borderRadius:"50%",background:dotColor[item.ty],flexShrink:0}}/>
                {i<tl.length-1&&<div style={{width:"1.5px",flex:1,background:t.line,marginTop:"4px"}}/>}
              </div>
              <div style={{flex:1}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:"4px"}}>
                  <p style={{fontFamily:f,fontSize:"15px",fontWeight:400,color:t.ink,margin:0}}>{item.ti}</p>
                  {item.amt&&<span style={{fontFamily:f,fontSize:"15px",color:t.ink}}>{item.amt}</span>}
                </div>
                <Lbl>{item.dt}</Lbl>
                <p style={{fontFamily:f,fontSize:"13px",color:t.muted,margin:"6px 0 0",lineHeight:1.5,fontStyle:"italic"}}>{item.sub}</p>
                {item.ty==="confirmed"&&<div style={{display:"inline-flex",padding:"4px 10px",borderRadius:"9999px",background:t.hero,marginTop:"8px"}}><Lbl color={t.accent} style={{fontSize:"10px",margin:0}}>Confirmed</Lbl></div>}
                {item.ty==="milestone"&&<div style={{display:"inline-flex",padding:"4px 10px",borderRadius:"9999px",background:t.callout,marginTop:"8px"}}><Lbl color="#92400E" style={{fontSize:"10px",margin:0}}>Milestone</Lbl></div>}
              </div>
            </div>
            {i<tl.length-1&&<Divider/>}
          </div>
        ))}
        <Footer/>
      </div>
    </div>
  );
}

// ─── P5: Services ────────────────────────
function PServices({go,onMenu,notifCount,onNotif}){
  const groups=[
    {name:"Private Sessions",services:[
      {n:"1-on-1 Vocal Lesson",d:"60 min",p:"$85",booked:28},
      {n:"Performance Coaching",d:"45 min",p:"$95",booked:8},
      {n:"Song Arrangement",d:"30–60 min",p:"from $65",booked:4},
    ]},
    {name:"Group Sessions",services:[
      {n:"Group Class",d:"90 min",p:"$45",booked:12},
      {n:"Duet Workshop",d:"60 min",p:"$60",booked:6},
    ]},
    {name:"Packages",services:[
      {n:"Starter Pack (4 sessions)",d:"4 × 60 min",p:"$300",booked:3},
    ]},
  ];
  const totalServices=groups.reduce((a,g)=>a+g.services.length,0);
  return(
    <div style={{minHeight:"100%",background:t.base,display:"flex",flexDirection:"column"}}>
      <Header onMenu={onMenu} initials="AW" notifCount={notifCount} onNotif={onNotif}/>
      <div style={{padding:"0 24px 24px",display:"flex",justifyContent:"space-between",alignItems:"end"}}>
        <div>
          <Lbl style={{marginBottom:"6px"}}>{totalServices} services · {groups.length} groups</Lbl>
          <h1 style={{fontFamily:f,fontSize:"32px",fontWeight:400,letterSpacing:"-0.03em",lineHeight:1.1,color:t.ink,margin:0}}>Services</h1>
        </div>
        <button onClick={()=>go("p_service_edit")} style={{padding:"10px 18px",borderRadius:"10px",border:"none",background:t.ink,color:"#fff",fontFamily:f,fontSize:"12px",fontWeight:500,cursor:"pointer",display:"flex",alignItems:"center",gap:"4px"}}>
          <svg width="12" height="12" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" strokeLinecap="round"/></svg>Add
        </button>
      </div>
      <div style={{padding:"0 24px",flex:1,display:"flex",flexDirection:"column"}}>
        {groups.map((group,gi)=>(
          <div key={group.name} style={{marginBottom:gi<groups.length-1?"8px":"0"}}>
            {/* Group header */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px 0 8px"}}>
              <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                <Lbl color={t.ink} style={{fontSize:"12px",fontWeight:500}}>{group.name}</Lbl>
                <span style={{fontFamily:f,fontSize:"11px",color:t.faded}}>{group.services.length}</span>
              </div>
              <button style={{background:"none",border:"none",cursor:"pointer",padding:"4px",display:"flex",alignItems:"center",gap:"4px"}}>
                <svg width="14" height="14" fill="none" stroke={t.faded} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" strokeLinecap="round"/></svg>
                <span style={{fontFamily:f,fontSize:"11px",color:t.accent}}>Add to group</span>
              </button>
            </div>
            <Divider/>
            {group.services.map(s=>(
              <div key={s.n}>
                <button onClick={()=>go("p_service_edit")} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"18px 0",background:"none",border:"none",cursor:"pointer",width:"100%",textAlign:"left"}}>
                  <div>
                    <p style={{fontFamily:f,fontSize:"16px",fontWeight:400,color:t.ink,margin:"0 0 4px"}}>{s.n}</p>
                    <p style={{fontFamily:f,fontSize:"13px",color:t.muted,margin:0}}>{s.d} · {s.p} · {s.booked} booked</p>
                  </div>
                  <ArrowIcon size={18}/>
                </button>
                <Divider/>
              </div>
            ))}
          </div>
        ))}
        {/* Add group button */}
        <button style={{width:"100%",padding:"16px",borderRadius:"14px",border:"1px dashed "+t.line,background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"6px",margin:"12px 0"}}>
          <svg width="14" height="14" fill="none" stroke={t.accent} strokeWidth="2" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" strokeLinecap="round"/></svg>
          <span style={{fontFamily:f,fontSize:"13px",color:t.accent,fontWeight:500}}>Add Group</span>
        </button>
        <Footer/>
      </div>
    </div>
  );
}

// ─── P6: Service editor ──────────────────
function PServiceEdit({go}){
  const [payType,setPayType]=useState("full");
  const [depType,setDepType]=useState("percent"); // "percent" or "fixed"
  const price=85;
  const depPercent=30;const depFixed=25;
  const depAmt=depType==="percent"?Math.round(price*depPercent/100):depFixed;
  const remaining=price-depAmt;
  return(
    <div style={{minHeight:"100%",background:t.base,display:"flex",flexDirection:"column"}}>
      <div style={{padding:"32px 24px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <BackBtn onClick={()=>go("p_services")}/>
        <Lbl color={t.ink} style={{fontSize:"13px",fontWeight:500}}>Edit Service</Lbl>
        <div style={{width:"28px"}}/>
      </div>
      <div style={{padding:"0 24px",flex:1}}>
        <Lbl style={{marginBottom:"8px"}}>Service Name</Lbl>
        <input defaultValue="1-on-1 Vocal Lesson" style={{width:"100%",padding:"14px 16px",borderRadius:"12px",border:"1px solid "+t.line,fontFamily:f,fontSize:"14px",color:t.ink,outline:"none",background:t.avatarBg,marginBottom:"20px",boxSizing:"border-box"}}/>

        <Lbl style={{marginBottom:"8px"}}>Duration</Lbl>
        <div style={{display:"flex",gap:"8px",marginBottom:"20px"}}>
          <input type="number" defaultValue="1" style={{width:"64px",padding:"14px 12px",borderRadius:"12px",border:"1px solid "+t.line,fontFamily:f,fontSize:"14px",color:t.ink,outline:"none",textAlign:"center",background:t.avatarBg,boxSizing:"border-box"}}/>
          <span style={{fontFamily:f,fontSize:"14px",color:t.muted,display:"flex",alignItems:"center"}}>hr</span>
          <input type="number" defaultValue="0" style={{width:"64px",padding:"14px 12px",borderRadius:"12px",border:"1px solid "+t.line,fontFamily:f,fontSize:"14px",color:t.ink,outline:"none",textAlign:"center",background:t.avatarBg,boxSizing:"border-box"}}/>
          <span style={{fontFamily:f,fontSize:"14px",color:t.muted,display:"flex",alignItems:"center"}}>min</span>
        </div>

        <Lbl style={{marginBottom:"8px"}}>Description</Lbl>
        <textarea placeholder="Describe what this service includes..." rows={3} style={{width:"100%",padding:"14px 16px",borderRadius:"12px",border:"1px solid "+t.line,fontFamily:f,fontSize:"13px",color:t.ink,outline:"none",resize:"vertical",background:t.avatarBg,boxSizing:"border-box",marginBottom:"20px"}}/>

        <Divider/>

        <Lbl style={{margin:"20px 0 8px"}}>Price</Lbl>
        <div style={{position:"relative",marginBottom:"20px"}}>
          <span style={{position:"absolute",left:"16px",top:"14px",fontFamily:f,fontSize:"14px",color:t.muted}}>$</span>
          <input type="number" defaultValue="85" style={{width:"100%",padding:"14px 16px 14px 32px",borderRadius:"12px",border:"1px solid "+t.line,fontFamily:f,fontSize:"14px",color:t.ink,outline:"none",background:t.avatarBg,boxSizing:"border-box"}}/>
        </div>

        <Lbl style={{marginBottom:"8px"}}>Payment Collection</Lbl>
        <div style={{display:"flex",gap:"8px",marginBottom:"20px"}}>
          {["full","deposit"].map(pt=>(
            <button key={pt} onClick={()=>setPayType(pt)} style={{flex:1,padding:"14px",borderRadius:"12px",border:payType===pt?"2px solid "+t.accent:"1px solid "+t.line,background:payType===pt?t.hero:"transparent",fontFamily:f,fontSize:"12px",fontWeight:500,color:payType===pt?t.accent:t.ink,cursor:"pointer",letterSpacing:"0.02em"}}>{pt==="full"?"Full Upfront":"Deposit + Remainder"}</button>
          ))}
        </div>

        {payType==="deposit"&&<div style={{padding:"16px",background:t.callout,borderRadius:"12px",marginBottom:"20px"}}>
          <Lbl color="#92400E" style={{marginBottom:"10px",fontSize:"10px"}}>Deposit Type</Lbl>
          <div style={{display:"flex",gap:"8px",marginBottom:"14px"}}>
            {["percent","fixed"].map(dt=>(
              <button key={dt} onClick={()=>setDepType(dt)} style={{flex:1,padding:"10px",borderRadius:"10px",border:depType===dt?"2px solid "+t.accent:"1px solid "+t.line,background:depType===dt?"#fff":"transparent",fontFamily:f,fontSize:"12px",fontWeight:500,color:depType===dt?t.accent:t.ink,cursor:"pointer"}}>{dt==="percent"?"Percentage":"Fixed Amount"}</button>
            ))}
          </div>

          {depType==="percent"?<div style={{display:"flex",gap:"8px",alignItems:"center",marginBottom:"14px"}}>
            <input type="number" defaultValue={depPercent} style={{width:"64px",padding:"10px 12px",borderRadius:"10px",border:"1px solid "+t.line,fontFamily:f,fontSize:"14px",color:t.ink,outline:"none",textAlign:"center",background:"#fff",boxSizing:"border-box"}}/>
            <span style={{fontFamily:f,fontSize:"13px",color:t.muted}}>% of service price</span>
          </div>:<div style={{display:"flex",gap:"8px",alignItems:"center",marginBottom:"14px"}}>
            <span style={{fontFamily:f,fontSize:"14px",color:t.muted}}>$</span>
            <input type="number" defaultValue={depFixed} style={{width:"80px",padding:"10px 12px",borderRadius:"10px",border:"1px solid "+t.line,fontFamily:f,fontSize:"14px",color:t.ink,outline:"none",textAlign:"center",background:"#fff",boxSizing:"border-box"}}/>
            <span style={{fontFamily:f,fontSize:"13px",color:t.muted}}>flat deposit</span>
          </div>}

          <div style={{height:"1px",background:"rgba(146,64,14,0.15)",marginBottom:"12px"}}/>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:"4px"}}>
            <span style={{fontFamily:f,fontSize:"13px",color:"#92400E"}}>Client pays now</span>
            <span style={{fontFamily:f,fontSize:"13px",fontWeight:500,color:"#92400E"}}>${depAmt}</span>
          </div>
          <div style={{display:"flex",justifyContent:"space-between"}}>
            <span style={{fontFamily:f,fontSize:"13px",color:t.muted}}>Remaining after service</span>
            <span style={{fontFamily:f,fontSize:"13px",color:t.muted}}>${remaining}</span>
          </div>
        </div>}

        <Divider/>

        {/* Intake Questions */}
        <Lbl style={{margin:"20px 0 12px"}}>Intake Questions</Lbl>
        <p style={{fontFamily:f,fontSize:"13px",color:t.muted,margin:"0 0 16px",lineHeight:1.5}}>Ask clients questions when they book so you're prepared for their session.</p>

        {[
          {q:"What area would you like to focus on?",opts:["Breath control","Range extension","Performance prep","Song learning","Other"]},
          {q:"Experience level?",opts:["Beginner","Intermediate","Advanced"]},
        ].map((question,qi)=>(
          <div key={qi} style={{padding:"16px",background:t.avatarBg,borderRadius:"14px",marginBottom:"12px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"10px"}}>
              <input defaultValue={question.q} style={{flex:1,padding:"0",border:"none",fontFamily:f,fontSize:"14px",fontWeight:500,color:t.ink,outline:"none",background:"transparent"}}/>
              <button style={{background:"none",border:"none",cursor:"pointer",padding:"2px",flexShrink:0,marginLeft:"8px"}}>
                <svg width="16" height="16" fill="none" stroke={t.faded} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>
            <Lbl style={{marginBottom:"8px",fontSize:"10px"}}>Options · Select from</Lbl>
            <div style={{display:"flex",flexWrap:"wrap",gap:"6px"}}>
              {question.opts.map(opt=>(
                <div key={opt} style={{display:"inline-flex",alignItems:"center",gap:"6px",padding:"6px 12px",borderRadius:"9999px",background:"#fff",border:"1px solid "+t.line}}>
                  <span style={{fontFamily:f,fontSize:"12px",color:t.ink}}>{opt}</span>
                  <button style={{background:"none",border:"none",cursor:"pointer",padding:"0",display:"flex",lineHeight:1}}>
                    <svg width="12" height="12" fill="none" stroke={t.faded} strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/></svg>
                  </button>
                </div>
              ))}
              <button style={{display:"inline-flex",alignItems:"center",gap:"4px",padding:"6px 12px",borderRadius:"9999px",background:"transparent",border:"1px dashed "+t.line,cursor:"pointer"}}>
                <svg width="12" height="12" fill="none" stroke={t.accent} strokeWidth="2" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" strokeLinecap="round"/></svg>
                <span style={{fontFamily:f,fontSize:"12px",color:t.accent}}>Add</span>
              </button>
            </div>
          </div>
        ))}

        {/* Add question button */}
        <button style={{width:"100%",padding:"14px",borderRadius:"14px",border:"1px dashed "+t.line,background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"6px",marginBottom:"20px"}}>
          <svg width="14" height="14" fill="none" stroke={t.accent} strokeWidth="2" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" strokeLinecap="round"/></svg>
          <span style={{fontFamily:f,fontSize:"13px",color:t.accent,fontWeight:500}}>Add Question</span>
        </button>

        <Divider/>

        {/* Client Notes Toggle */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"20px 0"}}>
          <div>
            <p style={{fontFamily:f,fontSize:"15px",fontWeight:400,color:t.ink,margin:"0 0 4px"}}>Client notes</p>
            <p style={{fontFamily:f,fontSize:"13px",color:t.muted,margin:0,lineHeight:1.5}}>Let clients add a personal message when booking</p>
          </div>
          {/* Toggle */}
          <div style={{width:"44px",height:"26px",borderRadius:"13px",background:t.accent,cursor:"pointer",position:"relative",flexShrink:0}}>
            <div style={{width:"22px",height:"22px",borderRadius:"50%",background:"#fff",position:"absolute",top:"2px",right:"2px",boxShadow:"0 1px 3px rgba(0,0,0,0.15)"}}/>
          </div>
        </div>

        <Divider/>

        <div style={{display:"flex",gap:"10px",padding:"24px 0 32px"}}>
          <button onClick={()=>go("p_services")} style={{flex:1,padding:"16px",borderRadius:"12px",border:"1px solid "+t.line,background:"transparent",fontFamily:f,fontSize:"13px",fontWeight:500,color:t.ink,cursor:"pointer"}}>Cancel</button>
          <button onClick={()=>go("p_services")} style={{flex:2,padding:"16px",borderRadius:"12px",border:"none",background:t.ink,color:"#fff",fontFamily:f,fontSize:"13px",fontWeight:500,cursor:"pointer"}}>Save Service</button>
        </div>
      </div>
    </div>
  );
}

// ─── P7: Calendar ────────────────────────
function PCalendar({go,onMenu,notifCount,onNotif}){
  const [selDay,setSelDay]=useState(19);
  const dayLabels=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const bookedDays=[12,14,17,19,21,24,26];
  const blockedDays=[15,22];
  const daySchedule=[{n:"Sarah M.",svc:"Vocal Coaching",t:"10:00 AM",i:"SM"},{n:"Kai T.",svc:"Audition Prep",t:"1:30 PM",i:"KT"}];
  return(
    <div style={{minHeight:"100%",background:t.base,display:"flex",flexDirection:"column"}}>
      <Header onMenu={onMenu} initials="AW" notifCount={notifCount} onNotif={onNotif}/>
      <div style={{padding:"0 24px 16px",display:"flex",justifyContent:"space-between",alignItems:"end"}}>
        <h1 style={{fontFamily:f,fontSize:"32px",fontWeight:400,letterSpacing:"-0.03em",lineHeight:1.1,color:t.ink,margin:0}}>Calendar</h1>
        <div style={{display:"flex",gap:"6px"}}>
          <button onClick={()=>go("p_availability")} style={{padding:"8px 14px",borderRadius:"10px",border:"1px solid "+t.line,background:"transparent",fontFamily:f,fontSize:"11px",fontWeight:500,color:t.ink,cursor:"pointer",letterSpacing:"0.02em"}}>Hours</button>
          <button onClick={()=>go("p_block_time")} style={{padding:"8px 14px",borderRadius:"10px",border:"none",background:t.ink,color:"#fff",fontFamily:f,fontSize:"11px",fontWeight:500,cursor:"pointer",letterSpacing:"0.02em"}}>Block Time</button>
        </div>
      </div>
      <div style={{padding:"0 24px",flex:1,display:"flex",flexDirection:"column"}}>
        {/* Month nav */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"20px"}}>
          <button style={{width:"32px",height:"32px",borderRadius:"50%",border:"1px solid "+t.line,background:"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><svg width="16" height="16" fill="none" stroke={t.ink} strokeWidth="2" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
          <span style={{fontFamily:f,fontSize:"17px",fontWeight:500,color:t.ink}}>March 2026</span>
          <button style={{width:"32px",height:"32px",borderRadius:"50%",border:"1px solid "+t.line,background:"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><svg width="16" height="16" fill="none" stroke={t.ink} strokeWidth="2" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
        </div>

        {/* Legend */}
        <div style={{display:"flex",gap:"16px",marginBottom:"16px"}}>
          <div style={{display:"flex",alignItems:"center",gap:"6px"}}><div style={{width:"6px",height:"6px",borderRadius:"50%",background:t.accent}}/><Lbl style={{margin:0,fontSize:"10px"}}>Booked</Lbl></div>
          <div style={{display:"flex",alignItems:"center",gap:"6px"}}><div style={{width:"6px",height:"6px",borderRadius:"50%",background:t.faded}}/><Lbl style={{margin:0,fontSize:"10px"}}>Blocked</Lbl></div>
        </div>

        {/* Day headers */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:"0",marginBottom:"4px"}}>
          {dayLabels.map(d=><div key={d} style={{textAlign:"center",fontFamily:f,fontSize:"11px",fontWeight:500,color:t.faded,padding:"4px 0",letterSpacing:"0.03em"}}>{d}</div>)}
        </div>

        {/* Grid */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:"2px",marginBottom:"24px"}}>
          {Array.from({length:6}).map((_,i)=><div key={"e"+i}/>)}
          {Array.from({length:31}).map((_,i)=>{const day=i+1;const isSel=day===selDay;const hasBooking=bookedDays.includes(day);const isBlocked=blockedDays.includes(day);return(
            <button key={day} onClick={()=>setSelDay(day)} style={{width:"100%",aspectRatio:"1",borderRadius:"50%",border:"none",background:isSel?t.ink:isBlocked?"rgba(140,106,100,0.08)":"transparent",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:0,position:"relative",opacity:isBlocked&&!isSel?0.5:1}}>
              <span style={{fontFamily:f,fontSize:"14px",fontWeight:isSel?500:400,color:isSel?"#fff":isBlocked?t.faded:t.ink}}>{day}</span>
              {hasBooking&&!isSel&&<div style={{width:"4px",height:"4px",borderRadius:"50%",background:t.accent,position:"absolute",bottom:"4px"}}/>}
              {isBlocked&&!isSel&&<div style={{width:"4px",height:"4px",borderRadius:"50%",background:t.faded,position:"absolute",bottom:"4px"}}/>}
            </button>
          )})}
        </div>

        <Divider/>

        {/* Day schedule */}
        <Lbl style={{margin:"16px 0 12px"}}>Wed, Mar {selDay}</Lbl>
        {blockedDays.includes(selDay)?
          <div style={{padding:"16px 20px",background:t.avatarBg,borderRadius:"14px",marginBottom:"16px"}}>
            <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"6px"}}>
              <svg width="16" height="16" fill="none" stroke={t.faded} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <Lbl color={t.muted} style={{margin:0}}>Time Blocked</Lbl>
            </div>
            <p style={{fontFamily:f,fontSize:"14px",color:t.muted,margin:"0 0 2px"}}>All day · Personal</p>
            <p style={{fontFamily:f,fontSize:"13px",color:t.faded,margin:0}}>Reason: Family event</p>
          </div>
        :selDay===19?daySchedule.map(u=>(
          <div key={u.n}>
            <button onClick={()=>go("p_appt_detail")} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px 0",background:"none",border:"none",cursor:"pointer",width:"100%",textAlign:"left"}}>
              <div style={{display:"flex",alignItems:"center",gap:"14px",flex:1}}>
                <Avatar initials={u.i} size={40}/>
                <div><p style={{fontFamily:f,fontSize:"15px",fontWeight:400,color:t.ink,margin:"0 0 2px"}}>{u.n}</p><p style={{fontFamily:f,fontSize:"13px",color:t.muted,margin:0}}>{u.svc}</p></div>
              </div>
              <span style={{fontFamily:f,fontSize:"14px",color:t.ink}}>{u.t}</span>
            </button>
            <Divider/>
          </div>
        )):<div style={{padding:"32px 0",textAlign:"center"}}><p style={{fontFamily:f,fontSize:"15px",color:t.muted,margin:0}}>Nothing scheduled this day.</p></div>}
        <Footer/>
      </div>
    </div>
  );
}

// ─── P7b: Availability (weekly hours) ────
function PAvailability({go}){
  const days=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
  const short=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const [active,setActive]=useState([0,1,2,3,4]);
  const [hours]=useState({0:{s:"9:00 AM",e:"5:00 PM"},1:{s:"9:00 AM",e:"5:00 PM"},2:{s:"9:00 AM",e:"5:00 PM"},3:{s:"9:00 AM",e:"5:00 PM"},4:{s:"9:00 AM",e:"5:00 PM"}});
  const toggleDay=(i)=>setActive(prev=>prev.includes(i)?prev.filter(x=>x!==i):[...prev,i]);
  const [bufferSel,setBufferSel]=useState(2);
  const [windowSel,setWindowSel]=useState(2);
  const [customDays,setCustomDays]=useState("30");
  return(
    <div style={{minHeight:"100%",background:t.base,display:"flex",flexDirection:"column"}}>
      <div style={{padding:"32px 24px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <BackBtn onClick={()=>go("p_calendar")}/>
        <Lbl color={t.ink} style={{fontSize:"13px",fontWeight:500}}>Working Hours</Lbl>
        <div style={{width:"28px"}}/>
      </div>
      <div style={{padding:"0 24px",flex:1,display:"flex",flexDirection:"column"}}>
        <h1 style={{fontFamily:f,fontSize:"28px",fontWeight:400,letterSpacing:"-0.03em",color:t.ink,margin:"0 0 8px"}}>Your availability.</h1>
        <p style={{fontFamily:f,fontSize:"15px",color:t.muted,margin:"0 0 28px",lineHeight:1.6}}>Set your weekly working hours. Clients can only book during these times.</p>

        <Divider/>
        {days.map((d,i)=>{const isOn=active.includes(i);const h=hours[i];return(
          <div key={d}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"18px 0"}}>
              <div style={{display:"flex",alignItems:"center",gap:"14px",flex:1}}>
                <button onClick={()=>toggleDay(i)} style={{width:"22px",height:"22px",borderRadius:"6px",border:isOn?"none":"1.5px solid "+t.line,background:isOn?t.accent:"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0}}>
                  {isOn&&<svg width="12" height="12" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </button>
                <span style={{fontFamily:f,fontSize:"15px",fontWeight:400,color:isOn?t.ink:t.faded}}>{d}</span>
              </div>
              {isOn?<div style={{display:"flex",alignItems:"center",gap:"6px"}}>
                <button style={{padding:"8px 12px",borderRadius:"8px",background:t.avatarBg,border:"none",fontFamily:f,fontSize:"13px",color:t.ink,cursor:"pointer"}}>{h.s}</button>
                <span style={{fontFamily:f,fontSize:"12px",color:t.faded}}>–</span>
                <button style={{padding:"8px 12px",borderRadius:"8px",background:t.avatarBg,border:"none",fontFamily:f,fontSize:"13px",color:t.ink,cursor:"pointer"}}>{h.e}</button>
              </div>:<Lbl color={t.faded} style={{margin:0}}>Off</Lbl>}
            </div>
            <Divider/>
          </div>
        )})}

        <Divider/>
        <Lbl style={{margin:"20px 0 12px"}}>Booking Settings</Lbl>

        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px 0"}}>
          <div><p style={{fontFamily:f,fontSize:"15px",fontWeight:400,color:t.ink,margin:"0 0 3px"}}>Buffer between sessions</p><p style={{fontFamily:f,fontSize:"13px",color:t.muted,margin:0}}>Break between back-to-back bookings</p></div>
        </div>
        <div style={{display:"flex",gap:"8px",marginBottom:"20px"}}>
          {["None","10 min","15 min","30 min"].map((b,i)=>(
            <button key={b} onClick={()=>setBufferSel(i)} style={{flex:1,padding:"10px 4px",borderRadius:"10px",border:bufferSel===i?"2px solid "+t.accent:"1px solid "+t.line,background:bufferSel===i?t.hero:"transparent",fontFamily:f,fontSize:"12px",fontWeight:bufferSel===i?500:400,color:bufferSel===i?t.accent:t.ink,cursor:"pointer"}}>{b}</button>
          ))}
        </div>

        <Divider/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px 0"}}>
          <div><p style={{fontFamily:f,fontSize:"15px",fontWeight:400,color:t.ink,margin:"0 0 3px"}}>Booking window</p><p style={{fontFamily:f,fontSize:"13px",color:t.muted,margin:0}}>How far ahead clients can book</p></div>
        </div>
        <div style={{display:"flex",flexWrap:"wrap",gap:"8px",marginBottom:"12px"}}>
          {["1 week","2 weeks","4 weeks","8 weeks","Custom"].map((b,i)=>(
            <button key={b} onClick={()=>setWindowSel(i)} style={{padding:"10px 14px",borderRadius:"10px",border:windowSel===i?"2px solid "+t.accent:"1px solid "+t.line,background:windowSel===i?t.hero:"transparent",fontFamily:f,fontSize:"12px",fontWeight:windowSel===i?500:400,color:windowSel===i?t.accent:t.ink,cursor:"pointer"}}>{b}</button>
          ))}
        </div>
        {windowSel===4&&<div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"20px"}}>
          <input type="number" value={customDays} onChange={e=>setCustomDays(e.target.value)} style={{width:"64px",padding:"10px 12px",borderRadius:"10px",border:"1px solid "+t.line,fontFamily:f,fontSize:"14px",color:t.ink,outline:"none",textAlign:"center",background:t.avatarBg,boxSizing:"border-box"}}/>
          <span style={{fontFamily:f,fontSize:"13px",color:t.muted}}>days ahead</span>
        </div>}

        <div style={{padding:"20px 0 32px"}}>
          <button onClick={()=>go("p_calendar")} style={{width:"100%",padding:"16px",borderRadius:"12px",border:"none",background:t.ink,color:"#fff",fontFamily:f,fontSize:"14px",fontWeight:500,cursor:"pointer"}}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}

// ─── P7c: Block Time ─────────────────────
function PBlockTime({go}){
  const [blockType,setBlockType]=useState("specific"); // "specific" or "allday"
  const [reason,setReason]=useState("");

  const existingBlocks=[
    {date:"Sat, Mar 15",time:"All day",reason:"Family event",type:"allday"},
    {date:"Sat, Mar 22",time:"All day",reason:"Conference",type:"allday"},
    {date:"Thu, Mar 27",time:"2:00 PM – 4:00 PM",reason:"Dentist appointment",type:"specific"},
  ];

  return(
    <div style={{minHeight:"100%",background:t.base,display:"flex",flexDirection:"column"}}>
      <div style={{padding:"32px 24px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <BackBtn onClick={()=>go("p_calendar")}/>
        <Lbl color={t.ink} style={{fontSize:"13px",fontWeight:500}}>Block Time</Lbl>
        <div style={{width:"28px"}}/>
      </div>
      <div style={{padding:"0 24px",flex:1,display:"flex",flexDirection:"column"}}>
        <h1 style={{fontFamily:f,fontSize:"28px",fontWeight:400,letterSpacing:"-0.03em",color:t.ink,margin:"0 0 8px"}}>Block your time.</h1>
        <p style={{fontFamily:f,fontSize:"15px",color:t.muted,margin:"0 0 28px",lineHeight:1.6}}>Prevent clients from booking during specific times. They won't see these slots as available.</p>

        {/* Block type toggle */}
        <Lbl style={{marginBottom:"10px"}}>Block Type</Lbl>
        <div style={{display:"flex",gap:"8px",marginBottom:"24px"}}>
          {[{id:"allday",l:"Full Day"},{id:"specific",l:"Specific Hours"}].map(bt=>(
            <button key={bt.id} onClick={()=>setBlockType(bt.id)} style={{flex:1,padding:"14px",borderRadius:"12px",border:blockType===bt.id?"2px solid "+t.accent:"1px solid "+t.line,background:blockType===bt.id?t.hero:"transparent",fontFamily:f,fontSize:"13px",fontWeight:500,color:blockType===bt.id?t.accent:t.ink,cursor:"pointer"}}>{bt.l}</button>
          ))}
        </div>

        {/* Date picker */}
        <Lbl style={{marginBottom:"8px"}}>Date</Lbl>
        <button style={{width:"100%",padding:"14px 16px",borderRadius:"12px",border:"1px solid "+t.line,background:t.avatarBg,fontFamily:f,fontSize:"14px",color:t.ink,cursor:"pointer",textAlign:"left",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"20px",boxSizing:"border-box"}}>
          <span>Select a date</span>
          <svg width="16" height="16" fill="none" stroke={t.muted} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>

        {/* Time range — only for specific */}
        {blockType==="specific"&&<>
          <Lbl style={{marginBottom:"8px"}}>Time Range</Lbl>
          <div style={{display:"flex",gap:"8px",alignItems:"center",marginBottom:"20px"}}>
            <button style={{flex:1,padding:"14px 16px",borderRadius:"12px",border:"1px solid "+t.line,background:t.avatarBg,fontFamily:f,fontSize:"14px",color:t.ink,cursor:"pointer",textAlign:"center"}}>Start time</button>
            <span style={{fontFamily:f,fontSize:"13px",color:t.faded}}>–</span>
            <button style={{flex:1,padding:"14px 16px",borderRadius:"12px",border:"1px solid "+t.line,background:t.avatarBg,fontFamily:f,fontSize:"14px",color:t.ink,cursor:"pointer",textAlign:"center"}}>End time</button>
          </div>
        </>}

        {/* Reason */}
        <Lbl style={{marginBottom:"8px"}}>Reason (optional)</Lbl>
        <input value={reason} onChange={e=>setReason(e.target.value)} placeholder="e.g., Dentist, vacation, personal day..." style={{width:"100%",padding:"14px 16px",borderRadius:"12px",border:"1px solid "+t.line,fontFamily:f,fontSize:"14px",color:t.ink,outline:"none",background:t.avatarBg,boxSizing:"border-box",marginBottom:"8px"}}/>
        <p style={{fontFamily:f,fontSize:"12px",color:t.faded,margin:"0 0 24px"}}>Only you can see the reason — it won't be shown to clients.</p>

        <button style={{width:"100%",padding:"16px",borderRadius:"12px",border:"none",background:t.ink,color:"#fff",fontFamily:f,fontSize:"14px",fontWeight:500,cursor:"pointer",marginBottom:"28px"}}>Block This Time</button>

        <Divider/>

        {/* Existing blocks */}
        <Lbl style={{margin:"20px 0 12px"}}>Upcoming Blocks</Lbl>
        {existingBlocks.map((b,i)=>(
          <div key={i}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px 0"}}>
              <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
                <div style={{width:"4px",height:"36px",borderRadius:"2px",background:b.type==="allday"?t.faded:t.accent,flexShrink:0}}/>
                <div>
                  <p style={{fontFamily:f,fontSize:"15px",fontWeight:400,color:t.ink,margin:"0 0 3px"}}>{b.date}</p>
                  <p style={{fontFamily:f,fontSize:"13px",color:t.muted,margin:0}}>{b.time}{b.reason?" · "+b.reason:""}</p>
                </div>
              </div>
              <button style={{background:"none",border:"none",cursor:"pointer",padding:"4px"}}>
                <svg width="16" height="16" fill="none" stroke={t.faded} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>
            <Divider/>
          </div>
        ))}

        <div style={{padding:"20px 0 32px"}}/>
      </div>
    </div>
  );
}

// ─── P8: Messages ────────────────────────
function PMessages({go,onMenu,notifCount,onNotif}){
  const convos=[
    {n:"Sarah Mitchell",msg:"Thanks for the exercises!",time:"1h",unread:false,i:"SM"},
    {n:"Kai Thompson",msg:"Can we reschedule?",time:"3h",unread:true,i:"KT"},
    {n:"Lisa Rivera",msg:"I'll book next week.",time:"1d",unread:false,i:"LR"},
  ];
  return(
    <div style={{minHeight:"100%",background:t.base,display:"flex",flexDirection:"column"}}>
      <Header onMenu={onMenu} initials="AW" notifCount={notifCount} onNotif={onNotif}/>
      <div style={{padding:"0 24px 24px"}}>
        <h1 style={{fontFamily:f,fontSize:"32px",fontWeight:400,letterSpacing:"-0.03em",lineHeight:1.1,color:t.ink,margin:0}}>Messages</h1>
      </div>
      <div style={{padding:"0 24px",flex:1,display:"flex",flexDirection:"column"}}>
        <Divider/>
        {convos.map(c=>(
          <div key={c.n}>
            <button onClick={()=>go("p_chat")} style={{display:"flex",alignItems:"center",gap:"16px",padding:"20px 0",background:"none",border:"none",cursor:"pointer",width:"100%",textAlign:"left"}}>
              <div style={{position:"relative"}}><Avatar initials={c.i} size={44}/>{c.unread&&<div style={{position:"absolute",top:0,right:0,width:"10px",height:"10px",borderRadius:"50%",background:t.accent,border:"2px solid "+t.base}}/>}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:"3px"}}><p style={{fontFamily:f,fontSize:"15px",fontWeight:c.unread?500:400,color:t.ink,margin:0}}>{c.n}</p><span style={{fontFamily:f,fontSize:"12px",color:t.faded}}>{c.time}</span></div>
                <p style={{fontFamily:f,fontSize:"14px",color:c.unread?t.ink:t.muted,margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.msg}</p>
              </div>
            </button>
            <Divider/>
          </div>
        ))}
        <Footer/>
      </div>
    </div>
  );
}

// ─── P9: Earnings ────────────────────────
function PEarnings({go,onMenu,notifCount,onNotif}){
  const months=["Oct","Nov","Dec","Jan","Feb","Mar"];
  const vals=[1800,2200,2600,2100,2900,3400];
  const mx=Math.max(...vals);
  return(
    <div style={{minHeight:"100%",background:t.base,display:"flex",flexDirection:"column"}}>
      <Header onMenu={onMenu} initials="AW" notifCount={notifCount} onNotif={onNotif}/>

      <HeroCard style={{minHeight:"200px"}}>
        <div>
          <HeroPill>March 2026</HeroPill>
          <Lbl color={t.muted} style={{marginBottom:"4px"}}>Total This Month</Lbl>
          <div style={{display:"flex",alignItems:"end",gap:"8px"}}>
            <span style={{fontFamily:f,fontSize:"48px",fontWeight:400,letterSpacing:"-0.05em",lineHeight:0.9,color:t.ink}}>$3,400</span>
            <Lbl color={t.success} style={{fontSize:"11px",marginBottom:"6px"}}>+17%</Lbl>
          </div>
        </div>
      </HeroCard>

      <div style={{padding:"32px 24px 0",flex:1,display:"flex",flexDirection:"column"}}>
        {/* Bar chart */}
        <Lbl style={{marginBottom:"16px"}}>6-Month Overview</Lbl>
        <div style={{display:"flex",alignItems:"flex-end",gap:"10px",height:"120px",marginBottom:"24px"}}>
          {months.map((m,i)=>(
            <div key={m} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:"6px"}}>
              <div style={{width:"100%",height:(vals[i]/mx)*100+"px",borderRadius:"6px 6px 2px 2px",background:i===5?t.accent:t.avatarBg}}/>
              <Lbl color={i===5?t.accent:t.faded} style={{fontSize:"10px"}}>{m}</Lbl>
            </div>
          ))}
        </div>

        <Divider/>

        <Lbl style={{margin:"20px 0 12px"}}>Breakdown</Lbl>
        {[{l:"1-on-1 Lessons",c:"28 sessions",a:"$2,380"},{l:"Group Classes",c:"8 classes",a:"$680"},{l:"Performance Coaching",c:"4 sessions",a:"$340"}].map(it=>(
          <div key={it.l}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px 0"}}>
              <div><p style={{fontFamily:f,fontSize:"15px",fontWeight:400,color:t.ink,margin:"0 0 3px"}}>{it.l}</p><p style={{fontFamily:f,fontSize:"13px",color:t.muted,margin:0}}>{it.c}</p></div>
              <span style={{fontFamily:f,fontSize:"18px",fontWeight:400,color:t.accent,letterSpacing:"-0.03em"}}>{it.a}</span>
            </div>
            <Divider/>
          </div>
        ))}

        {/* Next payout */}
        <div style={{padding:"20px",background:t.successBg,borderRadius:"16px",margin:"20px 0"}}>
          <Lbl color={t.success} style={{marginBottom:"6px"}}>Next Payout</Lbl>
          <span style={{fontFamily:f,fontSize:"24px",fontWeight:400,letterSpacing:"-0.03em",color:t.ink}}>$1,240</span>
          <p style={{fontFamily:f,fontSize:"13px",color:t.muted,margin:"6px 0 0"}}>Arrives via Stripe · Mar 22</p>
        </div>
        <Footer/>
      </div>
    </div>
  );
}

// ─── P10: Notifications ──────────────────
function PNotifications({go}){
  const notifs=[
    {id:1,type:"booking",title:"New booking request",body:"Emma Wilson wants to book 1-on-1 Vocal Lesson on Thu, Mar 20 at 11:00 AM.",time:"5m ago",read:false,initials:"EW"},
    {id:2,type:"connected",title:"New client connected",body:"David Park accepted your invite and is now part of your klique.",time:"2h ago",read:false,initials:"DP"},
    {id:3,type:"completed",title:"Session completed",body:"Kai Thompson's Performance Coaching session has been marked as complete.",time:"1d ago",read:true,initials:"KT"},
  ];
  const badgeColor={booking:t.accent,connected:t.success,completed:t.muted};
  const badgeIcon={
    booking:<svg width="12" height="12" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    connected:<svg width="12" height="12" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M8.5 3a4 4 0 100 8 4 4 0 000-8zM20 8v6m3-3h-6" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    completed:<svg width="12" height="12" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  };
  return(
    <div style={{minHeight:"100%",background:t.base,display:"flex",flexDirection:"column"}}>
      <div style={{padding:"32px 24px 16px",display:"flex",alignItems:"center",gap:"12px"}}>
        <BackBtn onClick={()=>go("p_dashboard")}/>
        <Lbl color={t.ink} style={{fontSize:"13px",fontWeight:500,flex:1}}>Notifications</Lbl>
        <Lbl color={t.accent} style={{fontSize:"11px",cursor:"pointer"}}>Mark all read</Lbl>
      </div>
      <div style={{padding:"0 24px",flex:1,display:"flex",flexDirection:"column"}}>
        <Divider/>
        {notifs.map(n=>(
          <div key={n.id}>
            <div style={{display:"flex",gap:"14px",padding:"20px 0",opacity:n.read?0.55:1}}>
              <div style={{position:"relative",flexShrink:0}}>
                <Avatar initials={n.initials} size={44}/>
                <div style={{position:"absolute",bottom:"-2px",right:"-2px",width:"22px",height:"22px",borderRadius:"50%",background:badgeColor[n.type],display:"flex",alignItems:"center",justifyContent:"center",border:"2px solid "+t.base}}>{badgeIcon[n.type]}</div>
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"4px"}}>
                  <p style={{fontFamily:f,fontSize:"15px",fontWeight:n.read?400:500,color:t.ink,margin:0}}>{n.title}</p>
                  {!n.read&&<div style={{width:"8px",height:"8px",borderRadius:"50%",background:t.accent,flexShrink:0,marginTop:"6px"}}/>}
                </div>
                <p style={{fontFamily:f,fontSize:"13px",color:t.muted,margin:"0 0 6px",lineHeight:1.5}}>{n.body}</p>
                <Lbl color={t.faded} style={{fontSize:"10px"}}>{n.time}</Lbl>
              </div>
            </div>
            <Divider/>
          </div>
        ))}
        <Footer/>
      </div>
    </div>
  );
}

// ─── P11: Smart alerts ───────────────────
function PAlerts({go}){
  const alerts=[
    {title:"Sarah M. — 10th session",sub:"Consider offering a loyalty discount or a personal note.",bg:t.hero},
    {title:"Kai T. — wants to reschedule",sub:"Respond to their message to confirm a new time.",bg:t.dangerBg},
    {title:"David P. — first session tomorrow",sub:"Review their intake form before the appointment.",bg:t.successBg},
  ];
  return(
    <div style={{minHeight:"100%",background:t.base,display:"flex",flexDirection:"column"}}>
      <div style={{padding:"32px 24px 16px"}}><BackBtn onClick={()=>go("p_dashboard")}/></div>
      <div style={{padding:"0 24px 24px"}}>
        <h1 style={{fontFamily:f,fontSize:"32px",fontWeight:400,letterSpacing:"-0.03em",lineHeight:1.1,color:t.ink,margin:0}}>Smart Alerts</h1>
      </div>
      <div style={{padding:"0 24px",flex:1,display:"flex",flexDirection:"column"}}>
        {alerts.map((a,i)=>(
          <div key={i} style={{padding:"24px",background:a.bg,borderRadius:"20px",marginBottom:"14px"}}>
            <p style={{fontFamily:f,fontSize:"16px",fontWeight:500,color:t.ink,margin:"0 0 6px"}}>{a.title}</p>
            <p style={{fontFamily:f,fontSize:"14px",color:t.muted,margin:"0 0 16px",lineHeight:1.6}}>{a.sub}</p>
            <button style={{padding:"10px 20px",borderRadius:"9999px",border:"none",background:t.ink,color:"#fff",fontFamily:f,fontSize:"12px",fontWeight:500,cursor:"pointer"}}>Take Action</button>
          </div>
        ))}
        <Footer/>
      </div>
    </div>
  );
}

// ─── P12: Appointment detail ─────────────
function PApptDetail({go}){
  return(
  <div style={{minHeight:"100%",background:t.base,display:"flex",flexDirection:"column"}}>
    <div style={{padding:"32px 24px 16px"}}><BackBtn onClick={()=>go("p_dashboard")}/></div>
    <div style={{padding:"0 24px",flex:1,display:"flex",flexDirection:"column"}}>
      {/* Client info */}
      <div style={{display:"flex",alignItems:"center",gap:"16px",marginBottom:"24px"}}>
        <Avatar initials="SM" size={56}/>
        <div>
          <p style={{fontFamily:f,fontSize:"20px",fontWeight:400,letterSpacing:"-0.02em",color:t.ink,margin:"0 0 4px"}}>Sarah Mitchell</p>
          <p style={{fontFamily:f,fontSize:"13px",color:t.muted,margin:0}}>12th visit · Client since Jan 2025</p>
        </div>
      </div>
      <div style={{display:"inline-flex",padding:"6px 12px",borderRadius:"9999px",background:t.hero,marginBottom:"24px",alignSelf:"flex-start"}}><Lbl color={t.accent} style={{fontSize:"10px",margin:0}}>Confirmed</Lbl></div>

      <Divider/>

      {/* Session info */}
      <div style={{padding:"20px 0"}}>
        <p style={{fontFamily:f,fontSize:"20px",fontWeight:400,letterSpacing:"-0.02em",color:t.ink,margin:"0 0 6px"}}>Wed, Mar 19 at 10:30 AM</p>
        <p style={{fontFamily:f,fontSize:"14px",color:t.muted,margin:0}}>60 min · 1-on-1 Vocal Lesson · $85</p>
      </div>

      <Divider/>

      {/* Payment info */}
      <div style={{padding:"20px 0"}}>
        <Lbl style={{marginBottom:"8px"}}>Payment Status</Lbl>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:"6px"}}>
          <span style={{fontFamily:f,fontSize:"14px",color:t.muted}}>Deposit paid</span>
          <span style={{fontFamily:f,fontSize:"14px",fontWeight:500,color:t.ink}}>$26</span>
        </div>
        <div style={{display:"flex",justifyContent:"space-between"}}>
          <span style={{fontFamily:f,fontSize:"14px",color:t.muted}}>Remaining balance</span>
          <span style={{fontFamily:f,fontSize:"14px",fontWeight:500,color:t.accent}}>$59</span>
        </div>
        <p style={{fontFamily:f,fontSize:"12px",color:t.faded,margin:"8px 0 0"}}>Remaining balance will be charged upon completion.</p>
      </div>

      <Divider/>

      {/* Previous notes */}
      <div style={{padding:"20px 0"}}>
        <Lbl style={{marginBottom:"8px"}}>Notes From Last Session</Lbl>
        <div style={{padding:"14px 16px",background:t.avatarBg,borderRadius:"12px"}}>
          <p style={{fontFamily:f,fontSize:"14px",color:t.ink,margin:0,lineHeight:1.6,fontStyle:"italic"}}>"Worked on breath control and upper range. Ready for recital."</p>
        </div>
      </div>

      <Divider/>

      {/* Current session notes */}
      <div style={{padding:"20px 0"}}>
        <Lbl style={{marginBottom:"8px"}}>Session Notes</Lbl>
        <textarea placeholder="How did this session go? Add notes for your records..." rows={4} style={{width:"100%",padding:"14px 16px",borderRadius:"12px",border:"1px solid "+t.line,fontFamily:f,fontSize:"13px",color:t.ink,resize:"vertical",outline:"none",background:t.avatarBg,boxSizing:"border-box"}}/>
      </div>

      <div style={{display:"flex",gap:"10px",paddingBottom:"20px"}}>
        <button onClick={()=>go("p_messages")} style={{flex:1,padding:"14px",borderRadius:"12px",border:"1px solid "+t.line,background:"transparent",fontFamily:f,fontSize:"13px",fontWeight:500,color:t.ink,cursor:"pointer"}}>Message</button>
        <button onClick={()=>go("p_complete")} style={{flex:1,padding:"14px",borderRadius:"12px",border:"none",background:t.ink,color:"#fff",fontFamily:f,fontSize:"13px",fontWeight:500,cursor:"pointer"}}>Mark Complete</button>
      </div>
      <Footer/>
    </div>
  </div>
)}

// ─── P12b: Session completed confirmation ─
function PComplete({go}){return(
  <div style={{minHeight:"100%",background:t.base,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px"}}>
    {/* Provider-client connection icon */}
    <div style={{display:"flex",alignItems:"center",marginBottom:"28px"}}>
      <div style={{width:"56px",height:"56px",borderRadius:"50%",background:t.hero,display:"flex",alignItems:"center",justifyContent:"center",border:"2px solid "+t.base,zIndex:2}}>
        <span style={{fontFamily:f,fontSize:"18px",fontWeight:400,color:t.ink}}>AW</span>
      </div>
      <div style={{width:"24px",height:"2px",background:t.success,margin:"0 -4px",zIndex:1}}/>
      <div style={{width:"56px",height:"56px",borderRadius:"50%",background:t.avatarBg,display:"flex",alignItems:"center",justifyContent:"center",border:"2px solid "+t.base,zIndex:2}}>
        <span style={{fontFamily:f,fontSize:"18px",fontWeight:400,color:t.muted}}>SM</span>
      </div>
    </div>

    <h1 style={{fontFamily:f,fontSize:"24px",fontWeight:400,letterSpacing:"-0.02em",color:t.ink,margin:"0 0 8px",textAlign:"center"}}>Session complete.</h1>
    <p style={{fontFamily:f,fontSize:"15px",color:t.muted,margin:"0 0 28px",textAlign:"center",lineHeight:1.6}}>Sarah Mitchell's vocal lesson has been marked as complete.</p>

    {/* Payout summary */}
    <div style={{width:"100%",padding:"20px",background:t.avatarBg,borderRadius:"16px",marginBottom:"28px"}}>
      <Lbl style={{marginBottom:"12px"}}>Payout Summary</Lbl>
      <Divider/>
      <div style={{display:"flex",justifyContent:"space-between",padding:"12px 0"}}><span style={{fontFamily:f,fontSize:"14px",color:t.muted}}>Deposit collected</span><span style={{fontFamily:f,fontSize:"14px",color:t.ink}}>$26</span></div>
      <Divider/>
      <div style={{display:"flex",justifyContent:"space-between",padding:"12px 0"}}><span style={{fontFamily:f,fontSize:"14px",color:t.muted}}>Remaining charged</span><span style={{fontFamily:f,fontSize:"14px",color:t.ink}}>$59</span></div>
      <Divider/>
      <div style={{display:"flex",justifyContent:"space-between",padding:"12px 0"}}><span style={{fontFamily:f,fontSize:"14px",color:t.muted}}>Platform fee</span><span style={{fontFamily:f,fontSize:"14px",color:t.muted}}>-$8.50</span></div>
      <Divider/>
      <div style={{display:"flex",justifyContent:"space-between",padding:"14px 0 0"}}>
        <span style={{fontFamily:f,fontSize:"15px",fontWeight:500,color:t.ink}}>Your payout</span>
        <span style={{fontFamily:f,fontSize:"22px",fontWeight:400,letterSpacing:"-0.03em",color:t.accent}}>$76.50</span>
      </div>
    </div>

    <div style={{width:"100%",padding:"16px",background:t.successBg,borderRadius:"12px",marginBottom:"28px",textAlign:"center"}}>
      <p style={{fontFamily:f,fontSize:"14px",color:t.success,margin:0}}>Payout will arrive via Stripe within 2–3 business days.</p>
    </div>

    <button onClick={()=>go("p_dashboard")} style={{width:"100%",padding:"16px",borderRadius:"12px",border:"none",background:t.ink,color:"#fff",fontFamily:f,fontSize:"14px",fontWeight:500,cursor:"pointer",marginBottom:"10px"}}>Back to Dashboard</button>
    <button onClick={()=>go("p_timeline")} style={{width:"100%",padding:"14px",borderRadius:"12px",border:"1px solid "+t.line,background:"transparent",fontFamily:f,fontSize:"14px",fontWeight:500,color:t.ink,cursor:"pointer"}}>View Client Timeline</button>
  </div>
)}

// ─── P13: Profile ────────────────────────
function PProfileScreen({go,onMenu,notifCount,onNotif}){
  const settings=[{l:"Personal details",s:"Name, email, phone"},{l:"Business details",s:"Studio name, address"},{l:"Photos & portfolio",s:"Manage gallery"},{l:"Payouts & billing",s:"Stripe Connect"},{l:"Working hours",s:"Availability schedule"},{l:"Notifications",s:"Email, push, SMS"},{l:"Booking settings",s:"Cancellation, buffer times"},{l:"Help & support",s:"FAQ, contact Kliques"}];
  return(
    <div style={{minHeight:"100%",background:t.base,display:"flex",flexDirection:"column"}}>
      <Header onMenu={onMenu} initials="AW" notifCount={notifCount} onNotif={onNotif}/>
      <div style={{padding:"0 24px 24px",display:"flex",flexDirection:"column",alignItems:"center"}}>
        <Avatar initials="AW" size={72}/>
        <h1 style={{fontFamily:f,fontSize:"24px",fontWeight:400,letterSpacing:"-0.02em",color:t.ink,margin:"16px 0 2px"}}>Anny Wong</h1>
        <p style={{fontFamily:f,fontSize:"14px",color:t.muted,margin:"0 0 16px"}}>Vocal Studio · Ottawa</p>
        <div style={{display:"flex",gap:"24px"}}>
          {[{l:"Rating",v:"4.9 ★"},{l:"Reviews",v:"127"},{l:"Clients",v:"34"}].map(s=>(
            <div key={s.l} style={{textAlign:"center"}}>
              <span style={{fontFamily:f,fontSize:"20px",fontWeight:400,letterSpacing:"-0.03em",color:t.accent}}>{s.v}</span>
              <Lbl style={{marginTop:"4px"}}>{s.l}</Lbl>
            </div>
          ))}
        </div>
      </div>
      <div style={{padding:"0 24px",flex:1,display:"flex",flexDirection:"column"}}>
        <Divider/>
        {settings.map(item=>(
          <div key={item.l}>
            <button style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"20px 0",background:"none",border:"none",cursor:"pointer",width:"100%",textAlign:"left"}}>
              <div><p style={{fontFamily:f,fontSize:"16px",fontWeight:400,color:t.ink,margin:"0 0 3px"}}>{item.l}</p><p style={{fontFamily:f,fontSize:"13px",color:t.muted,margin:0}}>{item.s}</p></div>
              <ArrowIcon size={18}/>
            </button>
            <Divider/>
          </div>
        ))}
        <Footer/>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// MAIN APP — DUAL FLOW
// ═══════════════════════════════════════════
export default function KliquesApp(){
  const [role,setRole]=useState("client");
  const [cs,setCs]=useState("c_providers");
  const [ps,setPs]=useState("p_dashboard");
  const [menuOpen,setMenuOpen]=useState(false);
  const [notifCount]=useState(2);
  const openMenu=()=>setMenuOpen(true);
  const closeMenu=()=>setMenuOpen(false);

  const cActiveMenu=["c_providers","c_relationship","c_services","c_service_detail","c_intake","c_time","c_time_request","c_time_request_sent","c_payment","c_confirmed","c_review","c_notifications","c_all_notifications"].includes(cs)?"c_providers":cs==="c_chat"?"c_messages":cs;
  const pActiveMenu=["p_timeline","p_service_edit","p_alerts","p_appt_detail","p_complete","p_notifications","p_availability","p_block_time"].includes(ps)?(ps==="p_timeline"?"p_clients":ps==="p_service_edit"?"p_services":["p_availability","p_block_time"].includes(ps)?"p_calendar":"p_dashboard"):ps==="p_chat"?"p_messages":ps;

  const clientRender=()=>{
    const p={go:setCs,onMenu:openMenu,notifCount,onNotif:()=>setCs("c_notifications")};
    switch(cs){
      case "c_providers": return <CProviders {...p}/>;
      case "c_relationship": return <CRelationship go={setCs}/>;
      case "c_services": return <CServices go={setCs}/>;
      case "c_service_detail": return <CServiceDetail go={setCs}/>;
      case "c_intake": return <CIntake go={setCs}/>;
      case "c_time": return <CTime go={setCs}/>;
      case "c_time_request": return <CTimeRequest go={setCs}/>;
      case "c_time_request_sent": return <CTimeRequestSent go={setCs}/>;
      case "c_payment": return <CPayment go={setCs}/>;
      case "c_confirmed": return <CConfirmed go={setCs}/>;
      case "c_review": return <CReview go={setCs}/>;
      case "c_messages": return <CMessages {...p}/>;
      case "c_chat": return <CChat go={setCs}/>;
      case "c_notifications": return <CNotifications go={setCs}/>;
      case "c_all_notifications": return <CAllNotifications go={setCs}/>;
      case "c_profile": return <CProfileScreen {...p}/>;
      default: return <CProviders {...p}/>;
    }
  };

  const provRender=()=>{
    const p={go:setPs,onMenu:openMenu,notifCount,onNotif:()=>setPs("p_notifications")};
    switch(ps){
      case "p_dashboard": return <PDashboard {...p}/>;
      case "p_bookings": return <PBookings {...p}/>;
      case "p_clients": return <PClients {...p}/>;
      case "p_timeline": return <PTimeline go={setPs}/>;
      case "p_services": return <PServices {...p}/>;
      case "p_service_edit": return <PServiceEdit go={setPs}/>;
      case "p_calendar": return <PCalendar {...p}/>;
      case "p_availability": return <PAvailability go={setPs}/>;
      case "p_block_time": return <PBlockTime go={setPs}/>;
      case "p_messages": return <PMessages {...p}/>;
      case "p_chat": return <PChat go={setPs}/>;
      case "p_earnings": return <PEarnings {...p}/>;
      case "p_notifications": return <PNotifications go={setPs}/>;
      case "p_alerts": return <PAlerts go={setPs}/>;
      case "p_appt_detail": return <PApptDetail go={setPs}/>;
      case "p_complete": return <PComplete go={setPs}/>;
      case "p_profile": return <PProfileScreen {...p}/>;
      default: return <PDashboard {...p}/>;
    }
  };

  return(
    <div style={{padding:"1rem 0 2rem",minHeight:"100vh",background:"#EDE6DD"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&display=swap');*{box-sizing:border-box;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}button:active{transform:scale(0.98)}::-webkit-scrollbar{display:none}`}</style>
      {/* Role switcher */}
      <div style={{display:"flex",justifyContent:"center",gap:"4px",marginBottom:"1.25rem",padding:"4px",background:t.avatarBg,borderRadius:"12px",width:"fit-content",margin:"0 auto 1.25rem"}}>
        {["client","provider"].map(r=><button key={r} onClick={()=>{setRole(r);setMenuOpen(false)}} style={{padding:"10px 28px",borderRadius:"10px",border:"none",fontFamily:f,fontSize:"12px",fontWeight:role===r?600:400,background:role===r?t.card:"transparent",color:role===r?t.ink:t.muted,cursor:"pointer",boxShadow:role===r?"0 1px 3px rgba(0,0,0,0.06)":"none",letterSpacing:"0.02em"}}>{r==="client"?"Client Flow":"Provider Flow"}</button>)}
      </div>
      <div style={{display:"flex",justifyContent:"center"}}>
        {role==="client"
          ?<Phone screen={cs} setScreen={setCs} screenList={clientScreens} labels={clientLabels}>
            {clientRender()}
            <SideMenu open={menuOpen} onClose={closeMenu} items={clientMenu} active={cActiveMenu} onNav={setCs} userName="Eto" userInitials="ET"/>
          </Phone>
          :<Phone screen={ps} setScreen={setPs} screenList={provScreens} labels={provLabels}>
            {provRender()}
            <SideMenu open={menuOpen} onClose={closeMenu} items={provMenu} active={pActiveMenu} onNav={setPs} userName="Anny Wong" userInitials="AW"/>
          </Phone>
        }
      </div>
    </div>
  );
}
