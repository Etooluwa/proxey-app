/**
 * BookingFlowPage — v6 Warm Editorial redesign
 *
 * Steps: services → detail (bottom sheet) → intake → time → time-request (branch) → payment → confirmed
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useSession } from '../auth/authContext';
import { request } from '../data/apiClient';
import { clearDraft, loadDraft, saveDraft } from '../bookings/draftStore';
import { supabase } from '../utils/supabase';
import BookingPaymentForm, { computeDepositCents } from '../components/payment/BookingPaymentForm';
import BackBtn from '../components/ui/BackBtn';
import Lbl from '../components/ui/Lbl';
import Divider from '../components/ui/Divider';
import Footer from '../components/ui/Footer';
import { useIsDesktop } from '../hooks/useIsDesktop';

const DT = { base: '#FBF7F2' };
const wrapDesktop = (node) => (
    <div style={{ minHeight: '100vh', background: DT.base, display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 600 }}>{node}</div>
    </div>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtPrice = (cents) => {
    if (!cents && cents !== 0) return 'POA';
    return `$${(cents / 100).toFixed(0)}`;
};

const fmtDuration = (mins) => {
    if (!mins) return null;
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
};

const getInitials = (name) =>
    (name || '?').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function buildDateList(count = 14) {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < count; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        days.push(d);
    }
    return days;
}

function parseTimeSlot(slot, date) {
    const [timePart, ampm] = slot.split(' ');
    let [hh, mm] = timePart.split(':').map(Number);
    if (ampm === 'PM' && hh !== 12) hh += 12;
    if (ampm === 'AM' && hh === 12) hh = 0;
    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

// ─── Shared sub-components ────────────────────────────────────────────────────

const StickyBar = ({ children }) => (
    <div className="fixed bottom-0 left-0 right-0 px-5 pt-3 pb-10 bg-base border-t border-line z-20">
        {children}
    </div>
);

const PrimaryBtn = ({ onClick, disabled, loading, children }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className="w-full py-3.5 rounded-pill text-[15px] font-semibold text-white transition-opacity active:opacity-80 flex items-center justify-center gap-2"
        style={{ background: disabled ? '#B0948F' : '#3D231E', cursor: disabled ? 'not-allowed' : 'pointer' }}
    >
        {loading && <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />}
        {children}
    </button>
);

const SubNav = ({ onBack, title, onClose }) => (
    <div className="flex items-center justify-between px-4 pt-3 pb-2 min-h-[48px]">
        <BackBtn onClick={onBack} />
        {title && <span className="text-[16px] font-semibold text-ink">{title}</span>}
        {onClose ? (
            <button onClick={onClose} className="-m-2 p-2 focus:outline-none" aria-label="Close">
                <svg width="22" height="22" fill="none" stroke="#3D231E" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
            </button>
        ) : (
            <div className="w-10" />
        )}
    </div>
);

// ─── Step: Services ───────────────────────────────────────────────────────────

const StepServices = ({ providerId, preSelectedId, onContinue, onClose }) => {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState(preSelectedId || null);
    const [intakeLoading, setIntakeLoading] = useState(false);
    const navigate = useNavigate();
    const autoOpenedRef = useRef(false);

    useEffect(() => {
        if (!providerId) return;
        setLoading(true);
        request(`/provider/${providerId}/services`)
            .then((d) => setServices(d.services || []))
            .catch(() => setServices([]))
            .finally(() => setLoading(false));
    }, [providerId]);

    useEffect(() => {
        if (!preSelectedId) return;
        setSelectedId(preSelectedId);
    }, [preSelectedId]);

    // Group by category
    const groups = useMemo(() => {
        const map = {};
        services.forEach((s) => {
            const g = s.category || 'Other';
            if (!map[g]) map[g] = [];
            map[g].push(s);
        });
        return Object.entries(map);
    }, [services]);

    const handleContinue = async () => {
        if (!selectedId) return;
        setIntakeLoading(true);
        try {
            const intakeData = await request(`/services/${selectedId}/intake`);
            const service = services.find((s) => s.id === selectedId);
            onContinue({
                service,
                intakeQuestions: intakeData.questions || [],
                clientNotesEnabled: intakeData.clientNotesEnabled !== false,
            });
        } catch {
            const service = services.find((s) => s.id === selectedId);
            onContinue({ service, intakeQuestions: [], clientNotesEnabled: false });
        } finally {
            setIntakeLoading(false);
        }
    };

    useEffect(() => {
        if (loading || intakeLoading || !preSelectedId || autoOpenedRef.current) return;
        const preselectedService = services.find((svc) => svc.id === preSelectedId);
        if (!preselectedService) return;
        autoOpenedRef.current = true;
        setSelectedId(preSelectedId);

        (async () => {
            setIntakeLoading(true);
            try {
                const intakeData = await request(`/services/${preSelectedId}/intake`);
                onContinue({
                    service: preselectedService,
                    intakeQuestions: intakeData.questions || [],
                    clientNotesEnabled: intakeData.clientNotesEnabled !== false,
                });
            } catch {
                onContinue({
                    service: preselectedService,
                    intakeQuestions: [],
                    clientNotesEnabled: false,
                });
            } finally {
                setIntakeLoading(false);
            }
        })();
    }, [intakeLoading, loading, onContinue, preSelectedId, services]);

    return (
        <div className="flex flex-col min-h-screen bg-base">
            <SubNav onBack={() => navigate(-1)} title="Select a service" onClose={() => navigate(-1)} />

            <div className="flex-1 overflow-y-auto px-5 pb-36 pt-2">
                {loading && (
                    <div className="flex items-center justify-center pt-20">
                        <div className="w-7 h-7 rounded-full border-2 border-accent border-t-transparent animate-spin" />
                    </div>
                )}

                {!loading && groups.length === 0 && (
                    <p className="text-[14px] text-muted text-center pt-20">No services available.</p>
                )}

                {!loading && groups.map(([groupName, items]) => (
                    <div key={groupName} className="mb-6">
                        {/* Group header */}
                        <div className="flex items-center justify-between mb-3">
                            <Lbl>{groupName}</Lbl>
                            <Lbl className="text-faded">{items.length} service{items.length !== 1 ? 's' : ''}</Lbl>
                        </div>

                        {/* Service rows */}
                        {items.map((svc, i) => {
                            const isSel = selectedId === svc.id;
                            return (
                                <React.Fragment key={svc.id}>
                                    <button
                                        onClick={() => setSelectedId(isSel ? null : svc.id)}
                                        className="w-full flex items-start justify-between py-3.5 px-1 text-left focus:outline-none active:bg-avatarBg/40 transition-colors"
                                    >
                                        <div className="flex-1 min-w-0 pr-4">
                                            <p className="text-[15px] font-semibold text-ink m-0 mb-0.5 truncate">
                                                {svc.name}
                                            </p>
                                            <p className="text-[13px] text-muted m-0">
                                                {svc.duration ? fmtDuration(svc.duration) : null}
                                                {svc.duration && svc.base_price ? ' · ' : ''}
                                                {svc.base_price ? `${fmtPrice(svc.base_price)} ${svc.unit || ''}`.trim() : 'POA'}
                                            </p>
                                            {svc.description ? (
                                                <p className="text-[12px] text-faded m-0 mt-1 leading-relaxed line-clamp-2">
                                                    {svc.description}
                                                </p>
                                            ) : null}
                                        </div>
                                        {/* Circle checkmark toggle */}
                                        <div
                                            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors"
                                            style={{
                                                background: isSel ? '#C25E4A' : 'transparent',
                                                border: isSel ? 'none' : '1.5px solid rgba(140,106,100,0.4)',
                                            }}
                                        >
                                            {isSel ? (
                                                <svg width="14" height="14" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24">
                                                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            ) : (
                                                <svg width="14" height="14" fill="none" stroke="#B0948F" strokeWidth="2" viewBox="0 0 24 24">
                                                    <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            )}
                                        </div>
                                    </button>
                                    {i < items.length - 1 && <Divider />}
                                </React.Fragment>
                            );
                        })}
                    </div>
                ))}
            </div>

            <StickyBar>
                <PrimaryBtn onClick={handleContinue} disabled={!selectedId || intakeLoading} loading={intakeLoading}>
                    {intakeLoading ? 'Loading…' : selectedId ? 'Continue' : 'Select a service'}
                </PrimaryBtn>
            </StickyBar>
        </div>
    );
};

// ─── Step: Service Detail (bottom sheet) ──────────────────────────────────────

const StepDetail = ({ service, onContinue, onBack }) => {
    const [selectedIdx, setSelectedIdx] = useState(null);
    const [showFull, setShowFull] = useState(false);

    const options = useMemo(() => {
        if (Array.isArray(service?.options) && service.options.length > 0) return service.options;
        return [{
            label: 'Standard',
            duration: service?.duration || null,
            price: service?.base_price || service?.basePrice || null,
            unit: service?.unit || '',
        }];
    }, [service]);

    const desc = service?.description || '';
    const TRUNC = 120;
    const displayDesc = !showFull && desc.length > TRUNC ? desc.slice(0, TRUNC) + '…' : desc;

    const handleContinue = () => {
        if (selectedIdx === null) return;
        const opt = options[selectedIdx];
        onContinue({ selectedOption: opt, price: opt?.price ?? service?.base_price ?? service?.basePrice ?? null });
    };

    return (
        <div className="fixed inset-0 z-50 flex flex-col justify-end" style={{ background: 'rgba(61,35,30,0.5)' }}>
            <div className="absolute inset-0" onClick={onBack} aria-hidden="true" />
            <div className="relative bg-base flex flex-col" style={{ borderRadius: '24px 24px 0 0', maxHeight: '88vh' }}>
                {/* Handle */}
                <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                    <div className="w-9 h-1 rounded-full bg-line" />
                </div>
                {/* Close */}
                <div className="flex justify-end px-5 pt-1 pb-0 flex-shrink-0">
                    <button onClick={onBack} className="-m-1 p-1 focus:outline-none" aria-label="Close">
                        <svg width="22" height="22" fill="none" stroke="#3D231E" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>

                <div className="overflow-y-auto px-5 pb-8 flex-1">
                    <h1 className="text-[24px] font-semibold text-ink tracking-[-0.02em] m-0 mb-3 mt-1">
                        {service?.name || 'Service'}
                    </h1>

                    {desc && (
                        <p className="text-[14px] text-muted leading-relaxed m-0 mb-5">
                            {displayDesc}
                            {desc.length > TRUNC && (
                                <button
                                    onClick={() => setShowFull((v) => !v)}
                                    className="ml-1 font-semibold text-ink focus:outline-none"
                                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                                >
                                    {showFull ? 'Show less' : 'Read more'}
                                </button>
                            )}
                        </p>
                    )}

                    {options.map((opt, i) => {
                        const isSel = selectedIdx === i;
                        return (
                            <button
                                key={i}
                                onClick={() => setSelectedIdx(i)}
                                className="w-full flex items-start gap-3.5 rounded-[14px] mb-3 p-4 text-left transition-colors"
                                style={{
                                    background: isSel ? 'rgba(194,94,74,0.06)' : '#FFFFFF',
                                    border: isSel ? '1.5px solid #C25E4A' : '1.5px solid rgba(140,106,100,0.2)',
                                }}
                            >
                                {/* Radio */}
                                <div
                                    className="flex items-center justify-center flex-shrink-0 mt-0.5"
                                    style={{
                                        width: 20, height: 20, borderRadius: '50%',
                                        background: isSel ? '#C25E4A' : 'transparent',
                                        border: isSel ? 'none' : '1.5px solid rgba(140,106,100,0.4)',
                                    }}
                                >
                                    {isSel && <div className="w-2 h-2 rounded-full bg-white" />}
                                </div>
                                <div>
                                    <p className="text-[15px] font-semibold text-ink m-0 mb-0.5">{opt.label}</p>
                                    {opt.duration && <p className="text-[13px] text-muted m-0 mb-0.5">{fmtDuration(opt.duration)}</p>}
                                    {opt.price != null && (
                                        <p className="text-[15px] font-semibold text-ink m-0">
                                            {fmtPrice(opt.price)}{opt.unit ? ` ${opt.unit}` : ''}
                                        </p>
                                    )}
                                </div>
                            </button>
                        );
                    })}

                    <PrimaryBtn onClick={handleContinue} disabled={selectedIdx === null}>
                        Continue
                    </PrimaryBtn>
                </div>
            </div>
        </div>
    );
};

// ─── Step: Intake Questions ───────────────────────────────────────────────────

const StepIntake = ({ questions, clientNotesEnabled, onContinue, onBack, onClose }) => {
    const [answers, setAnswers] = useState({});
    const [note, setNote] = useState('');
    const NOTE_MAX = 500;

    const setAnswer = (qid, val) => setAnswers((p) => ({ ...p, [qid]: val }));

    const buildResponses = () => {
        const responses = [];
        questions.forEach((q) => {
            const ans = answers[q.id];
            if (ans) responses.push({ questionId: q.id, responseText: String(ans) });
        });
        return responses;
    };

    return (
        <div className="flex flex-col min-h-screen bg-base">
            <SubNav onBack={onBack} title="A few questions" onClose={onClose} />

            <div className="flex-1 overflow-y-auto px-5 pb-36 pt-2">
                {questions.map((q) => (
                    <div key={q.id} className="mb-7">
                        <p className="text-[15px] font-semibold text-ink m-0 mb-3">{q.question_text}</p>

                        {q.question_type === 'select' && (
                            <div className="flex flex-wrap gap-2">
                                {q.options.map((opt) => {
                                    const isSel = answers[q.id] === opt.option_text;
                                    return (
                                        <button
                                            key={opt.id}
                                            onClick={() => setAnswer(q.id, isSel ? '' : opt.option_text)}
                                            className="px-4 py-2 rounded-pill text-[13px] font-semibold transition-colors focus:outline-none"
                                            style={{
                                                background: isSel ? '#C25E4A' : '#FFFFFF',
                                                color: isSel ? '#FFFFFF' : '#3D231E',
                                                border: isSel ? 'none' : '1px solid rgba(140,106,100,0.3)',
                                            }}
                                        >
                                            {opt.option_text}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {q.question_type === 'text' && (
                            <textarea
                                rows={3}
                                value={answers[q.id] || ''}
                                onChange={(e) => setAnswer(q.id, e.target.value)}
                                placeholder="Your answer…"
                                className="w-full text-[14px] text-ink resize-none focus:outline-none rounded-[12px] px-3.5 py-3 bg-white"
                                style={{ border: '1px solid rgba(140,106,100,0.25)', lineHeight: 1.55 }}
                            />
                        )}
                    </div>
                ))}

                {clientNotesEnabled && (
                    <div className="mb-7">
                        <p className="text-[15px] font-semibold text-ink m-0 mb-1">
                            Anything else you'd like to share?
                        </p>
                        <p className="text-[12px] text-faded m-0 mb-3">Optional</p>
                        <textarea
                            rows={4}
                            maxLength={NOTE_MAX}
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Goals, preferences, access details…"
                            className="w-full text-[14px] text-ink resize-none focus:outline-none rounded-[12px] px-3.5 py-3 bg-white"
                            style={{ border: '1px solid rgba(140,106,100,0.25)', lineHeight: 1.55 }}
                        />
                        <p className="text-[11px] text-faded text-right mt-1">{note.length}/{NOTE_MAX}</p>
                    </div>
                )}
            </div>

            <StickyBar>
                <div className="flex gap-3">
                    <button
                        onClick={() => onContinue({ intakeResponses: [], note: '' })}
                        className="px-5 py-3.5 rounded-pill text-[14px] font-semibold text-muted focus:outline-none"
                        style={{ border: '1px solid rgba(140,106,100,0.3)' }}
                    >
                        Skip
                    </button>
                    <PrimaryBtn onClick={() => onContinue({ intakeResponses: buildResponses(), note })}>
                        Continue
                    </PrimaryBtn>
                </div>
            </StickyBar>
        </div>
    );
};

// ─── Step: Time ───────────────────────────────────────────────────────────────

const StepTime = ({ providerId, service, onContinue, onBack, onClose, onTimeRequest }) => {
    const dates = useMemo(() => buildDateList(14), []);
    const [dateIdx, setDateIdx] = useState(0);
    const [slot, setSlot] = useState(null);

    // Default time slots — in future: fetch from provider_availability
    const timeSlots = [
        '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM',
        '11:00 AM', '11:30 AM', '2:00 PM', '2:30 PM',
        '3:00 PM', '3:30 PM', '4:00 PM', '5:00 PM',
    ];

    const handleContinue = () => {
        if (!slot) return;
        const date = dates[dateIdx];
        const iso = date.toISOString().slice(0, 10);
        const time24 = parseTimeSlot(slot, date);
        onContinue({ scheduledDate: iso, scheduledTime: time24, scheduledLabel: `${slot}, ${MONTH_ABBR[date.getMonth()]} ${date.getDate()}` });
    };

    const selDate = dates[dateIdx];

    return (
        <div className="flex flex-col min-h-screen bg-base">
            <SubNav onBack={onBack} title="Select time" onClose={onClose} />

            <div className="flex-1 overflow-y-auto px-5 pb-36 pt-2">
                <h1 className="text-[28px] font-semibold text-ink tracking-[-0.03em] m-0 mb-5">
                    {service?.name || 'Book a session'}
                </h1>

                {/* Date pill row */}
                <div
                    className="flex gap-2.5 mb-5"
                    style={{ overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
                >
                    {dates.slice(0, 7).map((d, i) => {
                        const isActive = dateIdx === i;
                        return (
                            <button
                                key={i}
                                onClick={() => { setDateIdx(i); setSlot(null); }}
                                className="flex flex-col items-center gap-1 flex-shrink-0 focus:outline-none"
                            >
                                <div
                                    className="w-12 h-12 rounded-full flex items-center justify-center transition-colors"
                                    style={{
                                        background: isActive ? '#C25E4A' : '#FFFFFF',
                                        border: isActive ? 'none' : '1.5px solid rgba(140,106,100,0.25)',
                                    }}
                                >
                                    <span
                                        className="text-[18px] font-semibold"
                                        style={{ color: isActive ? '#fff' : '#3D231E' }}
                                    >
                                        {d.getDate()}
                                    </span>
                                </div>
                                <span className="text-[11px] font-medium text-muted">
                                    {i === 0 ? 'Today' : DAY_ABBR[d.getDay()]}
                                </span>
                            </button>
                        );
                    })}
                </div>

                <p className="text-[12px] text-faded mb-4">
                    {MONTH_ABBR[selDate.getMonth()]} {selDate.getFullYear()}
                </p>

                <Lbl className="block mb-3">Available times</Lbl>

                {/* Time slot list */}
                <div className="flex flex-col gap-1">
                    {timeSlots.map((time) => {
                        const isActive = slot === time;
                        return (
                            <button
                                key={time}
                                onClick={() => setSlot(time)}
                                className="w-full text-left px-4 py-3.5 rounded-[12px] transition-colors focus:outline-none"
                                style={{
                                    background: isActive ? 'rgba(194,94,74,0.08)' : 'transparent',
                                    border: isActive ? '1.5px solid #C25E4A' : '1px solid rgba(140,106,100,0.15)',
                                }}
                            >
                                <span
                                    className="text-[15px]"
                                    style={{ fontWeight: isActive ? 600 : 500, color: isActive ? '#C25E4A' : '#3D231E' }}
                                >
                                    {time}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Time request link */}
                <div className="flex justify-center mt-5 mb-2">
                    <button
                        onClick={onTimeRequest}
                        className="text-[13px] font-semibold text-accent focus:outline-none"
                        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                        Can't find a time? Request one →
                    </button>
                </div>
            </div>

            {slot && (
                <StickyBar>
                    <PrimaryBtn onClick={handleContinue}>Confirm time</PrimaryBtn>
                </StickyBar>
            )}
        </div>
    );
};

// ─── Step: Time Request ───────────────────────────────────────────────────────

const StepTimeRequest = ({ providerId, service, session, onSent, onBack, onClose }) => {
    const dates = useMemo(() => buildDateList(28), []);
    const timeOptions = [
        '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
        '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM',
        '4:00 PM', '5:00 PM', '6:00 PM',
    ];
    const [dateIdx, setDateIdx] = useState(0);
    const [time, setTime] = useState('');
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const selDate = dates[dateIdx];

    const handleSend = async () => {
        if (!time) return;
        setSubmitting(true);
        setError(null);
        try {
            const iso = selDate.toISOString().slice(0, 10);
            const time24 = parseTimeSlot(time, selDate);
            await request('/time-requests', {
                method: 'POST',
                body: JSON.stringify({
                    clientId: session?.user?.id,
                    clientName: session?.user?.user_metadata?.name || '',
                    clientEmail: session?.user?.email || '',
                    providerId,
                    requestedDate: iso,
                    requestedTime: time24,
                    serviceId: service?.id,
                    serviceName: service?.name,
                    notes: message || null,
                }),
            });
            onSent();
        } catch (err) {
            setError('Could not send your request. Try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-base">
            <SubNav onBack={onBack} title="Request a time" onClose={onClose} />

            <div className="flex-1 overflow-y-auto px-5 pb-36 pt-2">
                {/* Yellow callout */}
                <div className="flex items-start gap-3 px-4 py-3.5 rounded-[14px] bg-callout mb-6">
                    <svg width="18" height="18" fill="none" stroke="#C25E4A" strokeWidth="1.75" viewBox="0 0 24 24" className="flex-shrink-0 mt-0.5">
                        <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div>
                        <p className="text-[13px] font-semibold text-ink m-0 mb-0.5">This is a request, not a confirmed booking.</p>
                        <p className="text-[12px] text-muted m-0 leading-relaxed">No payment now. Your provider will confirm or suggest an alternative time.</p>
                    </div>
                </div>

                <Lbl className="block mb-3">Preferred date</Lbl>

                {/* Date scroll */}
                <div
                    className="flex gap-2.5 mb-5"
                    style={{ overflowX: 'auto', scrollbarWidth: 'none' }}
                >
                    {dates.slice(0, 14).map((d, i) => {
                        const isActive = dateIdx === i;
                        return (
                            <button
                                key={i}
                                onClick={() => setDateIdx(i)}
                                className="flex flex-col items-center gap-1 flex-shrink-0 focus:outline-none"
                            >
                                <div
                                    className="w-12 h-12 rounded-full flex items-center justify-center"
                                    style={{
                                        background: isActive ? '#C25E4A' : '#FFFFFF',
                                        border: isActive ? 'none' : '1.5px solid rgba(140,106,100,0.25)',
                                    }}
                                >
                                    <span className="text-[18px] font-semibold" style={{ color: isActive ? '#fff' : '#3D231E' }}>
                                        {d.getDate()}
                                    </span>
                                </div>
                                <span className="text-[11px] font-medium text-muted">{DAY_ABBR[d.getDay()]}</span>
                            </button>
                        );
                    })}
                </div>

                <Lbl className="block mb-3">Preferred time</Lbl>
                <div className="flex flex-wrap gap-2 mb-6">
                    {timeOptions.map((t) => {
                        const isSel = time === t;
                        return (
                            <button
                                key={t}
                                onClick={() => setTime(isSel ? '' : t)}
                                className="px-4 py-2 rounded-pill text-[13px] font-semibold focus:outline-none transition-colors"
                                style={{
                                    background: isSel ? '#C25E4A' : '#FFFFFF',
                                    color: isSel ? '#FFFFFF' : '#3D231E',
                                    border: isSel ? 'none' : '1px solid rgba(140,106,100,0.3)',
                                }}
                            >
                                {t}
                            </button>
                        );
                    })}
                </div>

                <Lbl className="block mb-2">Message (optional)</Lbl>
                <textarea
                    rows={3}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Any notes for the provider…"
                    className="w-full text-[14px] text-ink resize-none focus:outline-none rounded-[12px] px-3.5 py-3 bg-white"
                    style={{ border: '1px solid rgba(140,106,100,0.25)', lineHeight: 1.55 }}
                />

                {error && <p className="text-[13px] text-accent mt-3">{error}</p>}
            </div>

            <StickyBar>
                <PrimaryBtn onClick={handleSend} disabled={!time || submitting} loading={submitting}>
                    Send request
                </PrimaryBtn>
            </StickyBar>
        </div>
    );
};

// ─── Step: Time Request Sent ──────────────────────────────────────────────────

const StepTimeRequestSent = ({ onDone }) => (
    <div className="flex flex-col min-h-screen bg-base px-5 items-center justify-center">
        <div className="w-20 h-20 rounded-full bg-successBg flex items-center justify-center mb-6">
            <svg width="36" height="36" fill="none" stroke="#5A8A5E" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        </div>
        <h1 className="text-[26px] font-semibold text-ink tracking-[-0.02em] text-center m-0 mb-3">
            Request sent
        </h1>
        <p className="text-[14px] text-muted text-center leading-relaxed max-w-xs m-0 mb-8">
            Your provider will confirm or suggest another time. You'll get a notification when they respond.
        </p>
        <button
            onClick={onDone}
            className="px-8 py-3.5 rounded-pill bg-ink text-white text-[14px] font-semibold"
        >
            Back to my kliques
        </button>
    </div>
);

// ─── Step: Payment ────────────────────────────────────────────────────────────

const StepPayment = ({ service, selectedOption, scheduledDate, scheduledTime, scheduledLabel, intakeResponses, clientNote, providerId, session, onConfirmed, onBack, onClose }) => {
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    // Honor option-level price if set, otherwise fall back to service base_price
    const effectivePrice = selectedOption?.price ?? service?.base_price ?? null;

    // Build a service object with the effective price so BookingPaymentForm charges the right amount
    const serviceForPayment = effectivePrice != null && effectivePrice !== service?.base_price
        ? { ...service, base_price: effectivePrice }
        : service;

    const paymentType = service?.payment_type || 'full';
    const depositAmount = paymentType === 'deposit' ? computeDepositCents(serviceForPayment) : null;
    const remainingAmount = effectivePrice != null && depositAmount != null ? effectivePrice - depositAmount : null;

    const handlePaymentSuccess = async (pmtData) => {
        setSubmitting(true);
        setError(null);
        console.log('[BookingFlow] handlePaymentSuccess called', pmtData);
        try {
            const body = {
                // snake_case keys to match backend contract
                service_id: service.id,
                provider_id: providerId,
                requested_date: scheduledDate,
                requested_time: scheduledTime,
                message: clientNote || undefined,
                ...pmtData,
            };
            console.log('[BookingFlow] calling /bookings/request-time with body', body);
            const data = await request('/bookings/request-time', {
                method: 'POST',
                body: JSON.stringify(body),
            });

            // Save intake responses client-side — non-blocking, booking already confirmed
            if (intakeResponses?.length > 0 && data.booking?.id) {
                const intakeRows = intakeResponses.map(r => ({
                    booking_id: data.booking.id,
                    question_id: r.questionId,
                    response_text: r.responseText,
                }));
                supabase.from('booking_intake_responses').insert(intakeRows).catch(() => {});
            }

            console.log('[BookingFlow] /bookings/request-time response:', data);
            onConfirmed({
                booking: data.booking,
                price: effectivePrice,
                depositAmount: pmtData.payment_type === 'deposit' ? pmtData.deposit_paid_cents : null,
                remainingAmount: pmtData.payment_type === 'deposit' ? remainingAmount : null,
                paymentType: pmtData.payment_type,
                service,
                providerId,
            });
        } catch (err) {
            console.error('[BookingFlow] request-time error:', err);
            setError(err.message || 'Booking failed. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-base">
            <SubNav onBack={onBack} title="Payment" onClose={onClose} />

            <div className="flex-1 overflow-y-auto px-5 pb-36 pt-2">
                {/* Booking summary */}
                <div className="mb-5">
                    <Lbl className="block mb-3">Booking summary</Lbl>
                    <div className="rounded-[16px] bg-white overflow-hidden" style={{ border: '1px solid rgba(140,106,100,0.15)' }}>
                        <div className="flex justify-between items-center px-4 py-3.5">
                            <span className="text-[15px] font-semibold text-ink">{service?.name}</span>
                            {effectivePrice != null && <span className="text-[15px] font-semibold text-ink">{fmtPrice(effectivePrice)}</span>}
                        </div>
                        <Divider />
                        {selectedOption?.duration && (
                            <>
                                <div className="flex justify-between items-center px-4 py-3">
                                    <span className="text-[13px] text-muted">Duration</span>
                                    <span className="text-[13px] text-ink">{fmtDuration(selectedOption.duration)}</span>
                                </div>
                                <Divider />
                            </>
                        )}
                        {scheduledLabel && (
                            <div className="flex justify-between items-center px-4 py-3">
                                <span className="text-[13px] text-muted">Time</span>
                                <span className="text-[13px] text-ink">{scheduledLabel}</span>
                            </div>
                        )}
                    </div>
                </div>

                {error && (
                    <div className="px-4 py-3 rounded-[12px] bg-dangerBg mb-4">
                        <p className="text-[13px] text-accent m-0">{error}</p>
                    </div>
                )}

                <BookingPaymentForm
                    service={serviceForPayment}
                    provider={{ id: providerId }}
                    session={session}
                    onSuccess={handlePaymentSuccess}
                    onError={(msg) => setError(msg)}
                    renderFooter={({ handleSubmit, processing, btnLabel, stripe }) => (
                        <StickyBar>
                            <PrimaryBtn
                                onClick={handleSubmit}
                                loading={processing || submitting}
                                disabled={processing || submitting || !stripe}
                            >
                                {processing || submitting ? 'Processing…' : btnLabel}
                            </PrimaryBtn>
                        </StickyBar>
                    )}
                />
            </div>
        </div>
    );
};

// ─── Step: Confirmed ──────────────────────────────────────────────────────────

const StepConfirmed = ({ booking, service, price, depositAmount, remainingAmount, paymentType, providerName, onDone }) => {
    const initials = getInitials(providerName);

    return (
        <div className="flex flex-col min-h-screen bg-base px-5">
            <div className="flex-1 flex flex-col items-center justify-center py-10">
                {/* Provider avatar with dashed accent ring + terracotta badge */}
                <div className="relative mb-7">
                    <div
                        className="w-24 h-24 rounded-full flex items-center justify-center bg-avatarBg"
                        style={{
                            border: '2.5px dashed #C25E4A',
                            outline: '4px solid rgba(194,94,74,0.12)',
                            outlineOffset: '3px',
                        }}
                    >
                        <span className="text-[28px] font-semibold text-ink">{initials}</span>
                    </div>
                    {/* Check badge */}
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-accent flex items-center justify-center border-2 border-base">
                        <svg width="14" height="14" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                </div>

                <h1 className="text-[26px] font-semibold text-ink tracking-[-0.02em] text-center m-0 mb-2">
                    You're booked!
                </h1>
                <p className="text-[14px] text-muted text-center m-0 mb-8 leading-relaxed">
                    {providerName} has been notified and will confirm shortly.
                </p>

                {/* Receipt card */}
                <div className="w-full rounded-[16px] overflow-hidden mb-6" style={{ border: '1px solid rgba(140,106,100,0.2)' }}>
                    <div className="px-4 py-3.5 flex justify-between items-center">
                        <span className="text-[14px] font-semibold text-ink">{service?.name}</span>
                        {price != null && <span className="text-[14px] font-semibold text-ink">{fmtPrice(price)}</span>}
                    </div>
                    {paymentType === 'save_card' && (
                        <>
                            <Divider />
                            <div className="px-4 py-3 flex justify-between items-center bg-successBg">
                                <span className="text-[13px] font-semibold text-success">Card saved — no charge now</span>
                                <span className="text-[13px] font-semibold text-success">$0</span>
                            </div>
                        </>
                    )}
                    {paymentType === 'deposit' && depositAmount != null && (
                        <>
                            <Divider />
                            <div className="px-4 py-3 flex justify-between items-center bg-successBg">
                                <span className="text-[13px] font-semibold text-success">Deposit paid</span>
                                <span className="text-[13px] font-semibold text-success">{fmtPrice(depositAmount)}</span>
                            </div>
                            <Divider />
                            <div className="px-4 py-3 flex justify-between items-center">
                                <span className="text-[13px] text-muted">Due after session</span>
                                <span className="text-[13px] text-ink">{fmtPrice(remainingAmount)}</span>
                            </div>
                        </>
                    )}
                    {(paymentType === 'full' || (!paymentType && depositAmount == null)) && price != null && (
                        <>
                            <Divider />
                            <div className="px-4 py-3 flex justify-between items-center bg-successBg">
                                <span className="text-[13px] font-semibold text-success">Paid in full</span>
                                <span className="text-[13px] font-semibold text-success">{fmtPrice(price)}</span>
                            </div>
                        </>
                    )}
                </div>

                <button
                    onClick={onDone}
                    className="w-full py-3.5 rounded-pill bg-ink text-white text-[14px] font-semibold"
                >
                    Back to my kliques
                </button>
            </div>
            <Footer />
        </div>
    );
};

// ─── Root: BookingFlowPage ────────────────────────────────────────────────────

const STEPS = ['services', 'detail', 'intake', 'time', 'payment', 'confirmed'];
const TIME_REQUEST_STEPS = ['time-request', 'time-request-sent'];

function BookingFlowPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { providerId: routeProviderId = '' } = useParams();
    const { session } = useSession();

    const existingDraft = useMemo(() => loadDraft(), []);
    const preProviderId = location.state?.providerId || routeProviderId || existingDraft?.providerId || '';
    const preServiceId = location.state?.serviceId || existingDraft?.serviceId || '';

    // Step routing
    const [stepKey, setStepKey] = useState('services');

    // Accumulated booking data
    const [providerId] = useState(preProviderId);
    const [service, setService] = useState(null);
    const [selectedOption, setSelectedOption] = useState(null);
    const [intakeQuestions, setIntakeQuestions] = useState([]);
    const [clientNotesEnabled, setClientNotesEnabled] = useState(false);
    const [intakeResponses, setIntakeResponses] = useState([]);
    const [clientNote, setClientNote] = useState('');
    const [scheduledDate, setScheduledDate] = useState('');
    const [scheduledTime, setScheduledTime] = useState('');
    const [scheduledLabel, setScheduledLabel] = useState('');
    const [confirmResult, setConfirmResult] = useState(null);
    const [providerName, setProviderName] = useState('');

    // Save draft on key data change
    useEffect(() => {
        saveDraft({ providerId, serviceId: service?.id, scheduledDate, scheduledTime });
    }, [providerId, service, scheduledDate, scheduledTime]);

    // ── Step handlers ────────────────────────────────────────────────────────

    const handleServicesNext = ({ service: svc, intakeQuestions: qs, clientNotesEnabled: cn }) => {
        setService(svc);
        setIntakeQuestions(qs);
        setClientNotesEnabled(cn);
        setStepKey('detail');
    };

    const handleDetailNext = ({ selectedOption: opt, price: p }) => {
        setSelectedOption(opt);
        if (intakeQuestions.length > 0 || clientNotesEnabled) {
            setStepKey('intake');
        } else {
            setStepKey('time');
        }
    };

    const handleIntakeNext = ({ intakeResponses: ir, note }) => {
        setIntakeResponses(ir);
        setClientNote(note);
        setStepKey('time');
    };

    const handleTimeNext = ({ scheduledDate: sd, scheduledTime: st, scheduledLabel: sl }) => {
        setScheduledDate(sd);
        setScheduledTime(st);
        setScheduledLabel(sl);
        setStepKey('payment');
    };

    const handleConfirmed = ({ booking, price: p, depositAmount, remainingAmount, paymentType: pt, service: svc, providerId: pid }) => {
        clearDraft();
        setConfirmResult({ booking, price: p, depositAmount, remainingAmount, paymentType: pt });
        setStepKey('confirmed');
    };

    const handleBack = () => {
        const order = ['services', 'detail', 'intake', 'time', 'payment'];
        const i = order.indexOf(stepKey);
        if (i > 0) {
            // Skip intake if there are no questions
            if (order[i - 1] === 'intake' && intakeQuestions.length === 0 && !clientNotesEnabled) {
                setStepKey(order[i - 2] || 'services');
            } else {
                setStepKey(order[i - 1]);
            }
        } else {
            navigate(-1);
        }
    };

    const handleClose = () => navigate(-1);

    const isDesktop = useIsDesktop();

    // ── Render step ──────────────────────────────────────────────────────────

    if (stepKey === 'time-request') {
        const node = (
            <StepTimeRequest
                providerId={providerId}
                service={service}
                session={session}
                onSent={() => setStepKey('time-request-sent')}
                onBack={() => setStepKey('time')}
                onClose={handleClose}
            />
        );
        return isDesktop ? wrapDesktop(node) : node;
    }

    if (stepKey === 'time-request-sent') {
        const node = <StepTimeRequestSent onDone={() => navigate('/app')} />;
        return isDesktop ? wrapDesktop(node) : node;
    }

    if (stepKey === 'confirmed') {
        const node = (
            <StepConfirmed
                booking={confirmResult?.booking}
                service={service}
                price={confirmResult?.price}
                depositAmount={confirmResult?.depositAmount}
                remainingAmount={confirmResult?.remainingAmount}
                paymentType={confirmResult?.paymentType}
                providerName={providerName || service?.provider_name || 'Your provider'}
                onDone={() => navigate('/app')}
            />
        );
        return isDesktop ? wrapDesktop(node) : node;
    }

    if (stepKey === 'payment') {
        const node = (
            <StepPayment
                service={service}
                selectedOption={selectedOption}
                scheduledDate={scheduledDate}
                scheduledTime={scheduledTime}
                scheduledLabel={scheduledLabel}
                intakeResponses={intakeResponses}
                clientNote={clientNote}
                providerId={providerId}
                session={session}
                onConfirmed={handleConfirmed}
                onBack={handleBack}
                onClose={handleClose}
            />
        );
        return isDesktop ? wrapDesktop(node) : node;
    }

    if (stepKey === 'time') {
        const node = (
            <StepTime
                providerId={providerId}
                service={service}
                onContinue={handleTimeNext}
                onBack={handleBack}
                onClose={handleClose}
                onTimeRequest={() => setStepKey('time-request')}
            />
        );
        return isDesktop ? wrapDesktop(node) : node;
    }

    if (stepKey === 'intake') {
        const node = (
            <StepIntake
                questions={intakeQuestions}
                clientNotesEnabled={clientNotesEnabled}
                onContinue={handleIntakeNext}
                onBack={handleBack}
                onClose={handleClose}
            />
        );
        return isDesktop ? wrapDesktop(node) : node;
    }

    if (stepKey === 'detail') {
        const node = (
            <StepDetail
                service={service}
                onContinue={handleDetailNext}
                onBack={handleBack}
            />
        );
        return isDesktop ? wrapDesktop(node) : node;
    }

    // Default: services
    const node = (
        <StepServices
            providerId={providerId}
            preSelectedId={preServiceId}
            onContinue={handleServicesNext}
            onClose={handleClose}
        />
    );
    return isDesktop ? wrapDesktop(node) : node;
}

export default BookingFlowPage;
