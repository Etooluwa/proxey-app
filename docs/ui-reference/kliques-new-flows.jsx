import { useState } from "react";

const t = {
  base:"#FBF7F2",ink:"#3D231E",muted:"#8C6A64",faded:"#B0948F",
  accent:"#C25E4A",hero:"#FDDCC6",avatarBg:"#F2EBE5",
  line:"rgba(140,106,100,0.18)",success:"#5A8A5E",successBg:"#EBF2EC",
  callout:"#FFF5E6",card:"#FFFFFF",dangerBg:"#FDEDEA",danger:"#B04040",
};
const f="'Sora',system-ui,sans-serif";
const topoSvg=`url("data:image/svg+xml,%3Csvg width='400' height='400' viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 200 Q 100 100 200 200 T 400 200' stroke='%233D231E' stroke-width='0.5' fill='none'/%3E%3Cpath d='M-50 250 Q 50 150 150 250 T 350 250' stroke='%233D231E' stroke-width='0.5' fill='none'/%3E%3Cpath d='M50 150 Q 150 50 250 150 T 450 150' stroke='%233D231E' stroke-width='0.5' fill='none'/%3E%3C/svg%3E")`;

function Lbl({children,color=t.muted,style={}}){return <span style={{fontFamily:f,fontSize:"11px",fontWeight:500,color,letterSpacing:"0.05em",textTransform:"uppercase",display:"block",...style}}>{children}</span>}
function Avatar({initials,size=40}){return <div style={{width:size,height:size,borderRadius:"50%",background:t.avatarBg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:f,fontSize:size*0.3,fontWeight:500,color:t.muted,flexShrink:0}}>{initials}</div>}
function Divider(){return <div style={{height:"1px",background:t.line}}/>}
function ArrowIcon({size=18}){return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={t.accent} strokeWidth="2"><path d="M7 17L17 7M17 7H7M17 7V17" strokeLinecap="round" strokeLinejoin="round"/></svg>}
function BackBtn({onClick}){return <button onClick={onClick} style={{background:"none",border:"none",cursor:"pointer",padding:"4px",display:"flex"}}><svg width="24" height="24" fill="none" stroke={t.ink} strokeWidth="2" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/></svg></button>}
function Phone({children}){return <div style={{display:"flex",flexDirection:"column",alignItems:"center",width:"100%",maxWidth:"420px"}}><div style={{width:"100%",maxWidth:"414px",height:"896px",background:t.base,position:"relative",overflow:"hidden",boxShadow:"0 0 40px rgba(61,35,30,0.05)",borderRadius:"40px",border:"1px solid "+t.line}}><div style={{height:"100%",overflowY:"auto",overflowX:"hidden"}}>{children}</div></div></div>}
function Toggle({on}){return <div style={{width:"44px",height:"26px",borderRadius:"13px",background:on?t.accent:t.avatarBg,cursor:"pointer",position:"relative",flexShrink:0}}><div style={{width:"22px",height:"22px",borderRadius:"50%",background:"#fff",position:"absolute",top:"2px",...(on?{right:"2px"}:{left:"2px"}),boxShadow:"0 1px 3px rgba(0,0,0,0.15)"}}/></div>}

// ═══════════════════════════════════════════
// 1. PROVIDER: CONFIRMED & PAST BOOKINGS
// ═══════════════════════════════════════════
function PAllBookings({go}){
  const [tab,setTab]=useState("upcoming");
  const upcoming=[
    {client:"Sarah Mitchell",i:"SM",svc:"1-on-1 Vocal Lesson",date:"Wed, Mar 19 · 10:30 AM",dur:"60 min",price:"$85",status:"confirmed"},
    {client:"Kai Thompson",i:"KT",svc:"Audition Prep",date:"Thu, Mar 20 · 1:30 PM",dur:"45 min",price:"$95",status:"confirmed"},
    {client:"Lisa Rivera",i:"LR",svc:"Vocal Coaching",date:"Fri, Mar 21 · 4:00 PM",dur:"60 min",price:"$85",status:"confirmed"},
    {client:"David Park",i:"DP",svc:"Group Class",date:"Sat, Mar 22 · 10:00 AM",dur:"90 min",price:"$45",status:"confirmed"},
  ];
  const past=[
    {client:"Sarah Mitchell",i:"SM",svc:"Vocal Lesson",date:"Wed, Mar 12 · 10:30 AM",dur:"60 min",price:"$85",status:"completed"},
    {client:"Kai Thompson",i:"KT",svc:"Performance Coaching",date:"Mon, Mar 10 · 2:00 PM",dur:"45 min",price:"$95",status:"completed"},
    {client:"Nadia Khan",i:"NK",svc:"Group Class",date:"Sat, Mar 8 · 10:00 AM",dur:"90 min",price:"$45",status:"completed"},
    {client:"Lisa Rivera",i:"LR",svc:"Vocal Lesson",date:"Wed, Mar 5 · 4:00 PM",dur:"60 min",price:"$85",status:"cancelled"},
    {client:"Sarah Mitchell",i:"SM",svc:"Song Arrangement",date:"Mon, Feb 26 · 11:00 AM",dur:"60 min",price:"$65",status:"completed"},
  ];
  const list=tab==="upcoming"?upcoming:past;
  const statusStyle={confirmed:{color:t.success,bg:t.successBg},completed:{color:t.success,bg:t.successBg},cancelled:{color:t.danger,bg:t.dangerBg}};
  return(
    <div style={{minHeight:"100%",background:t.base,display:"flex",flexDirection:"column"}}>
      <div style={{padding:"32px 24px 16px"}}><BackBtn onClick={()=>go("p_bookings")}/></div>
      <div style={{padding:"0 24px 20px"}}>
        <h1 style={{fontFamily:f,fontSize:"28px",fontWeight:400,letterSpacing:"-0.03em",color:t.ink,margin:"0 0 16px"}}>All Bookings</h1>
        <div style={{display:"flex",gap:"8px"}}>
          {["upcoming","past"].map(tb=><button key={tb} onClick={()=>setTab(tb)} style={{flex:1,padding:"10px",borderRadius:"10px",border:tab===tb?"2px solid "+t.accent:"1px solid "+t.line,background:tab===tb?t.hero:"transparent",fontFamily:f,fontSize:"12px",fontWeight:tab===tb?600:400,color:tab===tb?t.accent:t.ink,cursor:"pointer",textTransform:"capitalize"}}>{tb} ({tb==="upcoming"?upcoming.length:past.length})</button>)}
        </div>
      </div>
      <div style={{padding:"0 24px",flex:1}}>
        <Divider/>
        {list.map((b,i)=>{const st=statusStyle[b.status];return(
          <div key={i}><button onClick={()=>go("p_appt_detail")} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"18px 0",width:"100%",background:"none",border:"none",cursor:"pointer",textAlign:"left",fontFamily:f}}>
            <div style={{display:"flex",alignItems:"center",gap:"14px",flex:1}}>
              <Avatar initials={b.i} size={40}/>
              <div><p style={{fontSize:"15px",color:t.ink,margin:"0 0 3px"}}>{b.client}</p><p style={{fontSize:"13px",color:t.muted,margin:"0 0 4px"}}>{b.svc} · {b.dur}</p><p style={{fontSize:"12px",color:t.faded,margin:0}}>{b.date}</p></div>
            </div>
            <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:"6px"}}>
              <span style={{fontSize:"15px",fontWeight:500,color:t.ink}}>{b.price}</span>
              <span style={{fontSize:"10px",fontWeight:500,color:st.color,padding:"3px 8px",borderRadius:"9999px",background:st.bg,textTransform:"capitalize"}}>{b.status}</span>
            </div>
          </button><Divider/></div>
        )})}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// 2. SERVICE GROUP CREATION
// ═══════════════════════════════════════════
function PNewServiceGroup({go}){
  const [name,setName]=useState("");
  return(
    <div style={{minHeight:"100%",background:t.base,display:"flex",flexDirection:"column"}}>
      <div style={{padding:"32px 24px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <BackBtn onClick={()=>go("p_services")}/>
        <Lbl color={t.ink} style={{fontSize:"13px",fontWeight:500}}>New Group</Lbl>
        <div style={{width:"28px"}}/>
      </div>
      <div style={{padding:"0 24px",flex:1,display:"flex",flexDirection:"column"}}>
        <h1 style={{fontFamily:f,fontSize:"28px",fontWeight:400,letterSpacing:"-0.03em",color:t.ink,margin:"0 0 8px"}}>Create a group.</h1>
        <p style={{fontFamily:f,fontSize:"15px",color:t.muted,margin:"0 0 28px",lineHeight:1.6}}>Groups help clients browse your services by category.</p>

        <Lbl style={{marginBottom:"8px"}}>Group Name</Lbl>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g., Private Sessions, Packages, Workshops..." style={{width:"100%",padding:"14px 16px",borderRadius:"12px",border:"1px solid "+t.line,fontFamily:f,fontSize:"14px",color:t.ink,outline:"none",background:t.avatarBg,boxSizing:"border-box",marginBottom:"24px"}}/>

        <Lbl style={{marginBottom:"8px"}}>Description (optional)</Lbl>
        <textarea placeholder="What kind of services belong in this group?" rows={3} style={{width:"100%",padding:"14px 16px",borderRadius:"12px",border:"1px solid "+t.line,fontFamily:f,fontSize:"13px",color:t.ink,resize:"vertical",outline:"none",background:t.avatarBg,boxSizing:"border-box",marginBottom:"24px"}}/>

        <Divider/>
        <Lbl style={{margin:"20px 0 12px"}}>Add Existing Services</Lbl>
        <p style={{fontFamily:f,fontSize:"13px",color:t.muted,margin:"0 0 16px",lineHeight:1.5}}>Move services into this group, or add new ones later.</p>
        {["1-on-1 Vocal Lesson","Performance Coaching","Song Arrangement"].map(s=>{
          const [checked,setChecked]=useState(false);
          return <div key={s}><button onClick={()=>setChecked(!checked)} style={{display:"flex",alignItems:"center",gap:"14px",padding:"16px 0",width:"100%",background:"none",border:"none",cursor:"pointer",textAlign:"left",fontFamily:f}}>
            <div style={{width:"22px",height:"22px",borderRadius:"6px",border:checked?"none":"1.5px solid "+t.line,background:checked?t.accent:"transparent",display:"flex",alignItems:"center",justifyContent:"center"}}>
              {checked&&<svg width="12" height="12" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            </div>
            <span style={{fontSize:"15px",color:t.ink}}>{s}</span>
          </button><Divider/></div>
        })}

        <div style={{marginTop:"auto",padding:"24px 0 32px",display:"flex",gap:"10px"}}>
          <button onClick={()=>go("p_services")} style={{flex:1,padding:"16px",borderRadius:"12px",border:"1px solid "+t.line,background:"transparent",fontFamily:f,fontSize:"13px",fontWeight:500,color:t.ink,cursor:"pointer"}}>Cancel</button>
          <button onClick={()=>go("p_services")} style={{flex:2,padding:"16px",borderRadius:"12px",border:"none",background:name.trim()?t.ink:t.faded,color:"#fff",fontFamily:f,fontSize:"13px",fontWeight:500,cursor:name.trim()?"pointer":"default"}}>Create Group</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// 3. PROVIDER PROFILE SUB-PAGES
// ═══════════════════════════════════════════
function SettingsPage({go,backTo,title,children}){return(
  <div style={{minHeight:"100%",background:t.base,display:"flex",flexDirection:"column"}}>
    <div style={{padding:"32px 24px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <BackBtn onClick={()=>go(backTo)}/>
      <Lbl color={t.ink} style={{fontSize:"13px",fontWeight:500}}>{title}</Lbl>
      <div style={{width:"28px"}}/>
    </div>
    <div style={{padding:"0 24px",flex:1,display:"flex",flexDirection:"column"}}>{children}</div>
  </div>
)}

function PPersonalDetails({go}){return(
  <SettingsPage go={go} backTo="p_profile" title="Personal Details">
    <Lbl style={{marginBottom:"8px"}}>Full Name</Lbl>
    <input defaultValue="Anny Wong" style={{width:"100%",padding:"14px 16px",borderRadius:"12px",border:"1px solid "+t.line,fontFamily:f,fontSize:"14px",color:t.ink,outline:"none",background:t.avatarBg,boxSizing:"border-box",marginBottom:"20px"}}/>
    <Lbl style={{marginBottom:"8px"}}>Email</Lbl>
    <input defaultValue="anny@voxxstudio.com" type="email" style={{width:"100%",padding:"14px 16px",borderRadius:"12px",border:"1px solid "+t.line,fontFamily:f,fontSize:"14px",color:t.ink,outline:"none",background:t.avatarBg,boxSizing:"border-box",marginBottom:"20px"}}/>
    <Lbl style={{marginBottom:"8px"}}>Phone</Lbl>
    <input defaultValue="+1 (613) 555-0199" type="tel" style={{width:"100%",padding:"14px 16px",borderRadius:"12px",border:"1px solid "+t.line,fontFamily:f,fontSize:"14px",color:t.ink,outline:"none",background:t.avatarBg,boxSizing:"border-box",marginBottom:"20px"}}/>
    <div style={{marginTop:"auto",padding:"0 0 32px"}}><button onClick={()=>go("p_profile")} style={{width:"100%",padding:"16px",borderRadius:"12px",border:"none",background:t.ink,color:"#fff",fontFamily:f,fontSize:"14px",fontWeight:500,cursor:"pointer"}}>Save Changes</button></div>
  </SettingsPage>
)}

function PBusinessDetails({go}){return(
  <SettingsPage go={go} backTo="p_profile" title="Business Details">
    <Lbl style={{marginBottom:"8px"}}>Business Name</Lbl>
    <input defaultValue="Anny Wong Vocal Studio" style={{width:"100%",padding:"14px 16px",borderRadius:"12px",border:"1px solid "+t.line,fontFamily:f,fontSize:"14px",color:t.ink,outline:"none",background:t.avatarBg,boxSizing:"border-box",marginBottom:"20px"}}/>
    <Lbl style={{marginBottom:"8px"}}>Category</Lbl>
    <div style={{padding:"14px 16px",borderRadius:"12px",border:"1px solid "+t.line,background:t.avatarBg,marginBottom:"20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontFamily:f,fontSize:"14px",color:t.ink}}>Vocal Coaching</span><ArrowIcon size={14}/></div>
    <Lbl style={{marginBottom:"8px"}}>Address</Lbl>
    <input defaultValue="123 Music Lane" style={{width:"100%",padding:"14px 16px",borderRadius:"12px",border:"1px solid "+t.line,fontFamily:f,fontSize:"14px",color:t.ink,outline:"none",background:t.avatarBg,boxSizing:"border-box",marginBottom:"12px"}}/>
    <input defaultValue="Ottawa, ON K1A 0A6" style={{width:"100%",padding:"14px 16px",borderRadius:"12px",border:"1px solid "+t.line,fontFamily:f,fontSize:"14px",color:t.ink,outline:"none",background:t.avatarBg,boxSizing:"border-box",marginBottom:"20px"}}/>
    <Lbl style={{marginBottom:"8px"}}>Bio</Lbl>
    <textarea defaultValue="Helping you find your voice — whether you're stepping on stage for the first time or refining your craft." rows={3} style={{width:"100%",padding:"14px 16px",borderRadius:"12px",border:"1px solid "+t.line,fontFamily:f,fontSize:"13px",color:t.ink,resize:"vertical",outline:"none",background:t.avatarBg,boxSizing:"border-box",marginBottom:"20px"}}/>
    <Lbl style={{marginBottom:"8px"}}>Languages</Lbl>
    <div style={{display:"flex",gap:"8px",flexWrap:"wrap",marginBottom:"20px"}}>
      {["English","Cantonese"].map(l=><span key={l} style={{padding:"8px 16px",borderRadius:"9999px",background:t.hero,border:"2px solid "+t.accent,fontFamily:f,fontSize:"12px",fontWeight:500,color:t.accent}}>{l}</span>)}
      <button style={{padding:"8px 16px",borderRadius:"9999px",border:"1px dashed "+t.line,fontFamily:f,fontSize:"12px",color:t.accent,cursor:"pointer"}}>+ Add</button>
    </div>
    <div style={{marginTop:"auto",padding:"0 0 32px"}}><button onClick={()=>go("p_profile")} style={{width:"100%",padding:"16px",borderRadius:"12px",border:"none",background:t.ink,color:"#fff",fontFamily:f,fontSize:"14px",fontWeight:500,cursor:"pointer"}}>Save Changes</button></div>
  </SettingsPage>
)}

function PPhotosPortfolio({go}){return(
  <SettingsPage go={go} backTo="p_profile" title="Photos & Portfolio">
    <Lbl style={{marginBottom:"12px"}}>Profile Photo</Lbl>
    <div style={{display:"flex",alignItems:"center",gap:"16px",marginBottom:"28px"}}>
      <Avatar initials="AW" size={72}/>
      <div><button style={{padding:"10px 20px",borderRadius:"10px",border:"1px solid "+t.line,fontFamily:f,fontSize:"12px",fontWeight:500,color:t.ink,cursor:"pointer",marginBottom:"6px",display:"block"}}>Change Photo</button><p style={{fontFamily:f,fontSize:"11px",color:t.faded,margin:0}}>JPG or PNG · Max 5MB</p></div>
    </div>
    <Divider/>
    <Lbl style={{margin:"20px 0 12px"}}>Portfolio Gallery</Lbl>
    <p style={{fontFamily:f,fontSize:"13px",color:t.muted,margin:"0 0 16px",lineHeight:1.5}}>Showcase your work. Clients see this on your public booking page.</p>
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"8px",marginBottom:"16px"}}>
      {[1,2,3].map(i=><div key={i} style={{aspectRatio:"1",borderRadius:"12px",background:t.avatarBg,display:"flex",alignItems:"center",justifyContent:"center"}}><svg width="20" height="20" fill="none" stroke={t.faded} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/></svg></div>)}
      <button style={{aspectRatio:"1",borderRadius:"12px",border:"1px dashed "+t.line,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"4px",cursor:"pointer"}}><svg width="20" height="20" fill="none" stroke={t.accent} strokeWidth="2" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" strokeLinecap="round"/></svg><span style={{fontFamily:f,fontSize:"10px",color:t.accent}}>Add</span></button>
    </div>
  </SettingsPage>
)}

function PPayoutsBilling({go}){return(
  <SettingsPage go={go} backTo="p_profile" title="Payouts & Billing">
    <div style={{padding:"20px",background:t.successBg,borderRadius:"16px",marginBottom:"24px",display:"flex",alignItems:"center",gap:"14px"}}>
      <svg width="20" height="20" fill="none" stroke={t.success} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/></svg>
      <div><p style={{fontFamily:f,fontSize:"14px",fontWeight:500,color:t.success,margin:0}}>Stripe Connected</p><p style={{fontFamily:f,fontSize:"12px",color:t.muted,margin:"2px 0 0"}}>Payouts go to ••••4242</p></div>
    </div>
    <Divider/>
    {[{l:"Payout schedule",v:"Weekly (every Monday)"},{l:"Default currency",v:"CAD"},{l:"Platform fee",v:"10% per transaction"},{l:"Next payout",v:"$1,240 · Mar 22"}].map(row=>(
      <div key={row.l}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"18px 0"}}><span style={{fontFamily:f,fontSize:"15px",color:t.ink}}>{row.l}</span><span style={{fontFamily:f,fontSize:"14px",color:t.muted}}>{row.v}</span></div><Divider/></div>
    ))}
    <button style={{width:"100%",padding:"16px",borderRadius:"12px",border:"1px solid "+t.line,fontFamily:f,fontSize:"14px",fontWeight:500,color:t.ink,cursor:"pointer",marginTop:"24px",display:"flex",alignItems:"center",justifyContent:"center",gap:"8px"}}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z" fill="#635BFF"/></svg>
      Manage Stripe Account
    </button>
  </SettingsPage>
)}

function PWorkingHours({go}){return(
  <SettingsPage go={go} backTo="p_profile" title="Working Hours">
    <p style={{fontFamily:f,fontSize:"15px",color:t.muted,margin:"0 0 20px",lineHeight:1.6}}>This is a shortcut to your availability settings.</p>
    <button onClick={()=>go("p_availability")} style={{width:"100%",padding:"16px",borderRadius:"12px",border:"none",background:t.ink,color:"#fff",fontFamily:f,fontSize:"14px",fontWeight:500,cursor:"pointer"}}>Edit Availability</button>
  </SettingsPage>
)}

function PNotifSettings({go,backTo="p_profile"}){return(
  <SettingsPage go={go} backTo={backTo} title="Notifications">
    <Lbl style={{marginBottom:"12px"}}>Push Notifications</Lbl>
    {[{l:"New booking requests",on:true},{l:"Booking confirmations",on:true},{l:"Client messages",on:true},{l:"Session reminders",on:true},{l:"Payout updates",on:false}].map(item=>(
      <div key={item.l}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px 0"}}><span style={{fontFamily:f,fontSize:"15px",color:t.ink}}>{item.l}</span><Toggle on={item.on}/></div><Divider/></div>
    ))}
    <Lbl style={{margin:"24px 0 12px"}}>Email Notifications</Lbl>
    {[{l:"Weekly earnings summary",on:true},{l:"New reviews",on:true},{l:"Marketing & tips",on:false}].map(item=>(
      <div key={item.l}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px 0"}}><span style={{fontFamily:f,fontSize:"15px",color:t.ink}}>{item.l}</span><Toggle on={item.on}/></div><Divider/></div>
    ))}
  </SettingsPage>
)}

function PBookingSettings({go}){return(
  <SettingsPage go={go} backTo="p_profile" title="Booking Settings">
    {[{l:"Cancellation policy",v:"Free up to 24 hrs"},{l:"Minimum notice",v:"2 hours"},{l:"Auto-accept bookings",v:"Off"},{l:"Require deposit",v:"30% default"},{l:"Booking confirmation",v:"Manual review"}].map(row=>(
      <div key={row.l}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"18px 0"}}><div><p style={{fontFamily:f,fontSize:"15px",color:t.ink,margin:0}}>{row.l}</p></div><div style={{display:"flex",alignItems:"center",gap:"8px"}}><span style={{fontFamily:f,fontSize:"14px",color:t.muted}}>{row.v}</span><ArrowIcon size={14}/></div></div><Divider/></div>
    ))}
  </SettingsPage>
)}

function HelpSupport({go,backTo}){return(
  <SettingsPage go={go} backTo={backTo} title="Help & Support">
    {[{l:"FAQ",s:"Common questions answered"},{l:"Contact Support",s:"Email us at help@mykliques.com"},{l:"Report a Bug",s:"Let us know what's broken"},{l:"Feature Request",s:"Tell us what you'd like to see"},{l:"Terms of Service",s:"Legal stuff"},{l:"Privacy Policy",s:"How we handle your data"}].map(item=>(
      <div key={item.l}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"18px 0",cursor:"pointer"}}><div><p style={{fontFamily:f,fontSize:"15px",color:t.ink,margin:"0 0 3px"}}>{item.l}</p><p style={{fontFamily:f,fontSize:"13px",color:t.muted,margin:0}}>{item.s}</p></div><ArrowIcon size={14}/></div><Divider/></div>
    ))}
  </SettingsPage>
)}

// ═══════════════════════════════════════════
// 4. CLIENT PROFILE SUB-PAGES
// ═══════════════════════════════════════════
function CPersonalDetails({go}){return(
  <SettingsPage go={go} backTo="c_profile" title="Personal Details">
    <Lbl style={{marginBottom:"8px"}}>Full Name</Lbl>
    <input defaultValue="Eto" style={{width:"100%",padding:"14px 16px",borderRadius:"12px",border:"1px solid "+t.line,fontFamily:f,fontSize:"14px",color:t.ink,outline:"none",background:t.avatarBg,boxSizing:"border-box",marginBottom:"20px"}}/>
    <Lbl style={{marginBottom:"8px"}}>Email</Lbl>
    <input defaultValue="eto@email.com" type="email" style={{width:"100%",padding:"14px 16px",borderRadius:"12px",border:"1px solid "+t.line,fontFamily:f,fontSize:"14px",color:t.ink,outline:"none",background:t.avatarBg,boxSizing:"border-box",marginBottom:"20px"}}/>
    <Lbl style={{marginBottom:"8px"}}>Phone</Lbl>
    <input defaultValue="+1 (613) 555-0100" type="tel" style={{width:"100%",padding:"14px 16px",borderRadius:"12px",border:"1px solid "+t.line,fontFamily:f,fontSize:"14px",color:t.ink,outline:"none",background:t.avatarBg,boxSizing:"border-box",marginBottom:"20px"}}/>
    <Lbl style={{marginBottom:"8px"}}>City</Lbl>
    <input defaultValue="Ottawa, ON" style={{width:"100%",padding:"14px 16px",borderRadius:"12px",border:"1px solid "+t.line,fontFamily:f,fontSize:"14px",color:t.ink,outline:"none",background:t.avatarBg,boxSizing:"border-box",marginBottom:"20px"}}/>
    <div style={{marginTop:"auto",padding:"0 0 32px"}}><button onClick={()=>go("c_profile")} style={{width:"100%",padding:"16px",borderRadius:"12px",border:"none",background:t.ink,color:"#fff",fontFamily:f,fontSize:"14px",fontWeight:500,cursor:"pointer"}}>Save Changes</button></div>
  </SettingsPage>
)}

function CPaymentMethods({go}){return(
  <SettingsPage go={go} backTo="c_profile" title="Payment Methods">
    <Lbl style={{marginBottom:"12px"}}>Saved Cards</Lbl>
    <div style={{padding:"18px",background:t.card,borderRadius:"14px",border:"1px solid "+t.line,display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}}>
      <div style={{display:"flex",alignItems:"center",gap:"12px"}}><div style={{width:"40px",height:"28px",borderRadius:"6px",background:t.avatarBg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"10px",fontWeight:600,color:t.muted}}>MC</div><div><p style={{fontFamily:f,fontSize:"14px",color:t.ink,margin:0}}>Mastercard ••••4242</p><p style={{fontFamily:f,fontSize:"12px",color:t.faded,margin:"2px 0 0"}}>Expires 08/28</p></div></div>
      <div style={{padding:"4px 10px",borderRadius:"9999px",background:t.hero}}><Lbl color={t.accent} style={{fontSize:"9px",margin:0}}>Default</Lbl></div>
    </div>
    <div style={{padding:"18px",background:t.card,borderRadius:"14px",border:"1px solid "+t.line,display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"20px"}}>
      <div style={{display:"flex",alignItems:"center",gap:"12px"}}><div style={{width:"40px",height:"28px",borderRadius:"6px",background:t.avatarBg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"10px",fontWeight:600,color:t.muted}}>VISA</div><div><p style={{fontFamily:f,fontSize:"14px",color:t.ink,margin:0}}>Visa ••••1234</p><p style={{fontFamily:f,fontSize:"12px",color:t.faded,margin:"2px 0 0"}}>Expires 03/27</p></div></div>
      <button style={{fontFamily:f,fontSize:"12px",color:t.faded,background:"none",border:"none",cursor:"pointer"}}>Remove</button>
    </div>
    <button style={{width:"100%",padding:"16px",borderRadius:"14px",border:"1px dashed "+t.line,fontFamily:f,fontSize:"13px",fontWeight:500,color:t.accent,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"6px"}}><svg width="14" height="14" fill="none" stroke={t.accent} strokeWidth="2" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" strokeLinecap="round"/></svg>Add New Card</button>
  </SettingsPage>
)}

function CPrivacySecurity({go}){return(
  <SettingsPage go={go} backTo="c_profile" title="Privacy & Security">
    {[{l:"Change email",v:"eto@email.com"},{l:"Change phone",v:"+1 (613) ***-0100"}].map(row=>(
      <div key={row.l}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"18px 0"}}><span style={{fontFamily:f,fontSize:"15px",color:t.ink}}>{row.l}</span><div style={{display:"flex",alignItems:"center",gap:"8px"}}><span style={{fontFamily:f,fontSize:"14px",color:t.muted}}>{row.v}</span><ArrowIcon size={14}/></div></div><Divider/></div>
    ))}
    <Lbl style={{margin:"24px 0 12px"}}>Data & Privacy</Lbl>
    {[{l:"Download my data",s:"Get a copy of your account data"},{l:"Delete account",s:"Permanently remove your account"}].map(item=>(
      <div key={item.l}><button onClick={item.l.includes("Delete")?()=>go("delete_account"):undefined} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"18px 0",width:"100%",background:"none",border:"none",cursor:"pointer",textAlign:"left",fontFamily:f}}>
        <div><p style={{fontSize:"15px",color:item.l.includes("Delete")?t.danger:t.ink,margin:"0 0 3px"}}>{item.l}</p><p style={{fontSize:"13px",color:t.muted,margin:0}}>{item.s}</p></div>
        <ArrowIcon size={14}/>
      </button><Divider/></div>
    ))}
  </SettingsPage>
)}

// ═══════════════════════════════════════════
// 5. DELETE ACCOUNT FLOW
// ═══════════════════════════════════════════
function DeleteAccount({go,backTo}){
  const [confirmed,setConfirmed]=useState(false);
  const [typed,setTyped]=useState("");
  return(
    <div style={{minHeight:"100%",background:t.base,display:"flex",flexDirection:"column"}}>
      <div style={{padding:"32px 24px 16px"}}><BackBtn onClick={()=>go(backTo)}/></div>
      <div style={{padding:"0 24px",flex:1,display:"flex",flexDirection:"column"}}>
        <div style={{width:"56px",height:"56px",borderRadius:"16px",background:t.dangerBg,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:"20px"}}>
          <svg width="24" height="24" fill="none" stroke={t.danger} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <h1 style={{fontFamily:f,fontSize:"28px",fontWeight:400,letterSpacing:"-0.03em",color:t.danger,margin:"0 0 8px"}}>Delete your account</h1>
        <p style={{fontFamily:f,fontSize:"15px",color:t.muted,margin:"0 0 24px",lineHeight:1.6}}>This action is permanent and cannot be undone. All your data will be deleted, including:</p>

        {["Your profile and personal information","All booking history and session records","Messages and conversations","Invoices and payment records","Provider connections and relationships"].map(item=>(
          <div key={item} style={{display:"flex",gap:"10px",padding:"8px 0",alignItems:"flex-start"}}>
            <svg width="16" height="16" fill="none" stroke={t.danger} strokeWidth="1.5" viewBox="0 0 24 24" style={{flexShrink:0,marginTop:"2px"}}><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/></svg>
            <span style={{fontFamily:f,fontSize:"14px",color:t.ink,lineHeight:1.5}}>{item}</span>
          </div>
        ))}

        <Divider style={{margin:"24px 0"}}/>

        <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"20px",cursor:"pointer"}} onClick={()=>setConfirmed(!confirmed)}>
          <div style={{width:"22px",height:"22px",borderRadius:"6px",border:confirmed?"none":"1.5px solid "+t.line,background:confirmed?t.danger:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            {confirmed&&<svg width="12" height="12" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          </div>
          <span style={{fontFamily:f,fontSize:"14px",color:t.ink}}>I understand this action is permanent</span>
        </div>

        {confirmed&&<>
          <Lbl style={{marginBottom:"8px"}}>Type "DELETE" to confirm</Lbl>
          <input value={typed} onChange={e=>setTyped(e.target.value)} placeholder="DELETE" style={{width:"100%",padding:"14px 16px",borderRadius:"12px",border:"1px solid "+(typed==="DELETE"?t.danger:t.line),fontFamily:f,fontSize:"14px",color:t.ink,outline:"none",background:t.avatarBg,boxSizing:"border-box",marginBottom:"20px"}}/>
        </>}

        <div style={{marginTop:"auto",padding:"0 0 32px",display:"flex",gap:"10px"}}>
          <button onClick={()=>go(backTo)} style={{flex:1,padding:"16px",borderRadius:"12px",border:"1px solid "+t.line,background:"transparent",fontFamily:f,fontSize:"14px",fontWeight:500,color:t.ink,cursor:"pointer"}}>Cancel</button>
          <button style={{flex:1,padding:"16px",borderRadius:"12px",border:"none",background:confirmed&&typed==="DELETE"?t.danger:t.faded,color:"#fff",fontFamily:f,fontSize:"14px",fontWeight:500,cursor:confirmed&&typed==="DELETE"?"pointer":"default"}}>Delete Account</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// MAIN APP — Toggle between all new screens
// ═══════════════════════════════════════════
const screens=[
  {id:"p_all_bookings",l:"All Bookings (Provider)"},
  {id:"p_new_group",l:"New Service Group"},
  {id:"p_personal",l:"P: Personal Details"},
  {id:"p_business",l:"P: Business Details"},
  {id:"p_photos",l:"P: Photos & Portfolio"},
  {id:"p_payouts",l:"P: Payouts & Billing"},
  {id:"p_hours",l:"P: Working Hours"},
  {id:"p_notif_settings",l:"P: Notifications"},
  {id:"p_booking_settings",l:"P: Booking Settings"},
  {id:"p_help",l:"P: Help & Support"},
  {id:"p_delete",l:"P: Delete Account"},
  {id:"c_personal",l:"C: Personal Details"},
  {id:"c_payment_methods",l:"C: Payment Methods"},
  {id:"c_notif_settings",l:"C: Notifications"},
  {id:"c_privacy",l:"C: Privacy & Security"},
  {id:"c_help",l:"C: Help & Support"},
  {id:"c_delete",l:"C: Delete Account"},
];

export default function NewFlowsApp(){
  const [screen,setScreen]=useState("p_all_bookings");
  const render=()=>{
    switch(screen){
      case "p_all_bookings": return <PAllBookings go={setScreen}/>;
      case "p_new_group": return <PNewServiceGroup go={setScreen}/>;
      case "p_personal": return <PPersonalDetails go={setScreen}/>;
      case "p_business": return <PBusinessDetails go={setScreen}/>;
      case "p_photos": return <PPhotosPortfolio go={setScreen}/>;
      case "p_payouts": return <PPayoutsBilling go={setScreen}/>;
      case "p_hours": return <PWorkingHours go={setScreen}/>;
      case "p_notif_settings": return <PNotifSettings go={setScreen} backTo="p_profile"/>;
      case "p_booking_settings": return <PBookingSettings go={setScreen}/>;
      case "p_help": return <HelpSupport go={setScreen} backTo="p_profile"/>;
      case "p_delete": return <DeleteAccount go={setScreen} backTo="p_profile"/>;
      case "c_personal": return <CPersonalDetails go={setScreen}/>;
      case "c_payment_methods": return <CPaymentMethods go={setScreen}/>;
      case "c_notif_settings": return <PNotifSettings go={setScreen} backTo="c_profile"/>;
      case "c_privacy": return <CPrivacySecurity go={setScreen}/>;
      case "c_help": return <HelpSupport go={setScreen} backTo="c_profile"/>;
      case "c_delete": return <DeleteAccount go={setScreen} backTo="c_profile"/>;
      default: return <PAllBookings go={setScreen}/>;
    }
  };
  return(
    <div style={{padding:"1rem 0 2rem",minHeight:"100vh",background:"#EDE6DD"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&display=swap');*{box-sizing:border-box;-webkit-font-smoothing:antialiased}button:active{transform:scale(0.98)}::-webkit-scrollbar{display:none}`}</style>
      <div style={{display:"flex",flexWrap:"wrap",justifyContent:"center",gap:"4px",margin:"0 16px 1.25rem",padding:"4px"}}>
        {screens.map(s=><button key={s.id} onClick={()=>setScreen(s.id)} style={{padding:"6px 12px",borderRadius:"9999px",border:"none",fontSize:"10px",fontFamily:f,fontWeight:screen===s.id?600:400,background:screen===s.id?t.ink:t.avatarBg,color:screen===s.id?"#fff":t.muted,cursor:"pointer"}}>{s.l}</button>)}
      </div>
      <div style={{display:"flex",justifyContent:"center"}}><Phone>{render()}</Phone></div>
    </div>
  );
}
