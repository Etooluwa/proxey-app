/**
 * DeleteAccountPage — shared between client and provider
 * Client route:   /app/profile/privacy/delete
 * Provider route: /provider/profile/delete
 *
 * Flow:
 *   1. Warning card + explanation
 *   2. Checkbox gate → text input ("DELETE")
 *   3. Final confirmation modal
 *   4. DELETE /api/accounts/me → logout → /login with toast
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { request } from '../data/apiClient';
import { useSession } from '../auth/authContext';
import { useToast } from '../components/ui/ToastProvider';
import { useIsDesktop } from '../hooks/useIsDesktop';
import SettingsPageLayout from '../components/ui/SettingsPageLayout';

const T = {
    ink: '#3D231E', muted: '#8C6A64', faded: '#B0948F',
    line: 'rgba(140,106,100,0.18)', avatarBg: '#F2EBE5',
    base: '#FBF7F2', danger: '#B04040', dangerBg: '#FDEDEA',
};
const F = "'Sora',system-ui,sans-serif";

const Divider = () => <div style={{ height: 1, background: T.line }} />;

const WILL_BE_DELETED = [
    'Your profile and personal information',
    'All booking history and session records',
    'Messages and conversations',
    'Invoices and payment records',
    'Provider connections and relationships',
];

// ─── Final confirmation modal ─────────────────────────────────────────────────

const ConfirmModal = ({ onConfirm, onCancel, deleting }) => (
    <div
        style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(61,35,30,0.5)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            fontFamily: F,
        }}
        onClick={onCancel}
    >
        <div
            style={{
                background: '#fff', borderRadius: '24px 24px 0 0',
                padding: '28px 24px 40px', width: '100%', maxWidth: 480,
            }}
            onClick={(e) => e.stopPropagation()}
        >
            <div style={{ width: 40, height: 4, borderRadius: 2, background: T.line, margin: '0 auto 24px' }} />

            <h3 style={{ fontFamily: F, fontSize: 18, fontWeight: 600, color: T.danger, margin: '0 0 10px', textAlign: 'center' }}>
                Are you sure?
            </h3>
            <p style={{ fontFamily: F, fontSize: 14, color: T.muted, textAlign: 'center', lineHeight: 1.6, margin: '0 0 28px' }}>
                This will take effect immediately. Your account will be scheduled for permanent deletion after a 30-day grace period.
            </p>

            <div style={{ display: 'flex', gap: 10 }}>
                <button
                    onClick={onCancel}
                    disabled={deleting}
                    style={{
                        flex: 1, padding: '15px', borderRadius: 12,
                        border: `1px solid ${T.line}`, background: 'transparent',
                        fontFamily: F, fontSize: 14, fontWeight: 500,
                        color: T.ink, cursor: 'pointer',
                    }}
                >
                    Cancel
                </button>
                <button
                    onClick={onConfirm}
                    disabled={deleting}
                    style={{
                        flex: 1, padding: '15px', borderRadius: 12,
                        border: 'none', background: T.danger,
                        fontFamily: F, fontSize: 14, fontWeight: 600,
                        color: '#fff', cursor: deleting ? 'not-allowed' : 'pointer',
                        opacity: deleting ? 0.7 : 1,
                    }}
                >
                    {deleting ? 'Deleting…' : 'Yes, delete it'}
                </button>
            </div>
        </div>
    </div>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DeleteAccountPage() {
    const navigate = useNavigate();
    const { logout } = useSession();
    const { push: pushToast } = useToast();
    const isDesktop = useIsDesktop();

    const [confirmed, setConfirmed] = useState(false);
    const [typed, setTyped] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const canProceed = confirmed && typed === 'DELETE';

    const handleDeleteClick = () => {
        if (!canProceed) return;
        setShowModal(true);
    };

    const handleConfirm = async () => {
        setDeleting(true);
        try {
            await request('/accounts/me', { method: 'DELETE' });
            await logout();
            // Navigate first, then show toast (toast provider lives inside Router)
            navigate('/login', { replace: true, state: { accountDeleted: true } });
            pushToast({
                title: 'Your account has been deleted.',
                description: 'We\'re sorry to see you go.',
                variant: 'info',
                duration: 6000,
            });
        } catch (err) {
            console.error('[DeleteAccountPage] delete error:', err);
            pushToast({
                title: 'Could not delete account',
                description: err?.message || 'Please try again or contact support.',
                variant: 'error',
            });
            setDeleting(false);
            setShowModal(false);
        }
    };

    const content = (
        <>

                    {/* Warning icon */}
                    <div style={{
                        width: 56, height: 56, borderRadius: 16,
                        background: T.dangerBg,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginBottom: 20, marginTop: 8,
                    }}>
                        <svg width="24" height="24" fill="none" stroke={T.danger} strokeWidth="1.5" viewBox="0 0 24 24">
                            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>

                    {/* Heading */}
                    <h1 style={{ fontFamily: F, fontSize: 28, fontWeight: 400, letterSpacing: '-0.03em', color: T.danger, margin: '0 0 8px' }}>
                        Delete your account
                    </h1>
                    <p style={{ fontFamily: F, fontSize: 15, color: T.muted, margin: '0 0 20px', lineHeight: 1.6 }}>
                        This action is permanent and cannot be undone. All your data will be deleted, including:
                    </p>

                    {/* Deletion list */}
                    {WILL_BE_DELETED.map((item) => (
                        <div key={item} style={{ display: 'flex', gap: 10, padding: '7px 0', alignItems: 'flex-start' }}>
                            <svg width="16" height="16" fill="none" stroke={T.danger} strokeWidth="1.5" viewBox="0 0 24 24" style={{ flexShrink: 0, marginTop: 2 }}>
                                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                            </svg>
                            <span style={{ fontFamily: F, fontSize: 14, color: T.ink, lineHeight: 1.5 }}>{item}</span>
                        </div>
                    ))}

                    <div style={{ height: 1, background: T.line, margin: '24px 0' }} />

                    {/* Checkbox */}
                    <div
                        style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, cursor: 'pointer' }}
                        onClick={() => setConfirmed((c) => !c)}
                    >
                        <div style={{
                            width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                            border: confirmed ? 'none' : `1.5px solid ${T.line}`,
                            background: confirmed ? T.danger : 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'background 0.15s',
                        }}>
                            {confirmed && (
                                <svg width="12" height="12" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24">
                                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            )}
                        </div>
                        <span style={{ fontFamily: F, fontSize: 14, color: T.ink, userSelect: 'none' }}>
                            I understand this action is permanent
                        </span>
                    </div>

                    {/* Type DELETE input — shown once checkbox ticked */}
                    {confirmed && (
                        <div style={{ marginBottom: 8 }}>
                            <span style={{ display: 'block', fontSize: 11, fontWeight: 500, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                                Type "DELETE" to confirm
                            </span>
                            <input
                                value={typed}
                                onChange={(e) => setTyped(e.target.value)}
                                placeholder="DELETE"
                                autoCapitalize="characters"
                                style={{
                                    width: '100%', padding: '14px 16px', borderRadius: 12,
                                    border: `1px solid ${typed === 'DELETE' ? T.danger : T.line}`,
                                    fontFamily: F, fontSize: 14, color: T.ink,
                                    outline: 'none', background: T.avatarBg,
                                    boxSizing: 'border-box',
                                    transition: 'border-color 0.15s',
                                }}
                            />
                        </div>
                    )}

                    {/* Action buttons */}
                    <div style={{ marginTop: 'auto', paddingBottom: 40, paddingTop: 24, display: 'flex', gap: 10 }}>
                        <button
                            onClick={() => navigate(-1)}
                            style={{
                                flex: 1, padding: '15px', borderRadius: 12,
                                border: `1px solid ${T.line}`, background: 'transparent',
                                fontFamily: F, fontSize: 14, fontWeight: 500,
                                color: T.ink, cursor: 'pointer',
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDeleteClick}
                            disabled={!canProceed}
                            style={{
                                flex: 1, padding: '15px', borderRadius: 12,
                                border: 'none',
                                background: canProceed ? T.danger : T.faded,
                                fontFamily: F, fontSize: 14, fontWeight: 600,
                                color: '#fff',
                                cursor: canProceed ? 'pointer' : 'default',
                                transition: 'background 0.2s',
                            }}
                        >
                            Delete Account
                        </button>
                    </div>
        </>
    );

    return (
        <>
            {isDesktop ? (
                <div style={{ minHeight: '100vh', background: T.base, fontFamily: F, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '64px 24px' }}>
                    <div style={{ width: '100%', maxWidth: 560 }}>
                        <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 16, padding: 0, fontFamily: F, fontSize: 13, color: T.muted }}>
                            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M15 19l-7-7 7-7" /></svg>
                            Back
                        </button>
                        <div style={{ background: '#fff', borderRadius: 24, border: `1px solid ${T.line}`, padding: '40px 40px 48px' }}>
                            {content}
                        </div>
                    </div>
                </div>
            ) : (
                <SettingsPageLayout title="Delete Account">
                    {content}
                </SettingsPageLayout>
            )}

            {/* Final confirmation modal */}
            {showModal && (
                <ConfirmModal
                    onConfirm={handleConfirm}
                    onCancel={() => !deleting && setShowModal(false)}
                    deleting={deleting}
                />
            )}
        </>
    );
}
