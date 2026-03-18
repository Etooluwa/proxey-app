// Nav
// Source: kliques-prototype.jsx (v4 — Apple Health gradient + card UI)

function Nav({onBack,onClose,title}){return(
  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 16px 4px",minHeight:"44px"}}>
    {onBack?<button onClick={onBack} style={{background:"none",border:"none",cursor:"pointer",padding:"8px",margin:"-8px",display:"flex"}} aria-label="Back"><svg width="24" height="24" fill="none" stroke={t.fg} strokeWidth="2" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/></svg></button>:<div style={{width:"40px"}}/>}
    {title&&<span style={{fontFamily:f,fontSize:"17px",fontWeight:600,color:t.fg}}>{title}</span>}
    {onClose?<button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",padding:"8px",margin:"-8px",display:"flex"}} aria-label="Close"><svg width="24" height="24" fill="none" stroke={t.fg} strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/></svg></button>:<div style={{width:"40px"}}/>}
  </div>
)}
