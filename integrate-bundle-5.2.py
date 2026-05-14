#!/usr/bin/env python3
# Bundle 5.2 Integration Script - Message Templates

import re

print("Starting Bundle 5.2 integration...")

# Read App.jsx
with open('src/App.jsx', 'r') as f:
    content = f.read()

# Step 1: Add Templates tab to TABS array
print("\n1. Adding Templates tab to TABS array...")
old_tabs = "  { id: 'calendar', label: 'Calendar', icon: '📅' },\n  { id: 'outreach', label: 'Outreach', icon: '✦' },"
new_tabs = "  { id: 'calendar', label: 'Calendar', icon: '📅' },\n  { id: 'templates', label: 'Templates', icon: '📝' },\n  { id: 'outreach', label: 'Outreach', icon: '✦' },"

if old_tabs in content:
    content = content.replace(old_tabs, new_tabs)
    print("   ✓ Templates tab added")
else:
    print("   ✗ Could not find TABS array - may need manual edit")

# Step 2: Find where to insert components (before AnalyticsView)
print("\n2. Finding insertion point for components...")
insertion_marker = "// AnalyticsView Component"

if insertion_marker in content:
    # Read the component files
    with open('TemplatesView.jsx', 'r') as f:
        templates_view = f.read()
    
    with open('TemplatePicker.jsx', 'r') as f:
        template_picker = f.read()
    
    # Insert components
    components_code = f"""
// Message Templates Components (Bundle 5.2)
{templates_view}

{template_picker}

"""
    content = content.replace(insertion_marker, components_code + insertion_marker)
    print("   ✓ Components inserted")
else:
    print("   ✗ Could not find insertion point")

# Step 3: Add Templates rendering in main content
print("\n3. Adding Templates view rendering...")
old_render = "{activeTab === 'analytics' && <AnalyticsView supabase={supabase} user={user} />}\n      {activeTab === 'pipeline' && ("
new_render = "{activeTab === 'analytics' && <AnalyticsView supabase={supabase} user={user} />}\n      {activeTab === 'templates' && <TemplatesView supabase={supabase} user={user} />}\n      {activeTab === 'pipeline' && ("

if old_render in content:
    content = content.replace(old_render, new_render)
    print("   ✓ Templates rendering added")
else:
    print("   ✗ Could not find rendering location")

# Write the updated file
with open('src/App.jsx', 'w') as f:
    f.write(content)

print("\n✓ Integration complete!")
print("\nNext steps:")
print("1. Test: npm run dev")
print("2. Check Templates tab appears in sidebar")
print("3. Try creating a template")
print("4. Test Template Picker in LeadDetail (manual integration needed)")
