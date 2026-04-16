import { useEffect, useRef, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { request } from '../../data/apiClient';
import { useIsDesktop } from '../../hooks/useIsDesktop';
import { formatMoney } from '../../utils/formatMoney';

const T = {
  ink: '#3D231E',
  muted: '#8C6A64',
  faded: '#B0948F',
  accent: '#C25E4A',
  line: 'rgba(140,106,100,0.18)',
  card: '#FFFFFF',
  avatarBg: '#F2EBE5',
  base: '#FBF7F2',
  hero: '#FDDCC6',
  success: '#5A8A5E',
  successBg: '#EBF2EC',
};
const F = "'Sora',system-ui,sans-serif";

function fmtDuration(mins) {
  if (!mins) return null;
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h} hr ${m} min` : `${h} hr`;
}

const fmtPrice = (val, currency = 'cad') => (val == null ? null : formatMoney(val, currency));

export default function ProviderNewServiceGroup() {
  const navigate = useNavigate();
  const nameRef = useRef(null);
  const isDesktop = useIsDesktop();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (nameRef.current) nameRef.current.focus();
  }, []);

  useEffect(() => {
    setLoadingServices(true);
    request('/provider/services')
      .then((data) => {
        setServices(data.services || []);
      })
      .catch(() => {
        setServices([]);
      })
      .finally(() => {
        setLoadingServices(false);
      });
  }, []);

  function toggle(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function handleSubmit() {
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const result = await request('/provider/service-groups', {
        method: 'POST',
        body: JSON.stringify({ name: name.trim(), description: description.trim() }),
      });
      const groupId = result.group.id;
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          request(`/provider/services/${id}/group`, { method: 'PATCH', body: JSON.stringify({ group_id: groupId }) })
        )
      );
      navigate('/provider/services', { replace: true });
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = {
    width: '100%', padding: '14px 16px', borderRadius: 12,
    border: `1px solid ${T.line}`, fontFamily: F, fontSize: 14,
    color: T.ink, outline: 'none', background: T.avatarBg,
    boxSizing: 'border-box',
  };

  const lbl = (text) => (
    <span style={{ fontSize: 11, fontWeight: 500, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>
      {text}
    </span>
  );

  const ServicesList = () => (
    <>
      {lbl('Add existing services')}
      <p style={{ fontFamily: F, fontSize: 13, color: T.muted, margin: '4px 0 16px', lineHeight: 1.5 }}>
        Move services into this group, or add new ones later.
      </p>
      {loadingServices
        ? [1, 2, 3].map((i) => (
            <div key={i} style={{ height: 48, borderRadius: 10, background: 'rgba(140,106,100,0.08)', marginBottom: 8, animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))
        : services.map((svc) => {
            const checked = selectedIds.has(svc.id);
            return (
              <div key={svc.id}>
                <button onClick={() => toggle(svc.id)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: F }}>
                  <div style={{ width: 22, height: 22, borderRadius: 6, border: checked ? 'none' : `1.5px solid ${T.line}`, background: checked ? T.accent : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {checked && <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: F, fontSize: 15, color: T.ink, margin: 0, fontWeight: 500 }}>{svc.name}</p>
                    {(fmtDuration(svc.duration) || fmtPrice(svc.price, svc.currency)) && (
                      <p style={{ fontFamily: F, fontSize: 13, color: T.muted, margin: '2px 0 0' }}>
                        {[fmtDuration(svc.duration), fmtPrice(svc.price, svc.currency)].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>
                </button>
                <div style={{ height: 1, background: T.line }} />
              </div>
            );
          })}
      {!loadingServices && services.length === 0 && (
        <p style={{ fontFamily: F, fontSize: 14, color: T.muted, margin: '8px 0 0', fontStyle: 'italic' }}>No services yet. You can add services to this group later.</p>
      )}
    </>
  );

  const ActionButtons = ({ compact }) => (
    <div style={{ display: 'flex', gap: 10, paddingTop: compact ? 24 : 32, paddingBottom: compact ? 0 : 40 }}>
      <button onClick={() => navigate(-1)} style={{ flex: 1, padding: 16, borderRadius: 12, border: `1px solid ${T.line}`, background: 'transparent', fontFamily: F, fontSize: 13, fontWeight: 500, color: T.ink, cursor: 'pointer' }}>
        Cancel
      </button>
      <button onClick={handleSubmit} disabled={!name.trim() || saving} style={{ flex: 2, padding: 16, borderRadius: 12, border: 'none', background: name.trim() && !saving ? T.ink : T.faded, color: '#fff', fontFamily: F, fontSize: 13, fontWeight: 500, cursor: name.trim() && !saving ? 'pointer' : 'default' }}>
        {saving ? 'Creating…' : 'Create Group'}
      </button>
    </div>
  );

  if (isDesktop) {
    return (
      <div style={{ minHeight: '100vh', background: T.base, fontFamily: F, padding: '48px 40px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 24, padding: 0, fontFamily: F, fontSize: 13, color: T.muted }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M15 19l-7-7 7-7" /></svg>
            Back
          </button>
          <h1 style={{ fontFamily: F, fontSize: 32, fontWeight: 600, letterSpacing: '-0.03em', color: T.ink, margin: '0 0 6px' }}>Create a group.</h1>
          <p style={{ fontFamily: F, fontSize: 15, color: T.muted, margin: '0 0 36px', lineHeight: 1.6 }}>Groups help clients browse your services by category.</p>

          <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 32, alignItems: 'flex-start' }}>
            {/* Left: form */}
            <div style={{ background: T.card, borderRadius: 20, border: `1px solid ${T.line}`, padding: '32px 32px' }}>
              <div style={{ marginBottom: 24 }}>
                {lbl('Group name')}
                <input ref={nameRef} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Private Sessions, Workshops…" style={inputStyle} />
              </div>
              <div style={{ marginBottom: 8 }}>
                {lbl('Description (optional)')}
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What kind of services belong in this group?" rows={4} style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
              {error && <p style={{ fontFamily: F, fontSize: 13, color: '#B04040', margin: '8px 0 0' }}>{error}</p>}
              <ActionButtons compact />
            </div>

            {/* Right: services checklist */}
            <div style={{ background: T.card, borderRadius: 20, border: `1px solid ${T.line}`, padding: '32px 32px' }}>
              <ServicesList />
            </div>
          </div>
        </div>
        <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: T.base, display: 'flex', flexDirection: 'column', fontFamily: F }}>
      {/* Nav bar */}
      <div style={{ padding: '20px 24px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, display: 'flex', alignItems: 'center' }}>
          <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={T.ink} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M15 19l-7-7 7-7" /></svg>
        </button>
        <span style={{ fontSize: 13, fontWeight: 500, color: T.muted }}>New Group</span>
        <div style={{ width: 28 }} />
      </div>

      {/* Content area */}
      <div style={{ padding: '8px 24px 0', flex: 1, display: 'flex', flexDirection: 'column', maxWidth: 600, width: '100%', margin: '0 auto' }}>
        <h1 style={{ fontFamily: F, fontSize: 28, fontWeight: 400, letterSpacing: '-0.03em', color: T.ink, margin: '0 0 6px' }}>Create a group.</h1>
        <p style={{ fontFamily: F, fontSize: 15, color: T.muted, margin: '0 0 28px', lineHeight: 1.6 }}>Groups help clients browse your services by category.</p>

        <div style={{ marginBottom: 24 }}>
          {lbl('Group name')}
          <input ref={nameRef} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Private Sessions, Workshops…" style={{ ...inputStyle, marginBottom: 0 }} />
        </div>

        <div style={{ marginBottom: 28 }}>
          {lbl('Description (optional)')}
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What kind of services belong in this group?" rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
        </div>

        <div style={{ height: 1, background: T.line, marginBottom: 24 }} />

        <ServicesList />

        {error && <p style={{ fontFamily: F, fontSize: 13, color: '#B04040', margin: '12px 0 0' }}>{error}</p>}

        <div style={{ marginTop: 'auto' }}>
          <ActionButtons />
        </div>
      </div>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
    </div>
  );
}
