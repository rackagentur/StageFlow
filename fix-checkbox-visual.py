#!/usr/bin/env python3
"""
NoxReach - Fix Checkbox Visual State
Adds purple fill + white checkmark when checkbox is selected
"""

import sys
import re

# Read App.jsx
try:
    with open('src/App.jsx', 'r', encoding='utf-8') as f:
        content = f.read()
except FileNotFoundError:
    print("ERROR: src/App.jsx not found")
    print("Run this script from ~/NoxReach directory")
    sys.exit(1)

print("=" * 60)
print("  NoxReach - Fix Checkbox Visual State")
print("=" * 60)
print()

# Create backup
with open('src/App.jsx.backup-checkbox-fix', 'w', encoding='utf-8') as f:
    f.write(content)
print("✓ Backup created: src/App.jsx.backup-checkbox-fix")
print()

# Pattern to find the checkbox label/input
# Looking for something like:
# <label ... onClick={...toggleLeadSelection...}>
#   <input type="checkbox" ... />
# </label>

# Strategy: Find the label that has toggleLeadSelection in onClick
# and replace its style to show visual feedback

# Find the LeadCard checkbox section
checkbox_pattern = r'(<label[^>]*onClick[^>]*toggleLeadSelection[^>]*>)(.*?)(</label>)'

def fix_checkbox(match):
    """Replace checkbox with visual feedback version"""
    label_open = match.group(1)
    label_content = match.group(2)
    label_close = match.group(3)
    
    # New checkbox with visual feedback
    new_checkbox = '''<label 
  onClick={(e) => { 
    e.stopPropagation(); 
    toggleLeadSelection(lead.id); 
  }}
  style={{
    position: 'absolute',
    top: 8,
    left: 8,
    cursor: 'pointer',
    width: 20,
    height: 20,
    border: `2px solid ${isBulkSelected ? COLORS.purple : COLORS.border}`,
    borderRadius: 4,
    backgroundColor: isBulkSelected ? COLORS.purple : 'transparent',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
    transition: 'all 0.15s ease',
    zIndex: 10,
  }}
>
  {isBulkSelected ? '✓' : ''}
</label>'''
    
    return new_checkbox

# Search for checkbox pattern and count matches
matches = re.findall(checkbox_pattern, content, re.DOTALL)

if not matches:
    print("⚠ Could not find checkbox pattern automatically")
    print()
    print("MANUAL FIX REQUIRED:")
    print()
    print("Find your checkbox in LeadCard (search for 'toggleLeadSelection')")
    print("Replace the entire <label>...</label> block with:")
    print()
    print('''<label 
  onClick={(e) => { 
    e.stopPropagation(); 
    toggleLeadSelection(lead.id); 
  }}
  style={{
    position: 'absolute',
    top: 8,
    left: 8,
    cursor: 'pointer',
    width: 20,
    height: 20,
    border: `2px solid ${isBulkSelected ? COLORS.purple : COLORS.border}`,
    borderRadius: 4,
    backgroundColor: isBulkSelected ? COLORS.purple : 'transparent',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
    transition: 'all 0.15s ease',
    zIndex: 10,
  }}
>
  {isBulkSelected ? '✓' : ''}
</label>''')
    print()
    sys.exit(1)

print(f"Found {len(matches)} checkbox instance(s)")
print()

# Apply fix
content_fixed = re.sub(checkbox_pattern, fix_checkbox, content, flags=re.DOTALL)

# Write updated file
with open('src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(content_fixed)

print("✓ Applied visual feedback fix")
print()
print("=" * 60)
print("  Changes Applied")
print("=" * 60)
print()
print("Checkbox now has:")
print("  • Purple border when selected")
print("  • Purple fill background when selected")
print("  • White ✓ checkmark when selected")
print("  • Empty/transparent when not selected")
print("  • Smooth transition animation")
print()
print("=" * 60)
print("  NEXT STEPS")
print("=" * 60)
print()
print("1. TEST the changes:")
print("   npm run dev")
print()
print("2. Click a checkbox - should see:")
print("   ✓ Purple fill appears")
print("   ✓ White checkmark shows")
print("   ✓ Border turns purple")
print()
print("3. Click again - should clear back to empty")
print()
print("4. Test bulk actions still work:")
print("   ✓ Select multiple leads")
print("   ✓ Bulk bar appears")
print("   ✓ Move to... works")
print("   ✓ Archive works")
print()
print("5. IF TESTS PASS - Commit:")
print("   git add src/App.jsx")
print('   git commit -m "Bundle 5.5: Fix checkbox visual state"')
print("   git push origin dev")
print()
print("6. IF TESTS FAIL - Restore:")
print("   cp src/App.jsx.backup-checkbox-fix src/App.jsx")
print()
print("=" * 60)
