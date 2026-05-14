# Bundle 5.3: Smart Lead Suggestions - Integration Guide

## File Created
`SmartSuggestions.jsx` - Smart lead suggestions component (280 lines)

Contains two components:
1. `SmartSuggestionsModal` - Modal showing suggested venues
2. `SmartSuggestionsButton` - Trigger button for LeadDetail panel

## Integration Steps

### 1. Insert Components in App.jsx

Add the components after the TemplatePicker component (around line ~3600):

```javascript
function TemplatePicker({ supabase, user, lead, onInsert }) {
  // ... TemplatePicker code ...
}

// Smart Suggestions Components (Bundle 5.3)
function SmartSuggestionsModal({ supabase, user, currentLead, onClose, onAdd }) {
  // ... paste SmartSuggestionsModal code here
}

function SmartSuggestionsButton({ supabase, user, lead, onLeadAdded }) {
  // ... paste SmartSuggestionsButton code here
}

// Then AnalyticsView below...
```

### 2. Add Button to LeadDetail Panel

In `App.jsx`, find the LeadDetail component where the Template Picker button is (around line ~1900), and add the Smart Suggestions button:

```javascript
{/* Quick Actions Section */}
{(lead.stage === 'target' || lead.stage === 'contacted') && (
  <div style={{ marginTop: 20, paddingTop: 20, borderTop: `1px solid ${COLORS.border}` }}>
    <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text2, marginBottom: 12 }}>
      Quick Actions
    </div>
    
    {/* Template Picker */}
    <div style={{ marginBottom: 8 }}>
      <TemplatePicker
        supabase={supabase}
        user={user}
        lead={lead}
        onInsert={(message) => {
          navigator.clipboard.writeText(message);
          // ... toast code ...
        }}
      />
    </div>

    {/* Smart Suggestions Button - ADD THIS */}
    <SmartSuggestionsButton
      supabase={supabase}
      user={user}
      lead={lead}
      onLeadAdded={() => {
        loadData(); // Refresh leads after adding
      }}
    />
  </div>
)}
```

## Features Implemented

✅ **Smart Lead Discovery**
- Finds similar venues based on tier + tag
- Uses `find_similar_leads()` database function (already created in Bundle 5.1)
- Shows up to 5 suggestions per query
- Excludes already-added leads

✅ **One-Click Add to Pipeline**
- Add suggested venues directly to Target stage
- Auto-populates tier, tag, contact, instagram, notes from existing lead
- Shows success toast notification
- Refreshes pipeline after adding

✅ **Conditional Display**
- Only shows for leads in Target or Contacted stages
- Requires both tier AND tag to be set
- Hides automatically if no tier/tag present

✅ **Empty States**
- Loading state while fetching suggestions
- "No similar venues found" when no matches
- Graceful handling of edge cases

✅ **Smart UI**
- Displays tier badges (gold A1, silver A2, bronze A3)
- Shows tag with purple badge
- Preview contact info and notes
- Clean, scannable card layout

## Database Function Used

Uses `find_similar_leads()` function created in Bundle 5.1 migration:
- Parameters: `p_user_id`, `p_tier`, `p_tag`, `p_limit`
- Returns: Similar leads not yet in user's pipeline
- Excludes archived leads

## Testing Checklist

1. ✅ Open a lead in Target stage with tier + tag set
2. ✅ Click "🎯 Find Similar Venues" button
3. ✅ Modal shows loading state
4. ✅ Suggestions appear with tier/tag badges
5. ✅ Click "+ Add" on a suggestion
6. ✅ Lead added to Target column in pipeline
7. ✅ Toast notification appears
8. ✅ Suggestion removed from list
9. ✅ Pipeline refreshes automatically
10. ✅ Button hidden for leads without tier/tag
11. ✅ Button hidden for Follow-up/Replied/Booked stages

## User Flow Example

1. User opens "Bootshaus" (A1, Tech-House) lead in Target stage
2. Clicks "Find Similar Venues"
3. Modal shows 5 similar A1 Tech-House venues from their pipeline
4. User clicks "+ Add" on "Gewölbe"
5. Gewölbe added to Target column
6. Toast: "✓ Gewölbe added to pipeline"
7. Modal updates, showing 4 remaining suggestions

## Next: Bundle 5.4 - Quick Actions & Shortcuts
