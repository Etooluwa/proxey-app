// Card
// Source: kliques-prototype.jsx (v4 — Apple Health gradient + card UI)

function Card({children,style={},onClick}){return(
  <div onClick={onClick} style={{background:t.card,borderRadius:"16px",padding:"16px",marginBottom:"12px",boxShadow:"0 1px 3px rgba(0,0,0,0.04)",cursor:onClick?"pointer":"default",...style}}>{children}</div>
)}
