// Quick Actions & Keyboard Shortcuts (Bundle 5.4)
// Global keyboard shortcuts for power users

// Keyboard Shortcuts Hook
function useKeyboardShortcuts({ 
  onNewLead, 
  onImportCSV, 
  onSearch,
  onCloseModal,
  searchInputRef 
}) {
  useEffect(() => {
    function handleKeyDown(e) {
      // Don't trigger if user is typing in an input/textarea
      const isTyping = ['INPUT', 'TEXTAREA'].includes(e.target.tagName);
      
      // Esc - Close modals (works everywhere)
      if (e.key === 'Escape') {
        onCloseModal?.();
        return;
      }

      // Don't trigger other shortcuts while typing
      if (isTyping) return;

      // Cmd/Ctrl + K - Focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onSearch?.();
        searchInputRef?.current?.focus();
        return;
      }

      // N - New lead
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        onNewLead?.();
        return;
      }

      // I - Import CSV
      if (e.key === 'i' || e.key === 'I') {
        e.preventDefault();
        onImportCSV?.();
        return;
      }

      // ? - Show help
      if (e.key === '?') {
        e.preventDefault();
        // Will be handled by parent component
        const helpEvent = new CustomEvent('showShortcutsHelp');
        window.dispatchEvent(helpEvent);
        return;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNewLead, onImportCSV, onSearch, onCloseModal, searchInputRef]);
}

// Shortcuts Help Modal
function ShortcutsHelpModal({ onClose }) {
  const shortcuts = [
    { key: 'N', action: 'New Lead', description: 'Open add lead form' },
    { key: 'I', action: 'Import CSV', description: 'Open CSV import modal' },
    { key: 'Cmd + K', action: 'Search', description: 'Focus search bar' },
    { key: 'Esc', action: 'Close', description: 'Close any open modal' },
    { key: '?', action: 'Help', description: 'Show this shortcuts guide' },
  ];

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: 20
      }}
      onClick={onClose}
    >
      <div 
        style={{
          background: COLORS.bg,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 16,
          width: '100%',
          maxWidth: 500,
          padding: 32
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8
          }}>
            <h3 style={{ 
              fontSize: 24, 
              fontWeight: 700, 
              color: COLORS.text 
            }}>
              Keyboard Shortcuts
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
            Speed up your workflow with keyboard shortcuts
          </p>
        </div>

        {/* Shortcuts List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {shortcuts.map((shortcut, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: 12,
                background: COLORS.surface,
                borderRadius: 8,
                border: `1px solid ${COLORS.border}`
              }}
            >
              {/* Key Badge */}
              <div style={{
                minWidth: 80,
                padding: '6px 12px',
                background: COLORS.bg,
                border: `2px solid ${COLORS.border}`,
                borderRadius: 6,
                textAlign: 'center',
                fontFamily: 'monospace',
                fontSize: 13,
                fontWeight: 700,
                color: COLORS.text
              }}>
                {shortcut.key}
              </div>

              {/* Action & Description */}
              <div style={{ flex: 1 }}>
                <div style={{ 
                  fontSize: 14, 
                  fontWeight: 600, 
                  color: COLORS.text,
                  marginBottom: 2
                }}>
                  {shortcut.action}
                </div>
                <div style={{ 
                  fontSize: 12, 
                  color: COLORS.text2 
                }}>
                  {shortcut.description}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          marginTop: 24,
          padding: 16,
          background: COLORS.purple + '10',
          borderRadius: 10,
          fontSize: 13,
          color: COLORS.text2,
          textAlign: 'center'
        }}>
          💡 Press <kbd style={{ 
            background: COLORS.bg, 
            padding: '2px 6px', 
            borderRadius: 4,
            border: `1px solid ${COLORS.border}`,
            fontFamily: 'monospace'
          }}>?</kbd> anytime to see this guide
        </div>
      </div>
    </div>
  );
}

// Quick Actions Floating Button (Mobile/Desktop)
// Shows ? button in bottom-right corner
function QuickActionsButton({ onShowHelp }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onShowHelp}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        width: 48,
        height: 48,
        background: isHovered ? COLORS.purpleLight : COLORS.purple,
        border: 'none',
        borderRadius: '50%',
        color: 'white',
        fontSize: 20,
        fontWeight: 700,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 12px rgba(107, 47, 212, 0.3)',
        transition: 'all 0.2s',
        zIndex: 999,
        transform: isHovered ? 'scale(1.1)' : 'scale(1)'
      }}
      title="Keyboard shortcuts (press ?)"
    >
      ?
    </button>
  );
}

// Tooltip Component for Quick Actions
function QuickActionTooltip({ children, text, shortcut }) {
  const [show, setShow] = useState(false);

  return (
    <div 
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginBottom: 8,
          padding: '6px 12px',
          background: COLORS.bg,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 6,
          fontSize: 12,
          color: COLORS.text,
          whiteSpace: 'nowrap',
          zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
        }}>
          {text}
          {shortcut && (
            <kbd style={{
              marginLeft: 8,
              padding: '2px 6px',
              background: COLORS.surface,
              borderRadius: 4,
              border: `1px solid ${COLORS.border}`,
              fontFamily: 'monospace',
              fontSize: 11
            }}>
              {shortcut}
            </kbd>
          )}
        </div>
      )}
    </div>
  );
}
