# Bundle 5.2: Message Templates - Integration Guide

## Files Created
1. `TemplatesView.jsx` - Main templates management component (327 lines)
2. `TemplatePicker.jsx` - Quick template insertion modal (175 lines)

## Integration Steps

### 1. Add Templates Tab to Sidebar

In `App.jsx`, find the `TABS` array (around line ~3890) and add:

```javascript
const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'analytics', label: 'Analytics', icon: '📈' },
  { id: 'pipeline', label: 'Pipeline', icon: '⚡' },
  { id: 'followups', label: 'Follow-ups', icon: '⏰', badge: followUpBadge },
  { id: 'replyhub', label: 'Reply Hub', icon: '💬', badge: replyBadge },
  { id: 'calendar', label: 'Calendar', icon: '📅' },
  { id: 'templates', label: 'Templates', icon: '📝' },  // <-- ADD THIS
  // ... rest
];
```

### 2. Insert Components Before Main Content

In `App.jsx`, insert both components before the `AnalyticsView` component (around line ~3309):

```javascript
// Message Templates Components (Bundle 5.2)
function TemplatesView({ supabase, user }) {
  // ... paste TemplatesView.jsx content here
}

function TemplateModal({ supabase, user, template, onClose, onSave }) {
  // ... (already inside TemplatesView.jsx)
}

function TemplatePicker({ supabase, user, lead, onInsert }) {
  // ... paste TemplatePicker.jsx content here
}

// Then AnalyticsView below...
```

### 3. Add Templates Rendering in Main Content

In `App.jsx`, find the main content rendering section (around line ~4395) and add:

```javascript
{activeTab === 'analytics' && <AnalyticsView supabase={supabase} user={user} />}
{activeTab === 'templates' && <TemplatesView supabase={supabase} user={user} />}  // <-- ADD THIS
{activeTab === 'pipeline' && (
  // ... pipeline content
)}
```

### 4. Add Template Picker to LeadDetail Panel

In `App.jsx`, find the `LeadDetail` component (around line ~1850), inside the contact log section, add Template Picker button:

```javascript
{/* Contact Log Section */}
{lead.contactLog && (
  <div style={{ marginTop: 20, paddingTop: 20, borderTop: `1px solid ${COLORS.border}` }}>
    <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text2, marginBottom: 8 }}>
      Via {outreachIcon} {outreachLabel}
    </div>
    <div style={{ fontSize: 14, color: COLORS.text, lineHeight: 1.6 }}>
      {lead.contactLog}
    </div>
  </div>
)}

{/* Template Picker - ADD THIS SECTION */}
{(lead.stage === 'target' || lead.stage === 'contacted') && (
  <div style={{ marginTop: 20, paddingTop: 20, borderTop: `1px solid ${COLORS.border}` }}>
    <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text2, marginBottom: 12 }}>
      Quick Actions
    </div>
    <TemplatePicker
      supabase={supabase}
      user={user}
      lead={lead}
      onInsert={(message) => {
        // Copy message to clipboard
        navigator.clipboard.writeText(message);
        // Show toast
        const toast = document.createElement('div');
        toast.textContent = '✓ Template copied to clipboard';
        toast.style.cssText = `
          position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%);
          background: ${COLORS.purple}; color: white; padding: 12px 24px;
          border-radius: 8px; font-size: 14px; font-weight: 600; z-index: 10000;
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
      }}
    />
  </div>
)}
```

### 5. Add Templates Tab to Mobile Nav

In `App.jsx`, find the `MobileBottomNav` component (around line ~4300) and add templates icon:

```javascript
<MobileBottomNav style={{ display: isMobile ? 'flex' : 'none' }}>
  <NavItem onClick={() => setActiveTab('dashboard')} active={activeTab === 'dashboard'}>
    <span>📊</span>
    <span style={{ fontSize: 11 }}>Home</span>
  </NavItem>
  {/* ... other nav items ... */}
  <NavItem onClick={() => setActiveTab('templates')} active={activeTab === 'templates'}>  {/* <-- ADD THIS */}
    <span>📝</span>
    <span style={{ fontSize: 11 }}>Templates</span>
  </NavItem>
  <NavItem onClick={() => setActiveTab('replyhub')} active={activeTab === 'replyhub'}>
    <span>💬</span>
    {replyBadge > 0 && <Badge>{replyBadge}</Badge>}
    <span style={{ fontSize: 11 }}>Replies</span>
  </NavItem>
</MobileBottomNav>
```

## Features Implemented

✅ **Templates Management Tab**
- Create/edit/delete message templates
- Category-based organization (Initial Outreach, Follow-up, Booking Request, Thank You, Other)
- Use count tracking
- Empty state with CTA

✅ **Smart Placeholders**
- `{venue_name}` - Lead name
- `{contact_name}` - Extracted from contact email
- `{artist_name}` - From user profile
- `{genre}` - Lead tag
- `{instagram}` - Lead Instagram handle

✅ **Template Picker Modal**
- Quick access from LeadDetail panel
- Shows templates sorted by use count
- One-click insert
- Auto-replaces placeholders
- Copies to clipboard
- Shows success toast

✅ **Usage Analytics**
- Tracks how many times each template is used
- Increments count via `increment_template_usage()` DB function
- Displays use count on template cards

## Database Functions Used

- `increment_template_usage(template_id)` - Already created in Bundle 5.1 migration
- Table: `message_templates` - Already created in Bundle 5.1 migration

## Testing Checklist

1. ✅ Templates tab appears in sidebar
2. ✅ Create new template with placeholders
3. ✅ Edit existing template
4. ✅ Delete template (with confirmation)
5. ✅ Open Template Picker from LeadDetail
6. ✅ Select template → placeholders replaced correctly
7. ✅ Message copied to clipboard
8. ✅ Toast notification appears
9. ✅ Use count increments after selection
10. ✅ Templates sorted by use count

## Next: Bundle 5.3 - Smart Lead Suggestions
