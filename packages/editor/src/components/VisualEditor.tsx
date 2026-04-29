import { useCallback, useRef, useEffect, useState } from 'react'
import { LxElement } from '../types'

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
}

export default function VisualEditor({
  elements,
  selectedElementId,
  onSelectElement,
  onAddElement,
  onOpenPositionPicker: _onOpenPositionPicker,
  onOpenPropertyEditor,
  onDragStart,
  onDrag,
  onDragEnd,
}: VisualEditorProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [dragState, setDragState] = useState<{ edge: string } | null>(null)

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const { type, elementId, x, y, edge, startX, startY, deltaX, deltaY } = event.data

      console.log('[VisualEditor] message:', { type, elementId, edge, startX, startY, deltaX, deltaY })

      switch (type) {
        case 'elementClick':
          onSelectElement(elementId)
          break
        case 'openPropertyEditor':
          onOpenPropertyEditor(elementId, x, y)
          break
        case 'dragStart':
          setDragState({ edge })
          console.log('[VisualEditor] calling onDragStart:', { elementId, edge, startX, startY })
          onDragStart(elementId, edge, startX, startY)
          break
        case 'drag':
          console.log('[VisualEditor] calling onDrag:', { elementId, edge, deltaX, deltaY })
          onDrag(elementId, edge, deltaX, deltaY)
          break
        case 'dragEnd':
          setDragState(null)
          console.log('[VisualEditor] calling onDragEnd:', { elementId, edge, deltaX, deltaY })
          onDragEnd(elementId, edge, deltaX, deltaY)
          break
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [onSelectElement, onOpenPropertyEditor, onDragStart, onDrag, onDragEnd])

  useEffect(() => {
    if (!iframeRef.current) return

    const html = generateHtml(elements)
    iframeRef.current.contentWindow?.postMessage({ type: 'render', html }, '*')
  }, [elements])

  const generateHtml = (elements: LxElement[]): string => {
    const lxElements = elements.filter(el => el.attrs['lx'] !== undefined)
    
    return `<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #f5f5f5; }
  </style>
</head>
<body>
${serializeElements(lxElements)}
</body>
</html>`
  }

  const serializeElements = (elements: LxElement[]): string => {
    return elements.map(el => {
      const attrs = Object.entries(el.attrs)
        .map(([k, v]) => `${k}="${v}"`)
        .join(' ')
      const idPart = el.id ? ` id="${el.id}"` : ''
      const text = el.text || ''
      
      if (el.children.length > 0) {
        return `<div${idPart} ${attrs}>\n${serializeElements(el.children)}\n</div>`
      }
      return `<div${idPart} ${attrs}>${text}</div>`
    }).join('\n')
  }

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