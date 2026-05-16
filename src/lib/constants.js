export const COLORS = {
  // Backgrounds — theme-sensitive (CSS variables, toggled via data-theme on <html>)
  bg:          "var(--c-bg)",
  bgDeep:      "var(--c-bg-deep)",
  surface:     "var(--c-surface)",
  surface2:    "var(--c-surface2)",

  // Borders — theme-sensitive
  border:      "var(--c-border)",
  borderHover: "var(--c-border-hover)",
  borderActive:"#0E7490",   // brand colour — stays same in both themes

  // Brand cyan — ONE base, three densities, one rule:
  //   purple      → solid interactive backgrounds (buttons, checkboxes, dots)
  //   purpleHover → lightens on hover/focus
  //   purpleLight → highlight text/icon — theme-sensitive (dark: cyan-400, light: cyan-700)
  //   purpleDim   → border tint (all active/selected outlines)
  //   purpleBg    → subtle fill (selected card bg, PRO card tint)
  purple:      "#0E7490",   // cyan-700  — button bg, white text at 5.3:1 ✓
  purpleHover: "#0891B2",   // cyan-600  — hover/focus (slightly lighter)
  purpleLight: "var(--c-purple-light)",  // theme-sensitive: cyan-400 dark / cyan-700 light
  purpleDim:   "rgba(14,116,144,0.30)",  // ONE border tint — used everywhere
  purpleBg:    "rgba(14,116,144,0.08)",  // ONE fill tint  — used everywhere

  // Text — theme-sensitive
  text:          "var(--c-text)",
  text2:         "var(--c-text2)",
  text3:         "var(--c-text3)",
  textSecondary: "var(--c-text2)",
  textMuted:     "var(--c-text3)",

  // Status — unchanged in both themes
  green:  "#22c55e",
  amber:  "#f59e0b",
  red:    "#ef4444",

  // Gold: public booking CTA only
  gold: "#D4AF37",

  // Violet — selected lead state only
  violet:    "#7C3AED",   // violet-600 — selected border
  violetLight:"#8B5CF6",  // violet-500 — selected left accent glow
  violetBg:  "rgba(124,58,237,0.08)", // selected card tint
};

export const STAGES = [
  { id: "target",    label: "Target"    },
  { id: "contacted", label: "Contacted" },
  { id: "followup",  label: "Follow-up" },
  { id: "replied",   label: "Replied"   },
  { id: "booked",    label: "Booked"    },
];
