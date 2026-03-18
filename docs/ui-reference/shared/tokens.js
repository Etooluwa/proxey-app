// Kliques Design Tokens (v4 — Apple Health-inspired)

export const t = {
  bg: "#F2F2F7",        // System gray background (Apple-style)
  fg: "#0D1619",        // Primary text, near-black
  muted: "#6B7280",     // Secondary text
  accent: "#FF751F",    // Brand orange — selected states, active nav, links
  accentLight: "#FFF0E6", // Light orange tint
  ctaBg: "#0D1619",     // Primary button fill
  ctaText: "#FFFFFF",   // Primary button text
  ctaDisabled: "#B0B0B0", // Disabled button
  divider: "#E5E5EA",   // Separators (Apple system divider)
  surface: "#FFFFFF",   // Legacy — use card instead
  callout: "#FFF9E6",   // Yellow callout backgrounds
  success: "#22C55E",   // Completed states
  successLight: "#F0FDF4", // Success backgrounds
  warning: "#F5A623",   // Milestones, caution
  border: "#D1D5DB",    // Input borders
  borderLight: "#E5E7EB", // Subtle borders
  dangerLight: "#FEF2F2", // Danger backgrounds
  danger: "#EF4444",    // Destructive actions
  card: "#FFFFFF",      // Card surface color
  gradTop: "#D45400",   // Gradient start — dark burnt orange
  gradMid: "#E87020",   // Gradient middle — warm orange
  gradBot: "#F2F2F7",   // Gradient end — matches bg
};

export const f = "'Manrope', system-ui, sans-serif";

// Warm gradient — dark burnt orange top for white text contrast, fading to system gray
export const grad = `linear-gradient(180deg, ${t.gradTop} 0%, ${t.gradMid} 40%, #F09050 65%, #F5C4A0 82%, ${t.gradBot} 100%)`;
