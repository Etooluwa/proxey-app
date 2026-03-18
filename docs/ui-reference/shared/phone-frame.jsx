// Phone
// Source: kliques-prototype.jsx (v4 — Apple Health gradient + card UI)

function Phone({children,screen,setScreen,screenList,labels}) {
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
      <div style={{display:"flex",flexWrap:"wrap",gap:"4px",justifyContent:"center",maxWidth:"400px"}}>
        {screenList.map(s=><button key={s} onClick={()=>setScreen(s)} style={{padding:"4px 11px",borderRadius:"9999px",border:"none",fontSize:"10.5px",fontFamily:f,fontWeight:screen===s?700:500,background:screen===s?t.fg:"#E5E5EA",color:screen===s?"#fff":t.muted,cursor:"pointer"}}>{labels[s]}</button>)}
      </div>
    </div>
  );
}
