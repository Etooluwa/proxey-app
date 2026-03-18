// KliquesApp - Main Router
// Source: kliques-prototype.jsx (v4)

export default function KliquesApp(){
  const [role,setRole]=useState("client");
  const [cs,setCs]=useState("c_providers");
  const [ps,setPs]=useState("p_dashboard");
  const [menuOpen,setMenuOpen]=useState(false);
  const openMenu=()=>setMenuOpen(true);const closeMenu=()=>setMenuOpen(false);
  const clientActiveMenu=["c_providers","c_relationship"].includes(cs)?"c_providers":cs;
  const provActiveMenu=["p_timeline","p_service_edit","p_alerts","p_appt_detail"].includes(ps)?(ps==="p_timeline"?"p_clients":ps==="p_service_edit"?"p_services":"p_dashboard"):ps;
  const clientRender=()=>{const p={go:setCs,onMenu:openMenu};switch(cs){case "c_providers":return <CProviders {...p}/>;case "c_relationship":return <CRelationship go={setCs}/>;case "c_services":return <CServices go={setCs}/>;case "c_service_detail":return <CServiceDetail go={setCs}/>;case "c_time":return <CTime go={setCs}/>;case "c_confirmed":return <CConfirmed go={setCs}/>;case "c_messages":return <CMessages {...p}/>;case "c_profile":return <CProfileScreen {...p}/>;default:return <CProviders {...p}/>;}};
  const provRender=()=>{const p={go:setPs,onMenu:openMenu};switch(ps){case "p_dashboard":return <PDashboard {...p}/>;case "p_bookings":return <PBookings {...p}/>;case "p_clients":return <PClients {...p}/>;case "p_timeline":return <PTimeline go={setPs}/>;case "p_services":return <PServices {...p}/>;case "p_service_edit":return <PServiceEdit go={setPs}/>;case "p_calendar":return <PCalendar {...p}/>;case "p_messages":return <PMessages {...p}/>;case "p_earnings":return <PEarnings {...p}/>;case "p_alerts":return <PAlerts go={setPs}/>;case "p_appt_detail":return <PApptDetail go={setPs}/>;case "p_profile":return <PProfileScreen {...p}/>;default:return <PDashboard {...p}/>;}};
  return(
    <div style={{padding:"1rem 0 2rem",minHeight:"100vh",background:"#E5E5EA"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Playfair+Display:wght@700&display=swap');*{box-sizing:border-box;-webkit-font-smoothing:antialiased}button:active{transform:scale(0.98)}::-webkit-scrollbar{display:none}textarea{font-family:'Manrope',system-ui,sans-serif}@keyframes slideIn{from{transform:translateX(-100%)}to{transform:translateX(0)}}`}</style>
      <div style={{display:"flex",justifyContent:"center",gap:"4px",marginBottom:"1.25rem",padding:"4px",background:"#D1D1D6",borderRadius:"12px",width:"fit-content",margin:"0 auto 1.25rem"}}>
        {["client","provider"].map(r=><button key={r} onClick={()=>{setRole(r);setMenuOpen(false)}} style={{padding:"10px 28px",borderRadius:"10px",border:"none",fontFamily:f,fontSize:"14px",fontWeight:role===r?700:500,background:role===r?"#fff":"transparent",color:role===r?t.fg:t.muted,cursor:"pointer",boxShadow:role===r?"0 1px 3px rgba(0,0,0,0.08)":"none",textTransform:"capitalize"}}>{r} flow</button>)}
      </div>
      <div style={{display:"flex",justifyContent:"center"}}>
        {role==="client"
          ?<Phone screen={cs} setScreen={setCs} screenList={clientScreens} labels={clientLabels}>{clientRender()}<SideMenu open={menuOpen} onClose={closeMenu} items={clientMenu} active={clientActiveMenu} onNav={setCs} userName="Eto" userInitials="ET"/></Phone>
          :<Phone screen={ps} setScreen={setPs} screenList={provScreens} labels={provLabels}>{provRender()}<SideMenu open={menuOpen} onClose={closeMenu} items={provMenu} active={provActiveMenu} onNav={setPs} userName="Anny Wong" userInitials="AW"/></Phone>
        }
      </div>
    </div>
  );
}
