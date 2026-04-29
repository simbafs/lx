import { useCallback, useRef, useState, useEffect } from 'react'
import { LxElement } from '../types'
import { setup, update } from '@simbafs/lx'
import { serializeToHtml } from '../utils/htmlParser'

interface VisualEditorProps {
  elements: LxElement[]
  selectedElementId: string | null
  onSelectElement: (id: string | null) => void
  onAddElement: (parentId: string | null, newEl: LxElement) => void
  onOpenPositionPicker: (
    elementId: string,
    positionAttr: string,
    x: number,
    y: number,
  ) => void
  onUpdateElements: (elements: LxElement[]) => void
}

interface DragState {
  elementId: string
  startX: number
  startY: number
}

export default function VisualEditor({
  elements,
  selectedElementId: _selectedElementId,
  onSelectElement,
  onAddElement,
  onOpenPositionPicker,
  onUpdateElements: _onUpdateElements,
}: VisualEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [dragState, setDragState] = useState<DragState | null>(null)

  useEffect(() => {
    if (!contentRef.current || elements.length === 0) return

    const content = contentRef.current
    const html = serializeToHtml(elements)

    content.innerHTML = html

    const styleEl = document.createElement('style')
    styleEl.textContent = `
      [lx] {
        background-color: rgba(255, 180, 0, 0.08);
        border: 1px dashed rgba(0, 0, 0, 0.25);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
        font-family: sans-serif;
        box-sizing: border-box;
      }
      [lx]:hover {
        background-color: rgba(255, 180, 0, 0.15);
        border: 1px dashed rgba(255, 180, 0, 0.8);
      }
    `
    content.prepend(styleEl)

    try {
      setup(content, { debug: false })
    } catch (e) {
      console.warn('[lx-editor] setup error:', e)
    }
  }, [elements])

  useEffect(() => {
    if (!contentRef.current) return

    try {
      update()
    } catch (e) {
      console.warn('[lx-editor] update error:', e)
    }
  }, [elements])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      if (!dragState) return

      const rect = contentRef.current?.getBoundingClientRect()
      if (!rect) return

      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      onOpenPositionPicker(dragState.elementId, 'lx-left', x, y)
      setDragState(null)
    },
    [dragState, onOpenPositionPicker],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const handleClick = useCallback(
    (e: React.MouseEvent, elementId: string) => {
      e.stopPropagation()
      onSelectElement(elementId)
    },
    [onSelectElement],
  )

  const handleContentClick = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement
      const lxElement = target.closest('[lx]')
      if (lxElement && lxElement.id) {
        handleClick(e, lxElement.id)
      } else {
        onSelectElement(null)
      }
    },
    [onSelectElement, handleClick],
  )

  const handleAddNewElement = useCallback(() => {
    const newId = 'el-' + Math.random().toString(36).substring(2, 9)
    const newEl: LxElement = {
      id: newId,
      tagName: 'div',
      attrs: {
        lx: '',
        'lx-left': 'body.left+0',
        'lx-top': 'body.top+0',
        'lx-width': '100',
        'lx-height': '100',
      },
      children: [],
      text: 'New Element',
    }
    onAddElement(null, newEl)
  }, [onAddElement])

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement
      const lxElement = target.closest('[lx]')
      if (!lxElement) return

      e.stopPropagation()
      const rect = lxElement.getBoundingClientRect()
      const containerRect = contentRef.current?.getBoundingClientRect()
      if (containerRect) {
        onOpenPositionPicker(
          lxElement.id,
          'lx-left',
          rect.left - containerRect.left,
          rect.top - containerRect.top,
        )
      }
    },
    [onOpenPositionPicker],
  )

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span>Visual Editor</span>
        <button style={styles.addBtn} onClick={handleAddNewElement}>
          + Add Element
        </button>
      </div>
      <div
        ref={containerRef}
        style={styles.canvas}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <div
          ref={contentRef}
          style={styles.body}
          onClick={handleContentClick}
          onDoubleClick={handleDoubleClick}
        />
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    background: '#1e1e1e',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    background: '#252526',
    color: '#ccc',
    fontSize: 12,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    borderBottom: '1px solid #333',
  },
  addBtn: {
    padding: '4px 12px',
    background: '#007acc',
    border: 'none',
    borderRadius: 4,
    color: '#fff',
    fontSize: 12,
    cursor: 'pointer',
  },
  canvas: {
    flex: 1,
    position: 'relative',
    overflow: 'auto',
    background: '#f5f5f5',
  },
  body: {
    position: 'relative',
    width: '100%',
    height: '100%',
    minHeight: '100%',
  },
}