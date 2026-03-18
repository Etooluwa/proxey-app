// MenuBtn
// Source: kliques-prototype.jsx (v4 — Apple Health gradient + card UI)

function MenuBtn({onClick,white}){return(
  <button onClick={onClick} style={{background:"none",border:"none",cursor:"pointer",padding:"8px",margin:"-8px",display:"flex"}} aria-label="Open menu">
    <svg width="24" height="24" fill="none" stroke={white?"#fff":t.fg} strokeWidth="2" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round"/></svg>
  </button>
)}
