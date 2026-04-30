import { useRef, useCallback, useEffect, useState } from 'react'
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
  onOpenPropertyEditor,
  onDragStart,
  onDrag,
  onDragEnd,
  onHandleHover,
  onCycleElement,
  renderHtmlToIframe,
}: VisualEditorProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const [scale, setScale] = useState(() => {
    const saved = localStorage.getItem('lx-editor-zoom')
    return saved ? parseFloat(saved) : 1
  })

  useEffect(() => {
    localStorage.setItem('lx-editor-zoom', String(scale))
  }, [scale])

const handleZoom = (delta: number) => {
    setScale((s) => Math.min(3, Math.max(0.1, s + delta)))
  }

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

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span>Visual Editor</span>
        <span style={styles.statusBar}>
          {selectedElementId ? `#${selectedElementId}` : ''}
          {hoveredEdge ? `.${hoveredEdge}` : ''}
        </span>
        <div style={styles.zoomControls}>
          <button style={styles.zoomBtn} onClick={() => handleZoom(-0.1)}>−</button>
          <span style={styles.zoomLevel} onClick={() => setScale(1)}>{Math.round(scale * 100)}%</span>
          <button style={styles.zoomBtn} onClick={() => handleZoom(0.1)}>+</button>
        </div>
      </div>
      <div style={styles.canvas}>
        <div
          style={{
            ...styles.canvasWrapper,
            transform: `scale(${scale})`,
            width: `${100 / scale}%`,
            height: `${100 / scale}%`,
          }}
        >
          <iframe
            ref={iframeRef}
            src="/preview.html"
            style={styles.iframe}
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      </div>
    </div>
  )
}
