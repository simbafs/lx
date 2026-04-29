import { useRef, useCallback, useEffect } from 'react'
import { LxElement, IframeMessage } from '../types'
import { useIframeMessages } from '../hooks/useIframeMessages'
import { useSyncToIframe } from '../hooks/useSyncToIframe'
import { useIframeSender } from '../hooks/useIframeSender'
import { visualEditorStyles as styles } from '../styles'

interface VisualEditorProps {
  elements: LxElement[]
  selectedElementId: string | null
  hoveredEdge: string | null
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
  onHandleHover: (elementId: string | null, edge: string | null) => void
  onCycleElement: (direction: 'next' | 'prev', elements: string[], currentIndex: number) => void
  renderHtmlToIframe?: (sendFn: (message: IframeMessage) => void) => void
}

export default function VisualEditor({
  elements,
  selectedElementId,
  hoveredEdge,
  onSelectElement,
  onAddElement,
  onOpenPropertyEditor,
  onDragStart,
  onDrag,
  onDragEnd,
  onHandleHover,
  onCycleElement,
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
    onHandleHover,
    onCycleElement,
    sendToIframe,
  })

  useSyncToIframe({
    elements,
    sendToIframe,
  })

  useEffect(() => {
    if (selectedElementId !== null) {
      sendToIframe({ type: 'updateSelection', elementId: selectedElementId })
    }
  }, [selectedElementId, sendToIframe])

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
        <span style={styles.statusBar}>
          {selectedElementId ? `#${selectedElementId}` : ''}
          {hoveredEdge ? `.${hoveredEdge}` : ''}
        </span>
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