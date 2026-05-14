#!/usr/bin/env python3
# Master Integration Script - Bundles 5.2, 5.3, 5.4
# Message Templates + Smart Suggestions + Keyboard Shortcuts

import re

print("Starting Bundle 5.2, 5.3, 5.4 integration...")

# Read App.jsx
with open('src/App.jsx', 'r') as f:
    content = f.read()

# Read component files
print("\n1. Reading component files...")
with open('TemplatesView.jsx', 'r') as f:
    templates_view = f.read()

with open('TemplatePicker.jsx', 'r') as f:
    template_picker = f.read()

with open('SmartSuggestions.jsx', 'r') as f:
    smart_suggestions = f.read()

with open('KeyboardShortcuts.jsx', 'r') as f:
    keyboard_shortcuts = f.read()

print("   ✓ All component files loaded")

# Step 2: Insert all components before AnalyticsView
print("\n2. Inserting components...")
insertion_marker = "// AnalyticsView Component"

if insertion_marker in content:
    components_code = f"""
// Message Templates Components (Bundle 5.2)
{templates_view}

{template_picker}

// Smart Suggestions Components (Bundle 5.3)
{smart_suggestions}

// Quick Actions & Keyboard Shortcuts (Bundle 5.4)
{keyboard_shortcuts}

"""
    content = content.replace(insertion_marker, components_code + insertion_marker)
    print("   ✓ Components inserted")
else:
    print("   ✗ Could not find insertion point")

# Step 3: Add state for shortcuts help modal and search ref
print("\n3. Adding state for shortcuts...")
# Find the state declarations and add new ones
state_marker = "const [showCSVImport, setShowCSVImport] = useState(false);"
new_state = """const [showCSVImport, setShowCSVImport] = useState(false);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const searchInputRef = useRef(null);"""

if state_marker in content:
    content = content.replace(state_marker, new_state)
    print("   ✓ State added")
else:
    print("   ✗ Could not find state location")

# Step 4: Add keyboard shortcuts hook
print("\n4. Adding keyboard shortcuts hook...")
# Find after loadData function and add the hook
hook_marker = "  async function loadData() {"
hook_code = """  // Keyboard shortcuts hook (Bundle 5.4)
  useKeyboardShortcuts({
    onNewLead: () => {
      if (activeTab === "pipeline") setShowAddLead(true);
    },
    onImportCSV: () => {
      if (activeTab === "pipeline") setShowCSVImport(true);
    },
    onSearch: () => {
      if (activeTab === "pipeline" && searchInputRef.current) {
        searchInputRef.current.focus();
      }
    },
    onCloseModal: () => {
      setShowAddLead(false);
      setShowCSVImport(false);
      setShowShortcutsHelp(false);
      setSelectedLead(null);
    },
    searchInputRef
  });

  // Listen for help shortcut
  useEffect(() => {
    function handleShowHelp() {
      setShowShortcutsHelp(true);
    }
    window.addEventListener('showShortcutsHelp', handleShowHelp);
    return () => window.removeEventListener('showShortcutsHelp', handleShowHelp);
  }, []);

  async function loadData() {"""

if hook_marker in content:
    content = content.replace(hook_marker, hook_code)
    print("   ✓ Keyboard shortcuts hook added")
else:
    print("   ✗ Could not find hook location")

# Step 5: Add search input ref
print("\n5. Adding search input ref...")
search_input = 'placeholder="Search venues, contacts, notes..."'
search_input_with_ref = 'ref={searchInputRef}\n          placeholder="Search venues, contacts, notes..."'

if search_input in content:
    content = content.replace(search_input, search_input_with_ref)
    print("   ✓ Search ref added")
else:
    print("   ✗ Could not find search input")

# Step 6: Add modals to render
print("\n6. Adding modals to render...")
# Find the end of the main App component and add modals
render_marker = "export default App;"
modals_code = """
      {/* Shortcuts Help Modal (Bundle 5.4) */}
      {showShortcutsHelp && (
        <ShortcutsHelpModal
          onClose={() => setShowShortcutsHelp(false)}
        />
      )}

      {/* Quick Actions Floating Button (Bundle 5.4) */}
      <QuickActionsButton
        onShowHelp={() => setShowShortcutsHelp(true)}
      />
    </div>
  );
}

export default App;"""

content = content.replace(render_marker, modals_code)
print("   ✓ Modals added to render")

# Write the updated file
with open('src/App.jsx', 'w') as f:
    f.write(content)

print("\n✓ Integration complete!")
print("\nNext steps:")
print("1. Check for syntax errors: npm run dev")
print("2. Test Templates tab")
print("3. Test keyboard shortcuts (N, I, Cmd+K, Esc, ?)")
print("4. Deploy to production")
