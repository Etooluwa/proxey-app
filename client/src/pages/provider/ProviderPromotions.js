import { useEffect, useState } from 'react';
import { useToast } from '../../components/ui/ToastProvider';
import { request } from '../../data/apiClient';

const T = {
    base: '#FBF7F2',
    ink: '#3D231E',
    muted: '#8C6A64',
    faded: '#B0948F',
    accent: '#C25E4A',
    hero: '#FDDCC6',
    avatarBg: '#F2EBE5',
    line: 'rgba(140,106,100,0.2)',
    successBg: '#EBF2EC',
    success: '#5A8A5E',
    dangerBg: '#FDEDEA',
    callout: '#FFF5E6',
};
const F = "'Sora', system-ui, sans-serif";

const EMPTY_FORM = {
    promoCode: '',
    discountType: 'percentage',
    discountValue: 0,
    applicableServices: [],
    startAt: '',
    endAt: '',
    isActive: true,
};

function inputStyle(extra = {}) {
    return {
        width: '100%', padding: '10px 12px',
        borderRadius: 12, border: `1px solid ${T.line}`,
        background: '#fff', fontFamily: F, fontSize: 14, color: T.ink,
        outline: 'none', boxSizing: 'border-box',
        ...extra,
    };
}

function labelStyle() {
    return {
        display: 'block', marginBottom: 6,
        fontFamily: F, fontSize: 11, fontWeight: 500,
        textTransform: 'uppercase', letterSpacing: '0.05em', color: T.faded,
    };
}

function formatDate(iso) {
    if (!iso) return null;
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function isPromoActive(promo) {
    if (!promo.is_active) return false;
    const now = new Date();
    if (promo.start_at && new Date(promo.start_at) > now) return false;
    if (promo.end_at && new Date(promo.end_at) < now) return false;
    return true;
}

function PromoCard({ promo, onEdit, onDeactivate }) {
    const active = isPromoActive(promo);
    return (
        <div style={{ borderBottom: `1px solid ${T.line}`, padding: '18px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <span style={{
                    fontFamily: "'Sora', monospace", fontSize: 13, fontWeight: 700,
                    padding: '4px 10px', borderRadius: 8,
                    background: T.avatarBg, color: T.ink, letterSpacing: '0.04em',
                }}>
                    {promo.promo_code}
                </span>
                <span style={{
                    padding: '3px 10px', borderRadius: 9999,
                    fontFamily: F, fontSize: 11, fontWeight: 500,
                    background: active ? T.successBg : T.avatarBg,
                    color: active ? T.success : T.muted,
                    marginLeft: 'auto',
                }}>
                    {active ? 'Active' : 'Inactive'}
                </span>
            </div>

            <p style={{ margin: '0 0 4px', fontFamily: F, fontSize: 14, color: T.ink }}>
                {promo.discount_type === 'percentage'
                    ? `${promo.discount_value}% off`
                    : `$${promo.discount_value} off`}
            </p>

            {(promo.start_at || promo.end_at) && (
                <p style={{ margin: '0 0 10px', fontFamily: F, fontSize: 12, color: T.faded }}>
                    {promo.start_at ? `From ${formatDate(promo.start_at)}` : ''}
                    {promo.start_at && promo.end_at ? ' – ' : ''}
                    {promo.end_at ? `Until ${formatDate(promo.end_at)}` : ''}
                </p>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
                <button
                    onClick={() => onEdit(promo)}
                    style={{
                        flex: 1, padding: '9px 0', borderRadius: 10,
                        border: `1px solid ${T.line}`, background: 'transparent',
                        fontFamily: F, fontSize: 13, fontWeight: 600, color: T.ink, cursor: 'pointer',
                    }}
                >
                    Edit
                </button>
                {promo.is_active && (
                    <button
                        onClick={() => onDeactivate(promo.id)}
                        style={{
                            flex: 1, padding: '9px 0', borderRadius: 10,
                            border: `1px solid ${T.line}`, background: 'transparent',
                            fontFamily: F, fontSize: 13, fontWeight: 600, color: T.muted, cursor: 'pointer',
                        }}
                    >
                        Deactivate
                    </button>
                )}
            </div>
        </div>
    );
}

const ProviderPromotions = () => {
    const toast = useToast();
    const [promotions, setPromotions] = useState([]);
    const [services, setServices] = useState([]);
    const [view, setView] = useState('list');
    const [editing, setEditing] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState(EMPTY_FORM);

    useEffect(() => {
        let cancelled = false;
        async function load() {
            setLoading(true);
            try {
                const [promosResp, servicesResp] = await Promise.all([
                    request('/provider/promotions'),
                    request('/services'),
                ]);
                if (!cancelled) {
                    setPromotions(promosResp.promotions || []);
                    setServices(servicesResp.services || []);
                }
            } catch (error) {
                console.error('Failed to load promotions', error);
                if (!cancelled) { setPromotions([]); setServices([]); }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        load();
        return () => { cancelled = true; };
    }, []);

    const resetForm = () => { setEditing(null); setFormData(EMPTY_FORM); };

    const handleEdit = (promo) => {
        setEditing(promo.id);
        setFormData({
            promoCode: promo.promo_code,
            discountType: promo.discount_type,
            discountValue: promo.discount_value,
            applicableServices: promo.applicable_services || [],
            startAt: promo.start_at || '',
            endAt: promo.end_at || '',
            isActive: promo.is_active,
        });
        setView('create');
    };

    const handleDeactivate = async (id) => {
        try {
            await request(`/provider/promotions/${id}`, {
                method: 'PATCH',
                body: JSON.stringify({ isActive: false }),
            });
            setPromotions((prev) => prev.map((p) => p.id === id ? { ...p, is_active: false } : p));
        } catch (error) {
            toast.push({ title: 'Error', description: error.message, variant: 'error' });
        }
    };

    const handleSave = async () => {
        if (!formData.promoCode || !formData.discountValue || formData.applicableServices.length === 0) {
            toast.push({ title: 'Missing fields', description: 'Promo code, discount value, and service are required.', variant: 'error' });
            return;
        }
        const payload = {
            promoCode: formData.promoCode,
            discountType: formData.discountType,
            discountValue: Number(formData.discountValue),
            applicableServices: formData.applicableServices,
            startAt: formData.startAt || null,
            endAt: formData.endAt || null,
            isActive: formData.isActive,
        };
        setSaving(true);
        try {
            if (editing) {
                const resp = await request(`/provider/promotions/${editing}`, { method: 'PATCH', body: JSON.stringify(payload) });
                setPromotions((prev) => prev.map((p) => p.id === editing ? resp.promotion : p));
            } else {
                const resp = await request('/provider/promotions', { method: 'POST', body: JSON.stringify(payload) });
                setPromotions((prev) => [resp.promotion, ...prev]);
            }
            setView('list');
            resetForm();
        } catch (error) {
            toast.push({ title: 'Error saving promotion', description: error.message, variant: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const field = (key, val) => setFormData((f) => ({ ...f, [key]: val }));

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
                <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    border: `2px solid ${T.accent}`, borderTopColor: 'transparent',
                    animation: 'spin 0.7s linear infinite',
                }} />
                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (view === 'create') {
        return (
            <div style={{ fontFamily: F, maxWidth: 560, margin: '0 auto', padding: '0 20px 40px' }}>
                <style>{`@keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>

                <button
                    onClick={() => { setView('list'); resetForm(); }}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontFamily: F, fontSize: 13, color: T.muted,
                        padding: '20px 0 16px', marginLeft: -4,
                    }}
                >
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Back
                </button>

                <div style={{ marginBottom: 24, animation: 'fadeUp 0.35s ease both' }}>
                    <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: T.accent }}>
                        Promotions
                    </p>
                    <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600, letterSpacing: '-0.03em', color: T.ink }}>
                        {editing ? 'Edit Promotion' : 'New Promotion'}
                    </h1>
                </div>

                <div style={{ animation: 'fadeUp 0.35s ease 0.08s both' }}>
                    {/* Promo code */}
                    <div style={{ marginBottom: 18 }}>
                        <label style={labelStyle()}>Promo Code</label>
                        <input
                            value={formData.promoCode}
                            onChange={(e) => field('promoCode', e.target.value.toUpperCase())}
                            placeholder="SPRING20"
                            style={inputStyle()}
                        />
                    </div>

                    {/* Discount type + value */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
                        <div>
                            <label style={labelStyle()}>Type</label>
                            <select value={formData.discountType} onChange={(e) => field('discountType', e.target.value)} style={inputStyle()}>
                                <option value="percentage">Percentage</option>
                                <option value="fixed">Fixed amount</option>
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle()}>Value</label>
                            <input
                                type="number"
                                value={formData.discountValue}
                                onChange={(e) => field('discountValue', Number(e.target.value))}
                                placeholder={formData.discountType === 'percentage' ? '20' : '10'}
                                style={inputStyle()}
                            />
                        </div>
                    </div>

                    {/* Service */}
                    <div style={{ marginBottom: 18 }}>
                        <label style={labelStyle()}>Applies To</label>
                        <select
                            value={formData.applicableServices[0] || ''}
                            onChange={(e) => field('applicableServices', e.target.value ? [e.target.value] : [])}
                            style={inputStyle()}
                        >
                            <option value="">Select a service</option>
                            {services.map((svc) => (
                                <option key={svc.id} value={svc.name || svc.title}>{svc.name || svc.title}</option>
                            ))}
                        </select>
                    </div>

                    {/* Dates */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
                        <div>
                            <label style={labelStyle()}>Start Date (optional)</label>
                            <input type="date" value={formData.startAt} onChange={(e) => field('startAt', e.target.value)} style={inputStyle()} />
                        </div>
                        <div>
                            <label style={labelStyle()}>End Date (optional)</label>
                            <input type="date" value={formData.endAt} onChange={(e) => field('endAt', e.target.value)} style={inputStyle()} />
                        </div>
                    </div>

                    {/* Active toggle */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28, padding: '14px 16px', borderRadius: 14, background: T.avatarBg }}>
                        <input
                            id="isActive"
                            type="checkbox"
                            checked={formData.isActive}
                            onChange={(e) => field('isActive', e.target.checked)}
                            style={{ width: 16, height: 16, accentColor: T.accent }}
                        />
                        <label htmlFor="isActive" style={{ fontFamily: F, fontSize: 14, color: T.ink, cursor: 'pointer' }}>
                            Active immediately
                        </label>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 10 }}>
                        <button
                            onClick={() => { setView('list'); resetForm(); }}
                            style={{
                                flex: 1, padding: '13px', borderRadius: 14,
                                border: `1px solid ${T.line}`, background: 'transparent',
                                fontFamily: F, fontSize: 15, fontWeight: 600, color: T.muted, cursor: 'pointer',
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            style={{
                                flex: 2, padding: '13px', borderRadius: 14,
                                border: 'none', background: T.ink,
                                fontFamily: F, fontSize: 15, fontWeight: 600, color: '#fff',
                                cursor: 'pointer', opacity: saving ? 0.6 : 1,
                            }}
                        >
                            {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Promotion'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ fontFamily: F, maxWidth: 560, margin: '0 auto', padding: '0 20px 40px' }}>
            <style>{`
                @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '20px 0 24px', animation: 'fadeUp 0.35s ease both' }}>
                <div>
                    <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: T.accent }}>
                        Promotions
                    </p>
                    <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600, letterSpacing: '-0.03em', color: T.ink }}>
                        My Promotions
                    </h1>
                </div>
                <button
                    onClick={() => { resetForm(); setView('create'); }}
                    style={{
                        padding: '10px 18px', borderRadius: 12,
                        border: 'none', background: T.ink,
                        fontFamily: F, fontSize: 13, fontWeight: 600,
                        color: '#fff', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 6,
                    }}
                >
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                    </svg>
                    New
                </button>
            </div>

            {promotions.length === 0 ? (
                <div style={{
                    padding: '48px 24px', borderRadius: 20,
                    border: `1px dashed ${T.line}`, textAlign: 'center',
                    animation: 'fadeUp 0.35s ease 0.08s both',
                }}>
                    <p style={{ margin: '0 0 6px', fontFamily: F, fontSize: 15, fontWeight: 500, color: T.ink }}>No promotions yet</p>
                    <p style={{ margin: 0, fontFamily: F, fontSize: 13, color: T.muted }}>Create your first promotion to attract more clients.</p>
                </div>
            ) : (
                <div style={{ animation: 'fadeUp 0.35s ease 0.08s both' }}>
                    {promotions.map((promo) => (
                        <PromoCard
                            key={promo.id}
                            promo={promo}
                            onEdit={handleEdit}
                            onDeactivate={handleDeactivate}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default ProviderPromotions;
