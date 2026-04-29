import { useState, useCallback, useRef } from 'react'
import CodeEditor from './components/CodeEditor'
import VisualEditor from './components/VisualEditor'
import PositionPicker from './components/PositionPicker'
import PropertyPanel from './components/PropertyPanel'
import { useLxParser } from './hooks/useLxParser'
import { LxElement, Edge } from './types'
import { extractAllElementIds } from './utils/htmlParser'

const DEFAULT_HTML = `<!doctype html>
<html>
<head>
  <style>
    div {
      background-color: rgba(255, 180, 0, 0.08);
      border: 1px dashed rgba(0, 0, 0, 0.25);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      font-family: sans-serif;
    }
  </style>
</head>
<body>
  <div id="container" lx lx-left="0" lx-top="0" lx-right="0" lx-bottom="0">
    <div id="header" lx lx-left="20" lx-top="20" lx-width="300" lx-height="60">
      Header
    </div>
    <div id="sidebar" lx lx-left="20" lx-top="previous.bottom+20" lx-width="150" lx-height="200">
      Sidebar
    </div>
    <div id="main" lx lx-left="previous.right+20" lx-top="20" lx-right="20" lx-bottom="100">
      Main Content
    </div>
    <div id="footer" lx lx-left="20" lx-right="20" lx-bottom="20" lx-height="60">
      Footer
    </div>
  </div>
</body>
</html>`

export default function App() {
  const { html, elements, updateHtml } = useLxParser(DEFAULT_HTML)
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null)
  const sendToIframeRef = useRef<((html: string) => void) | null>(null)

  const generatePreviewHtml = useCallback((): string => {
    const lxElements = elements.filter(el => el.attrs['lx'] !== undefined)
    const serializeEls = (els: LxElement[]): string => {
      return els.map(el => {
        const attrs = Object.entries(el.attrs)
          .map(([k, v]) => `${k}="${v}"`)
          .join(' ')
        const idPart = el.id ? ` id="${el.id}"` : ''
        const text = el.text || ''
        if (el.children.length > 0) {
          return `<div${idPart} ${attrs}>\n${serializeEls(el.children)}\n</div>`
        }
        return `<div${idPart} ${attrs}>${text}</div>`
      }).join('\n')
    }
    return `<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #f5f5f5; }
  </style>
</head>
<body>
${serializeEls(lxElements)}
</body>
</html>`
  }, [elements])

  const [pickerState, setPickerState] = useState<{
    isOpen: boolean
    elementId: string
    positionAttr: string
    x: number
    y: number
  }>({
    isOpen: false,
    elementId: '',
    positionAttr: '',
    x: 0,
    y: 0,
  })

  const [propertyEditorState, setPropertyEditorState] = useState<{
    isOpen: boolean
    elementId: string
    element: LxElement | null
  }>({
    isOpen: false,
    elementId: '',
    element: null,
  })

  const [dragInfo, setDragInfo] = useState<{
    elementId: string
    edge: string
    startValue: string
    startOffset: number
    attr: string
  } | null>(null)

  const allIds = extractAllElementIds(elements)

  const getElementById = useCallback((id: string): LxElement | null => {
    const find = (els: LxElement[]): LxElement | null => {
      for (const el of els) {
        if (el.id === id) return el
        const found = find(el.children)
        if (found) return found
      }
      return null
    }
    return find(elements)
  }, [elements])

  const parseOffset = (value: string): number => {
    if (!value) return 0
    const match = value.match(/[+-]?\d+(\.\d+)?$/)
    if (match) return parseFloat(match[0])
    return 0
  }

  const updateElementAttr = useCallback((elementId: string, attr: string, value: string) => {
    const updateInHtml = (html: string): string => {
      const attrRegex = new RegExp(
        `(<div[^>]*id="${elementId}"[^>]*)(\\s+${attr}="[^"]*")([^>]*>)`,
        'i',
      )

      if (attrRegex.test(html)) {
        return html.replace(attrRegex, (_match, before, _oldAttr, after) => {
          return `${before} ${attr}="${value}"${after}`
        })
      }

      const insertRegex = new RegExp(
        `(<div[^>]*id="${elementId}"[^>]*)(>)`,
        'i',
      )
      return html.replace(insertRegex, (_match, before, after) => {
        return `${before} ${attr}="${value}"${after}`
      })
    }

    updateHtml(updateInHtml(html))
  }, [html, updateHtml])

  const handleCodeChange = useCallback(
    (newCode: string) => {
      updateHtml(newCode)
    },
    [updateHtml],
  )

  const handleSelectElement = useCallback((id: string | null) => {
    setSelectedElementId(id)
  }, [])

  const handleAddElement = useCallback(
    (parentId: string | null, newEl: LxElement) => {
      let newHtml: string

      if (parentId === null) {
        const bodyMatch = html.match(/<body[^>]*>/)
        if (bodyMatch) {
          const attrs = Object.entries(newEl.attrs)
            .map(([k, v]) => `${k}="${v}"`)
            .join(' ')
          const idPart = newEl.id ? ` id="${newEl.id}"` : ''
          const text = newEl.text || ''
          newHtml = html.replace(
            bodyMatch[0],
            bodyMatch[0] + `\n  <div${idPart} ${attrs}>${text}</div>`,
          )
        } else {
          const attrs = Object.entries(newEl.attrs)
            .map(([k, v]) => `${k}="${v}"`)
            .join(' ')
          const idPart = newEl.id ? ` id="${newEl.id}"` : ''
          const text = newEl.text || ''
          newHtml = html.replace('</body>', `  <div${idPart} ${attrs}>${text}</div>\n</body>`)
        }
      } else {
        const parentRegex = new RegExp(`(<div[^>]*id="${parentId}"[^>]*>)`, 'i')
        const attrs = Object.entries(newEl.attrs)
          .map(([k, v]) => `${k}="${v}"`)
          .join(' ')
        const idPart = newEl.id ? ` id="${newEl.id}"` : ''
        const text = newEl.text || ''
        newHtml = html.replace(parentRegex, (match) => {
          return match + `\n    <div${idPart} ${attrs}>${text}</div>`
        })
      }

      updateHtml(newHtml)
    },
    [html, updateHtml],
  )

  const handleOpenPositionPicker = useCallback(
    (elementId: string, positionAttr: string, x: number, y: number) => {
      setPickerState({
        isOpen: true,
        elementId,
        positionAttr,
        x,
        y,
      })
    },
    [],
  )

  const handleOpenPropertyEditor = useCallback(
    (elementId: string, _x: number, _y: number) => {
      const element = getElementById(elementId)
      setPropertyEditorState({
        isOpen: true,
        elementId,
        element,
      })
    },
    [getElementById],
  )

  const handleDragStart = useCallback(
    (elementId: string, edge: string, startX: number, startY: number) => {
      console.log('[App] handleDragStart:', { elementId, edge, startX, startY })
      const element = getElementById(elementId)
      if (!element) {
        console.log('[App] element not found:', elementId)
        return
      }

      console.log('[App] element attrs:', element.attrs)
      let attr = ''
      let currentValue = ''

      if (edge === 'left') {
        if (element.attrs['lx-left']) {
          attr = 'lx-left'
          currentValue = element.attrs[attr]
        } else if (element.attrs['lx-width']) {
          attr = 'lx-width'
          currentValue = element.attrs[attr]
        }
      } else if (edge === 'right') {
        if (element.attrs['lx-right']) {
          attr = 'lx-right'
          currentValue = element.attrs[attr]
        } else if (element.attrs['lx-width']) {
          attr = 'lx-width'
          currentValue = element.attrs[attr]
        }
      } else if (edge === 'top') {
        attr = 'lx-top'
        currentValue = element.attrs[attr] || ''
      } else if (edge === 'bottom') {
        if (element.attrs['lx-bottom']) {
          attr = 'lx-bottom'
          currentValue = element.attrs[attr]
        } else if (element.attrs['lx-height']) {
          attr = 'lx-height'
          currentValue = element.attrs[attr]
        }
      } else if (['tl', 'tr', 'bl', 'br'].includes(edge)) {
        attr = 'lx-width'
        currentValue = element.attrs[attr] || ''
      }

      const startOffset = parseOffset(currentValue || '0')
      const startValue = currentValue || '0'

      console.log('[App] dragInfo:', { elementId, edge, startValue, startOffset, attr })

      setDragInfo({
        elementId,
        edge,
        startValue,
        startOffset,
        attr,
      })
    },
    [getElementById],
  )

  const handleDrag = useCallback(
    (elementId: string, edge: string, deltaX: number, deltaY: number) => {
      console.log('[App] handleDrag:', { elementId, edge, deltaX, deltaY })
      if (!dragInfo || dragInfo.elementId !== elementId) {
        return
      }

      const attr = dragInfo.attr
      const startValue = dragInfo.startValue
      const startOffset = dragInfo.startOffset

      let newOffset: number
      if (['left', 'right'].includes(edge)) {
        newOffset = startOffset + deltaX
      } else if (['top', 'bottom'].includes(edge)) {
        newOffset = startOffset + deltaY
      } else if (['tl', 'tr', 'bl', 'br'].includes(edge)) {
        newOffset = startOffset + deltaX
      } else {
        return
      }

      let newValue: string
      if (!/^[+-]/.test(startValue)) {
        newValue = String(newOffset)
      } else {
        newValue = (newOffset >= 0 ? '+' : '') + newOffset.toString()
      }

      console.log('[App] handleDrag newValue:', newValue, { startValue, startOffset, newOffset })

      updateElementAttr(elementId, attr, newValue)

      if (sendToIframeRef.current) {
        const newHtml = generatePreviewHtml()
        sendToIframeRef.current(newHtml)
      }
    },
    [dragInfo, getElementById, updateElementAttr, generatePreviewHtml],
  )

  const handleDragEnd = useCallback(
    (elementId: string, edge: string, deltaX: number, deltaY: number) => {
      console.log('[App] handleDragEnd:', { elementId, edge, deltaX, deltaY })
      if (!dragInfo || dragInfo.elementId !== elementId) {
        console.log('[App] dragInfo mismatch:', { dragInfo, elementId })
        return
      }

      const element = getElementById(elementId)
      if (!element) {
        console.log('[App] element not found:', elementId)
        return
      }

      const attr = dragInfo.attr
      const startValue = dragInfo.startValue
      const startOffset = dragInfo.startOffset
      console.log('[App] will update:', { attr, startValue, startOffset })

      let newOffset: number

      if (['left', 'right'].includes(edge)) {
        newOffset = startOffset + deltaX
      } else if (['top', 'bottom'].includes(edge)) {
        newOffset = startOffset + deltaY
      } else if (['tl', 'tr', 'bl', 'br'].includes(edge)) {
        newOffset = startOffset + deltaX
      } else {
        console.log('[App] unknown edge:', edge)
        return
      }

      console.log('[App] newOffset:', newOffset)
      let newValue: string
      if (!/^[+-]/.test(startValue)) {
        newValue = String(newOffset)
      } else {
        newValue = (newOffset >= 0 ? '+' : '') + newOffset.toString()
      }

      console.log('[App] final newValue:', newValue)
      updateElementAttr(elementId, attr, newValue)
      setDragInfo(null)
    },
    [dragInfo, getElementById, updateElementAttr],
  )

  const handlePickerConfirm = useCallback(
    (targetId: string, edge: Edge, offset: number) => {
      const { elementId, positionAttr } = pickerState

      const targetStr = targetId === 'body' ? 'body' : `#${targetId}`
      const value = `${targetStr}.${edge}${offset >= 0 ? '+' : ''}${offset}`

      updateElementAttr(elementId, positionAttr, value)
      setPickerState((prev) => ({ ...prev, isOpen: false }))
    },
    [pickerState, updateElementAttr],
  )

  const handlePickerCancel = useCallback(() => {
    setPickerState((prev) => ({ ...prev, isOpen: false }))
  }, [])

  const handlePropertyEditorConfirm = useCallback(
    (attrs: Record<string, string>) => {
      const { elementId } = propertyEditorState

      Object.entries(attrs).forEach(([attr, value]) => {
        if (value) {
          updateElementAttr(elementId, attr, value)
        }
      })

      setPropertyEditorState({ isOpen: false, elementId: '', element: null })
    },
    [propertyEditorState, updateElementAttr],
  )

  const handlePropertyEditorCancel = useCallback(() => {
    setPropertyEditorState({ isOpen: false, elementId: '', element: null })
  }, [])

  return (
    <div style={styles.app}>
      <div style={styles.left}>
        <CodeEditor value={html} onChange={handleCodeChange} />
      </div>
      <div style={styles.right}>
        <VisualEditor
          elements={elements}
          selectedElementId={selectedElementId}
          onSelectElement={handleSelectElement}
          onAddElement={handleAddElement}
          onOpenPositionPicker={handleOpenPositionPicker}
          onOpenPropertyEditor={handleOpenPropertyEditor}
          onDragStart={handleDragStart}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
          renderHtmlToIframe={(sendFn) => {
            sendToIframeRef.current = sendFn
          }}
        />
      </div>
      <PositionPicker
        isOpen={pickerState.isOpen}
        elementId={pickerState.elementId}
        positionAttr={pickerState.positionAttr}
        availableIds={allIds}
        onConfirm={handlePickerConfirm}
        onCancel={handlePickerCancel}
      />
      <PropertyPanel
        isOpen={propertyEditorState.isOpen}
        element={propertyEditorState.element}
        onConfirm={handlePropertyEditorConfirm}
        onCancel={handlePropertyEditorCancel}
      />
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  app: {
    display: 'flex',
    width: '100vw',
    height: '100vh',
    overflow: 'hidden',
    background: '#1e1e1e',
  },
  left: {
    width: '50%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  right: {
    width: '50%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
}