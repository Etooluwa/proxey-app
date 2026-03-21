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

function Lbl({children,color=t.muted,style={}}){return <span style={{fontFamily:f,fontSize:"11px",fontWeight:500,color,letterSpacing:"0.05em",textTransform:"uppercase",display:"block",...style}}>{children}</span>}
function Avatar({initials,size=40}){return <div style={{width:size,height:size,borderRadius:"50%",background:t.avatarBg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:f,fontSize:size*0.3,fontWeight:500,color:t.muted,flexShrink:0}}>{initials}</div>}
function Divider(){return <div style={{height:"1px",background:t.line}}/>}
function Phone({children}){return(
  <div style={{display:"flex",flexDirection:"column",alignItems:"center",width:"100%",maxWidth:"420px"}}>
    <div style={{width:"100%",maxWidth:"414px",height:"896px",background:t.base,position:"relative",overflow:"hidden",boxShadow:"0 0 40px rgba(61,35,30,0.05)",borderRadius:"40px",border:"1px solid "+t.line}}>
      <div style={{height:"100%",overflowY:"auto",overflowX:"hidden"}}>{children}</div>
    </div>
  </div>
)}

// ═══════════════════════════════════════════
// PUBLIC BOOKING PAGE — mykliques.com/book/:handle
// ═══════════════════════════════════════════
function PublicBookingPage(){
  const [selected,setSelected]=useState([]);
  const toggle=(id)=>setSelected(prev=>prev.includes(id)?prev.filter(x=>x!==id):[...prev,id]);

  const groups=[
    {name:"Private Sessions",services:[
      {id:"s1",name:"1-on-1 Vocal Lesson",desc:"Personalized vocal training tailored to your range, technique, and goals.",dur:"60 min",price:"$85"},
      {id:"s2",name:"Performance Coaching",desc:"Stage presence, mic technique, and confidence building.",dur:"45 min",price:"$95"},
      {id:"s3",name:"Song Arrangement",desc:"Custom arrangement of any song for your vocal range.",dur:"30–60 min",price:"from $65"},
    ]},
    {name:"Group Sessions",services:[
      {id:"s4",name:"Group Class",desc:"Harmonies, ear training, and vocal exercises in a supportive group setting.",dur:"90 min",price:"$45"},
      {id:"s5",name:"Duet Workshop",desc:"Learn to blend voices and perform as a duo.",dur:"60 min",price:"$60"},
    ]},
  ];

  const reviews=[
    {name:"Sarah M.",text:"Anny completely transformed my confidence as a singer. 10 sessions in and I'm performing at open mics.",rating:5},
    {name:"Kai T.",text:"The best vocal coach I've ever worked with. Patient, knowledgeable, and genuinely cares about your progress.",rating:5},
  ];

  return(
    <div style={{minHeight:"100%",background:t.base,display:"flex",flexDirection:"column"}}>
      {/* Header */}
      <div style={{padding:"20px 24px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <Lbl color={t.accent} style={{fontSize:"13px",fontWeight:600}}>Kliques</Lbl>
        <button style={{background:"none",border:"none",cursor:"pointer",padding:"4px"}}>
          <svg width="20" height="20" fill="none" stroke={t.ink} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>

      {/* Provider hero */}
      <div style={{padding:"0 24px 32px",display:"flex",flexDirection:"column",alignItems:"center",textAlign:"center"}}>
        <div style={{width:"88px",height:"88px",borderRadius:"50%",background:t.hero,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:"16px",position:"relative"}}>
          <span style={{fontFamily:f,fontSize:"28px",fontWeight:400,color:t.ink}}>AW</span>
          <div style={{position:"absolute",bottom:"2px",right:"2px",width:"20px",height:"20px",borderRadius:"50%",background:t.success,display:"flex",alignItems:"center",justifyContent:"center",border:"2px solid "+t.base}}>
            <svg width="10" height="10" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
        </div>
        <h1 style={{fontFamily:f,fontSize:"28px",fontWeight:400,letterSpacing:"-0.03em",color:t.ink,margin:"0 0 4px"}}>Anny Wong</h1>
        <Lbl style={{marginBottom:"12px"}}>Vocal Trainer · Ottawa, ON</Lbl>
        <div style={{display:"flex",gap:"16px",marginBottom:"16px"}}>
          {[{l:"Rating",v:"4.9 ★"},{l:"Reviews",v:"127"},{l:"Clients",v:"34"}].map(s=>(
            <div key={s.l} style={{textAlign:"center"}}>
              <span style={{fontFamily:f,fontSize:"16px",fontWeight:400,letterSpacing:"-0.02em",color:t.accent}}>{s.v}</span>
              <Lbl style={{marginTop:"2px",fontSize:"10px"}}>{s.l}</Lbl>
            </div>
          ))}
        </div>
        <p style={{fontFamily:f,fontSize:"14px",color:t.muted,margin:0,lineHeight:1.7,maxWidth:"320px"}}>"Helping you find your voice — whether you're stepping on stage for the first time or refining your craft."</p>
      </div>

      <div style={{padding:"0 24px",flex:1}}>
        <Divider/>

        {/* Services grouped */}
        <Lbl style={{margin:"24px 0 16px"}}>Available Services</Lbl>
        {groups.map(group=>(
          <div key={group.name} style={{marginBottom:"8px"}}>
            <Lbl color={t.ink} style={{fontSize:"11px",fontWeight:500,padding:"8px 0"}}>{group.name}</Lbl>
            <Divider/>
            {group.services.map(s=>(
              <div key={s.id}>
                <button onClick={()=>toggle(s.id)} style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",padding:"18px 0",background:"none",border:"none",cursor:"pointer",width:"100%",textAlign:"left"}}>
                  <div style={{flex:1,paddingRight:"14px"}}>
                    <p style={{fontFamily:f,fontSize:"16px",fontWeight:400,color:t.ink,margin:"0 0 4px"}}>{s.name}</p>
                    <p style={{fontFamily:f,fontSize:"13px",color:t.muted,margin:"0 0 6px",lineHeight:1.5}}>{s.desc}</p>
                    <div style={{display:"flex",gap:"8px",alignItems:"center"}}>
                      <Lbl color={t.faded} style={{fontSize:"10px",margin:0}}>{s.dur}</Lbl>
                      <span style={{fontFamily:f,fontSize:"14px",fontWeight:500,color:t.ink}}>{s.price}</span>
                    </div>
                  </div>
                  <div style={{width:"28px",height:"28px",borderRadius:"50%",border:selected.includes(s.id)?"none":"1.5px solid "+t.line,background:selected.includes(s.id)?t.accent:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:"2px"}}>
                    {selected.includes(s.id)&&<svg width="14" height="14" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                </button>
                <Divider/>
              </div>
            ))}
          </div>
        ))}

        {/* Reviews */}
        <Lbl style={{margin:"24px 0 16px"}}>What Clients Say</Lbl>
        <Divider/>
        {reviews.map(r=>(
          <div key={r.name}>
            <div style={{padding:"18px 0"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px"}}>
                <p style={{fontFamily:f,fontSize:"14px",fontWeight:500,color:t.ink,margin:0}}>{r.name}</p>
                <span style={{fontFamily:f,fontSize:"12px",color:t.accent}}>{"★".repeat(r.rating)}</span>
              </div>
              <p style={{fontFamily:f,fontSize:"14px",color:t.muted,margin:0,lineHeight:1.6,fontStyle:"italic"}}>"{r.text}"</p>
            </div>
            <Divider/>
          </div>
        ))}

        {/* Location & details */}
        <Lbl style={{margin:"24px 0 12px"}}>Details</Lbl>
        <Divider/>
        {[{l:"Location",v:"Ottawa, ON"},{l:"Languages",v:"English, Cantonese"},{l:"Cancellation",v:"Free up to 24 hrs before"}].map(d=>(
          <div key={d.l}>
            <div style={{display:"flex",justifyContent:"space-between",padding:"14px 0"}}>
              <span style={{fontFamily:f,fontSize:"14px",color:t.muted}}>{d.l}</span>
              <span style={{fontFamily:f,fontSize:"14px",color:t.ink}}>{d.v}</span>
            </div>
            <Divider/>
          </div>
        ))}

        {/* Footer */}
        <div style={{padding:"32px 0",textAlign:"center"}}>
          <Lbl color={t.faded} style={{fontSize:"10px"}}>Powered by Kliques</Lbl>
        </div>
      </div>

      {/* Sticky book button */}
      {selected.length>0&&<div style={{position:"sticky",bottom:0,padding:"16px 24px",background:t.base,borderTop:"1px solid "+t.line,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <p style={{fontFamily:f,fontSize:"14px",fontWeight:500,color:t.ink,margin:"0 0 2px"}}>{selected.length} service{selected.length>1?"s":""}</p>
          <Lbl color={t.faded} style={{fontSize:"10px"}}>Select a time next</Lbl>
        </div>
        <button style={{padding:"14px 32px",borderRadius:"12px",border:"none",background:t.ink,color:"#fff",fontFamily:f,fontSize:"14px",fontWeight:500,cursor:"pointer"}}>Book Now</button>
      </div>}
    </div>
  );
}

// ═══════════════════════════════════════════
// INVITE ACCEPTANCE FLOW — mykliques.com/join/:code
// ═══════════════════════════════════════════
function InviteFlow(){
  const [step,setStep]=useState(1); // 1=landing, 2=signup, 3=connected

  // ─── Step 1: Invite landing ────────────
  if(step===1) return(
    <div style={{minHeight:"100%",background:t.base,display:"flex",flexDirection:"column"}}>
      {/* Minimal header */}
      <div style={{padding:"20px 24px",textAlign:"center"}}>
        <Lbl color={t.accent} style={{fontSize:"13px",fontWeight:600}}>Kliques</Lbl>
      </div>

      {/* Provider card with topo texture */}
      <div style={{margin:"0 16px 28px",background:t.hero,borderRadius:"28px",padding:"32px 28px",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",inset:0,backgroundImage:topoSvg,backgroundSize:"cover",opacity:0.12,pointerEvents:"none"}}/>
        <div style={{position:"relative",zIndex:1,display:"flex",flexDirection:"column",alignItems:"center",textAlign:"center"}}>
          <div style={{width:"80px",height:"80px",borderRadius:"50%",background:"rgba(255,255,255,0.5)",border:"2px solid rgba(255,255,255,0.7)",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:"16px",boxShadow:"0 4px 16px rgba(61,35,30,0.08)"}}>
            <span style={{fontFamily:f,fontSize:"26px",fontWeight:400,color:t.ink}}>AW</span>
          </div>
          <h1 style={{fontFamily:f,fontSize:"24px",fontWeight:400,letterSpacing:"-0.02em",color:t.ink,margin:"0 0 4px"}}>Anny Wong</h1>
          <p style={{fontFamily:f,fontSize:"14px",color:t.muted,margin:"0 0 8px"}}>Vocal Trainer · Ottawa, ON</p>
          <div style={{display:"flex",gap:"12px"}}>
            <span style={{fontFamily:f,fontSize:"13px",color:t.accent}}>4.9 ★</span>
            <span style={{fontFamily:f,fontSize:"13px",color:t.faded}}>·</span>
            <span style={{fontFamily:f,fontSize:"13px",color:t.muted}}>127 reviews</span>
          </div>
        </div>
      </div>

      <div style={{padding:"0 24px",flex:1,display:"flex",flexDirection:"column"}}>
        <h2 style={{fontFamily:f,fontSize:"22px",fontWeight:400,letterSpacing:"-0.02em",color:t.ink,margin:"0 0 12px",lineHeight:1.3}}>Anny invited you to join her klique.</h2>
        <p style={{fontFamily:f,fontSize:"15px",color:t.muted,margin:"0 0 28px",lineHeight:1.7}}>Accept to build a lasting relationship — your session history, notes, and bookings will all live in one place.</p>

        <Divider/>

        {/* What you get */}
        {[
          {icon:<svg width="16" height="16" fill="none" stroke={t.accent} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/></svg>,title:"Your history, always saved",desc:"Every session, note, and recommendation in one timeline."},
          {icon:<svg width="16" height="16" fill="none" stroke={t.accent} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/></svg>,title:"Easy booking & payment",desc:"Book sessions and pay securely, all through the platform."},
          {icon:<svg width="16" height="16" fill="none" stroke={t.accent} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" strokeLinecap="round" strokeLinejoin="round"/></svg>,title:"Direct communication",desc:"Message your provider anytime — questions, updates, or session prep."},
        ].map(item=>(
          <div key={item.title}>
            <div style={{display:"flex",gap:"14px",padding:"18px 0",alignItems:"flex-start"}}>
              <div style={{width:"36px",height:"36px",borderRadius:"10px",background:t.hero,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{item.icon}</div>
              <div>
                <p style={{fontFamily:f,fontSize:"15px",fontWeight:500,color:t.ink,margin:"0 0 3px"}}>{item.title}</p>
                <p style={{fontFamily:f,fontSize:"13px",color:t.muted,margin:0,lineHeight:1.5}}>{item.desc}</p>
              </div>
            </div>
            <Divider/>
          </div>
        ))}

        <div style={{marginTop:"auto",padding:"28px 0 20px"}}>
          <button onClick={()=>setStep(2)} style={{width:"100%",padding:"16px",borderRadius:"12px",border:"none",background:t.ink,color:"#fff",fontFamily:f,fontSize:"14px",fontWeight:500,cursor:"pointer",marginBottom:"12px"}}>Accept Invite</button>
          <button style={{width:"100%",padding:"14px",borderRadius:"12px",border:"none",background:"transparent",fontFamily:f,fontSize:"14px",fontWeight:500,color:t.accent,cursor:"pointer",textAlign:"center"}}>I already have an account</button>
        </div>

        <div style={{padding:"16px 0",textAlign:"center"}}><Lbl color={t.faded} style={{fontSize:"10px"}}>Powered by Kliques</Lbl></div>
      </div>
    </div>
  );

  // ─── Step 2: Quick signup ──────────────
  if(step===2) return(
    <div style={{minHeight:"100%",background:t.base,display:"flex",flexDirection:"column"}}>
      <div style={{padding:"20px 24px",display:"flex",alignItems:"center",gap:"12px"}}>
        <button onClick={()=>setStep(1)} style={{background:"none",border:"none",cursor:"pointer",padding:"4px",display:"flex"}}><svg width="24" height="24" fill="none" stroke={t.ink} strokeWidth="2" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
        <Lbl color={t.accent} style={{fontSize:"13px",fontWeight:600}}>Kliques</Lbl>
      </div>

      <div style={{padding:"0 24px",flex:1,display:"flex",flexDirection:"column"}}>
        <h1 style={{fontFamily:f,fontSize:"28px",fontWeight:400,letterSpacing:"-0.03em",color:t.ink,margin:"0 0 8px"}}>Create your account</h1>
        <p style={{fontFamily:f,fontSize:"15px",color:t.muted,margin:"0 0 32px",lineHeight:1.6}}>Just a few details and you'll be connected with Anny Wong.</p>

        <Lbl style={{marginBottom:"8px"}}>Full Name</Lbl>
        <input placeholder="Your name" style={{width:"100%",padding:"14px 16px",borderRadius:"12px",border:"1px solid "+t.line,fontFamily:f,fontSize:"14px",color:t.ink,outline:"none",background:t.avatarBg,marginBottom:"20px",boxSizing:"border-box"}}/>

        <Lbl style={{marginBottom:"8px"}}>Email</Lbl>
        <input type="email" placeholder="you@email.com" style={{width:"100%",padding:"14px 16px",borderRadius:"12px",border:"1px solid "+t.line,fontFamily:f,fontSize:"14px",color:t.ink,outline:"none",background:t.avatarBg,marginBottom:"20px",boxSizing:"border-box"}}/>

        <Lbl style={{marginBottom:"8px"}}>Phone Number</Lbl>
        <input type="tel" placeholder="+1 (555) 000-0000" style={{width:"100%",padding:"14px 16px",borderRadius:"12px",border:"1px solid "+t.line,fontFamily:f,fontSize:"14px",color:t.ink,outline:"none",background:t.avatarBg,marginBottom:"8px",boxSizing:"border-box"}}/>
        <p style={{fontFamily:f,fontSize:"12px",color:t.faded,margin:"0 0 32px"}}>We'll send you a login link — no password needed.</p>

        <div style={{marginTop:"auto",padding:"0 0 32px"}}>
          <button onClick={()=>setStep(3)} style={{width:"100%",padding:"16px",borderRadius:"12px",border:"none",background:t.ink,color:"#fff",fontFamily:f,fontSize:"14px",fontWeight:500,cursor:"pointer"}}>Create Account & Connect</button>
        </div>
      </div>
    </div>
  );

  // ─── Step 3: Connected ─────────────────
  return(
    <div style={{minHeight:"100%",background:t.base,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px"}}>
      {/* Connection icon — two avatars linked */}
      <div style={{display:"flex",alignItems:"center",marginBottom:"32px"}}>
        <div style={{width:"64px",height:"64px",borderRadius:"50%",background:t.avatarBg,display:"flex",alignItems:"center",justifyContent:"center",border:"2px solid "+t.base,zIndex:2}}>
          <span style={{fontFamily:f,fontSize:"20px",fontWeight:400,color:t.muted}}>ET</span>
        </div>
        <div style={{width:"32px",height:"2px",background:t.accent,margin:"0 -4px",zIndex:1}}/>
        <div style={{width:"64px",height:"64px",borderRadius:"50%",background:t.hero,display:"flex",alignItems:"center",justifyContent:"center",border:"2px solid "+t.base,zIndex:2}}>
          <span style={{fontFamily:f,fontSize:"20px",fontWeight:400,color:t.ink}}>AW</span>
        </div>
      </div>

      <h1 style={{fontFamily:f,fontSize:"28px",fontWeight:400,letterSpacing:"-0.03em",color:t.ink,margin:"0 0 8px",textAlign:"center"}}>You're connected.</h1>
      <p style={{fontFamily:f,fontSize:"15px",color:t.muted,margin:"0 0 12px",textAlign:"center",lineHeight:1.6}}>You and Anny Wong are now part of each other's klique.</p>
      <p style={{fontFamily:f,fontSize:"14px",color:t.muted,margin:"0 0 40px",textAlign:"center",lineHeight:1.6}}>Your shared history starts here — every session, note, and milestone will build over time.</p>

      {/* Connection confirmation card */}
      <div style={{width:"100%",padding:"20px",background:t.avatarBg,borderRadius:"16px",display:"flex",alignItems:"center",gap:"14px",marginBottom:"40px"}}>
        <div style={{width:"48px",height:"48px",borderRadius:"50%",background:t.hero,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          <span style={{fontFamily:f,fontSize:"16px",fontWeight:400,color:t.ink}}>AW</span>
        </div>
        <div style={{flex:1}}>
          <p style={{fontFamily:f,fontSize:"15px",fontWeight:500,color:t.ink,margin:"0 0 2px"}}>Anny Wong</p>
          <p style={{fontFamily:f,fontSize:"12px",color:t.muted,margin:0}}>Vocal Trainer · Connected just now</p>
        </div>
        <div style={{padding:"4px 10px",borderRadius:"9999px",background:t.successBg}}>
          <Lbl color={t.success} style={{fontSize:"10px",margin:0}}>Connected</Lbl>
        </div>
      </div>

      <button style={{width:"100%",padding:"16px",borderRadius:"12px",border:"none",background:t.ink,color:"#fff",fontFamily:f,fontSize:"14px",fontWeight:500,cursor:"pointer",marginBottom:"12px"}}>Go to My Kliques</button>

      <div style={{padding:"24px 0",textAlign:"center"}}><Lbl color={t.faded} style={{fontSize:"10px"}}>Powered by Kliques</Lbl></div>
    </div>
  );
}

// ═══════════════════════════════════════════
// MAIN APP — toggle between the two flows
// ═══════════════════════════════════════════
export default function PublicFlowsApp(){
  const [view,setView]=useState("booking");
  return(
    <div style={{padding:"1rem 0 2rem",minHeight:"100vh",background:"#EDE6DD"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&display=swap');*{box-sizing:border-box;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}button:active{transform:scale(0.98)}::-webkit-scrollbar{display:none}`}</style>
      <div style={{display:"flex",justifyContent:"center",gap:"4px",marginBottom:"1.25rem",padding:"4px",background:t.avatarBg,borderRadius:"12px",width:"fit-content",margin:"0 auto 1.25rem"}}>
        {[{id:"booking",l:"Booking Page"},{id:"invite",l:"Invite Flow"}].map(v=>(
          <button key={v.id} onClick={()=>setView(v.id)} style={{padding:"10px 24px",borderRadius:"10px",border:"none",fontFamily:f,fontSize:"12px",fontWeight:view===v.id?600:400,background:view===v.id?"#fff":"transparent",color:view===v.id?t.ink:t.muted,cursor:"pointer",boxShadow:view===v.id?"0 1px 3px rgba(0,0,0,0.06)":"none",letterSpacing:"0.02em"}}>{v.l}</button>
        ))}
      </div>
      <div style={{display:"flex",justifyContent:"center"}}>
        <Phone>{view==="booking"?<PublicBookingPage/>:<InviteFlow/>}</Phone>
      </div>
    </div>
  );
}
