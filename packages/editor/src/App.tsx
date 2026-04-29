import { useState, useCallback } from 'react'
import CodeEditor from './components/CodeEditor'
import VisualEditor from './components/VisualEditor'
import PositionPicker from './components/PositionPicker'
import { useLxParser } from './hooks/useLxParser'
import { LxElement, Edge } from './types'
import { serializeToHtml, extractAllElementIds } from './utils/htmlParser'

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

  const allIds = extractAllElementIds(elements)

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
          newHtml = html.replace(
            bodyMatch[0],
            bodyMatch[0] + '\n  ' + serializeToHtml([newEl]),
          )
        } else {
          newHtml = html.replace('</body>', `  ${serializeToHtml([newEl])}\n</body>`)
        }
      } else {
        const parentRegex = new RegExp(`(<div[^>]*id="${parentId}"[^>]*>)`, 'i')
        newHtml = html.replace(parentRegex, (match) => {
          return match + '\n    ' + serializeToHtml([newEl])
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

  const handleUpdateElements = useCallback(
    (newElements: LxElement[]) => {
      const bodyMatch = html.match(/<body[^>]*>/)
      if (bodyMatch) {
        const newHtml = html.replace(
          /<body[^>]*>[\s\S]*<\/body>/,
          '<body>\n  ' + serializeToHtml(newElements) + '\n</body>',
        )
        updateHtml(newHtml)
      }
    },
    [html, updateHtml],
  )

  const handlePickerConfirm = useCallback(
    (targetId: string, edge: Edge, offset: number) => {
      const { elementId, positionAttr } = pickerState

      const targetStr = targetId === 'body' ? 'body' : `#${targetId}`
      const value = `${targetStr}.${edge}${offset >= 0 ? '+' : ''}${offset}`

      const updateInHtml = (html: string): string => {
        const attrRegex = new RegExp(
          `(<div[^>]*id="${elementId}"[^>]*)(\\s+${positionAttr}="[^"]*")([^>]*>)`,
          'i',
        )

        if (attrRegex.test(html)) {
          return html.replace(attrRegex, (_match, before, _oldAttr, after) => {
            return `${before} ${positionAttr}="${value}"${after}`
          })
        }

        const insertRegex = new RegExp(
          `(<div[^>]*id="${elementId}"[^>]*)(>)`,
          'i',
        )
        return html.replace(insertRegex, (_match, before, after) => {
          return `${before} ${positionAttr}="${value}"${after}`
        })
      }

      updateHtml(updateInHtml(html))
      setPickerState((prev) => ({ ...prev, isOpen: false }))
    },
    [pickerState, html, updateHtml],
  )

  const handlePickerCancel = useCallback(() => {
    setPickerState((prev) => ({ ...prev, isOpen: false }))
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
          onUpdateElements={handleUpdateElements}
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
