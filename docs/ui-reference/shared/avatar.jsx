// Avatar
// Source: kliques-prototype.jsx (v4 — Apple Health gradient + card UI)

function Avatar({initials,size=44,bg="#fff3",color="#fff"}){return(
  <div style={{width:size,height:size,borderRadius:"50%",background:bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:f,fontSize:size*0.32,fontWeight:700,color,flexShrink:0,backdropFilter:"blur(10px)",border:"1px solid rgba(255,255,255,0.3)"}}>{initials}</div>
)}
