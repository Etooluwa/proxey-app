/**
 * ProviderGroupEditor — edit a service group
 * Route: /provider/services/groups/:groupId
 *
 * Features:
 *   - Edit group name + description (auto-save on blur)
 *   - See services in this group — click to edit
 *   - Add existing ungrouped services to this group
 *   - Delete group (reassigns services to General)
 */
import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { request } from '../../data/apiClient';
import { useIsDesktop } from '../../hooks/useIsDesktop';
import SettingsPageLayout from '../../components/ui/SettingsPageLayout';
import { formatMoney } from '../../utils/formatMoney';

const T = {
    ink: '#3D231E', muted: '#8C6A64', faded: '#B0948F', accent: '#C25E4A',
    line: 'rgba(140,106,100,0.18)', card: '#FFFFFF', avatarBg: '#F2EBE5',
    base: '#FBF7F2', danger: '#B04040', dangerBg: '#FDEDEA',
};
const F = "'Sora',system-ui,sans-serif";

const fmtPrice = (val, currency = 'cad') => (val == null ? null : formatMoney(val, currency));
function fmtDuration(mins) {
    if (!mins) return null;
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60), m = mins % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
}

const Divider = () => <div style={{ height: 1, background: T.line }} />;

const Lbl = ({ children, style = {} }) => (
    <span style={{ display: 'block', fontSize: 11, fontWeight: 500, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, ...style }}>
        {children}
    </span>
);

const inputStyle = {
    width: '100%', padding: '13px 16px', borderRadius: 12,
    border: `1px solid ${T.line}`, fontFamily: F, fontSize: 14,
    color: T.ink, outline: 'none', background: T.avatarBg, boxSizing: 'border-box',
};

export default function ProviderGroupEditor() {
    const navigate = useNavigate();
    const { groupId } = useParams();
    const isDesktop = useIsDesktop();

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [groupServices, setGroupServices] = useState([]);   // services in this group
    const [allServices, setAllServices] = useState([]);       // all provider services
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [saveError, setSaveError] = useState(null);
    const [showAddServices, setShowAddServices] = useState(false);

    const savedName = useRef('');
    const savedDesc = useRef('');

    // ── Load ────────────────────────────────────────────────────────────────
    useEffect(() => {
        setLoading(true);
        request('/provider/services')
            .then((data) => {
                const groups = data.groups || [];
                const services = data.services || [];
                const group = groups.find((g) => g.id === groupId);
                if (group) {
                    setName(group.name);
                    setDescription(group.description || '');
                    savedName.current = group.name;
                    savedDesc.current = group.description || '';
                }
                setGroupServices(services.filter((s) => s.group_id === groupId));
                setAllServices(services);
            })
            .catch((err) => console.error('[ProviderGroupEditor] load error:', err))
            .finally(() => setLoading(false));
    }, [groupId]);

    const ungroupedServices = allServices.filter((s) => !s.group_id || s.group_id !== groupId);

    // ── Save name/description ───────────────────────────────────────────────
    const handleSave = async () => {
        if (!name.trim()) return;
        if (name === savedName.current && description === savedDesc.current) return;
        setSaving(true);
        setSaveError(null);
        try {
            await request(`/provider/service-groups/${groupId}`, {
                method: 'PUT',
                body: JSON.stringify({ name: name.trim(), description: description.trim() }),
            });
            savedName.current = name.trim();
            savedDesc.current = description.trim();
        } catch (err) {
            setSaveError(err.message || 'Failed to save');
        } finally {
            setSaving(false);
        }
    };

    // ── Add service to this group ───────────────────────────────────────────
    const handleAddService = async (svc) => {
        try {
            await request(`/provider/services/${svc.id}/group`, {
                method: 'PATCH',
                body: JSON.stringify({ group_id: groupId }),
            });
            setGroupServices((prev) => [...prev, { ...svc, group_id: groupId }]);
            setAllServices((prev) => prev.map((s) => s.id === svc.id ? { ...s, group_id: groupId } : s));
        } catch (err) {
            console.error('[ProviderGroupEditor] add service error:', err);
        }
    };

    // ── Remove service from this group ──────────────────────────────────────
    const handleRemoveService = async (svc) => {
        try {
            await request(`/provider/services/${svc.id}/group`, {
                method: 'PATCH',
                body: JSON.stringify({ group_id: null }),
            });
            setGroupServices((prev) => prev.filter((s) => s.id !== svc.id));
            setAllServices((prev) => prev.map((s) => s.id === svc.id ? { ...s, group_id: null } : s));
        } catch (err) {
            console.error('[ProviderGroupEditor] remove service error:', err);
        }
    };

    // ── Delete group ────────────────────────────────────────────────────────
    const handleDelete = async () => {
        if (!window.confirm(`Delete "${name}"? All services will move to General.`)) return;
        setDeleting(true);
        try {
            await request(`/provider/service-groups/${groupId}`, { method: 'DELETE' });
            navigate('/provider/services', { replace: true });
        } catch (err) {
            console.error('[ProviderGroupEditor] delete error:', err);
            setDeleting(false);
        }
    };

    const ServiceRow = ({ svc, action }) => {
        const meta = [fmtDuration(svc.duration), fmtPrice(svc.base_price, svc.currency)].filter(Boolean).join(' · ');
        return (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0' }}>
                <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => navigate(`/provider/services/${svc.id}`)}>
                    <p style={{ fontFamily: F, fontSize: 15, color: T.ink, margin: 0 }}>{svc.name}</p>
                    {meta && <p style={{ fontFamily: F, fontSize: 12, color: T.muted, margin: '2px 0 0' }}>{meta}</p>}
                </div>
                <button
                    onClick={() => action.fn(svc)}
                    style={{ fontFamily: F, fontSize: 12, fontWeight: 500, color: action.danger ? T.danger : T.accent, background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, marginLeft: 16 }}
                >
                    {action.label}
                </button>
            </div>
        );
    };

    return (
        <SettingsPageLayout title="Edit Group">
            {loading ? (
                <p style={{ fontFamily: F, fontSize: 14, color: T.muted, marginTop: 24 }}>Loading…</p>
            ) : (
                <>
                    {/* ── Name + Description ── */}
                    <div style={{ marginBottom: 20 }}>
                        <Lbl>Group Name</Lbl>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onBlur={handleSave}
                            style={inputStyle}
                        />
                    </div>
                    <div style={{ marginBottom: 8 }}>
                        <Lbl>Description (optional)</Lbl>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            onBlur={handleSave}
                            rows={3}
                            placeholder="What kind of services belong here?"
                            style={{ ...inputStyle, resize: 'vertical' }}
                        />
                    </div>

                    {saveError && <p style={{ fontFamily: F, fontSize: 12, color: T.danger, margin: '4px 0 12px' }}>{saveError}</p>}

                    <button
                        onClick={handleSave}
                        disabled={saving || !name.trim()}
                        style={{ padding: '12px 20px', borderRadius: 12, border: 'none', background: saving ? T.faded : T.ink, fontFamily: F, fontSize: 13, fontWeight: 500, color: '#fff', cursor: saving ? 'default' : 'pointer', marginBottom: 32 }}
                    >
                        {saving ? 'Saving…' : 'Save Changes'}
                    </button>

                    <Divider />

                    {/* ── Services in this group ── */}
                    <div style={{ marginTop: 24, marginBottom: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                            <Lbl style={{ marginBottom: 0 }}>Services in this group</Lbl>
                            <button
                                onClick={() => setShowAddServices((v) => !v)}
                                style={{ fontFamily: F, fontSize: 12, fontWeight: 500, color: T.accent, background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                                {showAddServices ? 'Done' : '+ Add services'}
                            </button>
                        </div>

                        {groupServices.length === 0 && !showAddServices && (
                            <p style={{ fontFamily: F, fontSize: 13, color: T.faded, marginTop: 8 }}>No services yet. Add some above.</p>
                        )}

                        {groupServices.map((svc, i) => (
                            <div key={svc.id}>
                                <ServiceRow svc={svc} action={{ label: 'Remove', danger: false, fn: handleRemoveService }} />
                                {i < groupServices.length - 1 && <Divider />}
                            </div>
                        ))}

                        {/* ── Add existing ungrouped services ── */}
                        {showAddServices && ungroupedServices.length > 0 && (
                            <div style={{ marginTop: 16 }}>
                                <Divider />
                                <Lbl style={{ marginTop: 16 }}>Other services (tap to add)</Lbl>
                                {ungroupedServices.map((svc, i) => (
                                    <div key={svc.id}>
                                        <ServiceRow svc={svc} action={{ label: '+ Add', danger: false, fn: handleAddService }} />
                                        {i < ungroupedServices.length - 1 && <Divider />}
                                    </div>
                                ))}
                            </div>
                        )}
                        {showAddServices && ungroupedServices.length === 0 && (
                            <p style={{ fontFamily: F, fontSize: 13, color: T.faded, marginTop: 12 }}>No other services to add.</p>
                        )}
                    </div>

                    <div style={{ marginTop: 32, paddingTop: 24, borderTop: `1px solid ${T.line}` }}>
                        <button
                            onClick={handleDelete}
                            disabled={deleting}
                            style={{
                                width: '100%', padding: '14px', borderRadius: 12,
                                border: `1px solid rgba(176,64,64,0.3)`, background: T.dangerBg,
                                fontFamily: F, fontSize: 13, fontWeight: 500, color: T.danger,
                                cursor: deleting ? 'default' : 'pointer', opacity: deleting ? 0.6 : 1,
                            }}
                        >
                            {deleting ? 'Deleting…' : 'Delete Group'}
                        </button>
                        <p style={{ fontFamily: F, fontSize: 12, color: T.faded, textAlign: 'center', margin: '8px 0 0' }}>
                            Services will move to General, not be deleted.
                        </p>
                    </div>
                </>
            )}
        </SettingsPageLayout>
    );
}
