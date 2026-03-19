import { useState } from "react";

// ═══════════════════════════════════════════
// DESIGN TOKENS
// ═══════════════════════════════════════════
const t = {
  bg:"#F2F2F7",fg:"#0D1619",muted:"#6B7280",accent:"#FF751F",
  accentLight:"#FFF0E6",ctaBg:"#0D1619",ctaText:"#FFFFFF",
  ctaDisabled:"#B0B0B0",divider:"#E5E5EA",surface:"#FFFFFF",
  callout:"#FFF9E6",success:"#22C55E",successLight:"#F0FDF4",
  warning:"#F5A623",border:"#D1D5DB",borderLight:"#E5E7EB",
  dangerLight:"#FEF2F2",danger:"#EF4444",card:"#FFFFFF",
  gradTop:"#D45400",gradMid:"#E87020",gradBot:"#F2F2F7",
};
const f = "'Manrope',system-ui,sans-serif";
const grad = `linear-gradient(180deg, ${t.gradTop} 0%, ${t.gradMid} 40%, #F09050 65%, #F5C4A0 82%, ${t.gradBot} 100%)`;

// ═══════════════════════════════════════════
// SHARED COMPONENTS
// ═══════════════════════════════════════════
function Phone({children}) {
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"1rem",width:"100%",maxWidth:"420px"}}>
      <div style={{width:"100%",maxWidth:"390px",height:"844px",borderRadius:"44px",background:t.bg,border:"1px solid #D1D1D6",overflow:"hidden",position:"relative",boxShadow:"0 20px 60px -15px rgba(0,0,0,0.15)"}}>
        <div style={{height:"54px",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 32px",fontSize:"15px",fontWeight:600,color:"#fff",fontFamily:f,position:"relative",zIndex:10}}>
          <span>9:41</span>
          <div style={{position:"absolute",top:"12px",left:"50%",transform:"translateX(-50%)",width:"126px",height:"34px",borderRadius:"17px",background:"#000"}}/>
          <div style={{display:"flex",gap:"5px",alignItems:"center"}}>
            <svg width="17" height="12" viewBox="0 0 17 12"><rect x="0" y="4" width="3" height="8" rx="1" fill="#fff"/><rect x="4.5" y="2.5" width="3" height="9.5" rx="1" fill="#fff"/><rect x="9" y="1" width="3" height="11" rx="1" fill="#fff"/><rect x="13.5" y="0" width="3" height="12" rx="1" fill="#fff"/></svg>
            <svg width="25" height="12" viewBox="0 0 25 12"><rect x="0" y="1" width="22" height="10" rx="2.5" stroke="#fff" strokeWidth="1" fill="none"/><rect x="23" y="3.5" width="2" height="5" rx="1" fill="#fff" opacity="0.4"/><rect x="1.5" y="2.5" width="16" height="7" rx="1.5" fill="#fff"/></svg>
          </div>
        </div>
        <div style={{height:"calc(100% - 54px)",overflow:"hidden",position:"relative"}}>{children}</div>
      </div>
    </div>
  );
}

function Avatar({initials,size=44,bg="#fff3",color="#fff"}){return(
  <div style={{width:size,height:size,borderRadius:"50%",background:bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:f,fontSize:size*0.32,fontWeight:700,color,flexShrink:0,backdropFilter:"blur(10px)",border:"1px solid rgba(255,255,255,0.3)"}}>{initials}</div>
)}

function Card({children,style={},onClick}){return(
  <div onClick={onClick} style={{background:t.card,borderRadius:"16px",padding:"16px",marginBottom:"12px",boxShadow:"0 1px 3px rgba(0,0,0,0.04)",cursor:onClick?"pointer":"default",...style}}>{children}</div>
)}

function Logo({size=18,color=t.accent}){return(
  <span style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:size+"px",fontWeight:700,color,letterSpacing:"-0.5px"}}>kliques</span>
)}

function Footer(){return(
  <div style={{padding:"32px 20px 40px",marginTop:"auto"}}>
    <div style={{display:"flex",justifyContent:"center",marginBottom:"12px"}}><Logo size={18} color={t.muted}/></div>
    <div style={{display:"flex",justifyContent:"center",gap:"16px",marginBottom:"12px",flexWrap:"wrap"}}>
      {["About","Terms","Privacy","Support"].map(link=>(
        <span key={link} style={{fontFamily:f,fontSize:"13px",color:t.muted,cursor:"pointer",fontWeight:500}}>{link}</span>
      ))}
    </div>
    <p style={{fontFamily:f,fontSize:"11px",color:"#C7C7CC",margin:0,textAlign:"center"}}>© 2026 Kliques. All rights reserved.</p>
  </div>
)}

function MenuBtn({onClick}){return(
  <button onClick={onClick} style={{background:"none",border:"none",cursor:"pointer",padding:"8px",margin:"-8px",display:"flex"}} aria-label="Open menu">
    <svg width="24" height="24" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round"/></svg>
  </button>
)}

function GradientHeader({onMenu,title,subtitle,right,children}){return(
  <div style={{background:grad,padding:"0 20px",paddingBottom:"48px",borderRadius:"0 0 28px 28px",marginBottom:"-20px",position:"relative",zIndex:1}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px",paddingTop:"4px"}}>
      <MenuBtn onClick={onMenu}/>
      <Logo size={20} color="#fff"/>
      {right||<div style={{width:"40px"}}/>}
    </div>
    {title&&<h1 style={{fontFamily:f,fontSize:"30px",fontWeight:700,color:"#fff",margin:"0 0 4px"}}>{title}</h1>}
    {subtitle&&<p style={{fontFamily:f,fontSize:"15px",color:"rgba(255,255,255,0.8)",margin:0}}>{subtitle}</p>}
    {children}
  </div>
)}

// ═══════════════════════════════════════════
// SHARE LINKS COMPONENT (Provider persistent section)
// ═══════════════════════════════════════════
function ShareLinksSection({handle="annywong"}){
  const [copied,setCopied]=useState(null);
  const [showQR,setShowQR]=useState(null);
  const bookingUrl=`mykliques.com/book/${handle}`;
  const inviteUrl=`mykliques.com/join/${handle}`;

  const copyLink=(type,url)=>{
    setCopied(type);
    setTimeout(()=>setCopied(null),2000);
  };

  // Simple QR code placeholder (in production, use a QR library)
  const QRPlaceholder=({url})=>(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"20px 0"}}>
      <div style={{width:"160px",height:"160px",borderRadius:"16px",background:t.bg,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:"12px",border:"1px solid "+t.divider}}>
        <svg width="120" height="120" viewBox="0 0 120 120">
          {/* Simplified QR pattern */}
          <rect x="10" y="10" width="30" height="30" rx="4" fill={t.fg}/>
          <rect x="15" y="15" width="20" height="20" rx="2" fill={t.card}/>
          <rect x="20" y="20" width="10" height="10" rx="1" fill={t.fg}/>
          <rect x="80" y="10" width="30" height="30" rx="4" fill={t.fg}/>
          <rect x="85" y="15" width="20" height="20" rx="2" fill={t.card}/>
          <rect x="90" y="20" width="10" height="10" rx="1" fill={t.fg}/>
          <rect x="10" y="80" width="30" height="30" rx="4" fill={t.fg}/>
          <rect x="15" y="85" width="20" height="20" rx="2" fill={t.card}/>
          <rect x="20" y="90" width="10" height="10" rx="1" fill={t.fg}/>
          {/* Center logo area */}
          <rect x="45" y="45" width="30" height="30" rx="6" fill={t.accent}/>
          <text x="60" y="64" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="700" fontFamily="'Playfair Display',Georgia,serif">k</text>
          {/* Data modules */}
          {[48,56,64,72].map(x=>[48,56,64,72].map(y=>(x>42&&x<78&&y>42&&y<78)?null:<rect key={x+"-"+y} x={x} y={y} width="6" height="6" rx="1" fill={t.fg} opacity={Math.random()>0.4?"1":"0.15"}/>))}
        </svg>
      </div>
      <p style={{fontFamily:f,fontSize:"13px",color:t.muted,margin:"0 0 8px",textAlign:"center"}}>{url}</p>
      <button onClick={()=>setShowQR(null)} style={{padding:"8px 20px",borderRadius:"9999px",border:"1px solid "+t.divider,background:t.card,fontFamily:f,fontSize:"13px",fontWeight:600,color:t.fg,cursor:"pointer"}}>Close</button>
    </div>
  );

  return(
    <Card style={{padding:"0",overflow:"hidden"}}>
      <div style={{padding:"16px 16px 12px"}}>
        <p style={{fontFamily:f,fontSize:"16px",fontWeight:700,color:t.fg,margin:"0 0 4px"}}>Share your links</p>
        <p style={{fontFamily:f,fontSize:"13px",color:t.muted,margin:"0 0 16px",lineHeight:1.5}}>Invite clients to connect or book directly with you.</p>

        {/* Booking link */}
        <div style={{padding:"14px",borderRadius:"12px",background:t.bg,marginBottom:"10px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px"}}>
            <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
              <div style={{width:"28px",height:"28px",borderRadius:"8px",background:t.accentLight,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <svg width="14" height="14" fill="none" stroke={t.accent} strokeWidth="2" viewBox="0 0 24 24"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <span style={{fontFamily:f,fontSize:"14px",fontWeight:600,color:t.fg}}>Booking link</span>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:"6px",padding:"10px 12px",borderRadius:"10px",background:t.card,border:"1px solid "+t.divider,marginBottom:"10px"}}>
            <svg width="14" height="14" fill="none" stroke={t.muted} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span style={{fontFamily:f,fontSize:"13px",color:t.muted,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{bookingUrl}</span>
          </div>
          <div style={{display:"flex",gap:"8px"}}>
            <button onClick={()=>copyLink("booking",bookingUrl)} style={{flex:1,padding:"10px",borderRadius:"10px",border:"none",background:copied==="booking"?t.successLight:t.ctaBg,color:copied==="booking"?"#15803D":t.ctaText,fontFamily:f,fontSize:"13px",fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"6px"}}>
              {copied==="booking"?<><svg width="14" height="14" fill="none" stroke="#15803D" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg>Copied</>:<><svg width="14" height="14" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/></svg>Copy</>}
            </button>
            <button onClick={()=>setShowQR(showQR==="booking"?null:"booking")} style={{padding:"10px 14px",borderRadius:"10px",border:"1px solid "+t.divider,background:t.card,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <svg width="16" height="16" fill="none" stroke={t.fg} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM17 14v3h3m-3-6h3v3m-6 3h3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <button style={{padding:"10px 14px",borderRadius:"10px",border:"1px solid "+t.divider,background:t.card,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <svg width="16" height="16" fill="none" stroke={t.fg} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
          {showQR==="booking"&&<QRPlaceholder url={bookingUrl}/>}
        </div>

        {/* Invite link */}
        <div style={{padding:"14px",borderRadius:"12px",background:t.bg}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px"}}>
            <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
              <div style={{width:"28px",height:"28px",borderRadius:"8px",background:t.successLight,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <svg width="14" height="14" fill="none" stroke={t.success} strokeWidth="2" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M8.5 3a4 4 0 100 8 4 4 0 000-8zM20 8v6m3-3h-6" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <span style={{fontFamily:f,fontSize:"14px",fontWeight:600,color:t.fg}}>Invite link</span>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:"6px",padding:"10px 12px",borderRadius:"10px",background:t.card,border:"1px solid "+t.divider,marginBottom:"10px"}}>
            <svg width="14" height="14" fill="none" stroke={t.muted} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span style={{fontFamily:f,fontSize:"13px",color:t.muted,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{inviteUrl}</span>
          </div>
          <div style={{display:"flex",gap:"8px"}}>
            <button onClick={()=>copyLink("invite",inviteUrl)} style={{flex:1,padding:"10px",borderRadius:"10px",border:"none",background:copied==="invite"?t.successLight:t.ctaBg,color:copied==="invite"?"#15803D":t.ctaText,fontFamily:f,fontSize:"13px",fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"6px"}}>
              {copied==="invite"?<><svg width="14" height="14" fill="none" stroke="#15803D" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg>Copied</>:<><svg width="14" height="14" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/></svg>Copy</>}
            </button>
            <button onClick={()=>setShowQR(showQR==="invite"?null:"invite")} style={{padding:"10px 14px",borderRadius:"10px",border:"1px solid "+t.divider,background:t.card,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <svg width="16" height="16" fill="none" stroke={t.fg} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM17 14v3h3m-3-6h3v3m-6 3h3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <button style={{padding:"10px 14px",borderRadius:"10px",border:"1px solid "+t.divider,background:t.card,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <svg width="16" height="16" fill="none" stroke={t.fg} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
          {showQR==="invite"&&<QRPlaceholder url={inviteUrl}/>}
        </div>
      </div>
      <div style={{padding:"12px 16px",borderTop:"0.5px solid "+t.divider,background:t.bg,borderRadius:"0 0 16px 16px"}}>
        <p style={{fontFamily:f,fontSize:"12px",color:t.muted,margin:0,textAlign:"center"}}>Clients who book or accept your invite will appear in My kliques</p>
      </div>
    </Card>
  );
}

// ═══════════════════════════════════════════
// CLIENT EMPTY STATES
// ═══════════════════════════════════════════

function ClientEmptyKliques({onMenu}){return(
  <div style={{height:"100%",background:t.bg,overflowY:"auto",display:"flex",flexDirection:"column"}}>
    <GradientHeader onMenu={onMenu} title="My kliques" subtitle="Your relationships" right={<Avatar initials="ET" size={36}/>}/>
    <div style={{padding:"32px 16px 0",flex:1,display:"flex",flexDirection:"column"}}>
      <Card style={{textAlign:"center",padding:"40px 24px"}}>
        <div style={{width:"72px",height:"72px",borderRadius:"50%",background:t.accentLight,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}>
          <svg width="32" height="32" fill="none" stroke={t.accent} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <p style={{fontFamily:f,fontSize:"20px",fontWeight:700,color:t.fg,margin:"0 0 8px"}}>No connections yet</p>
        <p style={{fontFamily:f,fontSize:"15px",color:t.muted,margin:"0 0 24px",lineHeight:1.6}}>When you book with a provider or accept an invite, they'll show up here. Your history, notes, and bookings — all in one place.</p>
        <button style={{padding:"14px 28px",borderRadius:"12px",border:"none",background:t.ctaBg,color:t.ctaText,fontFamily:f,fontSize:"15px",fontWeight:700,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:"8px"}}>
          <svg width="16" height="16" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Find a provider
        </button>
      </Card>

      <Card style={{background:t.callout,display:"flex",gap:"14px",alignItems:"flex-start"}}>
        <div style={{width:"36px",height:"36px",borderRadius:"10px",background:"#FDE68A",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          <svg width="18" height="18" fill="none" stroke="#92400E" strokeWidth="2" viewBox="0 0 24 24"><path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <div>
          <p style={{fontFamily:f,fontSize:"15px",fontWeight:600,color:t.fg,margin:"0 0 4px"}}>Got an invite link?</p>
          <p style={{fontFamily:f,fontSize:"14px",color:t.muted,margin:0,lineHeight:1.5}}>If a provider sent you a link, tap it to connect and start building your history together.</p>
        </div>
      </Card>
    <Footer/></div>
  </div>
)}

function ClientEmptyMessages({onMenu}){return(
  <div style={{height:"100%",background:t.bg,overflowY:"auto",display:"flex",flexDirection:"column"}}>
    <GradientHeader onMenu={onMenu} title="Messages"/>
    <div style={{padding:"32px 16px 0",flex:1,display:"flex",flexDirection:"column"}}>
      <Card style={{textAlign:"center",padding:"40px 24px"}}>
        <div style={{width:"72px",height:"72px",borderRadius:"50%",background:t.accentLight,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}>
          <svg width="32" height="32" fill="none" stroke={t.accent} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <p style={{fontFamily:f,fontSize:"20px",fontWeight:700,color:t.fg,margin:"0 0 8px"}}>No messages yet</p>
        <p style={{fontFamily:f,fontSize:"15px",color:t.muted,margin:0,lineHeight:1.6}}>When you connect with a provider, you can message them here about bookings, questions, or updates.</p>
      </Card>
    <Footer/></div>
  </div>
)}

// ═══════════════════════════════════════════
// PROVIDER EMPTY STATES
// ═══════════════════════════════════════════

function ProviderEmptyDashboard({onMenu}){return(
  <div style={{height:"100%",background:t.bg,overflowY:"auto",display:"flex",flexDirection:"column"}}>
    <GradientHeader onMenu={onMenu} right={<Avatar initials="AW" size={36}/>}>
      <p style={{fontFamily:f,fontSize:"14px",color:"rgba(255,255,255,0.7)",margin:"12px 0 2px"}}>Wednesday, Mar 19</p>
      <h1 style={{fontFamily:f,fontSize:"28px",fontWeight:700,color:"#fff",margin:"0 0 16px"}}>Hi, Anny</h1>
      <div style={{display:"flex",gap:"10px"}}>{[{l:"Today",v:"0",s:"bookings"},{l:"This week",v:"$0",s:"—"}].map(s=><div key={s.l} style={{flex:1,padding:"14px 12px",borderRadius:"12px",background:"rgba(255,255,255,0.2)",backdropFilter:"blur(10px)"}}><p style={{fontFamily:f,fontSize:"12px",color:"rgba(255,255,255,0.7)",margin:"0 0 6px"}}>{s.l}</p><p style={{fontFamily:f,fontSize:"22px",fontWeight:700,color:"#fff",margin:"0 0 2px"}}>{s.v}</p><p style={{fontFamily:f,fontSize:"12px",color:"rgba(255,255,255,0.9)",fontWeight:600,margin:0}}>{s.s}</p></div>)}</div>
    </GradientHeader>
    <div style={{padding:"32px 16px 0",flex:1,display:"flex",flexDirection:"column"}}>

      {/* Share links — always visible */}
      <ShareLinksSection handle="annywong"/>

      {/* Empty schedule */}
      <p style={{fontFamily:f,fontSize:"18px",fontWeight:700,color:t.fg,margin:"8px 4px 14px"}}>Today's schedule</p>
      <Card style={{textAlign:"center",padding:"32px 24px"}}>
        <div style={{width:"56px",height:"56px",borderRadius:"50%",background:t.bg,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px"}}>
          <svg width="24" height="24" fill="none" stroke={t.muted} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <p style={{fontFamily:f,fontSize:"16px",fontWeight:600,color:t.fg,margin:"0 0 4px"}}>No bookings today</p>
        <p style={{fontFamily:f,fontSize:"14px",color:t.muted,margin:0,lineHeight:1.5}}>Share your booking link to start getting clients.</p>
      </Card>
    <Footer/></div>
  </div>
)}

function ProviderEmptyBookings({onMenu}){return(
  <div style={{height:"100%",background:t.bg,overflowY:"auto",display:"flex",flexDirection:"column"}}>
    <GradientHeader onMenu={onMenu} title="Bookings" subtitle="0 pending"/>
    <div style={{padding:"32px 16px 0",flex:1,display:"flex",flexDirection:"column"}}>
      <Card style={{textAlign:"center",padding:"32px 24px"}}>
        <div style={{width:"56px",height:"56px",borderRadius:"50%",background:t.successLight,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px"}}>
          <svg width="28" height="28" fill="none" stroke={t.success} strokeWidth="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <p style={{fontFamily:f,fontSize:"17px",fontWeight:600,color:t.fg,margin:"0 0 4px"}}>No pending bookings</p>
        <p style={{fontFamily:f,fontSize:"14px",color:t.muted,margin:0,lineHeight:1.5}}>When clients book with you, their requests will appear here for you to accept.</p>
      </Card>
    <Footer/></div>
  </div>
)}

function ProviderEmptyKliques({onMenu}){return(
  <div style={{height:"100%",background:t.bg,overflowY:"auto",display:"flex",flexDirection:"column"}}>
    <GradientHeader onMenu={onMenu} title="My kliques" subtitle="0 clients"/>
    <div style={{padding:"32px 16px 0",flex:1,display:"flex",flexDirection:"column"}}>
      <Card style={{textAlign:"center",padding:"32px 24px"}}>
        <div style={{width:"72px",height:"72px",borderRadius:"50%",background:t.accentLight,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}>
          <svg width="32" height="32" fill="none" stroke={t.accent} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <p style={{fontFamily:f,fontSize:"20px",fontWeight:700,color:t.fg,margin:"0 0 8px"}}>No clients yet</p>
        <p style={{fontFamily:f,fontSize:"15px",color:t.muted,margin:0,lineHeight:1.6}}>When clients accept your invite or book with you, they'll appear here with their full history.</p>
      </Card>
    <Footer/></div>
  </div>
)}

function ProviderEmptyServices({onMenu}){return(
  <div style={{height:"100%",background:t.bg,overflowY:"auto",display:"flex",flexDirection:"column"}}>
    <GradientHeader onMenu={onMenu} title="Services" subtitle="0 services" right={<button style={{padding:"8px 14px",borderRadius:"10px",border:"none",background:"rgba(255,255,255,0.25)",backdropFilter:"blur(10px)",color:"#fff",fontFamily:f,fontSize:"13px",fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:"4px"}}><svg width="14" height="14" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" strokeLinecap="round"/></svg>Add</button>}/>
    <div style={{padding:"32px 16px 0",flex:1,display:"flex",flexDirection:"column"}}>
      <Card style={{textAlign:"center",padding:"40px 24px"}}>
        <div style={{width:"72px",height:"72px",borderRadius:"50%",background:t.accentLight,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}>
          <svg width="32" height="32" fill="none" stroke={t.accent} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <p style={{fontFamily:f,fontSize:"20px",fontWeight:700,color:t.fg,margin:"0 0 8px"}}>Add your first service</p>
        <p style={{fontFamily:f,fontSize:"15px",color:t.muted,margin:"0 0 24px",lineHeight:1.6}}>Set up the services you offer — name, duration, price, and how you'd like to collect payment.</p>
        <button style={{padding:"14px 28px",borderRadius:"12px",border:"none",background:t.ctaBg,color:t.ctaText,fontFamily:f,fontSize:"15px",fontWeight:700,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:"8px"}}>
          <svg width="16" height="16" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" strokeLinecap="round"/></svg>
          Create service
        </button>
      </Card>
    <Footer/></div>
  </div>
)}

function ProviderEmptyCalendar({onMenu}){return(
  <div style={{height:"100%",background:t.bg,overflowY:"auto",display:"flex",flexDirection:"column"}}>
    <GradientHeader onMenu={onMenu} title="Calendar"/>
    <div style={{padding:"32px 16px 0",flex:1,display:"flex",flexDirection:"column"}}>
      {/* Calendar card still shows the grid — just no bookings */}
      <Card>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px"}}>
          <button style={{width:"32px",height:"32px",borderRadius:"50%",border:"1px solid "+t.divider,background:t.bg,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><svg width="16" height="16" fill="none" stroke={t.fg} strokeWidth="2" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
          <span style={{fontFamily:f,fontSize:"17px",fontWeight:700,color:t.fg}}>March 2026</span>
          <button style={{width:"32px",height:"32px",borderRadius:"50%",border:"1px solid "+t.divider,background:t.bg,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><svg width="16" height="16" fill="none" stroke={t.fg} strokeWidth="2" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:"0",marginBottom:"4px"}}>
          {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d=><div key={d} style={{textAlign:"center",fontFamily:f,fontSize:"12px",fontWeight:600,color:t.muted,padding:"4px 0"}}>{d}</div>)}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:"2px"}}>
          {/* Empty first row offset (March 2026 starts on Sunday = 6 offset for Mon-start) */}
          {Array.from({length:6}).map((_,i)=><div key={"e"+i}/>)}
          {Array.from({length:31}).map((_,i)=>{const day=i+1;const isToday=day===19;return(
            <button key={day} style={{width:"100%",aspectRatio:"1",borderRadius:"50%",border:"none",background:isToday?t.accent:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:0,outline:isToday?"none":"none"}}>
              <span style={{fontFamily:f,fontSize:"14px",fontWeight:isToday?700:400,color:isToday?"#fff":t.fg}}>{day}</span>
            </button>
          )})}
        </div>
      </Card>

      <p style={{fontFamily:f,fontSize:"16px",fontWeight:700,color:t.fg,margin:"4px 4px 12px"}}>Wednesday, Mar 19</p>
      <Card style={{textAlign:"center",padding:"32px 24px"}}>
        <div style={{width:"48px",height:"48px",borderRadius:"50%",background:t.bg,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px"}}>
          <svg width="24" height="24" fill="none" stroke={t.muted} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <p style={{fontFamily:f,fontSize:"15px",color:t.muted,margin:"0 0 4px"}}>No bookings this day</p>
        <p style={{fontFamily:f,fontSize:"14px",color:t.accent,fontWeight:600,cursor:"pointer",margin:0}}>+ Add availability</p>
      </Card>
    <Footer/></div>
  </div>
)}

function ProviderEmptyMessages({onMenu}){return(
  <div style={{height:"100%",background:t.bg,overflowY:"auto",display:"flex",flexDirection:"column"}}>
    <GradientHeader onMenu={onMenu} title="Messages"/>
    <div style={{padding:"32px 16px 0",flex:1,display:"flex",flexDirection:"column"}}>
      <Card style={{textAlign:"center",padding:"32px 24px"}}>
        <div style={{width:"72px",height:"72px",borderRadius:"50%",background:t.accentLight,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}>
          <svg width="32" height="32" fill="none" stroke={t.accent} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <p style={{fontFamily:f,fontSize:"20px",fontWeight:700,color:t.fg,margin:"0 0 8px"}}>No conversations yet</p>
        <p style={{fontFamily:f,fontSize:"15px",color:t.muted,margin:0,lineHeight:1.6}}>When clients connect with you, you can message them here about bookings, questions, or updates.</p>
      </Card>
    <Footer/></div>
  </div>
)}

function ProviderEmptyEarnings({onMenu}){return(
  <div style={{height:"100%",background:t.bg,overflowY:"auto",display:"flex",flexDirection:"column"}}>
    <GradientHeader onMenu={onMenu} title="Earnings" subtitle="March 2026">
      <div style={{marginTop:"16px",padding:"16px",borderRadius:"12px",background:"rgba(255,255,255,0.2)",backdropFilter:"blur(10px)"}}>
        <p style={{fontFamily:f,fontSize:"13px",color:"rgba(255,255,255,0.7)",margin:"0 0 4px"}}>Total this month</p>
        <span style={{fontFamily:f,fontSize:"36px",fontWeight:700,color:"#fff"}}>$0</span>
      </div>
    </GradientHeader>
    <div style={{padding:"32px 16px 0",flex:1,display:"flex",flexDirection:"column"}}>
      <Card style={{textAlign:"center",padding:"32px 24px"}}>
        <div style={{width:"56px",height:"56px",borderRadius:"50%",background:t.bg,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px"}}>
          <svg width="28" height="28" fill="none" stroke={t.muted} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <p style={{fontFamily:f,fontSize:"17px",fontWeight:600,color:t.fg,margin:"0 0 4px"}}>No earnings yet</p>
        <p style={{fontFamily:f,fontSize:"14px",color:t.muted,margin:0,lineHeight:1.5}}>Your earnings will appear here once clients start booking and paying for your services.</p>
      </Card>
    <Footer/></div>
  </div>
)}


// ═══════════════════════════════════════════
// MAIN APP — Toggle between empty states
// ═══════════════════════════════════════════
export default function EmptyStatesApp(){
  const [view,setView]=useState("c_kliques");
  const noop=()=>{};

  const screens={
    c_kliques:{label:"Client: My kliques",comp:<ClientEmptyKliques onMenu={noop}/>},
    c_messages:{label:"Client: Messages",comp:<ClientEmptyMessages onMenu={noop}/>},
    p_dashboard:{label:"Provider: Dashboard",comp:<ProviderEmptyDashboard onMenu={noop}/>},
    p_bookings:{label:"Provider: Bookings",comp:<ProviderEmptyBookings onMenu={noop}/>},
    p_kliques:{label:"Provider: My kliques",comp:<ProviderEmptyKliques onMenu={noop}/>},
    p_services:{label:"Provider: Services",comp:<ProviderEmptyServices onMenu={noop}/>},
    p_calendar:{label:"Provider: Calendar",comp:<ProviderEmptyCalendar onMenu={noop}/>},
    p_messages:{label:"Provider: Messages",comp:<ProviderEmptyMessages onMenu={noop}/>},
    p_earnings:{label:"Provider: Earnings",comp:<ProviderEmptyEarnings onMenu={noop}/>},
  };

  return(
    <div style={{padding:"1rem 0 2rem",minHeight:"100vh",background:"#E5E5EA"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Playfair+Display:wght@700&display=swap');*{box-sizing:border-box;-webkit-font-smoothing:antialiased}button:active{transform:scale(0.98)}::-webkit-scrollbar{display:none}`}</style>
      <div style={{display:"flex",flexWrap:"wrap",justifyContent:"center",gap:"4px",marginBottom:"1.25rem",padding:"0 16px"}}>
        {Object.entries(screens).map(([id,{label}])=>(
          <button key={id} onClick={()=>setView(id)} style={{padding:"8px 14px",borderRadius:"10px",border:"none",fontFamily:f,fontSize:"12px",fontWeight:view===id?700:500,background:view===id?"#fff":"#D1D1D6",color:view===id?t.fg:t.muted,cursor:"pointer",boxShadow:view===id?"0 1px 3px rgba(0,0,0,0.08)":"none"}}>{label}</button>
        ))}
      </div>
      <div style={{display:"flex",justifyContent:"center"}}>
        <Phone>{screens[view].comp}</Phone>
      </div>
    </div>
  );
}
