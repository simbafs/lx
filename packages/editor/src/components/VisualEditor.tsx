import { useRef, useCallback } from 'react'
import { LxElement } from '../types'
import { useIframeMessages } from '../hooks/useIframeMessages'
import { useSyncToIframe } from '../hooks/useSyncToIframe'
import { useIframeSender } from '../hooks/useIframeSender'

interface VisualEditorProps {
  elements: LxElement[]
  onSelectElement: (id: string | null) => void
  onAddElement: (parentId: string | null, newEl: LxElement) => void
  onOpenPropertyEditor: (elementId: string, x: number, y: number) => void
  onDragStart: (
    elementId: string,
    edge: string,
    startX: number,
    startY: number,
  ) => void
  onDrag: (
    elementId: string,
    edge: string,
    deltaX: number,
    deltaY: number,
  ) => void
  onDragEnd: (
    elementId: string,
    edge: string,
    deltaX: number,
    deltaY: number,
  ) => void
  renderHtmlToIframe?: (sendFn: (html: string) => void) => void
}

export default function VisualEditor({
  elements,
  onSelectElement,
  onAddElement,
  onOpenPropertyEditor,
  onDragStart,
  onDrag,
  onDragEnd,
  renderHtmlToIframe,
}: VisualEditorProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const sendToIframe = useIframeSender({
    iframeRef,
    renderHtmlToIframe,
  })

  useIframeMessages({
    elements,
    onSelectElement,
    onOpenPropertyEditor,
    onDragStart,
    onDrag,
    onDragEnd,
    sendToIframe,
  })

  useSyncToIframe({
    elements,
    sendToIframe,
  })

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

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span>Visual Editor</span>
        <button style={styles.addBtn} onClick={handleAddNewElement}>
          + Add Element
        </button>
      </div>
      <div style={styles.canvas}>
        <iframe
          ref={iframeRef}
          src="/preview.html"
          style={styles.iframe}
          sandbox="allow-scripts allow-same-origin"
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
    overflow: 'hidden',
    background: '#f5f5f5',
  },
  iframe: {
    width: '100%',
    height: '100%',
    border: 'none',
  },
}