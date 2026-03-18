// CRelationship
// Source: kliques-prototype.jsx (v4 — Apple Health gradient + card UI)

function CRelationship({go}){
  const timeline=[
    {date:"Mar 12, 2026",svc:"1-on-1 Vocal Lesson",dur:"1 hr",price:"$85",note:"Worked on breath control and upper range. Ready for recital."},
    {date:"Feb 26, 2026",svc:"Performance Coaching",dur:"45 min",price:"$95",note:"Stage presence exercises. Reviewed video of last open mic."},
    {date:"Feb 12, 2026",svc:"1-on-1 Vocal Lesson",dur:"1 hr",price:"$85",note:"Focus on vibrato technique. Assigned warm-up exercises."},
    {date:"Jan 29, 2026",svc:"Group Class",dur:"1 hr, 30 min",price:"$45",note:"Harmonies workshop. Great progress on ear training."},
  ];
  return(
    <div style={{height:"100%",background:t.bg,overflowY:"auto",display:"flex",flexDirection:"column"}}>
      <div style={{background:grad,padding:"0 20px 48px",borderRadius:"0 0 28px 28px",marginBottom:"-20px",position:"relative",zIndex:1}}>
        <div style={{paddingTop:"4px",marginBottom:"16px"}}><button onClick={()=>go("c_providers")} style={{background:"none",border:"none",cursor:"pointer",padding:"8px",margin:"-8px",display:"flex"}}><svg width="24" height="24" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/></svg></button></div>
        <div style={{display:"flex",alignItems:"center",gap:"14px",marginBottom:"16px"}}>
          <Avatar initials="AW" size={60}/>
          <div><p style={{fontFamily:f,fontSize:"22px",fontWeight:700,color:"#fff",margin:"0 0 2px"}}>Anny Wong</p><p style={{fontFamily:f,fontSize:"14px",color:"rgba(255,255,255,0.8)",margin:0}}>Vocal Trainer · Ottawa, ON</p></div>
        </div>
        <div style={{display:"flex",gap:"10px"}}>{[{l:"Together since",v:"Jan '26"},{l:"Sessions",v:"12"},{l:"Spent",v:"$1,045"}].map(s=><div key={s.l} style={{flex:1,padding:"12px 10px",borderRadius:"12px",background:"rgba(255,255,255,0.2)",backdropFilter:"blur(10px)"}}><p style={{fontFamily:f,fontSize:"11px",color:"rgba(255,255,255,0.7)",margin:"0 0 4px"}}>{s.l}</p><p style={{fontFamily:f,fontSize:"18px",fontWeight:700,color:"#fff",margin:0}}>{s.v}</p></div>)}</div>
      </div>
      <div style={{padding:"32px 16px 0",flex:1,display:"flex",flexDirection:"column"}}>
        <div style={{display:"flex",gap:"8px",marginBottom:"16px"}}>
          <button onClick={()=>go("c_services")} style={{flex:1,padding:"14px",borderRadius:"12px",border:"none",background:t.ctaBg,color:t.ctaText,fontFamily:f,fontSize:"15px",fontWeight:700,cursor:"pointer"}}>Book appointment</button>
          <button onClick={()=>go("c_messages")} style={{flex:1,padding:"14px",borderRadius:"12px",border:"1px solid "+t.divider,background:t.card,fontFamily:f,fontSize:"15px",fontWeight:600,color:t.fg,cursor:"pointer"}}>Message</button>
        </div>
        <p style={{fontFamily:f,fontSize:"18px",fontWeight:700,color:t.fg,margin:"8px 4px 14px"}}>History</p>
        {timeline.map((item,i)=>(
          <div key={i} style={{display:"flex",gap:"0"}}>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",width:"24px",flexShrink:0,paddingTop:"20px"}}>
              <div style={{width:"10px",height:"10px",borderRadius:"50%",background:i===0?t.accent:t.success,flexShrink:0,border:"2px solid "+t.bg,zIndex:1}}/>
              {i<timeline.length-1&&<div style={{width:"2px",flex:1,background:t.divider,marginTop:"-1px"}}/>}
            </div>
            <div style={{flex:1}}>
              <Card>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"4px"}}><div><p style={{fontFamily:f,fontSize:"16px",fontWeight:600,color:t.fg,margin:"0 0 2px"}}>{item.svc}</p><p style={{fontFamily:f,fontSize:"13px",color:t.muted,margin:0}}>{item.date} · {item.dur}</p></div><span style={{fontFamily:f,fontSize:"15px",fontWeight:600,color:t.fg}}>{item.price}</span></div>
                <p style={{fontFamily:f,fontSize:"14px",color:t.muted,margin:"8px 0 10px",lineHeight:1.5}}>{item.note}</p>
                <button onClick={()=>go("c_services")} style={{padding:"6px 14px",borderRadius:"9999px",border:"1px solid "+t.divider,background:t.bg,fontFamily:f,fontSize:"13px",fontWeight:600,color:t.fg,cursor:"pointer"}}>Rebook</button>
              </Card>
            </div>
          </div>
        ))}
      <Footer/></div>
    </div>
  );
}
