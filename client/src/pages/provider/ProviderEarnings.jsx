import { useEffect, useState } from "react";
import EarningCard from "../../components/provider/EarningCard";
import Card from "../../components/ui/Card";
import Skeleton from "../../components/ui/Skeleton";
import { useToast } from "../../components/ui/ToastProvider";
import { fetchProviderEarnings } from "../../data/provider";
import "../../styles/provider/providerEarnings.css";

function ProviderEarnings() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [earnings, setEarnings] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const data = await fetchProviderEarnings();
        if (!cancelled) setEarnings(data);
      } catch (error) {
        if (!cancelled) {
          toast.push({
            title: "Unable to load earnings",
            description: error.message,
            variant: "error",
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [toast]);

  return (
    <div className="provider-earnings">
      {loading ? (
        <Skeleton height={120} />
      ) : (
        <div className="provider-earnings__grid">
          <EarningCard title="Total earnings" amount={earnings?.totalEarned || 0} />
          <EarningCard
            title="Pending payout"
            amount={earnings?.pendingPayout || 0}
            supporting="Payouts process every Monday."
          />
        </div>
      )}

      <Card className="provider-earnings__history">
        <h2>Transaction history</h2>
        {loading ? (
          <div className="provider-earnings__transactions">
            <Skeleton height={48} />
            <Skeleton height={48} />
            <Skeleton height={48} />
          </div>
        ) : earnings?.transactions?.length ? (
          <ul className="provider-earnings__transactions">
            {earnings.transactions.map((txn) => (
              <li key={txn.id}>
                <div>
                  <p className="provider-earnings__txn-title">{txn.clientName}</p>
                  <p className="provider-earnings__txn-meta">
                    {new Date(txn.date).toLocaleString()} · Job #{txn.jobId}
                  </p>
                </div>
                <span className="provider-earnings__txn-amount">
                  ${(txn.amount / 100).toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="provider-earnings__empty">
            No payouts yet. Completed bookings will appear here.
          </p>
        )}
      </Card>
    </div>
  );
}

export default ProviderEarnings;
