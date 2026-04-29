import { useState } from 'react'
import { Edge } from '../types'
import { positionPickerStyles as styles } from '../styles'

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