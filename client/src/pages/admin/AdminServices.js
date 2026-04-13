import React, { useEffect, useState } from 'react';
import { fetchAdminServices } from '../../data/admin';

const INK = '#3D231E';
const MUTED = '#8C6A64';
const FADED = '#B0948F';
const ACCENT = '#C25E4A';
const LINE = 'rgba(140,106,100,0.2)';
const AVATAR_BG = '#F2EBE5';

const formatCurrency = (cents) => {
  if (!cents) return '—';
  return `$${(cents / 100).toFixed(2)}`;
};

const AdminServices = () => {
  const [services, setServices] = useState([]);
  const [categoryCounts, setCategoryCounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const data = await fetchAdminServices();
        if (!cancelled) {
          setServices(data.services || []);
          setCategoryCounts(data.categoryCounts || []);
        }
      } catch (err) {
        console.error('Failed to load services', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold" style={{ color: INK, letterSpacing: '-0.03em' }}>Services</h1>
        <p className="text-sm mt-1" style={{ color: MUTED }}>Browse all services on the platform</p>
      </div>

      {/* Category breakdown */}
      {categoryCounts.length > 0 && (
        <div>
          <h2 className="text-base font-semibold mb-4" style={{ color: INK }}>By Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {categoryCounts.map((cat) => (
              <div
                key={cat.category}
                className="p-4 rounded-2xl text-center"
                style={{ background: AVATAR_BG }}
              >
                <p className="text-2xl font-semibold mb-1" style={{ color: INK, letterSpacing: '-0.02em' }}>{cat.count}</p>
                <p className="text-[11px] truncate" style={{ color: MUTED }}>{cat.category}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div>
        <h2 className="text-base font-semibold mb-4" style={{ color: INK }}>All Services</h2>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: LINE, borderTopColor: ACCENT }} />
          </div>
        ) : services.length > 0 ? (
          <div>
            <div
              className="grid gap-4 px-4 py-3 text-[11px] uppercase tracking-widest font-medium"
              style={{ gridTemplateColumns: '2fr 2fr 1.5fr 1fr 1fr 1fr', borderBottom: `1px solid ${LINE}`, color: FADED }}
            >
              <span>Service</span>
              <span>Provider</span>
              <span>Category</span>
              <span>Price</span>
              <span>Duration</span>
              <span>Status</span>
            </div>
            {services.map((service) => (
              <div
                key={service.id}
                className="grid gap-4 px-4 py-4 items-center"
                style={{ gridTemplateColumns: '2fr 2fr 1.5fr 1fr 1fr 1fr', borderBottom: `1px solid ${LINE}` }}
              >
                <span className="text-sm font-medium" style={{ color: INK }}>{service.name}</span>
                <span className="text-sm truncate" style={{ color: MUTED }}>{service.provider_name || '—'}</span>
                <span
                  className="text-[11px] font-medium px-2 py-0.5 rounded-full inline-block"
                  style={{ background: AVATAR_BG, color: MUTED }}
                >
                  {service.category || 'Uncategorized'}
                </span>
                <span className="text-sm font-medium" style={{ color: INK }}>{formatCurrency(service.price)}</span>
                <span className="text-sm" style={{ color: MUTED }}>
                  {service.duration ? `${service.duration} min` : '—'}
                </span>
                <span
                  className="text-[11px] font-medium px-2 py-0.5 rounded-full inline-block"
                  style={{
                    background: service.is_active !== false ? '#EBF2EC' : '#FDEDEA',
                    color: service.is_active !== false ? '#5A8A5E' : '#A04030',
                  }}
                >
                  {service.is_active !== false ? 'Active' : 'Inactive'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div
            className="flex items-center justify-center py-16 rounded-xl"
            style={{ border: `1px dashed ${LINE}` }}
          >
            <p className="text-sm" style={{ color: MUTED }}>No services found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminServices;
