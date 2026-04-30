import { useState, useRef } from 'react'

interface FileTabsProps {
  files: string[]
  currentFile: string
  onSwitch: (name: string) => void
  onCreate: (name: string) => void
  onDelete: (name: string) => void
}

export default function FileTabs({
  files,
  currentFile,
  onSwitch,
  onCreate,
  onDelete,
}: FileTabsProps) {
  const [showInput, setShowInput] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleCreate = () => {
    if (inputValue.trim()) {
      onCreate(inputValue.trim())
      setInputValue('')
      setShowInput(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreate()
    } else if (e.key === 'Escape') {
      setShowInput(false)
      setInputValue('')
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.tabs}>
        {files.map(file => (
          <div
            key={file}
            style={{
              ...styles.tab,
              ...(file === currentFile ? styles.tabActive : {}),
            }}
            onClick={() => onSwitch(file)}
          >
            <span style={styles.tabName}>{file}</span>
            {files.length > 1 && (
              <button
                style={styles.deleteBtn}
                onClick={(e) => {
                  e.stopPropagation()
                  setConfirmDelete(file)
                }}
              >
                ×
              </button>
            )}
          </div>
        ))}
        {showInput ? (
          <input
            ref={inputRef}
            style={styles.input}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              if (inputValue.trim()) {
                handleCreate()
              } else {
                setShowInput(false)
              }
            }}
            autoFocus
          />
        ) : (
          <button style={styles.addBtn} onClick={() => setShowInput(true)}>
            +
          </button>
        )}
      </div>
      {confirmDelete && (
        <div style={styles.confirmOverlay} onClick={() => setConfirmDelete(null)}>
          <div style={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.confirmTitle}>Delete "{confirmDelete}"?</div>
            <div style={styles.confirmButtons}>
              <button
                style={styles.confirmCancel}
                onClick={() => setConfirmDelete(null)}
              >
                Cancel
              </button>
              <button
                style={styles.confirmDelete}
                onClick={() => {
                  onDelete(confirmDelete)
                  setConfirmDelete(null)
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    background: '#252526',
    borderBottom: '1px solid #333',
    padding: '4px 8px 0',
  },
  tabs: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: 1,
    overflowX: 'auto',
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '6px 12px',
    background: '#2d2d2d',
    color: '#666',
    fontSize: 12,
    cursor: 'pointer',
    borderRadius: '4px 4px 0 0',
    border: '1px solid #333',
    borderBottom: '1px solid #333',
    marginBottom: '-1px',
  },
  tabActive: {
    background: '#1e1e1e',
    color: '#fff',
    borderBottom: 'none',
  },
  tabName: {
    maxWidth: 120,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  deleteBtn: {
    background: 'none',
    border: 'none',
    color: '#999',
    fontSize: 14,
    cursor: 'pointer',
    padding: 0,
    lineHeight: 1,
  },
  addBtn: {
    padding: '6px 10px',
    background: 'transparent',
    border: 'none',
    color: '#999',
    fontSize: 14,
    cursor: 'pointer',
  },
  input: {
    width: 100,
    padding: '4px 8px',
    background: '#3c3c3c',
    border: '1px solid #007acc',
    borderRadius: 3,
    color: '#fff',
    fontSize: 12,
  },
  confirmOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  confirmModal: {
    background: '#252526',
    borderRadius: 8,
    padding: 20,
    minWidth: 250,
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
  },
  confirmTitle: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 16,
  },
  confirmButtons: {
    display: 'flex',
    gap: 12,
    justifyContent: 'flex-end',
  },
  confirmCancel: {
    padding: '6px 12px',
    background: 'transparent',
    border: '1px solid #555',
    borderRadius: 4,
    color: '#ccc',
    cursor: 'pointer',
    fontSize: 12,
  },
  confirmDelete: {
    padding: '6px 12px',
    background: '#d32f2f',
    border: 'none',
    borderRadius: 4,
    color: '#fff',
    cursor: 'pointer',
    fontSize: 12,
  },
}