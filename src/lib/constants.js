export const COLORS = {
  // Backgrounds
  bg:          "#0a0a0a",
  bgDeep:      "#060608",
  surface:     "#111111",
  surface2:    "#18181b",

  // Borders — one token for each state
  border:      "rgba(255,255,255,0.07)",
  borderHover: "rgba(255,255,255,0.14)",
  borderActive:"#0E7490",

  // Cyan — brand accent (matches NoxReach logo)
  // purple = solid button/interactive background (white text at 5.3:1 contrast)
  // purpleLight = text/icon highlight on dark backgrounds
  purple:      "#0E7490",
  purpleHover: "#0891B2",
  purpleLight: "#22D3EE",
  purpleDim:   "rgba(14,116,144,0.30)",
  purpleBg:    "rgba(14,116,144,0.10)",

  // Text — 3 levels only
  text:          "#ffffff",
  text2:         "#a1a1aa",
  text3:         "#52525b",
  textSecondary: "#a1a1aa",
  textMuted:     "#52525b",

  // Status — functional only, never decorative
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
