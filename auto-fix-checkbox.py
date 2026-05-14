#!/usr/bin/env python3
"""
NoxReach - Automated Checkbox Visual Fix
Finds the checkbox code and replaces it with visual feedback version
"""

import sys
import re

print("=" * 60)
print("  NoxReach - Automated Checkbox Visual Fix")
print("=" * 60)
print()

# Read App.jsx
try:
    with open('src/App.jsx', 'r', encoding='utf-8') as f:
        content = f.read()
except FileNotFoundError:
    print("ERROR: src/App.jsx not found")
    print("Run this from ~/NoxReach directory")
    sys.exit(1)

# Backup
with open('src/App.jsx.backup-auto-checkbox', 'w', encoding='utf-8') as f:
    f.write(content)
print("✓ Backup created: src/App.jsx.backup-auto-checkbox")
print()

# Strategy: Find ANY element that has onClick with toggleLeadSelection
# This could be <label>, <button>, <div>, etc.

# Pattern 1: Look for any opening tag with onClick containing toggleLeadSelection
pattern1 = re.compile(
    r'<(\w+)\s+([^>]*onClick[^>]*toggleLeadSelection[^>]*)>([^<]*)</\1>',
    re.DOTALL
)

# Pattern 2: Self-closing or multi-line versions
# Let's search for the onClick handler first
toggle_matches = list(re.finditer(r'onClick.*?toggleLeadSelection.*?\(lead\.id\)', content, re.DOTALL))

if not toggle_matches:
    print("⚠ Could not find toggleLeadSelection onClick handler")
    print()
    print("Searching for any reference to toggleLeadSelection...")
    if 'toggleLeadSelection' in content:
        print("✓ Found toggleLeadSelection in code")
        print("✗ But couldn't locate the checkbox element automatically")
        print()
        print("MANUAL APPROACH:")
        print("1. Open src/App.jsx")
        print("2. Search for: toggleLeadSelection")
        print("3. Find the element (label/button/div) with onClick handler")
        print("4. Replace that entire element with the code from checkbox-fix-code.jsx")
    sys.exit(1)

print(f"Found {len(toggle_matches)} onClick handler(s) with toggleLeadSelection")
print()

# Find the element that contains this onClick
# Look backward and forward from the match to find the complete element
for idx, match in enumerate(toggle_matches):
    match_pos = match.start()
    
    # Find the opening tag before this position
    # Search backward for < that's not inside a string
    search_start = max(0, match_pos - 500)
    before_text = content[search_start:match_pos]
    
    # Find last < before the onClick
    last_open = before_text.rfind('<')
    if last_open == -1:
        continue
    
    element_start = search_start + last_open
    
    # Find the matching closing tag
    # First extract the tag name
    tag_match = re.match(r'<(\w+)', content[element_start:])
    if not tag_match:
        continue
    
    tag_name = tag_match.group(1)
    
    # Find the closing tag
    search_end = min(len(content), match_pos + 1000)
    after_text = content[match_pos:search_end]
    
    close_pattern = f'</{tag_name}>'
    close_pos = after_text.find(close_pattern)
    
    if close_pos == -1:
        continue
    
    element_end = match_pos + close_pos + len(close_pattern)
    
    # Extract the full element
    old_element = content[element_start:element_end]
    
    print(f"Match {idx + 1}:")
    print(f"  Found <{tag_name}> at position {element_start}")
    print(f"  Length: {len(old_element)} characters")
    print()
    
    # Create the new checkbox element
    new_element = '''<label 
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
    
    # Replace in content
    content = content[:element_start] + new_element + content[element_end:]
    
    print("✓ Replaced checkbox element with visual feedback version")
    print()
    
    # Only replace the first match (LeadCard checkbox)
    break

# Write updated file
with open('src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("=" * 60)
print("  ✓ Checkbox Visual Fix Applied")
print("=" * 60)
print()
print("Changes:")
print("  • Purple border when selected")
print("  • Purple fill background when selected")
print("  • White ✓ checkmark when selected")
print("  • Empty/transparent when not selected")
print("  • Smooth transition animation")
print()
print("=" * 60)
print("  TEST NOW")
print("=" * 60)
print()
print("npm run dev")
print()
print("Then click a checkbox - should see purple fill + checkmark!")
print()
print("If it works:")
print("  git add src/App.jsx")
print('  git commit -m "Bundle 5.5: Fix checkbox visual state"')
print("  git push origin dev")
print()
print("If it breaks:")
print("  cp src/App.jsx.backup-auto-checkbox src/App.jsx")
print()
print("=" * 60)
