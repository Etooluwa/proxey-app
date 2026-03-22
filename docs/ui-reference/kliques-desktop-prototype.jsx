import { useState, useRef, useEffect } from "react";

// ═══════════════════════════════════════════
// DESIGN TOKENS
// ═══════════════════════════════════════════
const t = {
  base:"#FBF7F2",ink:"#3D231E",muted:"#8C6A64",faded:"#B0948F",
  accent:"#C25E4A",hero:"#FDDCC6",avatarBg:"#F2EBE5",
  line:"rgba(140,106,100,0.18)",success:"#5A8A5E",successBg:"#EBF2EC",
  callout:"#FFF5E6",card:"#FFFFFF",sidebar:"#F5EFE8",dangerBg:"#FDEDEA",
};
const f = "'Sora',system-ui,sans-serif";
const topoSvg = `url("data:image/svg+xml,%3Csvg width='400' height='400' viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 200 Q 100 100 200 200 T 400 200' stroke='%233D231E' stroke-width='0.5' fill='none'/%3E%3Cpath d='M-50 250 Q 50 150 150 250 T 350 250' stroke='%233D231E' stroke-width='0.5' fill='none'/%3E%3Cpath d='M50 150 Q 150 50 250 150 T 450 150' stroke='%233D231E' stroke-width='0.5' fill='none'/%3E%3Cpath d='M0 300 Q 100 200 200 300 T 400 300' stroke='%233D231E' stroke-width='0.5' fill='none'/%3E%3C/svg%3E")`;

// ═══════════════════════════════════════════
// SHARED COMPONENTS
// ═══════════════════════════════════════════
function Lbl({children,color=t.muted,style={}}){return <span style={{fontFamily:f,fontSize:"11px",fontWeight:500,color,letterSpacing:"0.05em",textTransform:"uppercase",display:"block",...style}}>{children}</span>}
function Avatar({initials,size=38}){return <div style={{width:size,height:size,borderRadius:"50%",background:t.avatarBg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:f,fontSize:size*0.34,fontWeight:500,color:t.muted,flexShrink:0}}>{initials}</div>}
function Divider(){return <div style={{height:"1px",background:t.line}}/>}
function ArrowIcon({size=16}){return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={t.accent} strokeWidth="2"><path d="M7 17L17 7M17 7H7M17 7V17" strokeLinecap="round" strokeLinejoin="round"/></svg>}

function HeroCard({children,onClick,style={}}){return(
  <div onClick={onClick} style={{background:t.hero,borderRadius:"24px",padding:"32px",position:"relative",overflow:"hidden",minHeight:"200px",display:"flex",flexDirection:"column",justifyContent:"space-between",cursor:onClick?"pointer":"default",...style}}>
    <div style={{position:"absolute",inset:0,backgroundImage:topoSvg,backgroundSize:"cover",opacity:0.12,pointerEvents:"none"}}/>
    <div style={{position:"relative",zIndex:1,display:"flex",flexDirection:"column",justifyContent:"space-between",flex:1}}>{children}</div>
  </div>
)}

// ═══════════════════════════════════════════
// DESKTOP SIDEBAR
// ═══════════════════════════════════════════
function DesktopSidebar({items,active,onNav,userName,userInitials,isProvider}){
  return(
    <div style={{width:"260px",position:"fixed",left:0,top:0,bottom:0,zIndex:10,background:t.sidebar,borderRight:"1px solid "+t.line,display:"flex",flexDirection:"column"}}>
      <div style={{padding:"28px 28px 8px"}}>
        <p style={{fontFamily:"'Playfair Display',serif",fontSize:"22px",fontWeight:500,color:t.accent,letterSpacing:"-0.02em",margin:0}}>kliques</p>
        <p style={{fontFamily:f,fontSize:"11px",color:t.faded,margin:"4px 0 0",letterSpacing:"0.03em"}}>Relationship OS</p>
      </div>
      <div style={{margin:"16px",padding:"14px 16px",background:t.base,borderRadius:"14px",display:"flex",alignItems:"center",gap:"12px"}}>
        <Avatar initials={userInitials} size={38}/>
        <div>
          <p style={{fontFamily:f,fontSize:"14px",fontWeight:500,color:t.ink,margin:0}}>{userName}</p>
          <Lbl color={t.faded} style={{fontSize:"10px",marginTop:"2px"}}>{isProvider?"Provider":"Client"}</Lbl>
        </div>
      </div>
      <nav style={{flex:1,padding:"0 8px",overflowY:"auto"}}>
        {items.map(item=>(
          <button key={item.id} onClick={()=>onNav(item.id)} style={{
            display:"flex",alignItems:"center",justifyContent:"space-between",
            padding:"12px 20px",margin:"2px 0",width:"100%",borderRadius:"10px",
            background:active===item.id?"rgba(194,94,74,0.08)":"transparent",
            border:"none",cursor:"pointer",fontFamily:f,fontSize:"13px",
            fontWeight:active===item.id?600:400,color:active===item.id?t.accent:t.muted,
            letterSpacing:"0.01em",transition:"all 0.15s",textAlign:"left",
          }}>
            <span>{item.label}</span>
            {item.count&&<span style={{fontSize:"11px",fontWeight:600,color:"#fff",background:t.accent,borderRadius:"9999px",padding:"2px 8px",lineHeight:"16px"}}>{item.count}</span>}
          </button>
        ))}
      </nav>
      <div style={{padding:"16px 24px",borderTop:"1px solid "+t.line}}>
        <button style={{display:"flex",alignItems:"center",gap:"10px",padding:"10px 0",background:"none",border:"none",cursor:"pointer",fontFamily:f,fontSize:"12px",color:t.faded}}>
          <svg width="16" height="16" fill="none" stroke={t.faded} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Sign Out
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// DESKTOP HEADER + NOTIFICATION DROPDOWN
// ═══════════════════════════════════════════
function DesktopHeader({title,subtitle,notifCount,onNotifNavigate}){
  const [notifOpen,setNotifOpen]=useState(false);
  const ref=useRef(null);
  useEffect(()=>{
    const handler=e=>{if(ref.current&&!ref.current.contains(e.target))setNotifOpen(false)};
    document.addEventListener("mousedown",handler);return()=>document.removeEventListener("mousedown",handler);
  },[]);

  const notifs=[
    {id:1,type:"booking",title:"New booking request",body:"Emma Wilson · 1-on-1 Vocal Lesson",time:"5m ago",unread:true,initials:"EW",nav:"bookings"},
    {id:2,type:"connected",title:"New client connected",body:"David Park accepted your invite",time:"2h ago",unread:true,initials:"DP",nav:"clients"},
    {id:3,type:"completed",title:"Session completed · Invoice #AW-0046",body:"Kai Thompson",time:"1d ago",unread:false,initials:"KT",nav:"invoices"},
  ];
  const badgeColors={booking:t.accent,connected:t.success,completed:t.success};

  return(
    <header style={{padding:"24px 40px 20px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:"1px solid "+t.line,position:"sticky",top:0,background:t.base,zIndex:5}}>
      <div>
        {subtitle&&<Lbl style={{marginBottom:"4px"}}>{subtitle}</Lbl>}
        <h1 style={{fontFamily:f,fontSize:"26px",fontWeight:400,letterSpacing:"-0.03em",color:t.ink,margin:0}}>{title}</h1>
      </div>
      <div ref={ref} style={{position:"relative"}}>
        <button onClick={()=>setNotifOpen(!notifOpen)} style={{position:"relative",padding:"8px",borderRadius:"10px",background:t.avatarBg,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <svg width="20" height="20" fill="none" stroke={t.ink} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" strokeLinecap="round" strokeLinejoin="round"/></svg>
          {notifCount>0&&<div style={{position:"absolute",top:"6px",right:"6px",width:"8px",height:"8px",borderRadius:"50%",background:t.accent}}/>}
        </button>
        {notifOpen&&<div style={{position:"absolute",top:"calc(100% + 8px)",right:0,width:"380px",background:t.card,borderRadius:"16px",border:"1px solid "+t.line,boxShadow:"0 12px 40px rgba(61,35,30,0.1)",zIndex:20,overflow:"hidden"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"20px 20px 12px"}}>
            <span style={{fontFamily:f,fontSize:"16px",fontWeight:500}}>Notifications</span>
            <Lbl color={t.accent} style={{cursor:"pointer",margin:0}}>Mark all read</Lbl>
          </div>
          <Divider/>
          {notifs.map(n=>(
            <div key={n.id}>
              <button onClick={()=>{onNotifNavigate(n.nav);setNotifOpen(false)}} style={{display:"flex",gap:"12px",padding:"16px 20px",width:"100%",textAlign:"left",background:n.unread?"rgba(194,94,74,0.02)":"transparent",border:"none",cursor:"pointer",fontFamily:f}}>
                <div style={{position:"relative",flexShrink:0}}>
                  <Avatar initials={n.initials} size={32}/>
                  <div style={{position:"absolute",bottom:"-2px",right:"-2px",width:"18px",height:"18px",borderRadius:"50%",background:badgeColors[n.type],display:"flex",alignItems:"center",justifyContent:"center",border:"2px solid "+t.card}}>
                    <svg width="9" height="9" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                </div>
                <div style={{flex:1}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                    <span style={{fontSize:"13px",fontWeight:n.unread?500:400,color:t.ink}}>{n.title}</span>
                    {n.unread&&<div style={{width:"7px",height:"7px",borderRadius:"50%",background:t.accent,flexShrink:0,marginTop:"4px"}}/>}
                  </div>
                  <p style={{fontSize:"12px",color:t.muted,margin:"2px 0 0"}}>{n.body}</p>
                  <span style={{fontSize:"10px",color:t.faded,marginTop:"4px",display:"block"}}>{n.time}</span>
                </div>
              </button>
              <div style={{padding:"0 20px"}}><Divider/></div>
            </div>
          ))}
          <button onClick={()=>{onNotifNavigate("bookings");setNotifOpen(false)}} style={{width:"100%",padding:"14px",fontFamily:f,fontSize:"13px",fontWeight:500,color:t.ink,textAlign:"center",border:"none",cursor:"pointer",background:"transparent"}}>View All Notifications</button>
        </div>}
      </div>
    </header>
  );
}

// ═══════════════════════════════════════════
// APPOINTMENT DRAWER (slides from right)
// ═══════════════════════════════════════════
function AppointmentDrawer({open,onClose,appointment,onNavigate}){
  if(!appointment)return null;
  const a=appointment;
  return(
    <>
      {open&&<div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(61,35,30,0.2)",zIndex:30}}/>}
      <div style={{position:"fixed",top:0,right:open?0:-500,width:"480px",height:"100vh",background:t.base,zIndex:31,boxShadow:"-8px 0 40px rgba(61,35,30,0.1)",overflowY:"auto",transition:"right 0.35s cubic-bezier(0.4,0,0.2,1)"}}>
        <div style={{padding:"28px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"24px"}}>
            <Lbl>Appointment Detail</Lbl>
            <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",padding:"4px"}}><svg width="24" height="24" fill="none" stroke={t.ink} strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/></svg></button>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:"16px",marginBottom:"20px"}}>
            <Avatar initials={a.initials} size={44}/>
            <div>
              <p style={{fontFamily:f,fontSize:"20px",fontWeight:400,letterSpacing:"-0.02em",color:t.ink,margin:0}}>{a.name}</p>
              <p style={{fontFamily:f,fontSize:"13px",color:t.muted,margin:"4px 0 0"}}>Client since Jan 2025</p>
            </div>
          </div>
          <div style={{display:"inline-flex",padding:"6px 12px",borderRadius:"9999px",background:t.hero,marginBottom:"20px"}}><Lbl color={t.accent} style={{fontSize:"10px",margin:0}}>Confirmed</Lbl></div>
          <Divider/>
          <div style={{padding:"20px 0"}}>
            <p style={{fontFamily:f,fontSize:"18px",fontWeight:400,letterSpacing:"-0.02em",color:t.ink,margin:0}}>Wed, Mar 19 at {a.time}</p>
            <p style={{fontFamily:f,fontSize:"14px",color:t.muted,margin:"6px 0 0"}}>{a.duration} · {a.service} · $85</p>
          </div>
          <Divider/>
          <div style={{padding:"20px 0"}}>
            <Lbl style={{marginBottom:"8px"}}>Payment Status</Lbl>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:"6px"}}><span style={{fontFamily:f,fontSize:"14px",color:t.muted}}>Deposit paid</span><span style={{fontFamily:f,fontSize:"14px",fontWeight:500,color:t.ink}}>$26</span></div>
            <div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontFamily:f,fontSize:"14px",color:t.muted}}>Remaining</span><span style={{fontFamily:f,fontSize:"14px",fontWeight:500,color:t.accent}}>$59</span></div>
          </div>
          <Divider/>
          <div style={{padding:"20px 0"}}>
            <Lbl style={{marginBottom:"8px"}}>Notes From Last Session</Lbl>
            <div style={{padding:"14px 16px",background:t.avatarBg,borderRadius:"12px"}}>
              <p style={{fontFamily:f,fontSize:"14px",color:t.ink,margin:0,lineHeight:1.6,fontStyle:"italic"}}>"Worked on breath control and upper range."</p>
            </div>
          </div>
          <Divider/>
          <div style={{padding:"20px 0"}}>
            <Lbl style={{marginBottom:"8px"}}>Session Notes</Lbl>
            <textarea placeholder="How did this session go?" rows={3} style={{width:"100%",padding:"14px 16px",borderRadius:"12px",border:"1px solid "+t.line,fontFamily:f,fontSize:"13px",color:t.ink,resize:"vertical",outline:"none",background:t.avatarBg,boxSizing:"border-box"}}/>
          </div>
          <div style={{display:"flex",gap:"10px"}}>
            <button onClick={()=>{onNavigate("messages");onClose()}} style={{flex:1,padding:"12px 24px",borderRadius:"12px",border:"1px solid "+t.line,background:"transparent",fontFamily:f,fontSize:"13px",fontWeight:500,color:t.ink,cursor:"pointer"}}>Message</button>
            <button style={{flex:2,padding:"12px 24px",borderRadius:"12px",border:"none",background:t.ink,color:"#fff",fontFamily:f,fontSize:"13px",fontWeight:500,cursor:"pointer"}}>Mark Complete</button>
          </div>
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════
// SHARE LINKS (desktop version)
// ═══════════════════════════════════════════
function DesktopShareLinks({handle="annywong"}){
  const [copied,setCopied]=useState(null);
  const doCopy=(type)=>{setCopied(type);setTimeout(()=>setCopied(null),2000)};
  const CopyBtn=({type})=><button onClick={()=>doCopy(type)} style={{flex:1,padding:"10px",borderRadius:"10px",border:"none",background:copied===type?t.successBg:t.ink,color:copied===type?t.success:"#fff",fontFamily:f,fontSize:"12px",fontWeight:500,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"5px"}}>
    {copied===type?<><svg width="13" height="13" fill="none" stroke={t.success} strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg>Copied</>:<><svg width="13" height="13" fill="none" stroke="#fff" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/></svg>Copy</>}
  </button>;
  const IconBtn=({children})=><button style={{padding:"10px 14px",borderRadius:"10px",border:"1px solid "+t.line,background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>{children}</button>;
  const qrIcon=<svg width="16" height="16" fill="none" stroke={t.ink} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM17 14v3h3m-3-6h3v3m-6 3h3" strokeLinecap="round" strokeLinejoin="round"/></svg>;
  const shareIcon=<svg width="16" height="16" fill="none" stroke={t.ink} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" strokeLinecap="round" strokeLinejoin="round"/></svg>;
  const linkIcon=<svg width="14" height="14" fill="none" stroke={t.muted} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" strokeLinecap="round" strokeLinejoin="round"/></svg>;

  return(
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"16px",marginTop:"28px"}}>
      <div style={{padding:"24px",borderRadius:"18px",background:t.hero,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",inset:0,backgroundImage:topoSvg,backgroundSize:"cover",opacity:0.08,pointerEvents:"none"}}/>
        <div style={{position:"relative",zIndex:1}}>
          <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"8px"}}>
            <svg width="16" height="16" fill="none" stroke={t.accent} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M8.5 3a4 4 0 100 8 4 4 0 000-8zM20 8v6m3-3h-6" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span style={{fontFamily:f,fontSize:"12px",fontWeight:500,color:t.ink}}>INVITE LINK</span>
          </div>
          <p style={{fontFamily:f,fontSize:"13px",color:t.muted,margin:"0 0 12px",lineHeight:1.5}}>Send to clients to join your klique instantly.</p>
          <div style={{display:"flex",alignItems:"center",gap:"6px",padding:"10px 12px",borderRadius:"10px",background:"rgba(255,255,255,0.6)",border:"1px solid rgba(61,35,30,0.08)",fontSize:"12px",color:t.muted,fontFamily:f}}>{linkIcon}<span style={{flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>mykliques.com/join/{handle}</span></div>
          <div style={{display:"flex",gap:"6px",marginTop:"10px"}}><CopyBtn type="invite"/><IconBtn>{qrIcon}</IconBtn><IconBtn>{shareIcon}</IconBtn></div>
        </div>
      </div>
      <div style={{padding:"24px",borderRadius:"18px",background:t.avatarBg}}>
        <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"8px"}}>
          <svg width="16" height="16" fill="none" stroke={t.accent} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <span style={{fontFamily:f,fontSize:"12px",fontWeight:500,color:t.ink}}>BOOKING LINK</span>
        </div>
        <p style={{fontFamily:f,fontSize:"13px",color:t.muted,margin:"0 0 12px",lineHeight:1.5}}>Your public page — clients see your profile and book.</p>
        <div style={{display:"flex",alignItems:"center",gap:"6px",padding:"10px 12px",borderRadius:"10px",background:"#fff",border:"1px solid "+t.line,fontSize:"12px",color:t.muted,fontFamily:f}}>{linkIcon}<span style={{flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>mykliques.com/book/{handle}</span></div>
        <div style={{display:"flex",gap:"6px",marginTop:"10px"}}><CopyBtn type="booking"/><IconBtn>{qrIcon}</IconBtn><IconBtn>{shareIcon}</IconBtn></div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// DESKTOP DASHBOARD
// ═══════════════════════════════════════════
function DeskDashboard({onNavigate,onOpenAppt}){
  const sched=[
    {name:"Sarah M.",service:"Vocal Coaching",duration:"60 min",time:"10:00 AM",initials:"SM",fullName:"Sarah Mitchell"},
    {name:"Kai T.",service:"Audition Prep",duration:"45 min",time:"1:30 PM",initials:"KT",fullName:"Kai Thompson"},
    {name:"Lisa R.",service:"Vocal Coaching",duration:"60 min",time:"4:00 PM",initials:"LR",fullName:"Lisa Rivera"},
  ];
  return(
    <div style={{padding:"32px 40px"}}>
      {/* Hero + Stats */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"20px",marginBottom:"28px"}}>
        <HeroCard onClick={()=>onOpenAppt(sched[0])}>
          <div>
            <div style={{display:"inline-flex",alignItems:"center",gap:"6px",padding:"6px 12px",border:"1px solid rgba(61,35,30,0.1)",borderRadius:"9999px",background:"rgba(255,255,255,0.3)",backdropFilter:"blur(4px)",marginBottom:"16px"}}>
              <span style={{width:"6px",height:"6px",borderRadius:"50%",background:t.accent}}/>
              <Lbl color={t.ink} style={{fontSize:"11px",margin:0}}>Thursday · Mar 19</Lbl>
            </div>
            <h2 style={{fontFamily:f,fontSize:"28px",fontWeight:400,letterSpacing:"-0.03em",lineHeight:1.15,color:t.ink,margin:0}}>Good morning,<br/>Anny</h2>
          </div>
          <div>
            <Divider/>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:"12px"}}>
              <p style={{fontFamily:f,fontSize:"14px",color:t.muted,margin:0}}>Up Next: Sarah M. · Vocal Coaching</p>
              <ArrowIcon/>
            </div>
          </div>
        </HeroCard>

        <div style={{display:"grid",gridTemplateRows:"1fr 1fr",gap:"16px"}}>
          <button onClick={()=>onNavigate("earnings")} style={{background:t.card,borderRadius:"20px",border:"1px solid "+t.line,padding:"24px",display:"flex",flexDirection:"column",justifyContent:"space-between",cursor:"pointer",textAlign:"left",transition:"transform 0.15s,box-shadow 0.2s"}} onMouseOver={e=>e.currentTarget.style.transform="translateY(-2px)"} onMouseOut={e=>e.currentTarget.style.transform="translateY(0)"}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><Lbl>Weekly Earnings</Lbl><ArrowIcon/></div>
            <div style={{display:"flex",alignItems:"end",gap:"8px"}}><ArrowIcon size={28}/><span style={{fontFamily:f,fontSize:"40px",fontWeight:400,letterSpacing:"-0.04em",lineHeight:0.9,color:t.accent}}>$840</span></div>
          </button>
          <button onClick={()=>onNavigate("clients")} style={{background:t.card,borderRadius:"20px",border:"1px solid "+t.line,padding:"24px",display:"flex",flexDirection:"column",justifyContent:"space-between",cursor:"pointer",textAlign:"left",transition:"transform 0.15s,box-shadow 0.2s"}} onMouseOver={e=>e.currentTarget.style.transform="translateY(-2px)"} onMouseOut={e=>e.currentTarget.style.transform="translateY(0)"}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><Lbl>New Clients This Week</Lbl><ArrowIcon/></div>
            <span style={{fontFamily:f,fontSize:"40px",fontWeight:400,letterSpacing:"-0.04em",lineHeight:0.9,color:t.accent}}>3</span>
          </button>
        </div>
      </div>

      {/* Schedule */}
      <div style={{background:t.card,borderRadius:"20px",border:"1px solid "+t.line,padding:"28px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px"}}>
          <Lbl>Today's Schedule</Lbl>
          <button onClick={()=>onNavigate("calendar")} style={{background:"none",border:"none",cursor:"pointer"}}><Lbl color={t.accent} style={{cursor:"pointer"}}>View Calendar →</Lbl></button>
        </div>
        <Divider/>
        {sched.map(u=>(
          <div key={u.name}>
            <button onClick={()=>onOpenAppt(u)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"18px 0",width:"100%",background:"none",border:"none",cursor:"pointer",textAlign:"left",fontFamily:f}}>
              <div style={{display:"flex",alignItems:"center",gap:"16px"}}><Avatar initials={u.initials}/><div><p style={{fontSize:"15px",color:t.ink,margin:"0 0 2px"}}>{u.name}</p><p style={{fontSize:"13px",color:t.muted,margin:0}}>{u.service} · {u.duration}</p></div></div>
              <div style={{display:"flex",alignItems:"center",gap:"12px"}}><span style={{fontSize:"14px",color:t.ink}}>{u.time}</span><ArrowIcon/></div>
            </button>
            <Divider/>
          </div>
        ))}
      </div>

      {/* Share Links */}
      <DesktopShareLinks handle="annywong"/>
    </div>
  );
}

// ═══════════════════════════════════════════
// PLACEHOLDER SCREENS (reference only — each maps to a full page in the mobile prototype)
// ═══════════════════════════════════════════
function PlaceholderScreen({title,subtitle}){return(
  <div style={{padding:"32px 40px"}}><div style={{background:t.card,borderRadius:"20px",border:"1px solid "+t.line,padding:"48px",textAlign:"center"}}>
    <p style={{fontFamily:f,fontSize:"22px",fontWeight:400,color:t.ink,margin:"0 0 8px"}}>{title}</p>
    {subtitle&&<p style={{fontFamily:f,fontSize:"14px",color:t.muted,margin:0}}>{subtitle}</p>}
    <p style={{fontFamily:f,fontSize:"13px",color:t.faded,margin:"16px 0 0"}}>See the mobile prototype for the full design of this screen.</p>
  </div></div>
)}

// ═══════════════════════════════════════════
// MAIN DESKTOP APP
// ═══════════════════════════════════════════
const menuItems=[
  {id:"dashboard",label:"Home"},{id:"bookings",label:"Bookings",count:"2"},{id:"clients",label:"My Kliques"},
  {id:"services",label:"Services"},{id:"calendar",label:"Calendar"},{id:"messages",label:"Messages"},
  {id:"earnings",label:"Earnings"},{id:"invoices",label:"Invoices"},{id:"profile",label:"Profile"},
];
const titles={dashboard:"Dashboard",bookings:"Bookings",clients:"My Kliques",services:"Services",calendar:"Calendar",messages:"Messages",earnings:"Earnings",invoices:"Invoices",profile:"Profile"};
const subs={dashboard:"Welcome back, Anny",bookings:"2 pending requests",clients:"4 clients",services:"6 services · 2 groups",calendar:"March 2026",messages:"3 conversations",earnings:"March 2026",invoices:"5 invoices",profile:""};

export default function KliquesDesktop(){
  const [screen,setScreen]=useState("dashboard");
  const [drawerOpen,setDrawerOpen]=useState(false);
  const [drawerAppt,setDrawerAppt]=useState(null);

  const openAppt=(appt)=>{setDrawerAppt({name:appt.fullName||appt.name,initials:appt.initials,time:appt.time,service:appt.service,duration:appt.duration});setDrawerOpen(true)};

  const renderScreen=()=>{
    switch(screen){
      case "dashboard": return <DeskDashboard onNavigate={setScreen} onOpenAppt={openAppt}/>;
      case "bookings": return <PlaceholderScreen title="Bookings" subtitle="2 pending requests"/>;
      case "clients": return <PlaceholderScreen title="My Kliques" subtitle="4 clients"/>;
      case "services": return <PlaceholderScreen title="Services" subtitle="6 services · 2 groups"/>;
      case "calendar": return <PlaceholderScreen title="Calendar" subtitle="March 2026"/>;
      case "messages": return <PlaceholderScreen title="Messages" subtitle="3 conversations"/>;
      case "earnings": return <PlaceholderScreen title="Earnings" subtitle="$3,400 this month"/>;
      case "invoices": return <PlaceholderScreen title="Invoices" subtitle="5 invoices"/>;
      case "profile": return <PlaceholderScreen title="Profile" subtitle="Anny Wong · Vocal Studio"/>;
      default: return <DeskDashboard onNavigate={setScreen} onOpenAppt={openAppt}/>;
    }
  };

  return(
    <div style={{minHeight:"100vh",background:t.base}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=Playfair+Display:wght@500&display=swap');*{box-sizing:border-box;-webkit-font-smoothing:antialiased}button:active{transform:scale(0.98)}::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:${t.line};border-radius:3px}`}</style>
      <DesktopSidebar items={menuItems} active={screen} onNav={setScreen} userName="Anny Wong" userInitials="AW" isProvider/>
      <div style={{marginLeft:"260px",minHeight:"100vh"}}>
        <DesktopHeader title={titles[screen]||""} subtitle={subs[screen]||""} notifCount={2} onNotifNavigate={setScreen}/>
        {renderScreen()}
      </div>
      <AppointmentDrawer open={drawerOpen} onClose={()=>setDrawerOpen(false)} appointment={drawerAppt} onNavigate={setScreen}/>
    </div>
  );
}
