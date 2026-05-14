// SmartSuggestions Component - AI-powered lead suggestions
// Suggests similar venues based on tier, tag, and existing pipeline

function SmartSuggestionsModal({ supabase, user, currentLead, onClose, onAdd }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(null);

  useEffect(() => {
    loadSuggestions();
  }, []);

  async function loadSuggestions() {
    setLoading(true);

    // Call the find_similar_leads function
    const { data, error } = await supabase.rpc('find_similar_leads', {
      p_user_id: user.id,
      p_tier: currentLead.tier,
      p_tag: currentLead.tag,
      p_limit: 5
    });

    if (!error && data) {
      setSuggestions(data);
    }

    setLoading(false);
  }

  async function handleAddLead(suggestion) {
    setAdding(suggestion.id);

    // Create new lead from suggestion
    const newLead = {
      user_id: user.id,
      name: suggestion.name,
      contact: suggestion.contact || null,
      instagram: suggestion.instagram || null,
      tier: suggestion.tier,
      tag: suggestion.tag,
      stage: 'target',
      notes: suggestion.notes || null,
      archived: false
    };

    const { error } = await supabase
      .from('leads')
      .insert([newLead]);

    setAdding(null);

    if (!error) {
      // Remove from suggestions
      setSuggestions(suggestions.filter(s => s.id !== suggestion.id));
      
      // Show toast
      const toast = document.createElement('div');
      toast.textContent = `✓ ${suggestion.name} added to pipeline`;
      toast.style.cssText = `
        position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%);
        background: ${COLORS.purple}; color: white; padding: 12px 24px;
        border-radius: 8px; font-size: 14px; font-weight: 600; z-index: 10000;
      `;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 2000);

      // Call onAdd callback
      if (onAdd) onAdd();

      // Close modal if no more suggestions
      if (suggestions.length <= 1) {
        setTimeout(() => onClose(), 2000);
      }
    } else {
      alert('Failed to add lead');
    }
  }

  function getTierColor(tier) {
    const colors = {
      'A1': '#FFD700',
      'A2': '#C0C0C0',
      'A3': '#CD7F32'
    };
    return colors[tier] || '#6B7280';
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: 20
    }}>
      <div style={{
        background: COLORS.bg,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 16,
        width: '100%',
        maxWidth: 600,
        maxHeight: '85vh',
        overflow: 'auto',
        padding: 32
      }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 8
          }}>
            <h3 style={{ fontSize: 24, fontWeight: 700, color: COLORS.text }}>
              Smart Suggestions
            </h3>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: COLORS.text2,
                fontSize: 28,
                cursor: 'pointer',
                padding: 0,
                lineHeight: 1
              }}
            >
              ×
            </button>
          </div>
          <p style={{ fontSize: 14, color: COLORS.text2 }}>
            Similar venues to <span style={{ color: COLORS.text, fontWeight: 600 }}>{currentLead.name}</span>
          </p>
          <div style={{ 
            display: 'flex', 
            gap: 8, 
            marginTop: 12,
            fontSize: 12
          }}>
            <span style={{
              background: getTierColor(currentLead.tier) + '20',
              color: getTierColor(currentLead.tier),
              padding: '4px 10px',
              borderRadius: 6,
              fontWeight: 600
            }}>
              {currentLead.tier}
            </span>
            {currentLead.tag && (
              <span style={{
                background: COLORS.purple + '20',
                color: COLORS.purple,
                padding: '4px 10px',
                borderRadius: 6,
                fontWeight: 600
              }}>
                {currentLead.tag}
              </span>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div style={{ 
            textAlign: 'center', 
            padding: 48,
            color: COLORS.text2 
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <div>Finding similar venues...</div>
          </div>
        ) : suggestions.length === 0 ? (
          /* Empty State */
          <div style={{ 
            textAlign: 'center', 
            padding: 48 
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎯</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: COLORS.text, marginBottom: 8 }}>
              No similar venues found
            </div>
            <div style={{ fontSize: 14, color: COLORS.text2, marginBottom: 24 }}>
              Try adding more leads with the same tier and tag
            </div>
            <button
              onClick={onClose}
              style={{
                background: COLORS.purple,
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        ) : (
          /* Suggestions List */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {suggestions.map(suggestion => (
              <div
                key={suggestion.id}
                style={{
                  background: COLORS.surface,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 12,
                  padding: 16
                }}
              >
                {/* Venue Header */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: 12
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      fontSize: 16, 
                      fontWeight: 600, 
                      color: COLORS.text,
                      marginBottom: 6
                    }}>
                      {suggestion.name}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{
                        background: getTierColor(suggestion.tier) + '20',
                        color: getTierColor(suggestion.tier),
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 600
                      }}>
                        {suggestion.tier}
                      </span>
                      {suggestion.tag && (
                        <span style={{
                          background: COLORS.purple + '20',
                          color: COLORS.purple,
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 600
                        }}>
                          {suggestion.tag}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddLead(suggestion)}
                    disabled={adding === suggestion.id}
                    style={{
                      background: adding === suggestion.id ? COLORS.border : COLORS.purple,
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: 6,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: adding === suggestion.id ? 'not-allowed' : 'pointer',
                      whiteSpace: 'nowrap',
                      marginLeft: 12
                    }}
                  >
                    {adding === suggestion.id ? 'Adding...' : '+ Add'}
                  </button>
                </div>

                {/* Contact Info */}
                {(suggestion.contact || suggestion.instagram) && (
                  <div style={{ 
                    fontSize: 13, 
                    color: COLORS.text2,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                    paddingTop: 12,
                    borderTop: `1px solid ${COLORS.border}`
                  }}>
                    {suggestion.contact && (
                      <div>📧 {suggestion.contact}</div>
                    )}
                    {suggestion.instagram && (
                      <div>📸 {suggestion.instagram}</div>
                    )}
                  </div>
                )}

                {/* Notes Preview */}
                {suggestion.notes && (
                  <div style={{
                    fontSize: 12,
                    color: COLORS.text3,
                    marginTop: 8,
                    fontStyle: 'italic',
                    maxHeight: 40,
                    overflow: 'hidden'
                  }}>
                    {suggestion.notes.substring(0, 100)}
                    {suggestion.notes.length > 100 && '...'}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Footer Info */}
        {!loading && suggestions.length > 0 && (
          <div style={{
            marginTop: 24,
            padding: 16,
            background: COLORS.surface,
            borderRadius: 10,
            fontSize: 13,
            color: COLORS.text2,
            textAlign: 'center'
          }}>
            💡 Suggestions are based on similar tier and tag in your pipeline
          </div>
        )}
      </div>
    </div>
  );
}

// Smart Suggestions Button Component
// Used in LeadDetail panel to trigger suggestions
function SmartSuggestionsButton({ supabase, user, lead, onLeadAdded }) {
  const [showModal, setShowModal] = useState(false);

  // Only show for leads in Target or Contacted stage
  if (!['target', 'contacted'].includes(lead.stage)) {
    return null;
  }

  // Need at least tier and tag to find similar leads
  if (!lead.tier || !lead.tag) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        style={{
          background: COLORS.cyan + '15',
          color: COLORS.cyan,
          border: 'none',
          padding: '8px 16px',
          borderRadius: 6,
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          width: '100%'
        }}
      >
        🎯 Find Similar Venues
      </button>

      {showModal && (
        <SmartSuggestionsModal
          supabase={supabase}
          user={user}
          currentLead={lead}
          onClose={() => setShowModal(false)}
          onAdd={onLeadAdded}
        />
      )}
    </>
  );
}
