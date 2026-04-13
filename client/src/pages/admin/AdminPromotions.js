import React, { useEffect, useState } from 'react';
import { fetchAdminPromotions } from '../../data/admin';

const INK = '#3D231E';
const MUTED = '#8C6A64';
const FADED = '#B0948F';
const ACCENT = '#C25E4A';
const LINE = 'rgba(140,106,100,0.2)';
const AVATAR_BG = '#F2EBE5';

const formatDiscount = (promo) => {
  if (promo.discount_type === 'percentage') return `${promo.discount_value}%`;
  return `$${(promo.discount_value / 100).toFixed(2)}`;
};

const isActive = (promo) => {
  if (!promo.is_active) return false;
  const now = new Date();
  if (promo.start_date && new Date(promo.start_date) > now) return false;
  if (promo.end_date && new Date(promo.end_date) < now) return false;
  if (promo.usage_limit && promo.usage_count >= promo.usage_limit) return false;
  return true;
};

const AdminPromotions = () => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const data = await fetchAdminPromotions();
        if (!cancelled) setPromotions(data.promotions || []);
      } catch (err) {
        console.error('Failed to load promotions', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold" style={{ color: INK, letterSpacing: '-0.03em' }}>Promotions</h1>
        <p className="text-sm mt-1" style={{ color: MUTED }}>View all promotional codes on the platform</p>
      </div>

      {/* Table */}
      <div>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: LINE, borderTopColor: ACCENT }} />
          </div>
        ) : promotions.length > 0 ? (
          <div>
            <div
              className="grid gap-4 px-4 py-3 text-[11px] uppercase tracking-widest font-medium"
              style={{ gridTemplateColumns: '1.5fr 2fr 1fr 1fr 1fr 2fr', borderBottom: `1px solid ${LINE}`, color: FADED }}
            >
              <span>Code</span>
              <span>Provider</span>
              <span>Discount</span>
              <span>Usage</span>
              <span>Status</span>
              <span>Valid Period</span>
            </div>
            {promotions.map((promo) => {
              const active = isActive(promo);
              return (
                <div
                  key={promo.id}
                  className="grid gap-4 px-4 py-4 items-center"
                  style={{ gridTemplateColumns: '1.5fr 2fr 1fr 1fr 1fr 2fr', borderBottom: `1px solid ${LINE}` }}
                >
                  <span
                    className="font-mono text-xs font-bold px-2 py-1 rounded-lg"
                    style={{ background: AVATAR_BG, color: INK }}
                  >
                    {promo.code}
                  </span>
                  <span className="text-sm truncate" style={{ color: MUTED }}>{promo.provider_name || '—'}</span>
                  <span>
                    <span className="text-sm font-medium" style={{ color: ACCENT }}>{formatDiscount(promo)} off</span>
                    <span className="text-[11px] ml-1" style={{ color: FADED }}>({promo.discount_type})</span>
                  </span>
                  <span className="text-sm" style={{ color: MUTED }}>
                    {promo.usage_count || 0}
                    {promo.usage_limit ? ` / ${promo.usage_limit}` : ' / ∞'}
                  </span>
                  <span
                    className="text-[11px] font-medium px-2 py-0.5 rounded-full inline-block"
                    style={{
                      background: active ? '#EBF2EC' : AVATAR_BG,
                      color: active ? '#5A8A5E' : MUTED,
                    }}
                  >
                    {active ? 'Active' : 'Inactive'}
                  </span>
                  <span className="text-xs" style={{ color: MUTED }}>
                    {promo.start_date && promo.end_date ? (
                      `${new Date(promo.start_date).toLocaleDateString()} – ${new Date(promo.end_date).toLocaleDateString()}`
                    ) : promo.start_date ? (
                      `From ${new Date(promo.start_date).toLocaleDateString()}`
                    ) : promo.end_date ? (
                      `Until ${new Date(promo.end_date).toLocaleDateString()}`
                    ) : (
                      'No limit'
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div
            className="flex items-center justify-center py-16 rounded-xl"
            style={{ border: `1px dashed ${LINE}` }}
          >
            <p className="text-sm" style={{ color: MUTED }}>No promotions found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPromotions;
