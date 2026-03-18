// CProviders
// Source: kliques-prototype.jsx (v4 — Apple Health gradient + card UI)

function CProviders({go,onMenu}){
  const providers=[
    {name:"Anny Wong",role:"Vocal Trainer",rating:"4.9",visits:12,initials:"AW",lastVisit:"Mar 12"},
    {name:"Mia Chen",role:"Hairstylist",rating:"4.8",visits:8,initials:"MC",lastVisit:"Feb 28"},
    {name:"James Okafor",role:"Personal Trainer",rating:"4.7",visits:3,initials:"JO",lastVisit:"Jan 15"},
  ];
  return(
    <div style={{height:"100%",background:t.bg,overflowY:"auto",display:"flex",flexDirection:"column"}}>
      <GradientHeader onMenu={onMenu} title="My kliques" subtitle="Your relationships" right={<Avatar initials="ET" size={36}/>}/>
      <div style={{padding:"32px 16px 0",flex:1,display:"flex",flexDirection:"column"}}>
        {providers.map((p,i)=>(
          <Card key={p.name} onClick={()=>go("c_relationship")} style={{display:"flex",alignItems:"center",gap:"14px",cursor:"pointer"}}>
            <Avatar initials={p.initials} size={52} bg={t.accentLight} color={t.accent}/>
            <div style={{flex:1,minWidth:0}}>
              <p style={{fontFamily:f,fontSize:"16px",fontWeight:600,color:t.fg,margin:"0 0 2px"}}>{p.name}</p>
              <p style={{fontFamily:f,fontSize:"14px",color:t.muted,margin:"0 0 4px"}}>{p.role}</p>
              <div style={{display:"flex",gap:"12px"}}><span style={{fontFamily:f,fontSize:"12px",color:t.muted}}>★ {p.rating}</span><span style={{fontFamily:f,fontSize:"12px",color:t.muted}}>{p.visits} visits</span><span style={{fontFamily:f,fontSize:"12px",color:t.muted}}>Last: {p.lastVisit}</span></div>
            </div>
            <svg width="20" height="20" fill="none" stroke={t.muted} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </Card>
        ))}
      <Footer/></div>
    </div>
  );
}
