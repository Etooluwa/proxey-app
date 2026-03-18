// GradientHeader
// Source: kliques-prototype.jsx (v4 — Apple Health gradient + card UI)

function GradientHeader({onMenu,title,subtitle,right,children}){return(
  <div style={{background:grad,padding:"0 20px",paddingBottom:"48px",borderRadius:"0 0 28px 28px",marginBottom:"-20px",position:"relative",zIndex:1}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px",paddingTop:"4px"}}>
      <MenuBtn onClick={onMenu} white/>
      <Logo size={20} color="#fff"/>
      {right||<div style={{width:"40px"}}/>}
    </div>
    {title&&<h1 style={{fontFamily:f,fontSize:"30px",fontWeight:700,color:"#fff",margin:"0 0 4px"}}>{title}</h1>}
    {subtitle&&<p style={{fontFamily:f,fontSize:"15px",color:"rgba(255,255,255,0.8)",margin:0}}>{subtitle}</p>}
    {children}
  </div>
)}

// ═══════════════════════════════════════════
// MENU DEFINITIONS
// ═══════════════════════════════════════════
const clientMenu = [
  {id:"c_providers",label:"My kliques",d:"M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"},
  {id:"c_messages",label:"Messages",d:"M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",badge:true},
  {id:"c_profile",label:"Profile",d:"M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"},
];
const provMenu = [
  {id:"p_dashboard",label:"Home",d:"M3 12.5l9-9 9 9M5 11v8a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-8"},
  {id:"p_bookings",label:"Bookings",d:"M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",count:"3"},
  {id:"p_clients",label:"My kliques",d:"M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"},
  {id:"p_services",label:"Services",d:"M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"},
  {id:"p_calendar",label:"Calendar",d:"M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"},
  {id:"p_messages",label:"Messages",d:"M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",badge:true},
  {id:"p_earnings",label:"Earnings",d:"M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"},
  {id:"p_profile",label:"Profile",d:"M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"},
];
const clientScreens = ["c_providers","c_relationship","c_services","c_service_detail","c_time","c_confirmed","c_messages","c_profile"];
const clientLabels = {c_providers:"My kliques",c_relationship:"Relationship",c_services:"Services",c_service_detail:"Service",c_time:"Time",c_confirmed:"Confirmed",c_messages:"Messages",c_profile:"Profile"};
const provScreens=["p_dashboard","p_bookings","p_clients","p_timeline","p_services","p_service_edit","p_calendar","p_messages","p_earnings","p_alerts","p_appt_detail","p_profile"];
const provLabels={p_dashboard:"Dashboard",p_bookings:"Bookings",p_clients:"My kliques",p_timeline:"Timeline",p_services:"Services",p_service_edit:"Edit service",p_calendar:"Calendar",p_messages:"Messages",p_earnings:"Earnings",p_alerts:"Alerts",p_appt_detail:"Appt detail",p_profile:"Profile"};
