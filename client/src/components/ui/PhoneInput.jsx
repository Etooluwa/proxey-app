/**
 * PhoneInput — country code dropdown + local number input
 *
 * Props:
 *   value     — full phone string, e.g. "+1 4155551234" or "4155551234"
 *   onChange  — called with combined string "+<code> <local>"
 *   style     — optional container style override
 *   inputStyle — optional input style override
 *   label     — optional (rendered externally by caller)
 *
 * The component stores the full E.164-style value (country code + space + local number).
 * If value already contains a known prefix it is parsed on mount.
 */
import { useState, useEffect, useRef } from 'react';

const T = {
    ink: '#3D231E',
    muted: '#8C6A64',
    faded: '#B0948F',
    line: 'rgba(140,106,100,0.18)',
    base: '#FBF7F2',
    avatarBg: '#F2EBE5',
    accent: '#C25E4A',
};
const F = "'Sora',system-ui,sans-serif";

// Most common countries first, then alphabetical
const COUNTRIES = [
    { code: 'CA', dial: '+1',   flag: '🇨🇦', name: 'Canada' },
    { code: 'US', dial: '+1',   flag: '🇺🇸', name: 'United States' },
    { code: 'GB', dial: '+44',  flag: '🇬🇧', name: 'United Kingdom' },
    { code: 'AU', dial: '+61',  flag: '🇦🇺', name: 'Australia' },
    { code: 'NG', dial: '+234', flag: '🇳🇬', name: 'Nigeria' },
    { code: 'GH', dial: '+233', flag: '🇬🇭', name: 'Ghana' },
    { code: 'KE', dial: '+254', flag: '🇰🇪', name: 'Kenya' },
    { code: 'ZA', dial: '+27',  flag: '🇿🇦', name: 'South Africa' },
    { code: 'IN', dial: '+91',  flag: '🇮🇳', name: 'India' },
    { code: 'FR', dial: '+33',  flag: '🇫🇷', name: 'France' },
    { code: 'DE', dial: '+49',  flag: '🇩🇪', name: 'Germany' },
    { code: 'IT', dial: '+39',  flag: '🇮🇹', name: 'Italy' },
    { code: 'ES', dial: '+34',  flag: '🇪🇸', name: 'Spain' },
    { code: 'MX', dial: '+52',  flag: '🇲🇽', name: 'Mexico' },
    { code: 'BR', dial: '+55',  flag: '🇧🇷', name: 'Brazil' },
    { code: 'JP', dial: '+81',  flag: '🇯🇵', name: 'Japan' },
    { code: 'CN', dial: '+86',  flag: '🇨🇳', name: 'China' },
    { code: 'AE', dial: '+971', flag: '🇦🇪', name: 'UAE' },
    { code: 'SG', dial: '+65',  flag: '🇸🇬', name: 'Singapore' },
    { code: 'NZ', dial: '+64',  flag: '🇳🇿', name: 'New Zealand' },
    { code: 'IE', dial: '+353', flag: '🇮🇪', name: 'Ireland' },
    { code: 'PT', dial: '+351', flag: '🇵🇹', name: 'Portugal' },
    { code: 'NL', dial: '+31',  flag: '🇳🇱', name: 'Netherlands' },
    { code: 'SE', dial: '+46',  flag: '🇸🇪', name: 'Sweden' },
    { code: 'NO', dial: '+47',  flag: '🇳🇴', name: 'Norway' },
    { code: 'DK', dial: '+45',  flag: '🇩🇰', name: 'Denmark' },
    { code: 'PK', dial: '+92',  flag: '🇵🇰', name: 'Pakistan' },
    { code: 'PH', dial: '+63',  flag: '🇵🇭', name: 'Philippines' },
    { code: 'TZ', dial: '+255', flag: '🇹🇿', name: 'Tanzania' },
    { code: 'UG', dial: '+256', flag: '🇺🇬', name: 'Uganda' },
    { code: 'ET', dial: '+251', flag: '🇪🇹', name: 'Ethiopia' },
    { code: 'TT', dial: '+1-868', flag: '🇹🇹', name: 'Trinidad & Tobago' },
    { code: 'JM', dial: '+1-876', flag: '🇯🇲', name: 'Jamaica' },
    { code: 'BB', dial: '+1-246', flag: '🇧🇧', name: 'Barbados' },
];

// Parse an existing phone string into { dialCode, local }
function parsePhone(value) {
    if (!value) return { dialCode: '+1', local: '' };
    const v = String(value).trim();
    if (!v.startsWith('+')) return { dialCode: '+1', local: v };

    // Try longest match first
    const sorted = [...COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);
    for (const c of sorted) {
        if (v.startsWith(c.dial + ' ') || v.startsWith(c.dial + '-') || v === c.dial) {
            const local = v.slice(c.dial.length).replace(/^[\s\-]/, '');
            return { dialCode: c.dial, local };
        }
    }
    // Unknown prefix — extract digits after first space
    const spaceIdx = v.indexOf(' ');
    if (spaceIdx > 0) {
        return { dialCode: v.slice(0, spaceIdx), local: v.slice(spaceIdx + 1) };
    }
    return { dialCode: '+1', local: v.replace(/^\+\d+/, '') };
}

export default function PhoneInput({ value, onChange, style = {}, inputStyle = {}, placeholder = '(555) 000-0000' }) {
    const parsed = parsePhone(value);
    const [dialCode, setDialCode] = useState(parsed.dialCode);
    const [local, setLocal] = useState(parsed.local);
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const dropdownRef = useRef(null);
    const searchRef = useRef(null);
    const initializedRef = useRef(false);

    // Sync from external value changes (e.g. data load from server)
    useEffect(() => {
        if (!value && !initializedRef.current) return;
        const p = parsePhone(value);
        setDialCode(p.dialCode);
        setLocal(p.local);
        initializedRef.current = true;
    }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

    // Emit combined value
    const emit = (code, num) => {
        const combined = num.trim() ? `${code} ${num.trim()}` : '';
        onChange(combined);
    };

    const handleDialChange = (code) => {
        setDialCode(code);
        setOpen(false);
        setSearch('');
        emit(code, local);
    };

    const handleLocalChange = (e) => {
        const num = e.target.value.replace(/[^\d\s\-().]/g, '');
        setLocal(num);
        emit(dialCode, num);
    };

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setOpen(false);
                setSearch('');
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    // Focus search when opening
    useEffect(() => {
        if (open) setTimeout(() => searchRef.current?.focus(), 60);
    }, [open]);

    const filtered = search.trim()
        ? COUNTRIES.filter(c =>
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.dial.includes(search) ||
            c.code.toLowerCase().includes(search.toLowerCase())
        )
        : COUNTRIES;

    const selected = COUNTRIES.find(c => c.dial === dialCode) || COUNTRIES[0];

    return (
        <div style={{ position: 'relative', ...style }} ref={dropdownRef}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                borderRadius: 12,
                border: `1px solid ${T.line}`,
                background: T.avatarBg,
                overflow: 'hidden',
                ...inputStyle,
            }}>
                {/* Country code button */}
                <button
                    type="button"
                    onClick={() => setOpen(o => !o)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '14px 10px 14px 14px',
                        background: 'transparent',
                        border: 'none',
                        borderRight: `1px solid ${T.line}`,
                        cursor: 'pointer',
                        fontFamily: F,
                        fontSize: 14,
                        color: T.ink,
                        flexShrink: 0,
                        whiteSpace: 'nowrap',
                    }}
                >
                    <span style={{ fontSize: 18, lineHeight: 1 }}>{selected.flag}</span>
                    <span style={{ fontSize: 13, color: T.muted, marginLeft: 2 }}>{selected.dial}</span>
                    <svg width="10" height="10" fill="none" stroke={T.faded} strokeWidth="2" viewBox="0 0 24 24" style={{ marginLeft: 2, flexShrink: 0 }}>
                        <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>

                {/* Local number */}
                <input
                    type="tel"
                    value={local}
                    onChange={handleLocalChange}
                    placeholder={placeholder}
                    autoComplete="tel-national"
                    style={{
                        flex: 1,
                        padding: '14px 14px',
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        fontFamily: F,
                        fontSize: 14,
                        color: T.ink,
                        minWidth: 0,
                    }}
                />
            </div>

            {/* Dropdown */}
            {open && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    left: 0,
                    zIndex: 200,
                    background: '#fff',
                    borderRadius: 14,
                    border: `1px solid ${T.line}`,
                    boxShadow: '0 8px 32px rgba(61,35,30,0.12)',
                    width: 260,
                    overflow: 'hidden',
                }}>
                    {/* Search */}
                    <div style={{ padding: '10px 12px', borderBottom: `1px solid ${T.line}` }}>
                        <input
                            ref={searchRef}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search country…"
                            style={{
                                width: '100%',
                                padding: '8px 12px',
                                borderRadius: 8,
                                border: `1px solid ${T.line}`,
                                background: T.avatarBg,
                                fontFamily: F,
                                fontSize: 13,
                                color: T.ink,
                                outline: 'none',
                                boxSizing: 'border-box',
                            }}
                        />
                    </div>

                    {/* List */}
                    <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                        {filtered.length === 0 ? (
                            <p style={{ fontFamily: F, fontSize: 13, color: T.faded, padding: '12px 16px', margin: 0 }}>No results</p>
                        ) : filtered.map((c) => (
                            <button
                                key={c.code}
                                type="button"
                                onClick={() => handleDialChange(c.dial)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                    width: '100%',
                                    padding: '10px 14px',
                                    background: c.dial === dialCode ? T.avatarBg : 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    fontFamily: F,
                                }}
                            >
                                <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>{c.flag}</span>
                                <span style={{ flex: 1, fontSize: 13, color: T.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                                <span style={{ fontSize: 12, color: T.muted, flexShrink: 0 }}>{c.dial}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
