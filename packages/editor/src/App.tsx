import { useState, useCallback, useRef } from 'react'
import CodeEditor, { CodeEditorRef } from './components/CodeEditor'
import VisualEditor from './components/VisualEditor'
import PositionPicker from './components/PositionPicker'
import PropertyPanel from './components/PropertyPanel'
import Layout from './components/Layout'
import { useLxParser } from './hooks/useLxParser'
import { useMonacoSync } from './hooks/useMonacoSync'
import { LxElement, Edge, IframeMessage } from './types'
import { extractAllElementIds } from './utils/htmlParser'
import { DEFAULT_HTML } from './utils/constants'

export default function App() {
  const { html, elements, updateHtml, currentSource, setCurrentSource } = useLxParser(DEFAULT_HTML)
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null)
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null)

const sendToIframeRef = useRef<((message: IframeMessage) => void) | null>(null)
  const codeEditorRef = useRef<CodeEditorRef>(null)

  useMonacoSync({ html, currentSource, codeEditorRef })

  const generatePreviewHtml = useCallback((): string => {
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/)
    const bodyContent = bodyMatch ? bodyMatch[1] : ''
    return `<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #f5f5f5; }
  </style>
</head>
<body>
${bodyContent}
</body>
</html>`
  }, [html])

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
    referencePrefix: string
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
    console.log('[App] updateElementAttr called:', { elementId, attr, value })
    updateHtml((prevHtml: string) => {
      console.log('[App] updateElementAttr prevHtml:', prevHtml.slice(0, 200))
      const attrRegex = new RegExp(
        `(<div[^>]*id="${elementId}"[^>]*)(\\s+${attr}="[^"]*")([^>]*>)`,
        'i',
      )

      if (attrRegex.test(prevHtml)) {
        return prevHtml.replace(attrRegex, (_match, before, _oldAttr, after) => {
          return `${before} ${attr}="${value}"${after}`
        })
      }

      const insertRegex = new RegExp(
        `(<div[^>]*id="${elementId}"[^>]*)(>)`,
        'i',
      )
      return prevHtml.replace(insertRegex, (_match, before, after) => {
        return `${before} ${attr}="${value}"${after}`
      })
    })
  }, [updateHtml])

  const handleCodeChange = useCallback(
    (newCode: string) => {
      setCurrentSource('monaco')
      updateHtml(newCode)
    },
    [updateHtml, setCurrentSource],
  )

  const handleSelectElement = useCallback((id: string | null) => {
    setSelectedElementId(id)
  }, [])

  const handleHandleHover = useCallback((elementId: string | null, edge: string | null) => {
    if (elementId && edge) {
      setSelectedElementId(elementId)
      setHoveredEdge(edge)
    } else {
      setHoveredEdge(null)
    }
  }, [])

  const handleCycleElement = useCallback(
    (direction: 'next' | 'prev', elements: string[], currentIndex: number) => {
      console.log('[App] handleCycleElement:', { direction, elements, currentIndex })
      let newIndex: number
      if (direction === 'next') {
        newIndex = (currentIndex + 1) % elements.length
      } else {
        newIndex = (currentIndex - 1 + elements.length) % elements.length
      }
      console.log('[App] newIndex:', newIndex, 'new element:', elements[newIndex])
      setSelectedElementId(elements[newIndex])
    },
    [],
  )

  const handleAddElement = useCallback(
    (parentId: string | null, newEl: LxElement) => {
      setCurrentSource('visual')
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
    [html, updateHtml, setCurrentSource],
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
      setCurrentSource('visual')
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

      const lastSignIndex = currentValue.lastIndexOf('+')
      const lastMinusIndex = currentValue.lastIndexOf('-')
      const signIndex = Math.max(lastSignIndex, lastMinusIndex)
      const referencePrefix = signIndex > 0 ? currentValue.slice(0, signIndex) : ''

      console.log('[App] dragInfo:', { elementId, edge, startValue, startOffset, attr, referencePrefix })

      setDragInfo({
        elementId,
        edge,
        startValue,
        startOffset,
        attr,
        referencePrefix,
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
      const referencePrefix = dragInfo.referencePrefix

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
      if (referencePrefix) {
        newValue = referencePrefix + (newOffset >= 0 ? '+' : '') + newOffset
        console.log('[App] case referencePrefix:', { referencePrefix, newOffset, newValue })
      } else if (!/^[+-]/.test(startValue)) {
        newValue = String(newOffset)
        console.log('[App] case no +/-:', { startValue, newOffset, newValue })
      } else {
        newValue = (newOffset >= 0 ? '+' : '') + newOffset.toString()
      }

      console.log('[App] handleDrag newValue:', newValue, { startValue, startOffset, newOffset, referencePrefix })

      updateElementAttr(elementId, attr, newValue)

      if (sendToIframeRef.current) {
        const newHtml = generatePreviewHtml()
        sendToIframeRef.current({ type: 'render', html: newHtml })
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
      const referencePrefix = dragInfo.referencePrefix
      console.log('[App] will update:', { attr, startValue, startOffset, referencePrefix })

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
      if (referencePrefix) {
        newValue = referencePrefix + (newOffset >= 0 ? '+' : '') + newOffset
        console.log('[App] case referencePrefix:', { referencePrefix, newOffset, newValue })
      } else if (!/^[+-]/.test(startValue)) {
        newValue = String(newOffset)
        console.log('[App] case no +/-:', { startValue, newOffset, newValue })
      } else {
        newValue = (newOffset >= 0 ? '+' : '') + newOffset.toString()
        console.log('[App] case has +/-:', { startValue, newOffset, newValue })
      }

      console.log('[App] final newValue:', newValue)
      updateElementAttr(elementId, attr, newValue)
      setDragInfo(null)
    },
    [dragInfo, getElementById, updateElementAttr],
  )

  const handlePickerConfirm = useCallback(
    (targetId: string, edge: Edge, offset: number) => {
      setCurrentSource('visual')
      const { elementId, positionAttr } = pickerState

      const targetStr = targetId === 'body' ? 'body' : `#${targetId}`
      const value = `${targetStr}.${edge}${offset >= 0 ? '+' : ''}${offset}`

      updateElementAttr(elementId, positionAttr, value)
      setPickerState((prev) => ({ ...prev, isOpen: false }))
    },
    [pickerState, updateElementAttr, setCurrentSource],
  )

  const handlePickerCancel = useCallback(() => {
    setPickerState((prev) => ({ ...prev, isOpen: false }))
  }, [])

  const handlePropertyEditorConfirm = useCallback(
    (attrs: Record<string, string>) => {
      setCurrentSource('visual')
      console.log('[App] handlePropertyEditorConfirm:', { attrs, propertyEditorState })
      const { elementId } = propertyEditorState
      console.log('[App] elementId:', elementId)

      Object.entries(attrs).forEach(([attr, value]) => {
        console.log('[App] updating:', { elementId, attr, value })
        if (value) {
          updateElementAttr(elementId, attr, value)
        }
      })

      console.log('[App] sendToIframeRef.current:', sendToIframeRef.current)
      if (sendToIframeRef.current) {
        const newHtml = generatePreviewHtml()
        console.log('[App] newHtml:', newHtml.slice(0, 200))
        sendToIframeRef.current({ type: 'render', html: newHtml })
      }

      setPropertyEditorState({ isOpen: false, elementId: '', element: null })
    },
    [propertyEditorState, updateElementAttr, generatePreviewHtml, setCurrentSource],
  )

  const handlePropertyEditorCancel = useCallback(() => {
    setPropertyEditorState({ isOpen: false, elementId: '', element: null })
  }, [])

  return (
    <Layout
      leftPanel={<CodeEditor ref={codeEditorRef} value={html} onChange={handleCodeChange} />}
      rightPanel={
        <VisualEditor
          elements={elements}
          selectedElementId={selectedElementId}
          hoveredEdge={hoveredEdge}
          onSelectElement={handleSelectElement}
          onOpenPropertyEditor={handleOpenPropertyEditor}
          onDragStart={handleDragStart}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
          onHandleHover={handleHandleHover}
          onCycleElement={handleCycleElement}
          renderHtmlToIframe={(sendFn) => {
            sendToIframeRef.current = sendFn
          }}
        />
      }
    >
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
    </Layout>
  )
}