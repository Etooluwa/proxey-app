// Footer
// Source: kliques-prototype.jsx (v4 — Apple Health gradient + card UI)

function Footer(){return(
  <div style={{padding:"32px 20px 40px",marginTop:"auto"}}>
    <div style={{display:"flex",justifyContent:"center",marginBottom:"12px"}}>
      <Logo size={18} color={t.muted}/>
    </div>
    <div style={{display:"flex",justifyContent:"center",gap:"16px",marginBottom:"12px",flexWrap:"wrap"}}>
      {["About","Terms","Privacy","Support"].map(link=>(
        <span key={link} style={{fontFamily:f,fontSize:"13px",color:t.muted,cursor:"pointer",fontWeight:500}}>{link}</span>
      ))}
    </div>
    <p style={{fontFamily:f,fontSize:"11px",color:"#C7C7CC",margin:0,textAlign:"center"}}>© 2026 Kliques. All rights reserved.</p>
  </div>
)}
