export const COLORS = {
  // Backgrounds
  bg:          "#0a0a0a",
  bgDeep:      "#060608",
  surface:     "#111111",
  surface2:    "#18181b",

  // Borders — one token for each state
  border:      "rgba(255,255,255,0.07)",
  borderHover: "rgba(255,255,255,0.14)",
  borderActive:"#00CFFF",

  // Cyan — brand accent (matches NoxReach logo)
  purple:      "#00CFFF",
  purpleHover: "#00B8E6",
  purpleLight: "#66E0FF",
  purpleDim:   "rgba(0,207,255,0.25)",
  purpleBg:    "rgba(0,207,255,0.08)",

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
