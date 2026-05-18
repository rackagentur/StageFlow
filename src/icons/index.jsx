// NoxReach icon set — stroke-based, 24×24 viewBox, currentColor
// Usage: <IconDashboard size={16} color="#22D3EE" />

const defaults = { size: 16, color: "currentColor", strokeWidth: 1.75 };

function Icon({ size, color, strokeWidth, children }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0, display: "block" }}
    >
      {children}
    </svg>
  );
}

export function IconDashboard({ size = defaults.size, color = defaults.color, strokeWidth = defaults.strokeWidth }) {
  return (
    <Icon size={size} color={color} strokeWidth={strokeWidth}>
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="8" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" />
      <rect x="13" y="13" width="8" height="8" rx="1.5" />
    </Icon>
  );
}

export function IconAnalytics({ size = defaults.size, color = defaults.color, strokeWidth = defaults.strokeWidth }) {
  return (
    <Icon size={size} color={color} strokeWidth={strokeWidth}>
      <line x1="3" y1="20" x2="21" y2="20" />
      <rect x="5" y="13" width="4" height="7" rx="1" />
      <rect x="10" y="8" width="4" height="12" rx="1" />
      <rect x="15" y="4" width="4" height="16" rx="1" />
    </Icon>
  );
}

export function IconPipeline({ size = defaults.size, color = defaults.color, strokeWidth = defaults.strokeWidth }) {
  return (
    <Icon size={size} color={color} strokeWidth={strokeWidth}>
      <rect x="2.5" y="3" width="5" height="18" rx="1.5" />
      <rect x="9.5" y="3" width="5" height="12" rx="1.5" />
      <rect x="16.5" y="3" width="5" height="15" rx="1.5" />
    </Icon>
  );
}

export function IconFollowUps({ size = defaults.size, color = defaults.color, strokeWidth = defaults.strokeWidth }) {
  return (
    <Icon size={size} color={color} strokeWidth={strokeWidth}>
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 15.5 14.5" />
    </Icon>
  );
}

export function IconReplyHub({ size = defaults.size, color = defaults.color, strokeWidth = defaults.strokeWidth }) {
  return (
    <Icon size={size} color={color} strokeWidth={strokeWidth}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <polyline points="3 7 12 13 21 7" />
    </Icon>
  );
}

export function IconCalendar({ size = defaults.size, color = defaults.color, strokeWidth = defaults.strokeWidth }) {
  return (
    <Icon size={size} color={color} strokeWidth={strokeWidth}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="8" y1="4" x2="8" y2="2" />
      <line x1="16" y1="4" x2="16" y2="2" />
      <circle cx="8.5" cy="16" r="1" fill={color} stroke="none" />
      <circle cx="12" cy="16" r="1" fill={color} stroke="none" />
      <circle cx="15.5" cy="16" r="1" fill={color} stroke="none" />
    </Icon>
  );
}

export function IconTemplates({ size = defaults.size, color = defaults.color, strokeWidth = defaults.strokeWidth }) {
  return (
    <Icon size={size} color={color} strokeWidth={strokeWidth}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="13" y2="17" />
    </Icon>
  );
}

export function IconOutreach({ size = defaults.size, color = defaults.color, strokeWidth = defaults.strokeWidth }) {
  return (
    <Icon size={size} color={color} strokeWidth={strokeWidth}>
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </Icon>
  );
}

export function IconBookingKit({ size = defaults.size, color = defaults.color, strokeWidth = defaults.strokeWidth }) {
  return (
    <Icon size={size} color={color} strokeWidth={strokeWidth}>
      <rect x="2" y="7" width="20" height="15" rx="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      <line x1="2" y1="13" x2="22" y2="13" />
      <line x1="12" y1="10" x2="12" y2="16" />
    </Icon>
  );
}

export function IconSettings({ size = defaults.size, color = defaults.color, strokeWidth = defaults.strokeWidth }) {
  return (
    <Icon size={size} color={color} strokeWidth={strokeWidth}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </Icon>
  );
}

export function IconInbound({ size = defaults.size, color = defaults.color, strokeWidth = defaults.strokeWidth }) {
  return (
    <Icon size={size} color={color} strokeWidth={strokeWidth}>
      <polyline points="8 17 12 21 16 17" />
      <line x1="12" y1="12" x2="12" y2="21" />
      <path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29" />
    </Icon>
  );
}

export function IconPricing({ size = defaults.size, color = defaults.color, strokeWidth = defaults.strokeWidth }) {
  return (
    <Icon size={size} color={color} strokeWidth={strokeWidth}>
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </Icon>
  );
}

export function IconAdmin({ size = defaults.size, color = defaults.color, strokeWidth = defaults.strokeWidth }) {
  return (
    <Icon size={size} color={color} strokeWidth={strokeWidth}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </Icon>
  );
}

// ── UI icons used throughout the app ──────────────────────────────────────

export function IconPlus({ size = defaults.size, color = defaults.color, strokeWidth = defaults.strokeWidth }) {
  return (
    <Icon size={size} color={color} strokeWidth={strokeWidth}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </Icon>
  );
}

export function IconClose({ size = defaults.size, color = defaults.color, strokeWidth = defaults.strokeWidth }) {
  return (
    <Icon size={size} color={color} strokeWidth={strokeWidth}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </Icon>
  );
}

export function IconSearch({ size = defaults.size, color = defaults.color, strokeWidth = defaults.strokeWidth }) {
  return (
    <Icon size={size} color={color} strokeWidth={strokeWidth}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </Icon>
  );
}

export function IconUpload({ size = defaults.size, color = defaults.color, strokeWidth = defaults.strokeWidth }) {
  return (
    <Icon size={size} color={color} strokeWidth={strokeWidth}>
      <polyline points="16 16 12 12 8 16" />
      <line x1="12" y1="12" x2="12" y2="21" />
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
    </Icon>
  );
}

export function IconCheck({ size = defaults.size, color = defaults.color, strokeWidth = defaults.strokeWidth }) {
  return (
    <Icon size={size} color={color} strokeWidth={strokeWidth}>
      <polyline points="20 6 9 17 4 12" />
    </Icon>
  );
}

export function IconArrowRight({ size = defaults.size, color = defaults.color, strokeWidth = defaults.strokeWidth }) {
  return (
    <Icon size={size} color={color} strokeWidth={strokeWidth}>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </Icon>
  );
}

export function IconMail({ size = defaults.size, color = defaults.color, strokeWidth = defaults.strokeWidth }) {
  return (
    <Icon size={size} color={color} strokeWidth={strokeWidth}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <polyline points="3 7 12 13 21 7" />
    </Icon>
  );
}

export function IconPhone({ size = defaults.size, color = defaults.color, strokeWidth = defaults.strokeWidth }) {
  return (
    <Icon size={size} color={color} strokeWidth={strokeWidth}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.62 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.96-.96a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </Icon>
  );
}

export function IconInstagram({ size = defaults.size, color = defaults.color, strokeWidth = defaults.strokeWidth }) {
  return (
    <Icon size={size} color={color} strokeWidth={strokeWidth}>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill={color} stroke="none" />
    </Icon>
  );
}

export function IconPowerOff({ size = defaults.size, color = defaults.color, strokeWidth = defaults.strokeWidth }) {
  return (
    <Icon size={size} color={color} strokeWidth={strokeWidth}>
      <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
      <line x1="12" y1="2" x2="12" y2="12" />
    </Icon>
  );
}

export function IconStar({ size = defaults.size, color = defaults.color, strokeWidth = defaults.strokeWidth }) {
  return (
    <Icon size={size} color={color} strokeWidth={strokeWidth}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </Icon>
  );
}

export function IconLink({ size = defaults.size, color = defaults.color, strokeWidth = defaults.strokeWidth }) {
  return (
    <Icon size={size} color={color} strokeWidth={strokeWidth}>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </Icon>
  );
}

export function IconChevronRight({ size = defaults.size, color = defaults.color, strokeWidth = defaults.strokeWidth }) {
  return (
    <Icon size={size} color={color} strokeWidth={strokeWidth}>
      <polyline points="9 18 15 12 9 6" />
    </Icon>
  );
}

export function IconWhatsApp({ size = defaults.size, color = defaults.color, strokeWidth = defaults.strokeWidth }) {
  return (
    <Icon size={size} color={color} strokeWidth={strokeWidth}>
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </Icon>
  );
}

export function IconContacts({ size = defaults.size, color = defaults.color, strokeWidth = defaults.strokeWidth }) {
  return (
    <Icon size={size} color={color} strokeWidth={strokeWidth}>
      <circle cx="9" cy="7" r="3.5" />
      <path d="M2 20c0-3.866 3.134-7 7-7s7 3.134 7 7" />
      <line x1="19" y1="8" x2="19" y2="14" />
      <line x1="22" y1="11" x2="16" y2="11" />
    </Icon>
  );
}

export function IconConnectors({ size = defaults.size, color = defaults.color, strokeWidth = defaults.strokeWidth }) {
  return (
    <Icon size={size} color={color} strokeWidth={strokeWidth}>
      <rect x="7" y="11" width="10" height="7" rx="1.5" />
      <line x1="9" y1="11" x2="9" y2="5" />
      <line x1="15" y1="11" x2="15" y2="5" />
      <line x1="12" y1="18" x2="12" y2="22" />
      <line x1="9" y1="22" x2="15" y2="22" />
    </Icon>
  );
}

// Map from tab id → icon component (for use in nav)
export const TAB_ICONS = {
  dashboard:   IconDashboard,
  analytics:   IconAnalytics,
  pipeline:    IconPipeline,
  contacts:    IconContacts,
  followups:   IconFollowUps,
  bookingdesk: IconReplyHub,
  calendar:    IconCalendar,
  templates:   IconTemplates,
  outreach:    IconOutreach,
  bookingkit:  IconBookingKit,
  settings:    IconSettings,
  connectors:  IconConnectors,
  inbound:     IconInbound,
  pricing:     IconPricing,
  admin:       IconAdmin,
};
