// TemplatePicker Component - Quick insert templates into outreach
// Used in LeadDetail panel for fast template insertion

function TemplatePicker({ supabase, user, lead, onInsert }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    if (showPicker) {
      loadTemplates();
    }
  }, [showPicker]);

  async function loadTemplates() {
    setLoading(true);
    const { data, error } = await supabase
      .from('message_templates')
      .select('*')
      .eq('user_id', user.id)
      .order('use_count', { ascending: false });
    
    if (!error && data) {
      setTemplates(data);
    }
    setLoading(false);
  }

  async function handleSelectTemplate(template) {
    // Increment use count
    await supabase.rpc('increment_template_usage', { 
      template_id: template.id 
    });

    // Replace placeholders
    const artistName = user.user_metadata?.full_name || 'GEEZ'; // Get from user_assets later
    const venueName = lead.name || '{venue_name}';
    const contactName = lead.contact?.split('@')[0] || '{contact_name}';
    const genre = lead.tag || '{genre}';
    const instagram = lead.instagram || '{instagram}';

    let message = template.body
      .replace(/{venue_name}/g, venueName)
      .replace(/{contact_name}/g, contactName)
      .replace(/{artist_name}/g, artistName)
      .replace(/{genre}/g, genre)
      .replace(/{instagram}/g, instagram);

    onInsert(message);
    setShowPicker(false);
  }

  if (!showPicker) {
    return (
      <button
        onClick={() => setShowPicker(true)}
        style={{
          background: COLORS.purple + '15',
          color: COLORS.purple,
          border: 'none',
          padding: '8px 16px',
          borderRadius: 6,
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6
        }}
      >
        📝 Use Template
      </button>
    );
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
        maxWidth: 500,
        maxHeight: '80vh',
        overflow: 'auto',
        padding: 24
      }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20
        }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: COLORS.text }}>
            Select Template
          </h3>
          <button
            onClick={() => setShowPicker(false)}
            style={{
              background: 'transparent',
              border: 'none',
              color: COLORS.text2,
              fontSize: 24,
              cursor: 'pointer',
              padding: 0,
              width: 32,
              height: 32
            }}
          >
            ×
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 32, color: COLORS.text2 }}>
            Loading templates...
          </div>
        ) : templates.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 32 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📝</div>
            <div style={{ fontSize: 14, color: COLORS.text2, marginBottom: 16 }}>
              No templates yet
            </div>
            <div style={{ fontSize: 13, color: COLORS.text3 }}>
              Create templates in the Templates tab
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {templates.map(template => (
              <button
                key={template.id}
                onClick={() => handleSelectTemplate(template)}
                style={{
                  background: COLORS.surface,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 10,
                  padding: 16,
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = COLORS.purple;
                  e.currentTarget.style.background = COLORS.purple + '08';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = COLORS.border;
                  e.currentTarget.style.background = COLORS.surface;
                }}
              >
                {/* Category Badge */}
                <div style={{
                  display: 'inline-block',
                  background: COLORS.purple + '20',
                  color: COLORS.purple,
                  padding: '2px 8px',
                  borderRadius: 4,
                  fontSize: 10,
                  fontWeight: 600,
                  marginBottom: 8,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  {template.category}
                </div>

                {/* Template Name */}
                <div style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: COLORS.text,
                  marginBottom: 6
                }}>
                  {template.name}
                </div>

                {/* Preview */}
                <div style={{
                  fontSize: 12,
                  color: COLORS.text2,
                  lineHeight: 1.5,
                  maxHeight: 40,
                  overflow: 'hidden'
                }}>
                  {template.body.substring(0, 100)}...
                </div>

                {/* Use Count */}
                {template.use_count > 0 && (
                  <div style={{
                    fontSize: 11,
                    color: COLORS.text3,
                    marginTop: 8
                  }}>
                    Used {template.use_count} times
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
