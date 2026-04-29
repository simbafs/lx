import { LxElement } from '../types'
import { useElementAttrs, LX_ATTRS_LIST } from '../hooks/useElementAttrs'

interface PropertyPanelProps {
  isOpen: boolean
  element: LxElement | null
  onConfirm: (attrs: Record<string, string>) => void
  onCancel: () => void
}

export default function PropertyPanel({
  isOpen,
  element,
  onConfirm,
  onCancel,
}: PropertyPanelProps) {
  const { attrs, setAttrs } = useElementAttrs(element)

  if (!isOpen || !element) return null

  const handleChange = (attr: string, value: string) => {
    setAttrs(attr, value)
  }

  const handleConfirm = () => {
    const cleanedAttrs: Record<string, string> = {}
    Object.entries(attrs).forEach(([k, v]) => {
      if (v.trim()) {
        cleanedAttrs[k] = v.trim()
      }
    })
    onConfirm(cleanedAttrs)
  }

  return (
    <div style={styles.overlay} onClick={onCancel}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.title}>
          屬性編輯器: <code>{element.id}</code>
        </div>

        <div style={styles.attrList}>
          {LX_ATTRS_LIST.map(attr => (
            <div key={attr} style={styles.field}>
              <label style={styles.label}>{attr}</label>
              <input
                type="text"
                style={styles.input}
                value={attrs[attr] || ''}
                onChange={e => handleChange(attr, e.target.value)}
                placeholder="未設定"
              />
            </div>
          ))}
        </div>

        <div style={styles.actions}>
          <button style={styles.cancelBtn} onClick={onCancel}>
            Cancel
          </button>
          <button style={styles.confirmBtn} onClick={handleConfirm}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    background: '#252526',
    borderRadius: 8,
    padding: 20,
    width: 400,
    maxHeight: '80vh',
    overflow: 'auto',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
  },
  title: {
    marginBottom: 20,
    color: '#ccc',
    fontSize: 14,
  },
  attrList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    marginBottom: 20,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  label: {
    color: '#999',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  input: {
    padding: '8px 12px',
    background: '#3c3c3c',
    border: '1px solid #555',
    borderRadius: 4,
    color: '#fff',
    fontSize: 14,
    fontFamily: 'monospace',
  },
  actions: {
    display: 'flex',
    gap: 12,
    justifyContent: 'flex-end',
  },
  cancelBtn: {
    padding: '8px 16px',
    background: 'transparent',
    border: '1px solid #555',
    borderRadius: 4,
    color: '#ccc',
    cursor: 'pointer',
  },
  confirmBtn: {
    padding: '8px 16px',
    background: '#007acc',
    border: 'none',
    borderRadius: 4,
    color: '#fff',
    cursor: 'pointer',
  },
}