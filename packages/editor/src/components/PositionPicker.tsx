import { useState } from 'react'
import { Edge } from '../types'

interface PositionPickerProps {
  isOpen: boolean
  elementId: string
  positionAttr: string
  availableIds: string[]
  onConfirm: (targetId: string, edge: Edge, offset: number) => void
  onCancel: () => void
}

export default function PositionPicker({
  isOpen,
  elementId,
  positionAttr,
  availableIds,
  onConfirm,
  onCancel,
}: PositionPickerProps) {
  const [targetId, setTargetId] = useState<string>('body')
  const [edge, setEdge] = useState<Edge>('left')
  const [offset, setOffset] = useState(0)

  if (!isOpen) return null

  const handleConfirm = () => {
    onConfirm(targetId, edge, offset)
  }

  return (
    <div style={styles.overlay} onClick={onCancel}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.title}>
          Set <code>{positionAttr}</code> for <code>{elementId}</code>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Reference Element</label>
          <select
            style={styles.select}
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
          >
            <option value="body">body (viewport)</option>
            {availableIds.filter(id => id !== elementId).map((id) => (
              <option key={id} value={`#${id}`}>
                #{id}
              </option>
            ))}
          </select>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Edge</label>
          <div style={styles.edgeGrid}>
            {(['left', 'right', 'top', 'bottom'] as Edge[]).map((e) => (
              <button
                key={e}
                style={{
                  ...styles.edgeBtn,
                  ...(edge === e ? styles.edgeBtnActive : {}),
                }}
                onClick={() => setEdge(e)}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Offset</label>
          <input
            type="number"
            style={styles.input}
            value={offset}
            onChange={(e) => setOffset(parseFloat(e.target.value) || 0)}
          />
        </div>

        <div style={styles.preview}>
          <code>
            {targetId}.{edge}
            {offset >= 0 ? '+' : ''}
            {offset}
          </code>
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
    width: 360,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
  },
  title: {
    marginBottom: 20,
    color: '#ccc',
    fontSize: 14,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    display: 'block',
    marginBottom: 8,
    color: '#999',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  select: {
    width: '100%',
    padding: '8px 12px',
    background: '#3c3c3c',
    border: '1px solid #555',
    borderRadius: 4,
    color: '#fff',
    fontSize: 14,
  },
  edgeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 8,
  },
  edgeBtn: {
    padding: '10px',
    background: '#3c3c3c',
    border: '1px solid #555',
    borderRadius: 4,
    color: '#ccc',
    cursor: 'pointer',
    fontSize: 13,
  },
  edgeBtnActive: {
    background: '#007acc',
    borderColor: '#007acc',
    color: '#fff',
  },
  input: {
    width: '100%',
    padding: '8px 12px',
    background: '#3c3c3c',
    border: '1px solid #555',
    borderRadius: 4,
    color: '#fff',
    fontSize: 14,
  },
  preview: {
    padding: '12px',
    background: '#1e1e1e',
    borderRadius: 4,
    marginBottom: 16,
    textAlign: 'center',
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
