export const COLORS = {
  // Backgrounds
  bg:          "#0a0a0a",
  bgDeep:      "#060608",
  surface:     "#111111",
  surface2:    "#18181b",

  // Borders
  border:      "rgba(255,255,255,0.07)",
  borderHover: "rgba(255,255,255,0.14)",
  borderActive:"#0E7490",

  // Brand cyan — ONE base, three densities, one rule:
  //   purple      → solid interactive backgrounds (buttons, checkboxes, dots)
  //   purpleHover → lightens on hover/focus
  //   purpleLight → text & icon highlights on dark surfaces ONLY — never a background
  //   purpleDim   → border tint (all active/selected outlines — same token everywhere)
  //   purpleBg    → subtle fill (selected card bg, PRO card tint)
  purple:      "#0E7490",   // cyan-700  — button bg, white text at 5.3:1 ✓
  purpleHover: "#0891B2",   // cyan-600  — hover/focus (slightly lighter)
  purpleLight: "#22D3EE",   // cyan-400  — text/icon labels on dark bg ONLY
  purpleDim:   "rgba(14,116,144,0.30)",  // ONE border tint — used everywhere
  purpleBg:    "rgba(14,116,144,0.08)",  // ONE fill tint  — used everywhere

  // Text — 3 levels
  text:          "#ffffff",
  text2:         "#a1a1aa",
  text3:         "#52525b",
  textSecondary: "#a1a1aa",
  textMuted:     "#52525b",

  // Status
  green:  "#22c55e",
  amber:  "#f59e0b",
  red:    "#ef4444",

  // Gold: public booking CTA only
  gold: "#D4AF37",
};

export const STAGES = [
  { id: "target",    label: "Target"    },
  { id: "contacted", label: "Contacted" },
  { id: "followup",  label: "Follow-up" },
  { id: "replied",   label: "Replied"   },
  { id: "booked",    label: "Booked"    },
];
