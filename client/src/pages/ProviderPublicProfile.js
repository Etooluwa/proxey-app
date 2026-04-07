import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { request } from '../data/apiClient';

const T = {
  base: '#FBF7F2', ink: '#3D231E', muted: '#8C6A64', faded: '#B0948F',
  accent: '#C25E4A', hero: '#FDDCC6', avatarBg: '#F2EBE5',
  line: 'rgba(140,106,100,0.2)', success: '#5A8A5E', successBg: '#EBF2EC',
  card: '#FFFFFF',
};
const F = "'Sora', system-ui, sans-serif";

const formatAge = (dateStr) => {
  const d = new Date(dateStr);
  const diffDays = Math.floor((Date.now() - d) / 86400000);
  if (diffDays < 1) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 30) return `${diffDays}d ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

const initials = (name = '') =>
  name.split(' ').slice(0, 2).map(w => w[0] || '').join('').toUpperCase() || '?';

const fmtPrice = (cents) => {
  if (!cents && cents !== 0) return '';
  const dollars = cents >= 100 ? cents / 100 : cents;
  return `$${dollars % 1 === 0 ? dollars : dollars.toFixed(2)}`;
};

const fmtDur = (mins) => {
  if (!mins) return '';
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
};

const isPerHourService = (service) =>
  service?.metadata?.pricingType === 'per_hour' || service?.unit === 'hour';

const getMinHours = (service) => Math.max(Number(service?.metadata?.minHours ?? 1) || 1, 1);

const getMaxHours = (service) => {
  const minHours = getMinHours(service);
  return Math.max(Number(service?.metadata?.maxHours ?? minHours) || minHours, minHours);
};

const fmtServiceSummary = (service) => {
  if (!service) return { duration: '', price: '' };
  if (isPerHourService(service)) {
    const minHours = getMinHours(service);
    const maxHours = getMaxHours(service);
    return {
      duration: minHours === maxHours
        ? `${minHours} ${minHours === 1 ? 'hour' : 'hours'}`
        : `${minHours}–${maxHours} hours`,
      price: service.base_price != null ? `${fmtPrice(service.base_price)}/hr` : '',
    };
  }
  return {
    duration: service.duration_minutes ? fmtDur(service.duration_minutes) : '',
    price: service.base_price != null ? fmtPrice(service.base_price) : '',
  };
};

// ── Divider ────────────────────────────────────────────────────────────────────
function Divider() {
  return <div style={{ height: '1px', background: T.line }} />;
}

// ── Label ─────────────────────────────────────────────────────────────────────
function Lbl({ children, color = T.muted, style = {} }) {
  return (
    <span style={{
      fontFamily: F, fontSize: '11px', fontWeight: 500, color,
      letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', ...style,
    }}>
      {children}
    </span>
  );
}

// ── Star row ──────────────────────────────────────────────────────────────────
function Stars({ rating = 5 }) {
  return (
    <span style={{ fontFamily: F, fontSize: '13px', color: T.accent, letterSpacing: '1px' }}>
      {'★'.repeat(Math.round(rating))}{'☆'.repeat(5 - Math.round(rating))}
    </span>
  );
}

// ── Group service list ─────────────────────────────────────────────────────────
function ServiceGroup({ name, services, selected, onToggle }) {
  return (
    <div style={{ marginBottom: '4px' }}>
      <Lbl color={T.ink} style={{ padding: '10px 0 6px' }}>{name}</Lbl>
      <Divider />
      {services.map(s => {
        const isSelected = selected.includes(s.id);
        const summary = fmtServiceSummary(s);
        return (
          <div key={s.id}>
            <button
              onClick={() => onToggle(s.id)}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                padding: '18px 0', background: 'none', border: 'none', cursor: 'pointer',
                width: '100%', textAlign: 'left',
              }}
            >
              <div style={{ flex: 1, paddingRight: '16px' }}>
                <p style={{ fontFamily: F, fontSize: '15px', fontWeight: 400, color: T.ink, margin: '0 0 4px' }}>{s.name}</p>
                {s.description && (
                  <p style={{ fontFamily: F, fontSize: '13px', color: T.muted, margin: '0 0 8px', lineHeight: 1.55 }}>{s.description}</p>
                )}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  {summary.duration && (
                    <Lbl color={T.faded} style={{ fontSize: '10px', margin: 0 }}>{summary.duration}</Lbl>
                  )}
                  {summary.price && (
                    <span style={{ fontFamily: F, fontSize: '14px', fontWeight: 500, color: T.ink }}>{summary.price}</span>
                  )}
                </div>
              </div>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0, marginTop: '2px',
                border: isSelected ? 'none' : `1.5px solid ${T.line}`,
                background: isSelected ? T.accent : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {isSelected && (
                  <svg width="13" height="13" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            </button>
            <Divider />
          </div>
        );
      })}
    </div>
  );
}

// ── Review card ───────────────────────────────────────────────────────────────
function ReviewCard({ review }) {
  return (
    <div>
      <div style={{ padding: '18px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <p style={{ fontFamily: F, fontSize: '14px', fontWeight: 500, color: T.ink, margin: 0 }}>
            {review.client_name || 'Client'}
          </p>
          <Stars rating={review.rating} />
        </div>
        {review.comment && (
          <p style={{ fontFamily: F, fontSize: '14px', color: T.muted, margin: '0 0 4px', lineHeight: 1.6, fontStyle: 'italic' }}>
            "{review.comment}"
          </p>
        )}
        <span style={{ fontFamily: F, fontSize: '11px', color: T.faded }}>{formatAge(review.created_at)}</span>
      </div>
      <Divider />
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ProviderPublicProfile() {
  const { handle, providerId } = useParams();
  const navigate = useNavigate();

  const [provider, setProvider] = useState(null);
  const [services, setServices] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [selected, setSelected] = useState([]);

  const isHandleMode = !!handle; // /book/:handle vs /app/provider/:providerId

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handle, providerId]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      if (isHandleMode) {
        // Public route — fetch by handle, no auth required
        const data = await request(`/provider/public/${handle}`);
        setProvider(data.provider);
        setServices(data.services || []);
        // Load reviews for provider
        loadReviews(data.provider.id);
      } else {
        // Authenticated client view — fetch by provider ID
        const [profileData, servicesData] = await Promise.all([
          request(`/provider/${providerId}/profile`).catch(() => null),
          request(`/provider/${providerId}/services`).catch(() => ({ services: [] })),
        ]);
        if (!profileData) { setNotFound(true); return; }
        setProvider(profileData.profile || profileData);
        setServices(servicesData.services || []);
        loadReviews(providerId);
      }
    } catch (err) {
      console.error('[ProviderPublicProfile]', err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const loadReviews = async (id) => {
    try {
      const data = await request(`/provider/${id}/reviews`);
      // Only show verified reviews on public page
      const filtered = (data.reviews || []).filter(r => r.is_verified !== false);
      setReviews(filtered);
    } catch {
      setReviews([]);
    }
  };

  const toggleService = (id) =>
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleBookNow = () => {
    const selectedServices = services.filter(s => selected.includes(s.id));
    navigate('/app/booking-flow', {
      state: { providerId: provider.id, providerName: provider.name || provider.business_name, services: selectedServices },
    });
  };

  // ── Group services by category ─────────────────────────────────────────────
  const grouped = services.reduce((acc, s) => {
    const key = s.category || 'Services';
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});
  const groupEntries = Object.entries(grouped);
  const flatGroups = groupEntries.length === 1 && groupEntries[0][0] === 'Services'
    ? [{ name: 'Available Services', services: groupEntries[0][1] }]
    : groupEntries.map(([name, svcs]) => ({ name, services: svcs }));

  const providerName = provider?.name || provider?.business_name || 'Provider';
  const providerRole = provider?.category || '';
  const providerCity = provider?.city || '';
  const subtitle = [providerRole, providerCity].filter(Boolean).join(' · ');

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: T.base, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: `2px solid ${T.hero}`, borderTopColor: T.accent, animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          <span style={{ fontSize: '14px', color: T.muted }}>Loading…</span>
        </div>
      </div>
    );
  }

  // ── Not found ──────────────────────────────────────────────────────────────
  if (notFound || !provider) {
    return (
      <div style={{ minHeight: '100vh', background: T.base, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: F }}>
        <p style={{ fontSize: '18px', color: T.ink, marginBottom: '8px' }}>Page not found.</p>
        <p style={{ fontSize: '14px', color: T.muted, marginBottom: '28px' }}>This provider page doesn't exist or may have moved.</p>
        <button
          onClick={() => navigate('/')}
          style={{ padding: '12px 28px', borderRadius: '10px', background: T.ink, color: '#fff', border: 'none', fontFamily: F, fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}
        >
          Go home
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: T.base, fontFamily: F }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600&display=swap');*{box-sizing:border-box;-webkit-font-smoothing:antialiased}`}</style>

      {/* ── Minimal Header ─────────────────────────────────────────────── */}
      <div style={{
        padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: `1px solid ${T.line}`,
      }}>
        <span style={{ fontFamily: F, fontSize: '16px', fontWeight: 600, color: T.accent, letterSpacing: '-0.01em' }}>
          kliques
        </span>
        <button
          onClick={() => {
            if (navigator.share) {
              navigator.share({ title: providerName, url: window.location.href }).catch(() => {});
            } else {
              navigator.clipboard?.writeText(window.location.href).catch(() => {});
            }
          }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center' }}
          aria-label="Share"
        >
          <svg width="20" height="20" fill="none" stroke={T.ink} strokeWidth="1.5" viewBox="0 0 24 24">
            <path d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* ── Provider Hero ──────────────────────────────────────────────── */}
      <div style={{ padding: '36px 24px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        {/* Avatar with verified badge */}
        <div style={{ position: 'relative', marginBottom: '16px' }}>
          {provider.avatar ? (
            <img
              src={provider.avatar}
              alt={providerName}
              style={{ width: '88px', height: '88px', borderRadius: '50%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{
              width: '88px', height: '88px', borderRadius: '50%', background: T.hero,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '28px', fontWeight: 400, color: T.ink,
            }}>
              {initials(providerName)}
            </div>
          )}
          {/* Green verified badge */}
          <div style={{
            position: 'absolute', bottom: '2px', right: '2px',
            width: '22px', height: '22px', borderRadius: '50%',
            background: T.success, border: `2px solid ${T.base}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="10" height="10" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        <h1 style={{ fontFamily: F, fontSize: '28px', fontWeight: 400, letterSpacing: '-0.03em', color: T.ink, margin: '0 0 4px' }}>
          {providerName}
        </h1>
        {subtitle && <Lbl style={{ marginBottom: '16px', fontSize: '12px' }}>{subtitle}</Lbl>}

        {/* Stats row */}
        <div style={{ display: 'flex', gap: '24px', marginBottom: '20px' }}>
          {[
            { l: 'Rating', v: provider.rating ? `${parseFloat(provider.rating).toFixed(1)} ★` : '—' },
            { l: 'Reviews', v: reviews.length > 0 ? reviews.length : (provider.review_count || '—') },
            { l: 'Clients', v: provider.clients_count || '—' },
          ].map(s => (
            <div key={s.l} style={{ textAlign: 'center' }}>
              <span style={{ fontFamily: F, fontSize: '16px', fontWeight: 400, letterSpacing: '-0.02em', color: T.accent, display: 'block' }}>{s.v}</span>
              <Lbl style={{ marginTop: '2px', fontSize: '10px' }}>{s.l}</Lbl>
            </div>
          ))}
        </div>

        {/* Bio */}
        {provider.bio && (
          <p style={{ fontFamily: F, fontSize: '14px', color: T.muted, margin: 0, lineHeight: 1.7, maxWidth: '320px', fontStyle: 'italic' }}>
            "{provider.bio}"
          </p>
        )}
      </div>

      {/* ── Content ────────────────────────────────────────────────────── */}
      <div style={{ padding: '0 24px' }}>
        <Divider />

        {/* Services */}
        {services.length > 0 ? (
          <>
            <Lbl style={{ margin: '24px 0 8px' }}>Available Services</Lbl>
            {flatGroups.map(group => (
              <ServiceGroup
                key={group.name}
                name={group.name}
                services={group.services}
                selected={selected}
                onToggle={toggleService}
              />
            ))}
          </>
        ) : (
          <div style={{ padding: '32px 0', textAlign: 'center' }}>
            <p style={{ fontFamily: F, fontSize: '14px', color: T.muted }}>No services listed yet.</p>
          </div>
        )}

        {/* Reviews */}
        {reviews.length > 0 && (
          <>
            <Lbl style={{ margin: '32px 0 0' }}>What Clients Say</Lbl>
            <Divider style={{ marginBottom: 0 }} />
            {reviews.slice(0, 6).map(r => <ReviewCard key={r.id} review={r} />)}
          </>
        )}

        {/* Details */}
        <Lbl style={{ margin: '32px 0 0' }}>Details</Lbl>
        <Divider />
        {[
          providerCity && { l: 'Location', v: providerCity },
          provider.languages && { l: 'Languages', v: provider.languages },
          { l: 'Cancellation', v: 'Free up to 24 hrs before' },
        ].filter(Boolean).map(d => (
          <div key={d.l}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0' }}>
              <span style={{ fontFamily: F, fontSize: '14px', color: T.muted }}>{d.l}</span>
              <span style={{ fontFamily: F, fontSize: '14px', color: T.ink }}>{d.v}</span>
            </div>
            <Divider />
          </div>
        ))}

        {/* Powered by footer */}
        <div style={{ padding: '40px 0 80px', textAlign: 'center' }}>
          <Lbl color={T.faded} style={{ fontSize: '10px' }}>Powered by Kliques</Lbl>
        </div>
      </div>

      {/* ── Sticky Book Bar ────────────────────────────────────────────── */}
      {selected.length > 0 && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          padding: '16px 24px', background: T.base, borderTop: `1px solid ${T.line}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          zIndex: 100,
        }}>
          <div>
            <p style={{ fontFamily: F, fontSize: '14px', fontWeight: 500, color: T.ink, margin: '0 0 2px' }}>
              {selected.length} service{selected.length > 1 ? 's' : ''} selected
            </p>
            <Lbl color={T.faded} style={{ fontSize: '10px', margin: 0 }}>Select a time next</Lbl>
          </div>
          <button
            onClick={handleBookNow}
            style={{
              padding: '14px 32px', borderRadius: '12px', border: 'none',
              background: T.ink, color: '#fff', fontFamily: F, fontSize: '14px',
              fontWeight: 500, cursor: 'pointer',
            }}
          >
            Book Now
          </button>
        </div>
      )}
    </div>
  );
}
