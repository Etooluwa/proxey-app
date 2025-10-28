import "../../styles/ui/skeleton.css";

function Skeleton({ height = 16, width = "100%", radius = 12, className = "" }) {
  const style = {
    height,
    width,
    borderRadius: radius,
  };
  return <div className={["ui-skeleton", className].filter(Boolean).join(" ")} style={style} />;
}

export default Skeleton;
