/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        fontFamily: {
            sans: ["'Sora'", 'system-ui', 'sans-serif'],
            sora: ["'Sora'", 'system-ui', 'sans-serif'],
        },
        extend: {
            colors: {
                // Kliques v6 design tokens — Warm Editorial
                base:      '#FBF7F2', // Warm cream — page background
                ink:       '#3D231E', // Deep brown-black — primary text
                muted:     '#8C6A64', // Warm brown-gray — secondary text
                faded:     '#B0948F', // Lightest text
                accent:    '#C25E4A', // Terracotta — the ONLY accent color
                hero:      '#FDDCC6', // Hero card background
                avatarBg:  '#F2EBE5', // Warm light section bg
                line:      'rgba(140,106,100,0.2)', // Hairline divider
                success:   '#5A8A5E', // Muted earthy green
                successBg: '#EBF2EC', // Success background
                callout:   '#FFF5E6', // Warm yellow callout
                card:      '#FFFFFF', // Card surface
                dangerBg:  '#FDEDEA', // Danger background
            },
            borderRadius: {
                card:   '16px',
                hero:   '28px',
                pill:   '9999px',
            },
            boxShadow: {
                card:      '0 1px 3px rgba(0, 0, 0, 0.04)',
                'card-md': '0 2px 8px rgba(0, 0, 0, 0.08)',
            },
        },
    },
    plugins: [],
}
