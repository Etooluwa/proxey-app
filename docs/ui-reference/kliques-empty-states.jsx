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
  callout:"#FFF5E6",
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

function MenuBtn({onClick}){return(
  <button onClick={onClick} style={{background:"none",border:"none",cursor:"pointer",padding:"4px",display:"flex",flexDirection:"column",gap:"4px",width:"20px"}}>
    <div style={{width:"20px",height:"2px",background:t.accent}}/>
    <div style={{width:"14px",height:"2px",background:t.accent}}/>
    <div style={{width:"20px",height:"2px",background:t.accent}}/>
  </button>
)}

function Header({onMenu,initials="ET"}){return(
  <header style={{padding:"32px 24px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
    <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
      <MenuBtn onClick={onMenu}/>
      <Lbl color={t.accent} style={{fontSize:"13px",fontWeight:600}}>Kliques</Lbl>
    </div>
    <Avatar initials={initials} size={36}/>
  </header>
)}

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

function Phone({children}){return(
  <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"1rem",width:"100%",maxWidth:"420px"}}>
    <div style={{width:"100%",maxWidth:"414px",height:"896px",background:t.base,position:"relative",overflow:"hidden",boxShadow:"0 0 40px rgba(61,35,30,0.05)",borderRadius:"40px",border:"1px solid "+t.line}}>
      <div style={{height:"100%",overflowY:"auto",overflowX:"hidden",position:"relative"}}>{children}</div>
    </div>
  </div>
)}

// ═══════════════════════════════════════════
// CLIENT EMPTY — MY KLIQUES
// ═══════════════════════════════════════════
function ClientEmptyKliques({onMenu}){return(
  <div style={{minHeight:"100%",background:t.base,display:"flex",flexDirection:"column"}}>
    <Header onMenu={onMenu}/>
    <div style={{padding:"0 24px 24px"}}>
      <Lbl style={{marginBottom:"6px"}}>Your relationships</Lbl>
      <h1 style={{fontFamily:f,fontSize:"32px",fontWeight:400,letterSpacing:"-0.03em",lineHeight:1.1,color:t.ink,margin:0}}>My kliques</h1>
    </div>

    <div style={{padding:"0 24px",flex:1,display:"flex",flexDirection:"column"}}>
      {/* Hero empty state card with topo texture */}
      <div style={{background:t.hero,borderRadius:"28px",padding:"32px 28px",position:"relative",overflow:"hidden",marginBottom:"20px"}}>
        <div style={{position:"absolute",inset:0,backgroundImage:topoSvg,backgroundSize:"cover",opacity:0.12,pointerEvents:"none"}}/>
        <div style={{position:"relative",zIndex:1}}>
          {/* Three ghost avatars — representing future connections */}
          <div style={{display:"flex",marginBottom:"28px"}}>
            {[0,1,2].map(i=>(
              <div key={i} style={{width:"48px",height:"48px",borderRadius:"50%",background:"rgba(255,255,255,0.5)",border:"2px solid rgba(255,255,255,0.7)",display:"flex",alignItems:"center",justifyContent:"center",marginLeft:i>0?"-12px":"0",zIndex:3-i}}>
                <svg width="20" height="20" fill="none" stroke={t.faded} strokeWidth="1.5" viewBox="0 0 24 24" opacity={1-i*0.25}><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            ))}
          </div>
          <h2 style={{fontFamily:f,fontSize:"24px",fontWeight:400,letterSpacing:"-0.02em",lineHeight:1.2,color:t.ink,margin:"0 0 10px"}}>Your circle<br/>starts here.</h2>
          <p style={{fontFamily:f,fontSize:"14px",color:t.muted,margin:0,lineHeight:1.7,maxWidth:"280px"}}>Every great relationship begins with a first step. Book with a provider or accept an invite — your shared history will live here.</p>
        </div>
      </div>

      <Divider/>

      {/* Invite link hint */}
      <div style={{padding:"20px 0",display:"flex",gap:"16px",alignItems:"flex-start"}}>
        <div style={{width:"40px",height:"40px",borderRadius:"12px",background:t.callout,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          <svg width="18" height="18" fill="none" stroke="#92400E" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <div>
          <p style={{fontFamily:f,fontSize:"15px",fontWeight:500,color:t.ink,margin:"0 0 4px"}}>Got an invite?</p>
          <p style={{fontFamily:f,fontSize:"14px",color:t.muted,margin:0,lineHeight:1.6}}>Tap the link your provider sent you. One tap and you're connected.</p>
        </div>
      </div>

      <Divider/>

      {/* How it works — editorial explanation */}
      <div style={{padding:"20px 0",display:"flex",gap:"16px",alignItems:"flex-start"}}>
        <div style={{width:"40px",height:"40px",borderRadius:"12px",background:t.avatarBg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          <svg width="18" height="18" fill="none" stroke={t.muted} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <div>
          <p style={{fontFamily:f,fontSize:"15px",fontWeight:500,color:t.ink,margin:"0 0 4px"}}>Everything in one place</p>
          <p style={{fontFamily:f,fontSize:"14px",color:t.muted,margin:0,lineHeight:1.6}}>Session history, provider notes, bookings, and messages — all tied to each relationship.</p>
        </div>
      </div>

      <Divider/>

      <div style={{padding:"20px 0",display:"flex",gap:"16px",alignItems:"flex-start"}}>
        <div style={{width:"40px",height:"40px",borderRadius:"12px",background:t.avatarBg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          <svg width="18" height="18" fill="none" stroke={t.muted} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <div>
          <p style={{fontFamily:f,fontSize:"15px",fontWeight:500,color:t.ink,margin:"0 0 4px"}}>Built around people, not transactions</p>
          <p style={{fontFamily:f,fontSize:"14px",color:t.muted,margin:0,lineHeight:1.6}}>Kliques remembers your journey with each provider so the relationship only gets better.</p>
        </div>
      </div>

      <Footer/>
    </div>
  </div>
)}

// ═══════════════════════════════════════════
// CLIENT EMPTY — MESSAGES
// ═══════════════════════════════════════════
function ClientEmptyMessages({onMenu}){return(
  <div style={{minHeight:"100%",background:t.base,display:"flex",flexDirection:"column"}}>
    <Header onMenu={onMenu}/>
    <div style={{padding:"0 24px 24px"}}>
      <h1 style={{fontFamily:f,fontSize:"32px",fontWeight:400,letterSpacing:"-0.03em",lineHeight:1.1,color:t.ink,margin:0}}>Messages</h1>
    </div>

    <div style={{padding:"0 24px",flex:1,display:"flex",flexDirection:"column"}}>
      <Divider/>

      {/* Empty state — centered, editorial */}
      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 0"}}>
        {/* Abstract chat illustration — two overlapping speech shapes */}
        <div style={{position:"relative",width:"120px",height:"90px",marginBottom:"32px"}}>
          <div style={{position:"absolute",left:"0",top:"0",width:"72px",height:"56px",borderRadius:"20px 20px 4px 20px",background:t.hero,transform:"rotate(-3deg)"}}/>
          <div style={{position:"absolute",right:"0",bottom:"0",width:"72px",height:"56px",borderRadius:"20px 20px 20px 4px",background:t.avatarBg,transform:"rotate(3deg)"}}>
            <div style={{display:"flex",gap:"4px",alignItems:"center",justifyContent:"center",height:"100%",paddingTop:"4px"}}>
              <div style={{width:"6px",height:"6px",borderRadius:"50%",background:t.faded}}/>
              <div style={{width:"6px",height:"6px",borderRadius:"50%",background:t.faded,opacity:0.6}}/>
              <div style={{width:"6px",height:"6px",borderRadius:"50%",background:t.faded,opacity:0.3}}/>
            </div>
          </div>
        </div>

        <h2 style={{fontFamily:f,fontSize:"22px",fontWeight:400,letterSpacing:"-0.02em",color:t.ink,margin:"0 0 10px",textAlign:"center"}}>Quiet in here... for now.</h2>
        <p style={{fontFamily:f,fontSize:"14px",color:t.muted,margin:0,lineHeight:1.7,textAlign:"center",maxWidth:"280px"}}>Once you're connected with a provider, this is where the conversation happens. Questions, updates, session prep — all in one thread.</p>
      </div>

      <Divider/>
      <Footer/>
    </div>
  </div>
)}

// ═══════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════
export default function EmptyStatesApp(){
  const [view,setView]=useState("kliques");
  const noop=()=>{};
  return(
    <div style={{padding:"1rem 0 2rem",minHeight:"100vh",background:"#EDE6DD"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&display=swap');*{box-sizing:border-box;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}button:active{transform:scale(0.98)}::-webkit-scrollbar{display:none}`}</style>
      <div style={{display:"flex",justifyContent:"center",gap:"8px",marginBottom:"1.25rem"}}>
        {[{id:"kliques",l:"My Kliques (empty)"},{id:"messages",l:"Messages (empty)"}].map(s=>(
          <button key={s.id} onClick={()=>setView(s.id)} style={{padding:"8px 18px",borderRadius:"10px",border:"none",fontFamily:f,fontSize:"12px",fontWeight:view===s.id?600:400,background:view===s.id?t.ink:t.avatarBg,color:view===s.id?"#fff":t.muted,cursor:"pointer",letterSpacing:"0.02em"}}>{s.l}</button>
        ))}
      </div>
      <div style={{display:"flex",justifyContent:"center"}}>
        <Phone>
          {view==="kliques"?<ClientEmptyKliques onMenu={noop}/>:<ClientEmptyMessages onMenu={noop}/>}
        </Phone>
      </div>
    </div>
  );
}
