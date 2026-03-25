import { useState } from "react";

// ═══════════════════════════════════════════
// DESIGN TOKENS
// ═══════════════════════════════════════════
const t = {
  base:"#FBF7F2",ink:"#3D231E",muted:"#8C6A64",faded:"#B0948F",
  accent:"#C25E4A",hero:"#FDDCC6",avatarBg:"#F2EBE5",
  line:"rgba(140,106,100,0.2)",success:"#5A8A5E",successBg:"#EBF2EC",
  callout:"#FFF5E6",card:"#FFFFFF",dangerBg:"#FDEDEA",
};
const f = "'Sora',system-ui,sans-serif";
const topoSvg = `url("data:image/svg+xml,%3Csvg width='400' height='400' viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 200 Q 100 100 200 200 T 400 200' stroke='%233D231E' stroke-width='0.5' fill='none'/%3E%3Cpath d='M-50 250 Q 50 150 150 250 T 350 250' stroke='%233D231E' stroke-width='0.5' fill='none'/%3E%3Cpath d='M50 150 Q 150 50 250 150 T 450 150' stroke='%233D231E' stroke-width='0.5' fill='none'/%3E%3Cpath d='M0 300 Q 100 200 200 300 T 400 300' stroke='%233D231E' stroke-width='0.5' fill='none'/%3E%3Cpath d='M100 50 Q 200 -50 300 50 T 500 50' stroke='%233D231E' stroke-width='0.5' fill='none'/%3E%3Cpath d='M200 350 Q 250 250 350 300' stroke='%233D231E' stroke-width='0.5' fill='none'/%3E%3C/svg%3E")`;

// ═══════════════════════════════════════════
// SHARED
// ═══════════════════════════════════════════
function Lbl({children,color=t.muted,style={}}){return <span style={{fontFamily:f,fontSize:"11px",fontWeight:500,color,letterSpacing:"0.05em",textTransform:"uppercase",display:"block",...style}}>{children}</span>}
function Avatar({initials,size=40}){return <div style={{width:size,height:size,borderRadius:"50%",background:t.avatarBg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:f,fontSize:size*0.3,fontWeight:500,color:t.muted,flexShrink:0}}>{initials}</div>}
function Divider(){return <div style={{height:"1px",background:t.line}}/>}
function ArrowIcon({size=20,color=t.accent}){return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M7 17L17 7M17 7H7M17 7V17" strokeLinecap="round" strokeLinejoin="round"/></svg>}
function MenuBtn({onClick}){return <button onClick={onClick} style={{background:"none",border:"none",cursor:"pointer",padding:"4px",display:"flex",flexDirection:"column",gap:"4px",width:"20px"}}><div style={{width:"20px",height:"2px",background:t.accent}}/><div style={{width:"14px",height:"2px",background:t.accent}}/><div style={{width:"20px",height:"2px",background:t.accent}}/></button>}
function NotifBell({count=0}){return <button style={{position:"relative",background:"none",border:"none",cursor:"pointer",padding:"4px",display:"flex"}}><svg width="20" height="20" fill="none" stroke={t.ink} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" strokeLinecap="round" strokeLinejoin="round"/></svg>{count>0&&<div style={{position:"absolute",top:"-2px",right:"-2px",minWidth:"16px",height:"16px",borderRadius:"8px",background:t.accent,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 4px",border:"2px solid "+t.base}}><span style={{fontFamily:f,fontSize:"9px",fontWeight:600,color:"#fff",lineHeight:1}}>{count}</span></div>}</button>}

function Header({onMenu}){return(
  <header style={{padding:"32px 24px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",position:"relative"}}>
    <MenuBtn onClick={onMenu}/>
    <Lbl color={t.accent} style={{fontSize:"13px",fontWeight:600,position:"absolute",left:"50%",transform:"translateX(-50%)"}}>Kliques</Lbl>
    <div style={{display:"flex",alignItems:"center",gap:"12px"}}><NotifBell count={0}/><Avatar initials="AW" size={36}/></div>
  </header>
)}

function HeroCard({children,style={}}){return(
  <div style={{margin:"0 16px",background:t.hero,borderRadius:"28px",padding:"28px",position:"relative",overflow:"hidden",minHeight:"200px",display:"flex",flexDirection:"column",justifyContent:"space-between",...style}}>
    <div style={{position:"absolute",inset:0,backgroundImage:topoSvg,backgroundSize:"cover",opacity:0.12,pointerEvents:"none"}}/>
    <div style={{position:"relative",zIndex:1,display:"flex",flexDirection:"column",justifyContent:"space-between",flex:1}}>{children}</div>
  </div>
)}
function HeroPill({children}){return <div style={{display:"inline-flex",alignItems:"center",gap:"6px",padding:"6px 12px",border:"1px solid rgba(61,35,30,0.1)",borderRadius:"9999px",background:"rgba(255,255,255,0.3)",backdropFilter:"blur(4px)",marginBottom:"20px",alignSelf:"flex-start"}}><span style={{width:"6px",height:"6px",borderRadius:"50%",background:t.accent}}/><Lbl color={t.ink} style={{fontSize:"11px",margin:0}}>{children}</Lbl></div>}

function Footer(){return(
  <div style={{padding:"40px 0 32px",marginTop:"auto"}}><Divider/><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"24px 0 0"}}><Lbl color={t.faded} style={{fontSize:"10px",letterSpacing:"0.08em"}}>© 2026 Kliques</Lbl><div style={{display:"flex",gap:"16px"}}>{["Terms","Privacy","Help"].map(l=><Lbl key={l} color={t.faded} style={{fontSize:"10px",cursor:"pointer",letterSpacing:"0.08em"}}>{l}</Lbl>)}</div></div></div>
)}

function Phone({children}){return(
  <div style={{display:"flex",flexDirection:"column",alignItems:"center",width:"100%",maxWidth:"420px"}}>
    <div style={{width:"100%",maxWidth:"414px",height:"896px",background:t.base,position:"relative",overflow:"hidden",boxShadow:"0 0 40px rgba(61,35,30,0.05)",borderRadius:"40px",border:"1px solid "+t.line}}>
      <div style={{height:"100%",overflowY:"auto",overflowX:"hidden"}}>{children}</div>
    </div>
  </div>
)}

// ═══════════════════════════════════════════
// SHARE LINKS (Dashboard only)
// ═══════════════════════════════════════════
function ShareLinks({handle="annywong"}){
  const [copied,setCopied]=useState(null);
  const [showQR,setShowQR]=useState(null);
  const bookUrl=`mykliques.com/book/${handle}`;
  const inviteUrl=`mykliques.com/join/${handle}`;
  const doCopy=(type)=>{setCopied(type);setTimeout(()=>setCopied(null),2000);};
  const QR=({url})=>(<div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"20px 0 8px"}}><div style={{width:"130px",height:"130px",borderRadius:"16px",background:"#fff",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:"10px",border:"1px solid "+t.line}}><svg width="96" height="96" viewBox="0 0 96 96"><rect x="6" y="6" width="24" height="24" rx="4" fill={t.ink}/><rect x="10" y="10" width="16" height="16" rx="2" fill="#fff"/><rect x="14" y="14" width="8" height="8" rx="1" fill={t.ink}/><rect x="66" y="6" width="24" height="24" rx="4" fill={t.ink}/><rect x="70" y="10" width="16" height="16" rx="2" fill="#fff"/><rect x="74" y="14" width="8" height="8" rx="1" fill={t.ink}/><rect x="6" y="66" width="24" height="24" rx="4" fill={t.ink}/><rect x="10" y="70" width="16" height="16" rx="2" fill="#fff"/><rect x="14" y="74" width="8" height="8" rx="1" fill={t.ink}/><rect x="38" y="38" width="20" height="20" rx="4" fill={t.accent}/><text x="48" y="52" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="600" fontFamily={f}>k</text></svg></div><p style={{fontFamily:f,fontSize:"11px",color:t.faded,margin:"0 0 8px"}}>{url}</p><button onClick={()=>setShowQR(null)} style={{fontFamily:f,fontSize:"12px",color:t.accent,fontWeight:500,background:"none",border:"none",cursor:"pointer"}}>Close</button></div>);
  const Btns=({type})=>(<div style={{display:"flex",gap:"6px",marginTop:"10px"}}><button onClick={()=>doCopy(type)} style={{flex:1,padding:"10px",borderRadius:"10px",border:"none",background:copied===type?t.successBg:t.ink,color:copied===type?t.success:"#fff",fontFamily:f,fontSize:"12px",fontWeight:500,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"5px"}}>{copied===type?<><svg width="13" height="13" fill="none" stroke={t.success} strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg>Copied</>:<><svg width="13" height="13" fill="none" stroke="#fff" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/></svg>Copy</>}</button><button onClick={()=>setShowQR(showQR===type?null:type)} style={{padding:"10px 14px",borderRadius:"10px",border:"1px solid "+t.line,background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><svg width="16" height="16" fill="none" stroke={t.ink} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM17 14v3h3m-3-6h3v3m-6 3h3" strokeLinecap="round" strokeLinejoin="round"/></svg></button><button style={{padding:"10px 14px",borderRadius:"10px",border:"1px solid "+t.line,background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><svg width="16" height="16" fill="none" stroke={t.ink} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" strokeLinecap="round" strokeLinejoin="round"/></svg></button></div>);
  return(
    <div style={{marginTop:"24px"}}>
      <Lbl style={{marginBottom:"16px"}}>Grow Your Klique</Lbl>
      <div style={{padding:"20px",background:t.hero,borderRadius:"18px",marginBottom:"12px",position:"relative",overflow:"hidden"}}><div style={{position:"absolute",inset:0,backgroundImage:topoSvg,backgroundSize:"cover",opacity:0.08,pointerEvents:"none"}}/><div style={{position:"relative",zIndex:1}}><div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"8px"}}><svg width="16" height="16" fill="none" stroke={t.accent} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M8.5 3a4 4 0 100 8 4 4 0 000-8zM20 8v6m3-3h-6" strokeLinecap="round" strokeLinejoin="round"/></svg><Lbl color={t.ink} style={{fontSize:"12px",fontWeight:500,margin:0}}>Invite Link</Lbl></div><p style={{fontFamily:f,fontSize:"14px",color:t.muted,margin:"0 0 12px",lineHeight:1.5}}>Send this to clients to join your klique. They'll be connected to you instantly.</p><div style={{display:"flex",alignItems:"center",gap:"6px",padding:"10px 12px",borderRadius:"10px",background:"rgba(255,255,255,0.6)",border:"1px solid rgba(61,35,30,0.08)"}}><svg width="14" height="14" fill="none" stroke={t.muted} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" strokeLinecap="round" strokeLinejoin="round"/></svg><span style={{fontFamily:f,fontSize:"12px",color:t.muted,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{inviteUrl}</span></div><Btns type="invite"/>{showQR==="invite"&&<QR url={inviteUrl}/>}</div></div>
      <div style={{padding:"20px",background:t.avatarBg,borderRadius:"18px"}}><div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"8px"}}><svg width="16" height="16" fill="none" stroke={t.accent} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/></svg><Lbl color={t.ink} style={{fontSize:"12px",fontWeight:500,margin:0}}>Booking Link</Lbl></div><p style={{fontFamily:f,fontSize:"14px",color:t.muted,margin:"0 0 12px",lineHeight:1.5}}>Your public booking page — clients see your profile, services, and book directly.</p><div style={{display:"flex",alignItems:"center",gap:"6px",padding:"10px 12px",borderRadius:"10px",background:"#fff",border:"1px solid "+t.line}}><svg width="14" height="14" fill="none" stroke={t.muted} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" strokeLinecap="round" strokeLinejoin="round"/></svg><span style={{fontFamily:f,fontSize:"12px",color:t.muted,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{bookUrl}</span></div><Btns type="booking"/>{showQR==="booking"&&<QR url={bookUrl}/>}</div>
    </div>
  );
}

// ═══════════════════════════════════════════
// PROVIDER EMPTY STATES
// ═══════════════════════════════════════════

// ─── Dashboard (empty) ───────────────────
function ProviderEmptyDashboard({onMenu}){return(
  <div style={{minHeight:"100%",background:t.base,display:"flex",flexDirection:"column"}}>
    <Header onMenu={onMenu}/>
    <HeroCard>
      <div>
        <HeroPill>Wednesday · Mar 19</HeroPill>
        <h1 style={{fontFamily:f,fontSize:"32px",fontWeight:400,letterSpacing:"-0.03em",lineHeight:1.1,color:t.ink,margin:0}}>Good morning,<br/>Anny</h1>
      </div>
      <div>
        <div style={{height:"1px",background:"rgba(61,35,30,0.1)",marginBottom:"16px"}}/>
        <p style={{fontFamily:f,fontSize:"15px",color:t.muted,margin:0}}>No upcoming sessions today.</p>
      </div>
    </HeroCard>

    {/* Stats at zero */}
    <div style={{padding:"32px 24px 0",display:"flex",gap:"24px",position:"relative"}}>
      <div style={{position:"absolute",top:0,left:24,right:24,height:"1px",background:t.line}}/>
      <div style={{flex:1,paddingTop:"20px"}}>
        <Lbl style={{marginBottom:"8px"}}>This Week</Lbl>
        <span style={{fontFamily:f,fontSize:"56px",fontWeight:400,letterSpacing:"-0.05em",lineHeight:0.9,color:t.faded}}>$0</span>
      </div>
      <div style={{width:"1px",background:t.line,alignSelf:"stretch",marginTop:"20px"}}/>
      <div style={{flex:1,paddingTop:"20px",display:"flex",flexDirection:"column",alignItems:"flex-end"}}>
        <Lbl style={{marginBottom:"8px"}}>Clients</Lbl>
        <span style={{fontFamily:f,fontSize:"56px",fontWeight:400,letterSpacing:"-0.05em",lineHeight:0.9,color:t.faded}}>0</span>
      </div>
    </div>
    <p style={{fontFamily:f,fontSize:"15px",color:t.muted,padding:"16px 24px 0",margin:0}}>Share your links below to start booking clients.</p>

    <div style={{padding:"0 24px",flex:1,display:"flex",flexDirection:"column"}}>
      {/* Empty schedule */}
      <Lbl style={{margin:"28px 0 12px"}}>Today's Schedule</Lbl>
      <Divider/>
      <div style={{padding:"32px 0",textAlign:"center"}}>
        <p style={{fontFamily:f,fontSize:"16px",color:t.ink,margin:"0 0 4px"}}>Your day is wide open.</p>
        <p style={{fontFamily:f,fontSize:"14px",color:t.muted,margin:0}}>Once clients book, their sessions show up here.</p>
      </div>
      <Divider/>

      {/* Share links — only on dashboard */}
      <ShareLinks handle="annywong"/>

      <Footer/>
    </div>
  </div>
)}

// ─── Bookings (empty) ────────────────────
function ProviderEmptyBookings({onMenu}){return(
  <div style={{minHeight:"100%",background:t.base,display:"flex",flexDirection:"column"}}>
    <Header onMenu={onMenu}/>
    <div style={{padding:"0 24px 24px"}}>
      <Lbl style={{marginBottom:"6px"}}>0 pending</Lbl>
      <h1 style={{fontFamily:f,fontSize:"32px",fontWeight:400,letterSpacing:"-0.03em",lineHeight:1.1,color:t.ink,margin:0}}>Bookings</h1>
    </div>
    <div style={{padding:"0 24px",flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
      <div style={{width:"64px",height:"64px",borderRadius:"20px",background:t.avatarBg,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:"20px"}}>
        <svg width="28" height="28" fill="none" stroke={t.muted} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M3 19V9a2 2 0 011.106-1.789L12 3l7.894 4.211A2 2 0 0121 9v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 9l9 6 9-6" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </div>
      <p style={{fontFamily:f,fontSize:"20px",fontWeight:400,letterSpacing:"-0.02em",color:t.ink,margin:"0 0 8px",textAlign:"center"}}>Inbox zero. Feels good.</p>
      <p style={{fontFamily:f,fontSize:"14px",color:t.muted,margin:0,textAlign:"center",lineHeight:1.6,maxWidth:"280px"}}>When clients request a booking, you'll review and accept them here.</p>
    </div>
    <div style={{padding:"0 24px"}}><Footer/></div>
  </div>
)}

// ─── My Kliques (empty) ──────────────────
function ProviderEmptyKliques({onMenu}){return(
  <div style={{minHeight:"100%",background:t.base,display:"flex",flexDirection:"column"}}>
    <Header onMenu={onMenu}/>
    <div style={{padding:"0 24px 24px"}}>
      <Lbl style={{marginBottom:"6px"}}>0 clients</Lbl>
      <h1 style={{fontFamily:f,fontSize:"32px",fontWeight:400,letterSpacing:"-0.03em",lineHeight:1.1,color:t.ink,margin:0}}>My kliques</h1>
    </div>
    <div style={{padding:"0 24px",flex:1,display:"flex",flexDirection:"column"}}>
      {/* Hero card with ghost avatars */}
      <div style={{background:t.hero,borderRadius:"24px",padding:"28px 24px",position:"relative",overflow:"hidden",marginBottom:"20px"}}>
        <div style={{position:"absolute",inset:0,backgroundImage:topoSvg,backgroundSize:"cover",opacity:0.1,pointerEvents:"none"}}/>
        <div style={{position:"relative",zIndex:1}}>
          <div style={{display:"flex",marginBottom:"24px"}}>
            {[0,1,2].map(i=><div key={i} style={{width:"44px",height:"44px",borderRadius:"50%",background:"rgba(255,255,255,0.5)",border:"2px solid rgba(255,255,255,0.7)",display:"flex",alignItems:"center",justifyContent:"center",marginLeft:i>0?"-10px":"0",zIndex:3-i}}><svg width="18" height="18" fill="none" stroke={t.faded} strokeWidth="1.5" viewBox="0 0 24 24" opacity={1-i*0.25}><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeLinecap="round" strokeLinejoin="round"/></svg></div>)}
          </div>
          <h2 style={{fontFamily:f,fontSize:"22px",fontWeight:400,letterSpacing:"-0.02em",lineHeight:1.2,color:t.ink,margin:"0 0 8px"}}>Your people are<br/>out there.</h2>
          <p style={{fontFamily:f,fontSize:"14px",color:t.muted,margin:0,lineHeight:1.6}}>When clients accept your invite or book a session, they become part of your klique. Every session and milestone — tracked here.</p>
        </div>
      </div>

      <ShareLinks handle="annywong"/>

      <Footer/>
    </div>
  </div>
)}

// ─── Services (empty) ────────────────────
function ProviderEmptyServices({onMenu}){return(
  <div style={{minHeight:"100%",background:t.base,display:"flex",flexDirection:"column"}}>
    <Header onMenu={onMenu}/>
    <div style={{padding:"0 24px 24px",display:"flex",justifyContent:"space-between",alignItems:"end"}}>
      <div>
        <Lbl style={{marginBottom:"6px"}}>0 services</Lbl>
        <h1 style={{fontFamily:f,fontSize:"32px",fontWeight:400,letterSpacing:"-0.03em",lineHeight:1.1,color:t.ink,margin:0}}>Services</h1>
      </div>
      <button style={{padding:"10px 18px",borderRadius:"10px",border:"none",background:t.ink,color:"#fff",fontFamily:f,fontSize:"12px",fontWeight:500,cursor:"pointer",display:"flex",alignItems:"center",gap:"4px"}}><svg width="12" height="12" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" strokeLinecap="round"/></svg>Add</button>
    </div>
    <div style={{padding:"0 24px",flex:1,display:"flex",flexDirection:"column"}}>
      <Divider/>
      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"20px 0"}}>
        <div style={{width:"72px",height:"72px",borderRadius:"20px",background:t.hero,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:"20px"}}>
          <svg width="32" height="32" fill="none" stroke={t.accent} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <p style={{fontFamily:f,fontSize:"20px",fontWeight:400,letterSpacing:"-0.02em",color:t.ink,margin:"0 0 8px",textAlign:"center"}}>What do you offer?</p>
        <p style={{fontFamily:f,fontSize:"14px",color:t.muted,margin:"0 0 28px",textAlign:"center",lineHeight:1.6,maxWidth:"280px"}}>Define your services — name, duration, price, and how you'd like to get paid. This is what clients see when they book.</p>
        <button style={{padding:"14px 32px",borderRadius:"12px",border:"none",background:t.ink,color:"#fff",fontFamily:f,fontSize:"14px",fontWeight:500,cursor:"pointer",display:"flex",alignItems:"center",gap:"8px"}}>
          <svg width="14" height="14" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" strokeLinecap="round"/></svg>
          Create Your First Service
        </button>
      </div>
      <Divider/>
      <Footer/>
    </div>
  </div>
)}

// ─── Calendar (empty day) ────────────────
function ProviderEmptyCalendar({onMenu}){
  const days=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  return(
  <div style={{minHeight:"100%",background:t.base,display:"flex",flexDirection:"column"}}>
    <Header onMenu={onMenu}/>
    <div style={{padding:"0 24px 24px"}}><h1 style={{fontFamily:f,fontSize:"32px",fontWeight:400,letterSpacing:"-0.03em",lineHeight:1.1,color:t.ink,margin:0}}>Calendar</h1></div>
    <div style={{padding:"0 24px",flex:1,display:"flex",flexDirection:"column"}}>
      {/* Month nav */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"20px"}}>
        <button style={{width:"32px",height:"32px",borderRadius:"50%",border:"1px solid "+t.line,background:"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><svg width="16" height="16" fill="none" stroke={t.ink} strokeWidth="2" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
        <span style={{fontFamily:f,fontSize:"17px",fontWeight:500,color:t.ink}}>March 2026</span>
        <button style={{width:"32px",height:"32px",borderRadius:"50%",border:"1px solid "+t.line,background:"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><svg width="16" height="16" fill="none" stroke={t.ink} strokeWidth="2" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:"0",marginBottom:"4px"}}>{days.map(d=><div key={d} style={{textAlign:"center",fontFamily:f,fontSize:"11px",fontWeight:500,color:t.faded,padding:"4px 0",letterSpacing:"0.03em"}}>{d}</div>)}</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:"2px",marginBottom:"24px"}}>
        {Array.from({length:6}).map((_,i)=><div key={"e"+i}/>)}
        {Array.from({length:31}).map((_,i)=>{const day=i+1;const isToday=day===19;return(
          <button key={day} style={{width:"100%",aspectRatio:"1",borderRadius:"50%",border:"none",background:isToday?t.ink:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:0}}>
            <span style={{fontFamily:f,fontSize:"14px",fontWeight:isToday?500:400,color:isToday?"#fff":t.ink}}>{day}</span>
          </button>
        )})}
      </div>
      <Divider/>
      <Lbl style={{margin:"16px 0 12px"}}>Wed, Mar 19</Lbl>
      <div style={{padding:"32px 0",textAlign:"center"}}>
        <p style={{fontFamily:f,fontSize:"15px",color:t.muted,margin:"0 0 6px"}}>Nothing scheduled today.</p>
        <p style={{fontFamily:f,fontSize:"14px",color:t.accent,fontWeight:500,margin:0,cursor:"pointer"}}>+ Add availability</p>
      </div>
      <Divider/>
      <Footer/>
    </div>
  </div>
);}

// ─── Messages (empty) ────────────────────
function ProviderEmptyMessages({onMenu}){return(
  <div style={{minHeight:"100%",background:t.base,display:"flex",flexDirection:"column"}}>
    <Header onMenu={onMenu}/>
    <div style={{padding:"0 24px 24px"}}><h1 style={{fontFamily:f,fontSize:"32px",fontWeight:400,letterSpacing:"-0.03em",lineHeight:1.1,color:t.ink,margin:0}}>Messages</h1></div>
    <div style={{padding:"0 24px",flex:1,display:"flex",flexDirection:"column"}}>
      <Divider/>
      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 0"}}>
        {/* Two overlapping chat shapes */}
        <div style={{position:"relative",width:"120px",height:"90px",marginBottom:"28px"}}>
          <div style={{position:"absolute",left:"0",top:"0",width:"72px",height:"56px",borderRadius:"20px 20px 4px 20px",background:t.hero,transform:"rotate(-3deg)"}}/>
          <div style={{position:"absolute",right:"0",bottom:"0",width:"72px",height:"56px",borderRadius:"20px 20px 20px 4px",background:t.avatarBg,transform:"rotate(3deg)"}}>
            <div style={{display:"flex",gap:"4px",alignItems:"center",justifyContent:"center",height:"100%",paddingTop:"4px"}}>
              <div style={{width:"6px",height:"6px",borderRadius:"50%",background:t.faded}}/><div style={{width:"6px",height:"6px",borderRadius:"50%",background:t.faded,opacity:0.6}}/><div style={{width:"6px",height:"6px",borderRadius:"50%",background:t.faded,opacity:0.3}}/>
            </div>
          </div>
        </div>
        <p style={{fontFamily:f,fontSize:"20px",fontWeight:400,letterSpacing:"-0.02em",color:t.ink,margin:"0 0 8px",textAlign:"center"}}>The best conversations<br/>haven't started yet.</p>
        <p style={{fontFamily:f,fontSize:"14px",color:t.muted,margin:0,textAlign:"center",lineHeight:1.6,maxWidth:"280px"}}>When clients connect with you, this is where you'll coordinate sessions, share updates, and keep the relationship going.</p>
      </div>
      <Divider/>
      <Footer/>
    </div>
  </div>
)}

// ─── Earnings (empty) ────────────────────
function ProviderEmptyEarnings({onMenu}){return(
  <div style={{minHeight:"100%",background:t.base,display:"flex",flexDirection:"column"}}>
    <Header onMenu={onMenu}/>
    <HeroCard style={{minHeight:"180px"}}>
      <div>
        <HeroPill>March 2026</HeroPill>
        <Lbl color={t.muted} style={{marginBottom:"4px"}}>Total This Month</Lbl>
        <span style={{fontFamily:f,fontSize:"48px",fontWeight:400,letterSpacing:"-0.05em",lineHeight:0.9,color:t.faded}}>$0</span>
      </div>
    </HeroCard>
    <div style={{padding:"32px 24px 0",flex:1,display:"flex",flexDirection:"column"}}>
      <Divider/>
      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"32px 0"}}>
        <div style={{display:"flex",gap:"4px",alignItems:"flex-end",marginBottom:"20px"}}>
          {[20,35,15,40,28,48].map((h,i)=><div key={i} style={{width:"20px",height:h+"px",borderRadius:"4px 4px 2px 2px",background:i===5?t.hero:t.avatarBg}}/>)}
        </div>
        <p style={{fontFamily:f,fontSize:"20px",fontWeight:400,letterSpacing:"-0.02em",color:t.ink,margin:"0 0 8px",textAlign:"center"}}>Your first dollar<br/>is coming.</p>
        <p style={{fontFamily:f,fontSize:"14px",color:t.muted,margin:0,textAlign:"center",lineHeight:1.6,maxWidth:"280px"}}>Once clients start booking and paying, your revenue, breakdowns, and payout schedule will all show up here.</p>
      </div>
      <Divider/>
      <Footer/>
    </div>
  </div>
)}

// ─── Invoices (empty) ───────────────────
function ProviderEmptyInvoices({onMenu}){return(
  <div style={{minHeight:"100%",background:t.base,display:"flex",flexDirection:"column"}}>
    <Header onMenu={onMenu}/>
    <div style={{padding:"0 24px 24px"}}>
      <Lbl style={{marginBottom:"6px"}}>0 invoices</Lbl>
      <h1 style={{fontFamily:f,fontSize:"32px",fontWeight:400,letterSpacing:"-0.03em",lineHeight:1.1,color:t.ink,margin:0}}>Invoices</h1>
    </div>
    <div style={{padding:"0 24px",flex:1,display:"flex",flexDirection:"column"}}>
      <Divider/>
      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 0"}}>
        <div style={{width:"72px",height:"72px",borderRadius:"20px",background:t.avatarBg,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:"20px"}}>
          <svg width="32" height="32" fill="none" stroke={t.faded} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <p style={{fontFamily:f,fontSize:"20px",fontWeight:400,letterSpacing:"-0.02em",color:t.ink,margin:"0 0 8px",textAlign:"center"}}>No invoices yet.</p>
        <p style={{fontFamily:f,fontSize:"14px",color:t.muted,margin:0,textAlign:"center",lineHeight:1.6,maxWidth:"280px"}}>Invoices are generated automatically when you mark a session as complete. They'll show your business name — not Kliques.</p>
      </div>
      <Divider/>
      <Footer/>
    </div>
  </div>
)}

// ═══════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════
export default function ProviderEmptyStatesApp(){
  const [view,setView]=useState("dashboard");
  const noop=()=>{};
  const screens=[
    {id:"dashboard",l:"Dashboard",comp:<ProviderEmptyDashboard onMenu={noop}/>},
    {id:"bookings",l:"Bookings",comp:<ProviderEmptyBookings onMenu={noop}/>},
    {id:"kliques",l:"My Kliques",comp:<ProviderEmptyKliques onMenu={noop}/>},
    {id:"services",l:"Services",comp:<ProviderEmptyServices onMenu={noop}/>},
    {id:"calendar",l:"Calendar",comp:<ProviderEmptyCalendar onMenu={noop}/>},
    {id:"messages",l:"Messages",comp:<ProviderEmptyMessages onMenu={noop}/>},
    {id:"earnings",l:"Earnings",comp:<ProviderEmptyEarnings onMenu={noop}/>},
    {id:"invoices",l:"Invoices",comp:<ProviderEmptyInvoices onMenu={noop}/>},
  ];
  return(
    <div style={{padding:"1rem 0 2rem",minHeight:"100vh",background:"#EDE6DD"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&display=swap');*{box-sizing:border-box;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}button:active{transform:scale(0.98)}::-webkit-scrollbar{display:none}`}</style>
      <div style={{display:"flex",flexWrap:"wrap",justifyContent:"center",gap:"4px",marginBottom:"1.25rem",padding:"0 16px"}}>
        {screens.map(s=><button key={s.id} onClick={()=>setView(s.id)} style={{padding:"8px 14px",borderRadius:"10px",border:"none",fontFamily:f,fontSize:"12px",fontWeight:view===s.id?600:400,background:view===s.id?t.ink:t.avatarBg,color:view===s.id?"#fff":t.muted,cursor:"pointer",letterSpacing:"0.02em"}}>{s.l}</button>)}
      </div>
      <div style={{display:"flex",justifyContent:"center"}}><Phone>{screens.find(s=>s.id===view).comp}</Phone></div>
    </div>
  );
}
