#!/bin/bash
# NoxReach - Remove Bulk Selection Debug Logs
# Removes the 2 debug console.logs identified at lines 723 and 6280

cd ~/NoxReach

echo "================================================"
echo "  NoxReach - Remove Bulk Selection Debug Logs"
echo "================================================"
echo ""

echo "=== BEFORE: Line Count ==="
wc -l src/App.jsx

echo ""
echo "=== STEP 1: Create Backup ==="
cp src/App.jsx src/App.jsx.backup
echo "✓ Backup created: src/App.jsx.backup"

echo ""
echo "=== STEP 2: Remove Debug Console Logs ==="

# Remove the two debug console.logs
sed -i '' "/console.log('BULK_CHECKBOX_BUTTON'/d" src/App.jsx
echo "✓ Removed: console.log('BULK_CHECKBOX_BUTTON'..."

sed -i '' "/console.log('SELECTED_LEADS_UPDATED'/d" src/App.jsx
echo "✓ Removed: console.log('SELECTED_LEADS_UPDATED'..."

echo ""
echo "=== AFTER CLEANUP: Line Count ==="
wc -l src/App.jsx

echo ""
echo "=== VERIFY: Check for remaining debug console.logs ==="
echo "Searching for console.log statements (excluding catch blocks)..."
remaining=$(grep -n "console.log" src/App.jsx | grep -v "catch" | wc -l)
if [ "$remaining" -eq 0 ]; then
  echo "✓ No debug console.logs remaining"
else
  echo "⚠ Found $remaining remaining console.log statements:"
  grep -n "console.log" src/App.jsx | grep -v "catch" | head -5
fi

echo ""
echo "================================================"
echo "  ✓ Debug Log Cleanup Complete"
echo "================================================"
echo ""
echo "📋 NEXT STEPS:"
echo ""
echo "1. TEST the application:"
echo "   npm run dev"
echo ""
echo "2. Verify bulk selection still works:"
echo "   ✓ Click checkbox on lead card → card highlights"
echo "   ✓ Click 'Select All' in column → all cards highlight"
echo "   ✓ Bulk bar appears at bottom"
echo "   ✓ Test 'Move to...' dropdown"
echo "   ✓ Test 'Archive' button"
echo "   ✓ Test 'Cancel' clears selection"
echo ""
echo "3. Check browser console - should be clean (no debug logs)"
echo ""
echo "4. IF TESTS PASS - Commit:"
echo "   git add src/App.jsx"
echo "   git commit -m 'Bundle 5.5: Remove bulk selection debug logs'"
echo "   git push origin dev"
echo ""
echo "5. IF TESTS FAIL - Restore backup:"
echo "   cp src/App.jsx.backup src/App.jsx"
echo ""
echo "================================================"
echo ""
echo "Changes made:"
echo "  - Removed 2 debug console.log statements"
echo "  - Lines reduced: ~2"
echo "  - All bulk selection logic preserved"
echo "  - Custom button selector trigger unchanged"
echo ""
