import { LxElement } from '../types'
import { useElementAttrs } from '../hooks/useElementAttrs'
import { LX_ATTRS_LIST } from '../utils/constants'
import { propertyPanelStyles as styles } from '../styles'

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