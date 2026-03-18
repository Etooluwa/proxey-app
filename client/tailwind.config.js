/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Kliques v4 design tokens — 1:1 with docs/ui-reference/shared/tokens.js
                accent:       '#FF751F', // Brand orange — active states, links, badges
                accentLight:  '#FFF0E6', // Light orange tint backgrounds
                background:   '#F2F2F7', // Page background — Apple system gray
                foreground:   '#0D1619', // Primary text, near-black
                muted:        '#6B7280', // Secondary text / metadata
                card:         '#FFFFFF', // Card surface
                surface:      '#F3F1EF', // Elevated surface (sheets, modals)
                divider:      '#E5E5EA', // Separators — Apple system divider
                callout:      '#FFF9E6', // Yellow callout backgrounds
                success:      '#22C55E', // Completed states
                successLight: '#F0FDF4', // Success badge backgrounds
                warning:      '#F5A623', // Milestones / caution
                danger:       '#EF4444', // Destructive actions
                dangerLight:  '#FEF2F2', // Danger tint backgrounds
                ctaBg:        '#0D1619', // Primary button fill (near-black)
                ctaText:      '#FFFFFF', // Primary button text
                ctaDisabled:  '#B0B0B0', // Disabled button fill
                border:       '#D1D5DB', // Input borders
                borderLight:  '#E5E7EB', // Subtle borders
                // Gradient colour stops
                gradTop:      '#D45400', // Gradient start — dark burnt orange
                gradMid:      '#E87020', // Gradient middle — warm orange
                gradMid2:     '#F09050', // Gradient 65% step
                gradMid3:     '#F5C4A0', // Gradient 82% step
                gradBot:      '#F2F2F7', // Gradient end — matches background
            },
            fontFamily: {
                manrope:  ["'Manrope'", 'system-ui', 'sans-serif'],
                playfair: ["'Playfair Display'", 'Georgia', 'serif'],
            },
            borderRadius: {
                card:   '16px',   // Standard card corners
                header: '28px',   // Gradient header bottom corners
                pill:   '9999px', // Fully rounded badges / buttons
            },
            backgroundImage: {
                'gradient-header': "linear-gradient(180deg, #D45400 0%, #E87020 40%, #F09050 65%, #F5C4A0 82%, #F2F2F7 100%)",
            },
            boxShadow: {
                card:      '0 1px 3px rgba(0, 0, 0, 0.04)',
                'card-md': '0 2px 8px rgba(0, 0, 0, 0.08)',
            },
        },
    },
    plugins: [],
}
