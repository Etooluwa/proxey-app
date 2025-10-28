import "../../styles/provider/earningCard.css";

function EarningCard({ title, amount, supporting }) {
  const displayAmount =
    typeof amount === "number" ? `$${(amount / 100).toFixed(2)}` : amount;

  return (
    <div className="provider-earning-card">
      <p className="provider-earning-card__label">{title}</p>
      <p className="provider-earning-card__value">{displayAmount}</p>
      {supporting ? (
        <p className="provider-earning-card__supporting">{supporting}</p>
      ) : null}
    </div>
  );
}

export default EarningCard;
