// SideMenu
// Source: kliques-prototype.jsx (v4 — Apple Health gradient + card UI)

function SideMenu({open,onClose,items,active,onNav,userName,userInitials}){
  if(!open) return null;
  return(
    <div style={{position:"absolute",inset:0,zIndex:50,display:"flex"}}>
      <div onClick={onClose} style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.4)"}}/>
      <div style={{position:"relative",width:"280px",height:"100%",background:t.card,display:"flex",flexDirection:"column",boxShadow:"4px 0 24px rgba(0,0,0,0.1)",animation:"slideIn 0.25s ease-out"}}>
        <div style={{padding:"24px 20px 20px",borderBottom:"0.5px solid "+t.divider}}>
          <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
            <Avatar initials={userInitials} size={44} bg={t.accentLight} color={t.accent}/>
            <div><p style={{fontFamily:f,fontSize:"16px",fontWeight:700,color:t.fg,margin:0}}>{userName}</p><Logo size={14}/></div>
          </div>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"8px 0"}}>
          {items.map(item=>(
            <button key={item.id} onClick={()=>{onNav(item.id);onClose()}} style={{
              display:"flex",alignItems:"center",gap:"14px",
              padding:"14px 20px",background:active===item.id?t.accentLight:"transparent",
              border:"none",cursor:"pointer",width:"100%",textAlign:"left",
              borderRight:active===item.id?"3px solid "+t.accent:"3px solid transparent",
            }}>
              <svg width="22" height="22" fill={active===item.id?t.accent:"none"} stroke={active===item.id?t.accent:t.muted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d={item.d}/></svg>
              <span style={{fontFamily:f,fontSize:"15px",fontWeight:active===item.id?700:500,color:active===item.id?t.fg:t.muted}}>{item.label}</span>
              {item.badge&&<div style={{width:"8px",height:"8px",borderRadius:"50%",background:t.accent,marginLeft:"auto"}}/>}
              {item.count&&<span style={{marginLeft:"auto",padding:"2px 8px",borderRadius:"9999px",background:t.accent,color:"#fff",fontFamily:f,fontSize:"11px",fontWeight:700}}>{item.count}</span>}
            </button>
          ))}
        </div>
        <div style={{padding:"16px 20px",borderTop:"0.5px solid "+t.divider}}>
          <p style={{fontFamily:f,fontSize:"12px",color:t.muted,margin:0,textAlign:"center"}}>kliques · relationship OS</p>
        </div>
      </div>
    </div>
  );
}
