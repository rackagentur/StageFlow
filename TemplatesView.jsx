// TemplatesView Component - Message Templates Management
// Reusable outreach templates with placeholders

function TemplatesView({ supabase, user }) {
  const [templates, setTemplates] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, []);

  async function loadTemplates() {
    setLoading(true);
    const { data, error } = await supabase
      .from('message_templates')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setTemplates(data);
    }
    setLoading(false);
  }

  async function deleteTemplate(id) {
    if (!confirm('Delete this template?')) return;
    
    const { error } = await supabase
      .from('message_templates')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    
    if (!error) {
      setTemplates(templates.filter(t => t.id !== id));
    }
  }

  function getCategoryColor(category) {
    const colors = {
      'Initial Outreach': '#6B2FD4',
      'Follow-up': '#8B4FFF',
      'Booking Request': '#00D4FF',
      'Thank You': '#10B981',
      'Other': '#6B7280'
    };
    return colors[category] || colors['Other'];
  }

  if (loading) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: COLORS.text2 }}>
        Loading templates...
      </div>
    );
  }

  return (
    <div style={{ padding: 32, maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 32 
      }}>
        <div>
          <h2 style={{ 
            fontSize: 28, 
            fontWeight: 700, 
            color: COLORS.text,
            marginBottom: 4
          }}>
            Message Templates
          </h2>
          <p style={{ color: COLORS.text2, fontSize: 14 }}>
            Reusable outreach templates with smart placeholders
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            background: COLORS.purple,
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          + New Template
        </button>
      </div>

      {/* Placeholder Guide */}
      <div style={{
        background: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 12,
        padding: 20,
        marginBottom: 24
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text, marginBottom: 8 }}>
          Available Placeholders:
        </div>
        <div style={{ 
          display: 'flex', 
          gap: 12, 
          flexWrap: 'wrap',
          fontSize: 12,
          color: COLORS.text2
        }}>
          <code style={{ 
            background: COLORS.bg, 
            padding: '4px 8px', 
            borderRadius: 4,
            color: COLORS.cyan
          }}>
            {'{venue_name}'}
          </code>
          <code style={{ 
            background: COLORS.bg, 
            padding: '4px 8px', 
            borderRadius: 4,
            color: COLORS.cyan
          }}>
            {'{contact_name}'}
          </code>
          <code style={{ 
            background: COLORS.bg, 
            padding: '4px 8px', 
            borderRadius: 4,
            color: COLORS.cyan
          }}>
            {'{artist_name}'}
          </code>
          <code style={{ 
            background: COLORS.bg, 
            padding: '4px 8px', 
            borderRadius: 4,
            color: COLORS.cyan
          }}>
            {'{genre}'}
          </code>
          <code style={{ 
            background: COLORS.bg, 
            padding: '4px 8px', 
            borderRadius: 4,
            color: COLORS.cyan
          }}>
            {'{instagram}'}
          </code>
        </div>
      </div>

      {/* Empty State */}
      {templates.length === 0 ? (
        <div style={{
          background: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 12,
          padding: 48,
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📝</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: COLORS.text, marginBottom: 8 }}>
            No templates yet
          </div>
          <div style={{ fontSize: 14, color: COLORS.text2, marginBottom: 24 }}>
            Create reusable templates to speed up your outreach
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
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
            Create First Template
          </button>
        </div>
      ) : (
        /* Templates Grid */
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: 20
        }}>
          {templates.map(template => (
            <div
              key={template.id}
              style={{
                background: COLORS.surface,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 12,
                padding: 20,
                position: 'relative'
              }}
            >
              {/* Category Badge */}
              <div style={{
                display: 'inline-block',
                background: getCategoryColor(template.category) + '20',
                color: getCategoryColor(template.category),
                padding: '4px 10px',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 600,
                marginBottom: 12,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {template.category}
              </div>

              {/* Template Name */}
              <div style={{ 
                fontSize: 16, 
                fontWeight: 600, 
                color: COLORS.text,
                marginBottom: 8
              }}>
                {template.name}
              </div>

              {/* Subject (if exists) */}
              {template.subject && (
                <div style={{ 
                  fontSize: 13, 
                  color: COLORS.text2,
                  marginBottom: 8,
                  fontStyle: 'italic'
                }}>
                  Subject: {template.subject}
                </div>
              )}

              {/* Body Preview */}
              <div style={{
                fontSize: 13,
                color: COLORS.text2,
                lineHeight: 1.6,
                marginBottom: 16,
                maxHeight: 80,
                overflow: 'hidden',
                position: 'relative'
              }}>
                {template.body.substring(0, 150)}
                {template.body.length > 150 && '...'}
              </div>

              {/* Stats */}
              <div style={{
                display: 'flex',
                gap: 16,
                fontSize: 12,
                color: COLORS.text3,
                marginBottom: 16,
                paddingTop: 12,
                borderTop: `1px solid ${COLORS.border}`
              }}>
                <div>Used {template.use_count || 0} times</div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setEditingTemplate(template)}
                  style={{
                    flex: 1,
                    background: COLORS.purple + '15',
                    color: COLORS.purple,
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteTemplate(template.id)}
                  style={{
                    background: '#EF444415',
                    color: '#EF4444',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || editingTemplate) && (
        <TemplateModal
          supabase={supabase}
          user={user}
          template={editingTemplate}
          onClose={() => {
            setShowCreateModal(false);
            setEditingTemplate(null);
          }}
          onSave={() => {
            loadTemplates();
            setShowCreateModal(false);
            setEditingTemplate(null);
          }}
        />
      )}
    </div>
  );
}

// Template Create/Edit Modal
function TemplateModal({ supabase, user, template, onClose, onSave }) {
  const [name, setName] = useState(template?.name || '');
  const [subject, setSubject] = useState(template?.subject || '');
  const [body, setBody] = useState(template?.body || '');
  const [category, setCategory] = useState(template?.category || 'Initial Outreach');
  const [saving, setSaving] = useState(false);

  const categories = [
    'Initial Outreach',
    'Follow-up',
    'Booking Request',
    'Thank You',
    'Other'
  ];

  async function handleSave() {
    if (!name.trim() || !body.trim()) {
      alert('Please fill in template name and body');
      return;
    }

    setSaving(true);

    const templateData = {
      user_id: user.id,
      name: name.trim(),
      subject: subject.trim() || null,
      body: body.trim(),
      category
    };

    let error;
    if (template) {
      // Update existing
      ({ error } = await supabase
        .from('message_templates')
        .update(templateData)
        .eq('id', template.id)
        .eq('user_id', user.id));
    } else {
      // Create new
      ({ error } = await supabase
        .from('message_templates')
        .insert([templateData]));
    }

    setSaving(false);

    if (!error) {
      onSave();
    } else {
      alert('Failed to save template');
    }
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
        maxHeight: '90vh',
        overflow: 'auto',
        padding: 32
      }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 24, fontWeight: 700, color: COLORS.text, marginBottom: 8 }}>
            {template ? 'Edit Template' : 'New Template'}
          </h3>
          <p style={{ fontSize: 14, color: COLORS.text2 }}>
            Use placeholders like {'{venue_name}'} to personalize messages
          </p>
        </div>

        {/* Template Name */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ 
            display: 'block', 
            fontSize: 13, 
            fontWeight: 600, 
            color: COLORS.text2,
            marginBottom: 8
          }}>
            Template Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g., Initial Club Outreach"
            style={{
              width: '100%',
              background: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 8,
              padding: '10px 14px',
              fontSize: 14,
              color: COLORS.text
            }}
          />
        </div>

        {/* Category */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ 
            display: 'block', 
            fontSize: 13, 
            fontWeight: 600, 
            color: COLORS.text2,
            marginBottom: 8
          }}>
            Category
          </label>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            style={{
              width: '100%',
              background: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 8,
              padding: '10px 14px',
              fontSize: 14,
              color: COLORS.text
            }}
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Subject (Optional) */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ 
            display: 'block', 
            fontSize: 13, 
            fontWeight: 600, 
            color: COLORS.text2,
            marginBottom: 8
          }}>
            Subject Line (Optional)
          </label>
          <input
            type="text"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="e.g., Booking Inquiry - {artist_name}"
            style={{
              width: '100%',
              background: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 8,
              padding: '10px 14px',
              fontSize: 14,
              color: COLORS.text
            }}
          />
        </div>

        {/* Body */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ 
            display: 'block', 
            fontSize: 13, 
            fontWeight: 600, 
            color: COLORS.text2,
            marginBottom: 8
          }}>
            Message Body *
          </label>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Hey {contact_name},

I'm reaching out about potential booking opportunities at {venue_name}...

Best,
{artist_name}"
            rows={12}
            style={{
              width: '100%',
              background: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 8,
              padding: '12px 14px',
              fontSize: 14,
              color: COLORS.text,
              fontFamily: 'inherit',
              resize: 'vertical'
            }}
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={onClose}
            disabled={saving}
            style={{
              flex: 1,
              background: COLORS.surface,
              color: COLORS.text2,
              border: `1px solid ${COLORS.border}`,
              padding: '12px 24px',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.5 : 1
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              flex: 1,
              background: COLORS.purple,
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.5 : 1
            }}
          >
            {saving ? 'Saving...' : (template ? 'Save Changes' : 'Create Template')}
          </button>
        </div>
      </div>
    </div>
  );
}
