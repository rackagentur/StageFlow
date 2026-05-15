export const COLORS = {
  // Backgrounds
  bg:          "#0a0a0a",
  bgDeep:      "#060608",
  surface:     "#111111",
  surface2:    "#18181b",

  // Borders — one token for each state
  border:      "rgba(255,255,255,0.07)",
  borderHover: "rgba(255,255,255,0.14)",
  borderActive:"#155E75",

  // Cyan — brand accent (matches NoxReach logo)
  // purple     = solid button bg — one step darker for depth
  // purpleHover= lightens on hover (previous base value)
  // purpleLight= text/icon highlight on dark surfaces
  // btnText    = dark indigo from logo bg — replaces white on cyan buttons
  purple:      "#155E75",
  purpleHover: "#0E7490",
  purpleLight: "#22D3EE",
  purpleDim:   "rgba(21,94,117,0.35)",
  purpleBg:    "rgba(21,94,117,0.10)",
  btnText:     "#0E0B1F",

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
