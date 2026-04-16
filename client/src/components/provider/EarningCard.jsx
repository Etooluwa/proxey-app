import "../../styles/provider/earningCard.css";
import { formatMoney } from "../../utils/formatMoney";

function EarningCard({ title, amount, supporting, currency = 'cad' }) {
  const displayAmount =
    typeof amount === "number" ? formatMoney(amount, currency) : amount;

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
