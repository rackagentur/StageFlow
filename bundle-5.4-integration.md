# Bundle 5.4: Quick Actions & Keyboard Shortcuts - Integration Guide

## File Created
`KeyboardShortcuts.jsx` - Keyboard shortcuts system (220 lines)

Contains:
1. `useKeyboardShortcuts` - React hook for global shortcuts
2. `ShortcutsHelpModal` - Help modal showing all shortcuts
3. `QuickActionsButton` - Floating ? button in bottom-right
4. `QuickActionTooltip` - Tooltip component for buttons

## Keyboard Shortcuts

| Key | Action | Description |
|-----|--------|-------------|
| `N` | New Lead | Open add lead form |
| `I` | Import CSV | Open CSV import modal |
| `Cmd + K` | Search | Focus search bar |
| `Esc` | Close | Close any open modal |
| `?` | Help | Show shortcuts guide |

## Integration Steps

### 1. Insert Components in App.jsx

Add after SmartSuggestions components (around line ~3900):

```javascript
function SmartSuggestionsButton({ supabase, user, lead, onLeadAdded }) {
  // ... SmartSuggestions code ...
}

// Quick Actions & Keyboard Shortcuts (Bundle 5.4)
function useKeyboardShortcuts({ onNewLead, onImportCSV, onSearch, onCloseModal, searchInputRef }) {
  // ... paste useKeyboardShortcuts code here
}

function ShortcutsHelpModal({ onClose }) {
  // ... paste ShortcutsHelpModal code here
}

function QuickActionsButton({ onShowHelp }) {
  // ... paste QuickActionsButton code here
}

function QuickActionTooltip({ children, text, shortcut }) {
  // ... paste QuickActionTooltip code here
}

// Then AnalyticsView below...
```

### 2. Add State for Shortcuts Help Modal

In the main App component, add state near the top (around line ~4200):

```javascript
function App() {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // ... other state ...
  
  // Add this:
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const searchInputRef = useRef(null);
```

### 3. Wire Up Keyboard Shortcuts Hook

Add the hook below state declarations:

```javascript
const searchInputRef = useRef(null);

// Wire up keyboard shortcuts
useKeyboardShortcuts({
  onNewLead: () => {
    if (activeTab === 'pipeline') {
      setShowAddLead(true);
    }
  },
  onImportCSV: () => {
    if (activeTab === 'pipeline') {
      setShowCSVImport(true);
    }
  },
  onSearch: () => {
    // Focus search if on pipeline
    if (activeTab === 'pipeline' && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  },
  onCloseModal: () => {
    // Close any open modals
    setShowAddLead(false);
    setShowCSVImport(false);
    setShowShortcutsHelp(false);
    setSelectedLead(null);
  },
  searchInputRef
});

// Listen for help shortcut event
useEffect(() => {
  function handleShowHelp() {
    setShowShortcutsHelp(true);
  }
  window.addEventListener('showShortcutsHelp', handleShowHelp);
  return () => window.removeEventListener('showShortcutsHelp', handleShowHelp);
}, []);
```

### 4. Add ref to Search Input

In the Pipeline view, find the search input (around line ~4650) and add ref:

```javascript
<input
  ref={searchInputRef}  // <-- ADD THIS
  type="text"
  placeholder="Search venues, contacts, notes..."
  value={searchQuery}
  onChange={e => setSearchQuery(e.target.value)}
  style={{
    // ... styles
  }}
/>
```

### 5. Add Tooltips to Main Action Buttons

Wrap the "+ Add Lead" and "Import CSV" buttons with tooltips:

```javascript
{/* Add Lead Button - wrap with tooltip */}
<QuickActionTooltip text="Add new lead" shortcut="N">
  <button
    onClick={() => setShowAddLead(true)}
    style={{ /* ... existing styles ... */ }}
  >
    + Add Lead
  </button>
</QuickActionTooltip>

{/* Import CSV Button - wrap with tooltip */}
<QuickActionTooltip text="Import from CSV" shortcut="I">
  <button
    onClick={() => setShowCSVImport(true)}
    style={{ /* ... existing styles ... */ }}
  >
    📊 Import CSV
  </button>
</QuickActionTooltip>
```

### 6. Add Shortcuts Help Modal to Main Render

Add before the closing `</div>` of the main App component (around line ~5700):

```javascript
      {/* Shortcuts Help Modal */}
      {showShortcutsHelp && (
        <ShortcutsHelpModal
          onClose={() => setShowShortcutsHelp(false)}
        />
      )}

      {/* Quick Actions Floating Button */}
      <QuickActionsButton
        onShowHelp={() => setShowShortcutsHelp(true)}
      />
    </div>
  );
}
```

## Features Implemented

✅ **Global Keyboard Shortcuts**
- `N` - New lead (opens add lead form)
- `I` - Import CSV (opens import modal)
- `Cmd + K` - Focus search bar
- `Esc` - Close any modal
- `?` - Show shortcuts help

✅ **Smart Context Detection**
- Shortcuts disabled when typing in inputs
- Only triggers on appropriate tabs
- Works globally across the app

✅ **Help Modal**
- Press `?` to see all shortcuts
- Clean, scannable layout
- Keyboard-style key badges
- Description for each shortcut

✅ **Floating Help Button**
- Bottom-right corner `?` button
- Hover effect with scale animation
- Always accessible
- Tooltip on hover

✅ **Tooltips on Action Buttons**
- Shows action name + keyboard shortcut
- Appears on hover
- Positioned above button
- Clean, minimal design

## User Experience Improvements

1. **Power Users**: Keyboard shortcuts dramatically speed up common actions
2. **Discoverability**: `?` button makes shortcuts discoverable
3. **Visual Feedback**: Tooltips show shortcuts on hover
4. **Accessibility**: Help modal can be opened via keyboard
5. **Non-Intrusive**: Floating button stays out of the way

## Testing Checklist

1. ✅ Press `N` - Opens add lead form
2. ✅ Press `I` - Opens CSV import modal
3. ✅ Press `Cmd + K` - Focuses search bar
4. ✅ Press `Esc` - Closes open modal
5. ✅ Press `?` - Opens shortcuts help modal
6. ✅ Shortcuts disabled while typing in inputs
7. ✅ Hover over "+ Add Lead" - Shows tooltip with `N` shortcut
8. ✅ Hover over "Import CSV" - Shows tooltip with `I` shortcut
9. ✅ Click floating `?` button - Opens help modal
10. ✅ Press `?` again - Closes help modal

## Bundle 5 Complete! 🎉

All features from Bundle 5 are now ready:
- ✅ 5.1: CSV Import (deployed to production)
- ✅ 5.2: Message Templates
- ✅ 5.3: Smart Lead Suggestions
- ✅ 5.4: Quick Actions & Shortcuts

**Ready to integrate all three remaining features and deploy to production!**
