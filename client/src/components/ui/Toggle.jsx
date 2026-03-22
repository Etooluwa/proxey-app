/**
 * Toggle — v6 Warm Editorial switch
 * Props:
 *   on       {boolean}  — current state
 *   onChange {fn}       — called with new boolean value
 *   disabled {boolean}  — optional
 */
export default function Toggle({ on, onChange, disabled = false, activeColor = '#C25E4A' }) {
    return (
        <button
            type="button"
            onClick={() => !disabled && onChange(!on)}
            role="switch"
            aria-checked={on}
            disabled={disabled}
            style={{
                width: 44,
                height: 26,
                borderRadius: 13,
                border: 'none',
                cursor: disabled ? 'not-allowed' : 'pointer',
                background: on ? activeColor : 'rgba(140,106,100,0.2)',
                position: 'relative',
                transition: 'background 0.2s',
                flexShrink: 0,
                opacity: disabled ? 0.5 : 1,
            }}
        >
            <div
                style={{
                    position: 'absolute',
                    top: 3,
                    left: on ? 21 : 3,
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: '#fff',
                    transition: 'left 0.2s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }}
            />
        </button>
    );
}
