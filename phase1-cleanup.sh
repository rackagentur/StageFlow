#!/bin/bash
# NoxReach Phase 1 Complete Cleanup
# Creates utility files - you'll handle App.jsx updates manually for safety

cd ~/NoxReach

echo "================================================"
echo "  NoxReach Phase 1 Cleanup - Complete Script"
echo "================================================"
echo ""

echo "=== BEFORE: Line Count ==="
wc -l src/App.jsx

echo ""
echo "=== STEP 1: Create lib directory ==="
mkdir -p src/lib
echo "✓ Created src/lib/"

echo ""
echo "=== STEP 2: Create constants.js ==="
cat > src/lib/constants.js << 'EOF'
export const COLORS = {
  bg: "#060608",
  surface: "#0f0f18",
  border: "#1c1c2e",
  purple: "#6B2FD4",
  purpleLight: "#8B4FE4",
  cyan: "#00D4FF",
  gold: "#FFAB00",
  green: "#22C55E",
  red: "#EF4444",
  text: "#E0E0E0",
  text2: "#A8A8A8",
  text3: "#707070",
};

export const STAGES = [
  { id: "target", label: "Target" },
  { id: "contacted", label: "Contacted" },
  { id: "followup", label: "Follow-up" },
  { id: "replied", label: "Replied" },
  { id: "booked", label: "Booked" },
];
EOF
echo "✓ Created src/lib/constants.js"

echo ""
echo "=== STEP 3: Create formatters.js ==="
cat > src/lib/formatters.js << 'EOF'
export const formatShortDate = (dateString) => {
  if (!dateString) return "";
  const d = new Date(dateString);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d.getDate()} ${months[d.getMonth()]}`;
};

export const formatDate = (dateString) => {
  if (!dateString) return "";
  const d = new Date(dateString);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

export const formatFollowUpLabel = (stage) => {
  if (stage === "contacted") return "1st follow-up";
  if (stage === "followup1") return "2nd follow-up";
  if (stage === "followup2") return "Final follow-up";
  return "Follow-up";
};
EOF
echo "✓ Created src/lib/formatters.js"

echo ""
echo "=== STEP 4: Create toast.js ==="
cat > src/lib/toast.js << 'EOF'
import { COLORS } from './constants.js';

export const showToast = (message, type = 'success') => {
  const bgColor = type === 'error' ? COLORS.red : 
                  type === 'warning' ? COLORS.gold : 
                  COLORS.green;
  
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.style.cssText = `position: fixed; top: 20px; right: 20px; background: ${bgColor}; color: white; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 600; z-index: 10000;`;
  
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2000);
};
EOF
echo "✓ Created src/lib/toast.js"

echo ""
echo "=== STEP 5: Create supabaseClient.js ==="
cat > src/lib/supabaseClient.js << 'EOF'
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://ckttttvgvpvflgjzkbmy.supabase.co";
const SUPABASE_ANON = "sb_publishable_77AjzPzfXgMSvku0fRFD9w_l4hHVMvo";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);
EOF
echo "✓ Created src/lib/supabaseClient.js"

echo ""
echo "=== FILES CREATED ==="
ls -lh src/lib/

echo ""
echo "================================================"
echo "  ✓ Utility Files Created Successfully"
echo "================================================"
echo ""
echo "📋 MANUAL STEPS REQUIRED:"
echo ""
echo "Open src/App.jsx in your editor and make these changes:"
echo ""
echo "1. ADD these imports at the top (after the supabase import):"
echo "   import { COLORS, STAGES } from './lib/constants.js';"
echo "   import { formatShortDate, formatDate, formatFollowUpLabel } from './lib/formatters.js';"
echo "   import { showToast } from './lib/toast.js';"
echo "   import { supabase } from './lib/supabaseClient.js';"
echo ""
echo "2. REMOVE these old definitions:"
echo "   - Search for 'const COLORS = {' and delete the entire object"
echo "   - Search for 'const STAGES = [' and delete the entire array"
echo "   - Search for 'const SUPABASE_URL' and 'const supabase = createClient' - delete both"
echo "   - Search for 'function formatShortDate' - delete all 3 formatter functions"
echo ""
echo "3. REPLACE manual toast code (optional - can do later):"
echo "   - Find: const toast = document.createElement('div');"
echo "   - Replace entire toast creation block with: showToast('message', 'success')"
echo ""
echo "4. TEST after each change:"
echo "   npm run dev"
echo ""
echo "5. VERIFY:"
echo "   ✓ App loads without errors"
echo "   ✓ Pipeline displays with correct colors"
echo "   ✓ Bulk selection checkboxes work"
echo "   ✓ Moving leads works"
echo "   ✓ Toasts appear correctly"
echo ""
echo "6. COMMIT when all tests pass:"
echo "   git add src/lib/ src/App.jsx"
echo "   git commit -m 'Bundle 5.5: Phase 1 cleanup - extract utilities'"
echo "   git push origin dev"
echo ""
echo "================================================"
