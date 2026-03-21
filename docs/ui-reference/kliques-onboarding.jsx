import { useState } from "react";

const t = {
  base:"#FBF7F2",ink:"#3D231E",muted:"#8C6A64",faded:"#B0948F",
  accent:"#C25E4A",hero:"#FDDCC6",avatarBg:"#F2EBE5",
  line:"rgba(140,106,100,0.2)",success:"#5A8A5E",successBg:"#EBF2EC",
  callout:"#FFF5E6",card:"#FFFFFF",dangerBg:"#FDEDEA",
};
const f = "'Sora',system-ui,sans-serif";
const topoSvg = `url("data:image/svg+xml,%3Csvg width='400' height='400' viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 200 Q 100 100 200 200 T 400 200' stroke='%233D231E' stroke-width='0.5' fill='none'/%3E%3Cpath d='M-50 250 Q 50 150 150 250 T 350 250' stroke='%233D231E' stroke-width='0.5' fill='none'/%3E%3Cpath d='M50 150 Q 150 50 250 150 T 450 150' stroke='%233D231E' stroke-width='0.5' fill='none'/%3E%3Cpath d='M0 300 Q 100 200 200 300 T 400 300' stroke='%233D231E' stroke-width='0.5' fill='none'/%3E%3Cpath d='M100 50 Q 200 -50 300 50 T 500 50' stroke='%233D231E' stroke-width='0.5' fill='none'/%3E%3Cpath d='M200 350 Q 250 250 350 300' stroke='%233D231E' stroke-width='0.5' fill='none'/%3E%3C/svg%3E")`;

function Lbl({children,color=t.muted,style={}}){return <span style={{fontFamily:f,fontSize:"11px",fontWeight:500,color,letterSpacing:"0.05em",textTransform:"uppercase",display:"block",...style}}>{children}</span>}
function Divider(){return <div style={{height:"1px",background:t.line}}/>}
function Input({label,placeholder,type="text",style={}}){return(<div style={{marginBottom:"20px",...style}}><Lbl style={{marginBottom:"8px"}}>{label}</Lbl><input type={type} placeholder={placeholder} style={{width:"100%",padding:"14px 16px",borderRadius:"12px",border:"1px solid "+t.line,fontFamily:f,fontSize:"14px",color:t.ink,outline:"none",background:t.avatarBg,boxSizing:"border-box"}}/></div>)}
function BackBtn({onClick}){return <button onClick={onClick} style={{background:"none",border:"none",cursor:"pointer",padding:"4px",display:"flex"}}><svg width="24" height="24" fill="none" stroke={t.ink} strokeWidth="2" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/></svg></button>}

// Step progress bar
function StepBar({current,total}){return(
  <div style={{display:"flex",gap:"4px",padding:"0 24px",marginBottom:"28px"}}>
    {Array.from({length:total}).map((_,i)=>(
      <div key={i} style={{flex:1,height:"3px",borderRadius:"2px",background:i<=current?t.accent:t.avatarBg}}/>
    ))}
  </div>
)}

function Phone({children}){return(
  <div style={{display:"flex",flexDirection:"column",alignItems:"center",width:"100%",maxWidth:"420px"}}>
    <div style={{width:"100%",maxWidth:"414px",height:"896px",background:t.base,position:"relative",overflow:"hidden",boxShadow:"0 0 40px rgba(61,35,30,0.05)",borderRadius:"40px",border:"1px solid "+t.line}}>
      <div style={{height:"100%",overflowY:"auto",overflowX:"hidden"}}>{children}</div>
    </div>
  </div>
)}

// ═══════════════════════════════════════════
// AUTH — Login / Sign Up
// ═══════════════════════════════════════════

function AuthScreen(){
  const [mode,setMode]=useState("login"); // "login", "signup", "magic"
  const [role,setRole]=useState("client"); // "client", "provider"

  // ─── Magic link sent ───
  if(mode==="magic") return(
    <div style={{minHeight:"100%",background:t.base,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px"}}>
      <div style={{width:"72px",height:"72px",borderRadius:"20px",background:t.hero,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:"24px",position:"relative"}}>
        <svg width="32" height="32" fill="none" stroke={t.accent} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M3 19V9a2 2 0 011.106-1.789L12 3l7.894 4.211A2 2 0 0121 9v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 9l9 6 9-6" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </div>
      <h1 style={{fontFamily:f,fontSize:"24px",fontWeight:400,letterSpacing:"-0.02em",color:t.ink,margin:"0 0 8px",textAlign:"center"}}>Check your email.</h1>
      <p style={{fontFamily:f,fontSize:"15px",color:t.muted,margin:"0 0 32px",textAlign:"center",lineHeight:1.6,maxWidth:"300px"}}>We sent a login link to your email address. Tap the link to sign in — no password needed.</p>
      <button onClick={()=>setMode("login")} style={{fontFamily:f,fontSize:"14px",color:t.accent,fontWeight:500,background:"none",border:"none",cursor:"pointer"}}>Back to login</button>
    </div>
  );

  return(
    <div style={{minHeight:"100%",background:t.base,display:"flex",flexDirection:"column"}}>
      {/* Top section with topo texture */}
      <div style={{position:"relative",padding:"60px 24px 40px",overflow:"hidden"}}>
        <div style={{position:"absolute",inset:0,backgroundImage:topoSvg,backgroundSize:"cover",opacity:0.06,pointerEvents:"none"}}/>
        <div style={{position:"relative",zIndex:1}}>
          <Lbl color={t.accent} style={{fontSize:"14px",fontWeight:600,marginBottom:"24px"}}>Kliques</Lbl>
          <h1 style={{fontFamily:f,fontSize:"32px",fontWeight:400,letterSpacing:"-0.03em",lineHeight:1.1,color:t.ink,margin:"0 0 8px"}}>{mode==="login"?"Welcome back.":"Create your\naccount."}</h1>
          <p style={{fontFamily:f,fontSize:"15px",color:t.muted,margin:0,lineHeight:1.6}}>{mode==="login"?"Sign in to continue where you left off.":"Join Kliques and start building lasting relationships."}</p>
        </div>
      </div>

      <div style={{padding:"0 24px",flex:1,display:"flex",flexDirection:"column"}}>
        {/* Role toggle — signup only */}
        {mode==="signup"&&<>
          <Lbl style={{marginBottom:"10px"}}>I am a</Lbl>
          <div style={{display:"flex",gap:"8px",marginBottom:"24px"}}>
            {["client","provider"].map(r=>(
              <button key={r} onClick={()=>setRole(r)} style={{flex:1,padding:"14px",borderRadius:"12px",border:role===r?"2px solid "+t.accent:"1px solid "+t.line,background:role===r?t.hero:"transparent",fontFamily:f,fontSize:"13px",fontWeight:500,color:role===r?t.accent:t.ink,cursor:"pointer",letterSpacing:"0.02em"}}>{r==="client"?"Client":"Service Provider"}</button>
            ))}
          </div>
        </>}

        {mode==="signup"&&<Input label="Full Name" placeholder="Your name"/>}
        <Input label="Email" placeholder="you@email.com" type="email"/>
        {mode==="signup"&&<Input label="Phone Number" placeholder="+1 (555) 000-0000" type="tel"/>}

        {mode==="login"&&<p style={{fontFamily:f,fontSize:"12px",color:t.faded,margin:"-12px 0 24px"}}>We'll send you a magic link — no password needed.</p>}
        {mode==="signup"&&<p style={{fontFamily:f,fontSize:"12px",color:t.faded,margin:"-12px 0 24px"}}>We'll email you a link to verify your account.</p>}

        <button onClick={()=>setMode("magic")} style={{width:"100%",padding:"16px",borderRadius:"12px",border:"none",background:t.ink,color:"#fff",fontFamily:f,fontSize:"14px",fontWeight:500,cursor:"pointer",marginBottom:"16px"}}>{mode==="login"?"Send Login Link":"Create Account"}</button>

        <Divider/>

        {/* Social login */}
        <div style={{padding:"20px 0"}}>
          <Lbl style={{marginBottom:"12px",textAlign:"center"}}>Or continue with</Lbl>
          <div style={{display:"flex",gap:"8px"}}>
            {["Google","Apple"].map(provider=>(
              <button key={provider} style={{flex:1,padding:"14px",borderRadius:"12px",border:"1px solid "+t.line,background:"transparent",fontFamily:f,fontSize:"13px",fontWeight:500,color:t.ink,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"8px"}}>
                {provider==="Google"?<svg width="16" height="16" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>:<svg width="16" height="16" viewBox="0 0 24 24" fill={t.ink}><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>}
                {provider}
              </button>
            ))}
          </div>
        </div>

        <div style={{marginTop:"auto",padding:"20px 0 32px",textAlign:"center"}}>
          <button onClick={()=>setMode(mode==="login"?"signup":"login")} style={{background:"none",border:"none",cursor:"pointer",fontFamily:f,fontSize:"14px",color:t.muted}}>
            {mode==="login"?<>Don't have an account? <span style={{color:t.accent,fontWeight:500}}>Sign up</span></>:<>Already have an account? <span style={{color:t.accent,fontWeight:500}}>Log in</span></>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// CLIENT ONBOARDING — 3 Steps
// ═══════════════════════════════════════════
function ClientOnboarding(){
  const [step,setStep]=useState(0);
  const [city,setCity]=useState("");
  const [showCitySuggestions,setShowCitySuggestions]=useState(false);
  const allCities=["Ottawa, ON","Toronto, ON","Vancouver, BC","Montreal, QC","Calgary, AB","Edmonton, AB","Winnipeg, MB","Halifax, NS","Ottawa East, ON","Ottawa South, ON","Oakville, ON","Oshawa, ON"];
  const filtered=city.length>0?allCities.filter(c=>c.toLowerCase().includes(city.toLowerCase())):[];
  const selectCity=(c)=>{setCity(c);setShowCitySuggestions(false);};

  // ─── Step 0: Welcome ───
  if(step===0) return(
    <div style={{minHeight:"100%",background:t.base,display:"flex",flexDirection:"column"}}>
      <div style={{background:t.hero,margin:"16px",borderRadius:"28px",padding:"40px 28px",position:"relative",overflow:"hidden",minHeight:"300px",display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>
        <div style={{position:"absolute",inset:0,backgroundImage:topoSvg,backgroundSize:"cover",opacity:0.12,pointerEvents:"none"}}/>
        <div style={{position:"relative",zIndex:1}}>
          <Lbl color={t.accent} style={{fontSize:"13px",fontWeight:600,marginBottom:"16px"}}>Kliques</Lbl>
          <h1 style={{fontFamily:f,fontSize:"32px",fontWeight:400,letterSpacing:"-0.03em",lineHeight:1.15,color:t.ink,margin:"0 0 10px"}}>Welcome to<br/>your journey.</h1>
          <p style={{fontFamily:f,fontSize:"15px",color:t.muted,margin:0,lineHeight:1.6}}>We just need a few details to get you started.</p>
        </div>
      </div>

      <div style={{padding:"28px 24px",flex:1,display:"flex",flexDirection:"column"}}>
        {[
          {icon:<svg width="16" height="16" fill="none" stroke={t.accent} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/></svg>,t:"Takes under 30 seconds",d:"Just your name, email, and phone number"},
          {icon:<svg width="16" height="16" fill="none" stroke={t.accent} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round"/></svg>,t:"Connect with providers",d:"Book sessions, track your history, message directly"},
          {icon:<svg width="16" height="16" fill="none" stroke={t.accent} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeLinecap="round" strokeLinejoin="round"/></svg>,t:"No password needed",d:"We'll send you a magic link to sign in"},
        ].map((item,i)=>(
          <div key={i}>
            <div style={{display:"flex",gap:"14px",padding:"16px 0",alignItems:"flex-start"}}>
              <div style={{width:"36px",height:"36px",borderRadius:"10px",background:t.hero,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{item.icon}</div>
              <div><p style={{fontFamily:f,fontSize:"15px",fontWeight:500,color:t.ink,margin:"0 0 2px"}}>{item.t}</p><p style={{fontFamily:f,fontSize:"13px",color:t.muted,margin:0}}>{item.d}</p></div>
            </div>
            {i<2&&<Divider/>}
          </div>
        ))}
        <div style={{marginTop:"auto",paddingTop:"20px"}}>
          <button onClick={()=>setStep(1)} style={{width:"100%",padding:"16px",borderRadius:"12px",border:"none",background:t.ink,color:"#fff",fontFamily:f,fontSize:"14px",fontWeight:500,cursor:"pointer"}}>Let's Go</button>
        </div>
      </div>
    </div>
  );

  // ─── Step 1: Name, Email, Phone ───
  if(step===1) return(
    <div style={{minHeight:"100%",background:t.base,display:"flex",flexDirection:"column"}}>
      <div style={{padding:"32px 24px 16px"}}><BackBtn onClick={()=>setStep(0)}/></div>
      <div style={{padding:"0 24px",flex:1,display:"flex",flexDirection:"column"}}>
        <h1 style={{fontFamily:f,fontSize:"28px",fontWeight:400,letterSpacing:"-0.03em",color:t.ink,margin:"0 0 8px"}}>About you.</h1>
        <p style={{fontFamily:f,fontSize:"15px",color:t.muted,margin:"0 0 32px",lineHeight:1.6}}>This is how providers will know you.</p>

        <Input label="Full Name" placeholder="Your name"/>
        <Input label="Email" placeholder="you@email.com" type="email"/>
        <Input label="Phone Number" placeholder="+1 (555) 000-0000" type="tel"/>

        {/* City with autocomplete */}
        <div style={{marginBottom:"20px",position:"relative"}}>
          <Lbl style={{marginBottom:"8px"}}>City</Lbl>
          <div style={{position:"relative"}}>
            <input
              value={city}
              onChange={e=>{setCity(e.target.value);setShowCitySuggestions(true);}}
              onFocus={()=>city.length>0&&setShowCitySuggestions(true)}
              placeholder="Start typing your city..."
              style={{width:"100%",padding:"14px 16px",paddingRight:"36px",borderRadius:"12px",border:"1px solid "+(showCitySuggestions&&filtered.length>0?t.accent:t.line),fontFamily:f,fontSize:"14px",color:t.ink,outline:"none",background:t.avatarBg,boxSizing:"border-box"}}
            />
            {city&&<button onClick={()=>{setCity("");setShowCitySuggestions(false);}} style={{position:"absolute",right:"12px",top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",padding:"4px",display:"flex"}}>
              <svg width="16" height="16" fill="none" stroke={t.faded} strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/></svg>
            </button>}
          </div>

          {/* Suggestions dropdown */}
          {showCitySuggestions&&filtered.length>0&&(
            <div style={{position:"absolute",top:"100%",left:0,right:0,marginTop:"4px",background:t.card,borderRadius:"12px",border:"1px solid "+t.line,boxShadow:"0 8px 24px rgba(61,35,30,0.08)",zIndex:10,overflow:"hidden",maxHeight:"200px",overflowY:"auto"}}>
              {filtered.slice(0,5).map(c=>(
                <button key={c} onClick={()=>selectCity(c)} style={{display:"flex",alignItems:"center",gap:"10px",padding:"14px 16px",background:"none",border:"none",borderBottom:"1px solid "+t.line,cursor:"pointer",width:"100%",textAlign:"left"}}>
                  <svg width="14" height="14" fill="none" stroke={t.muted} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" strokeLinecap="round" strokeLinejoin="round"/><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  <span style={{fontFamily:f,fontSize:"14px",color:t.ink}}>{c}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <p style={{fontFamily:f,fontSize:"12px",color:t.faded,margin:"-12px 0 0"}}>We'll send you a magic link — no password needed.</p>

        <div style={{marginTop:"auto",padding:"0 0 32px"}}>
          <button onClick={()=>setStep(2)} style={{width:"100%",padding:"16px",borderRadius:"12px",border:"none",background:t.ink,color:"#fff",fontFamily:f,fontSize:"14px",fontWeight:500,cursor:"pointer"}}>Create Account</button>
        </div>
      </div>
    </div>
  );

  // ─── Step 2: All set ───
  return(
    <div style={{minHeight:"100%",background:t.base,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px"}}>
      <div style={{width:"80px",height:"80px",borderRadius:"24px",background:t.hero,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:"24px",position:"relative"}}>
        <div style={{position:"absolute",inset:0,borderRadius:"24px",backgroundImage:topoSvg,backgroundSize:"cover",opacity:0.1,pointerEvents:"none"}}/>
        <svg width="36" height="36" fill="none" stroke={t.accent} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </div>
      <h1 style={{fontFamily:f,fontSize:"28px",fontWeight:400,letterSpacing:"-0.03em",color:t.ink,margin:"0 0 8px",textAlign:"center"}}>You're all set.</h1>
      <p style={{fontFamily:f,fontSize:"15px",color:t.muted,margin:"0 0 32px",textAlign:"center",lineHeight:1.6,maxWidth:"300px"}}>Your account is ready. Start exploring providers or accept an invite to build your first connection.</p>
      <button style={{width:"100%",padding:"16px",borderRadius:"12px",border:"none",background:t.ink,color:"#fff",fontFamily:f,fontSize:"14px",fontWeight:500,cursor:"pointer"}}>Go to My Kliques</button>
    </div>
  );
}

// ═══════════════════════════════════════════
// PROVIDER ONBOARDING — 5 Steps
// ═══════════════════════════════════════════
function ProviderOnboarding(){
  const [step,setStep]=useState(0);
  const [catSel,setCatSel]=useState(null);
  const [customCat,setCustomCat]=useState("");
  const [services]=useState([{n:"1-on-1 Vocal Lesson",d:"60 min",p:"$85"}]);
  const [activeDays,setActiveDays]=useState([0,1,2,3,4]);
  const toggleDay=(i)=>setActiveDays(prev=>prev.includes(i)?prev.filter(x=>x!==i):[...prev,i]);
  const categories=["Barber & Haircuts","Hair Styling & Braiding","Nails & Manicure","Makeup & Aesthetics","Lashes & Brows","Vocal Coaching","Music Lessons","Personal Training","Yoga & Pilates","Wellness & Massage","Mental Health & Therapy","Nutrition & Dietetics","Life Coaching","Tutoring & Education","Photography","Videography","Cleaning Services","Home Maintenance","Auto Detailing","Pet Grooming & Care","Tattoo & Piercing","Tailoring & Alterations","Event Planning","Other"];
  const days=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const canContinue=catSel&&(catSel!=="Other"||customCat.trim().length>0);

  // ─── Step 0: Welcome ───
  if(step===0) return(
    <div style={{minHeight:"100%",background:t.base,display:"flex",flexDirection:"column"}}>
      <div style={{background:t.hero,margin:"16px",borderRadius:"28px",padding:"40px 28px",position:"relative",overflow:"hidden",minHeight:"300px",display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>
        <div style={{position:"absolute",inset:0,backgroundImage:topoSvg,backgroundSize:"cover",opacity:0.12,pointerEvents:"none"}}/>
        <div style={{position:"relative",zIndex:1}}>
          <Lbl color={t.accent} style={{fontSize:"13px",fontWeight:600,marginBottom:"16px"}}>Kliques for Providers</Lbl>
          <h1 style={{fontFamily:f,fontSize:"32px",fontWeight:400,letterSpacing:"-0.03em",lineHeight:1.15,color:t.ink,margin:"0 0 10px"}}>Build your<br/>practice here.</h1>
          <p style={{fontFamily:f,fontSize:"15px",color:t.muted,margin:0,lineHeight:1.6}}>Set up your profile, services, and start getting booked in minutes.</p>
        </div>
      </div>
      <div style={{padding:"28px 24px",flex:1,display:"flex",flexDirection:"column"}}>
        {["Category","Profile & Photo","Services & Pricing","Availability","Handle & Payouts"].map((s,i)=>(
          <div key={s}>
            <div style={{display:"flex",gap:"14px",padding:"14px 0",alignItems:"center"}}>
              <div style={{width:"28px",height:"28px",borderRadius:"50%",background:t.avatarBg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:f,fontSize:"12px",fontWeight:500,color:t.muted}}>{i+1}</div>
              <p style={{fontFamily:f,fontSize:"15px",fontWeight:400,color:t.ink,margin:0}}>{s}</p>
            </div>
            {i<4&&<Divider/>}
          </div>
        ))}
        <div style={{marginTop:"auto",paddingTop:"20px"}}>
          <button onClick={()=>setStep(1)} style={{width:"100%",padding:"16px",borderRadius:"12px",border:"none",background:t.ink,color:"#fff",fontFamily:f,fontSize:"14px",fontWeight:500,cursor:"pointer"}}>Get Started</button>
        </div>
      </div>
    </div>
  );

  // ─── Step 1: Category ───
  if(step===1){
    return(
      <div style={{minHeight:"100%",background:t.base,display:"flex",flexDirection:"column"}}>
        <div style={{padding:"32px 24px 16px"}}><BackBtn onClick={()=>setStep(0)}/></div>
        <StepBar current={0} total={5}/>
        <div style={{padding:"0 24px",flex:1,display:"flex",flexDirection:"column"}}>
          <Lbl style={{marginBottom:"6px"}}>Step 1 of 5</Lbl>
          <h1 style={{fontFamily:f,fontSize:"28px",fontWeight:400,letterSpacing:"-0.03em",color:t.ink,margin:"0 0 8px"}}>What do you do?</h1>
          <p style={{fontFamily:f,fontSize:"15px",color:t.muted,margin:"0 0 24px",lineHeight:1.6}}>Pick the category that best describes your work.</p>

          <div style={{display:"flex",flexWrap:"wrap",gap:"8px",marginBottom:"16px"}}>
            {categories.map(c=>{
              const active=catSel===c;
              return(
                <button key={c} onClick={()=>{setCatSel(c);if(c!=="Other")setCustomCat("");}} style={{padding:"10px 16px",borderRadius:"9999px",border:active?"2px solid "+t.accent:"1px solid "+t.line,background:active?t.hero:"transparent",fontFamily:f,fontSize:"13px",fontWeight:active?500:400,color:active?t.accent:t.ink,cursor:"pointer"}}>{c}</button>
              );
            })}
          </div>

          {/* Custom category input — only when Other is selected */}
          {catSel==="Other"&&(
            <div style={{marginBottom:"16px"}}>
              <Lbl style={{marginBottom:"8px"}}>Tell us what you do</Lbl>
              <input
                value={customCat}
                onChange={e=>setCustomCat(e.target.value)}
                placeholder="e.g., Dog Training, Interior Design, DJ Services..."
                style={{width:"100%",padding:"14px 16px",borderRadius:"12px",border:"1px solid "+(customCat.length>0?t.accent:t.line),fontFamily:f,fontSize:"14px",color:t.ink,outline:"none",background:t.avatarBg,boxSizing:"border-box"}}
              />
              <p style={{fontFamily:f,fontSize:"12px",color:t.faded,margin:"6px 0 0"}}>We'll create a custom category for you.</p>
            </div>
          )}

          <div style={{marginTop:"auto",padding:"20px 0 32px"}}>
            <button onClick={()=>canContinue&&setStep(2)} style={{width:"100%",padding:"16px",borderRadius:"12px",border:"none",background:canContinue?t.ink:t.faded,color:"#fff",fontFamily:f,fontSize:"14px",fontWeight:500,cursor:canContinue?"pointer":"default"}}>Continue</button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Step 2: Profile ───
  if(step===2) return(
    <div style={{minHeight:"100%",background:t.base,display:"flex",flexDirection:"column"}}>
      <div style={{padding:"32px 24px 16px"}}><BackBtn onClick={()=>setStep(1)}/></div>
      <StepBar current={1} total={5}/>
      <div style={{padding:"0 24px",flex:1,display:"flex",flexDirection:"column"}}>
        <Lbl style={{marginBottom:"6px"}}>Step 2 of 5</Lbl>
        <h1 style={{fontFamily:f,fontSize:"28px",fontWeight:400,letterSpacing:"-0.03em",color:t.ink,margin:"0 0 8px"}}>Your profile.</h1>
        <p style={{fontFamily:f,fontSize:"15px",color:t.muted,margin:"0 0 28px",lineHeight:1.6}}>This is what clients see when they find you.</p>

        <div style={{display:"flex",flexDirection:"column",alignItems:"center",marginBottom:"28px"}}>
          <div style={{width:"88px",height:"88px",borderRadius:"50%",background:t.avatarBg,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",border:"2px dashed "+t.line}}>
            <svg width="28" height="28" fill="none" stroke={t.faded} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="13" r="4" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <p style={{fontFamily:f,fontSize:"12px",color:t.accent,margin:"8px 0 0",fontWeight:500,cursor:"pointer"}}>Upload photo</p>
        </div>

        <Input label="Business / Display Name" placeholder="e.g., Anny Wong Vocal Studio"/>
        <Input label="City" placeholder="Ottawa, ON"/>
        <div style={{marginBottom:"20px"}}>
          <Lbl style={{marginBottom:"8px"}}>Short Bio</Lbl>
          <textarea placeholder="Tell clients what you do and what makes your approach unique..." rows={3} style={{width:"100%",padding:"14px 16px",borderRadius:"12px",border:"1px solid "+t.line,fontFamily:f,fontSize:"13px",color:t.ink,outline:"none",resize:"vertical",background:t.avatarBg,boxSizing:"border-box"}}/>
          <p style={{fontFamily:f,fontSize:"11px",color:t.faded,margin:"6px 0 0",textAlign:"right"}}>0 / 160</p>
        </div>

        <div style={{marginTop:"auto",padding:"0 0 32px"}}>
          <button onClick={()=>setStep(3)} style={{width:"100%",padding:"16px",borderRadius:"12px",border:"none",background:t.ink,color:"#fff",fontFamily:f,fontSize:"14px",fontWeight:500,cursor:"pointer"}}>Continue</button>
        </div>
      </div>
    </div>
  );

  // ─── Step 3: Services ───
  if(step===3){
    return(
      <div style={{minHeight:"100%",background:t.base,display:"flex",flexDirection:"column"}}>
        <div style={{padding:"32px 24px 16px"}}><BackBtn onClick={()=>setStep(2)}/></div>
        <StepBar current={2} total={5}/>
        <div style={{padding:"0 24px",flex:1,display:"flex",flexDirection:"column"}}>
          <Lbl style={{marginBottom:"6px"}}>Step 3 of 5</Lbl>
          <h1 style={{fontFamily:f,fontSize:"28px",fontWeight:400,letterSpacing:"-0.03em",color:t.ink,margin:"0 0 8px"}}>Your services.</h1>
          <p style={{fontFamily:f,fontSize:"15px",color:t.muted,margin:"0 0 28px",lineHeight:1.6}}>Add at least one service. You can always add more later.</p>

          <Divider/>
          {services.map(s=>(
            <div key={s.n}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"18px 0"}}>
                <div><p style={{fontFamily:f,fontSize:"16px",fontWeight:400,color:t.ink,margin:"0 0 3px"}}>{s.n}</p><p style={{fontFamily:f,fontSize:"13px",color:t.muted,margin:0}}>{s.d} · {s.p}</p></div>
                <button style={{background:"none",border:"none",cursor:"pointer",padding:"4px"}}><svg width="16" height="16" fill="none" stroke={t.faded} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
              </div>
              <Divider/>
            </div>
          ))}

          <button style={{width:"100%",padding:"16px",borderRadius:"14px",border:"1px dashed "+t.line,background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"6px",margin:"16px 0"}}>
            <svg width="14" height="14" fill="none" stroke={t.accent} strokeWidth="2" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" strokeLinecap="round"/></svg>
            <span style={{fontFamily:f,fontSize:"13px",color:t.accent,fontWeight:500}}>Add Service</span>
          </button>

          <div style={{marginTop:"auto",padding:"0 0 32px"}}>
            <button onClick={()=>setStep(4)} style={{width:"100%",padding:"16px",borderRadius:"12px",border:"none",background:services.length>0?t.ink:t.faded,color:"#fff",fontFamily:f,fontSize:"14px",fontWeight:500,cursor:"pointer"}}>Continue</button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Step 4: Availability ───
  if(step===4){
    return(
      <div style={{minHeight:"100%",background:t.base,display:"flex",flexDirection:"column"}}>
        <div style={{padding:"32px 24px 16px"}}><BackBtn onClick={()=>setStep(3)}/></div>
        <StepBar current={3} total={5}/>
        <div style={{padding:"0 24px",flex:1,display:"flex",flexDirection:"column"}}>
          <Lbl style={{marginBottom:"6px"}}>Step 4 of 5</Lbl>
          <h1 style={{fontFamily:f,fontSize:"28px",fontWeight:400,letterSpacing:"-0.03em",color:t.ink,margin:"0 0 8px"}}>Availability.</h1>
          <p style={{fontFamily:f,fontSize:"15px",color:t.muted,margin:"0 0 28px",lineHeight:1.6}}>Set your weekly schedule. You can always adjust this later.</p>

          <Divider/>
          {days.map((d,i)=>{const isActive=activeDays.includes(i);return(
            <div key={d}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px 0"}}>
                <div style={{display:"flex",alignItems:"center",gap:"14px"}}>
                  <button onClick={()=>toggleDay(i)} style={{width:"22px",height:"22px",borderRadius:"6px",border:isActive?"none":"1.5px solid "+t.line,background:isActive?t.accent:"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0}}>
                    {isActive&&<svg width="12" height="12" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </button>
                  <span style={{fontFamily:f,fontSize:"15px",fontWeight:400,color:isActive?t.ink:t.faded}}>{d}</span>
                </div>
                {isActive&&<span style={{fontFamily:f,fontSize:"13px",color:t.muted}}>9:00 AM – 5:00 PM</span>}
                {!isActive&&<span style={{fontFamily:f,fontSize:"13px",color:t.faded}}>Off</span>}
              </div>
              <Divider/>
            </div>
          )})}

          <Lbl style={{margin:"20px 0 12px"}}>Buffer Between Sessions</Lbl>
          <div style={{display:"flex",gap:"8px",marginBottom:"20px"}}>
            {["None","10 min","15 min","30 min"].map((b,i)=>(
              <button key={b} style={{flex:1,padding:"10px 4px",borderRadius:"10px",border:i===2?"2px solid "+t.accent:"1px solid "+t.line,background:i===2?t.hero:"transparent",fontFamily:f,fontSize:"12px",fontWeight:i===2?500:400,color:i===2?t.accent:t.ink,cursor:"pointer"}}>{b}</button>
            ))}
          </div>

          <div style={{marginTop:"auto",padding:"0 0 32px"}}>
            <button onClick={()=>setStep(5)} style={{width:"100%",padding:"16px",borderRadius:"12px",border:"none",background:t.ink,color:"#fff",fontFamily:f,fontSize:"14px",fontWeight:500,cursor:"pointer"}}>Continue</button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Step 5: Handle + Stripe ───
  return(
    <div style={{minHeight:"100%",background:t.base,display:"flex",flexDirection:"column"}}>
      <div style={{padding:"32px 24px 16px"}}><BackBtn onClick={()=>setStep(4)}/></div>
      <StepBar current={4} total={5}/>
      <div style={{padding:"0 24px",flex:1,display:"flex",flexDirection:"column"}}>
        <Lbl style={{marginBottom:"6px"}}>Step 5 of 5</Lbl>
        <h1 style={{fontFamily:f,fontSize:"28px",fontWeight:400,letterSpacing:"-0.03em",color:t.ink,margin:"0 0 8px"}}>Almost there.</h1>
        <p style={{fontFamily:f,fontSize:"15px",color:t.muted,margin:"0 0 28px",lineHeight:1.6}}>Choose your public handle and connect your payout method.</p>

        <Lbl style={{marginBottom:"8px"}}>Your Handle</Lbl>
        <input defaultValue="annywong" style={{width:"100%",padding:"14px 16px",borderRadius:"12px",border:"1px solid "+t.line,fontFamily:f,fontSize:"14px",color:t.ink,outline:"none",background:t.avatarBg,boxSizing:"border-box",marginBottom:"6px"}}/>
        <div style={{display:"flex",alignItems:"center",gap:"6px",marginBottom:"24px"}}>
          <svg width="14" height="14" fill="none" stroke={t.success} strokeWidth="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <p style={{fontFamily:f,fontSize:"13px",color:t.success,margin:0}}>mykliques.com/book/annywong is available</p>
        </div>

        <Divider/>

        <div style={{padding:"20px 0"}}>
          <Lbl style={{marginBottom:"8px"}}>Connect Payouts</Lbl>
          <p style={{fontFamily:f,fontSize:"14px",color:t.muted,margin:"0 0 16px",lineHeight:1.5}}>Connect your Stripe account so you can receive payments from clients securely.</p>
          <button style={{width:"100%",padding:"16px",borderRadius:"12px",border:"1px solid "+t.line,background:t.card,fontFamily:f,fontSize:"14px",fontWeight:500,color:t.ink,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"8px"}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z" fill="#635BFF"/></svg>
            Connect Stripe
          </button>
        </div>

        <div style={{marginTop:"auto",padding:"0 0 32px"}}>
          <button style={{width:"100%",padding:"16px",borderRadius:"12px",border:"none",background:t.ink,color:"#fff",fontFamily:f,fontSize:"14px",fontWeight:500,cursor:"pointer"}}>Launch My Page</button>
          <p style={{fontFamily:f,fontSize:"12px",color:t.faded,margin:"12px 0 0",textAlign:"center"}}>You can always update everything from your profile later.</p>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════
export default function OnboardingApp(){
  const [view,setView]=useState("auth");
  const screens=[
    {id:"auth",l:"Login / Sign Up"},
    {id:"client_onboard",l:"Client Onboarding"},
    {id:"provider_onboard",l:"Provider Onboarding"},
  ];
  return(
    <div style={{padding:"1rem 0 2rem",minHeight:"100vh",background:"#EDE6DD"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&display=swap');*{box-sizing:border-box;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}button:active{transform:scale(0.98)}::-webkit-scrollbar{display:none}textarea{font-family:'Sora',system-ui,sans-serif}`}</style>
      <div style={{display:"flex",justifyContent:"center",gap:"4px",marginBottom:"1.25rem",padding:"4px",background:t.avatarBg,borderRadius:"12px",width:"fit-content",margin:"0 auto 1.25rem"}}>
        {screens.map(s=><button key={s.id} onClick={()=>setView(s.id)} style={{padding:"10px 20px",borderRadius:"10px",border:"none",fontFamily:f,fontSize:"12px",fontWeight:view===s.id?600:400,background:view===s.id?"#fff":"transparent",color:view===s.id?t.ink:t.muted,cursor:"pointer",boxShadow:view===s.id?"0 1px 3px rgba(0,0,0,0.06)":"none",letterSpacing:"0.02em"}}>{s.l}</button>)}
      </div>
      <div style={{display:"flex",justifyContent:"center"}}>
        <Phone>{view==="auth"?<AuthScreen/>:view==="client_onboard"?<ClientOnboarding/>:<ProviderOnboarding/>}</Phone>
      </div>
    </div>
  );
}
