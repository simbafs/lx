import { useEffect, useRef } from 'react'
import type { LxElement } from '../types'

interface MessageHandlers {
  elements: LxElement[]
  onSelectElement: (id: string | null) => void
  onOpenPropertyEditor: (elementId: string, x: number, y: number) => void
  onDragStart: (elementId: string, edge: string, startX: number, startY: number) => void
  onDrag: (elementId: string, edge: string, deltaX: number, deltaY: number) => void
  onDragEnd: (elementId: string, edge: string, deltaX: number, deltaY: number) => void
  sendToIframe: (html: string) => void
}

export function useIframeMessages({
  elements,
  onSelectElement,
  onOpenPropertyEditor,
  onDragStart,
  onDrag,
  onDragEnd,
  sendToIframe,
}: MessageHandlers) {
  const elementsRef = useRef(elements)
  elementsRef.current = elements

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const { type, elementId, x, y, edge, startX, startY, deltaX, deltaY } = event.data

      console.log('[useIframeMessages] message:', { type, elementId, edge, startX, startY, deltaX, deltaY })

      switch (type) {
        case 'ready':
          console.log('[useIframeMessages] iframe ready, sending initial HTML')
          const lxElements = elementsRef.current.filter(el => el.attrs['lx'] !== undefined)
          const serialize = (els: LxElement[]): string => els.map(el => {
            const attrs = Object.entries(el.attrs).map(([k, v]) => `${k}="${v}"`).join(' ')
            const idPart = el.id ? ` id="${el.id}"` : ''
            const text = el.text || ''
            if (el.children.length > 0) {
              return `<div${idPart} ${attrs}>\n${serialize(el.children)}\n</div>`
            }
            return `<div${idPart} ${attrs}>${text}</div>`
          }).join('\n')
          const readyHtml = `<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #f5f5f5; }
  </style>
</head>
<body>
${serialize(lxElements)}
</body>
</html>`
          sendToIframe(readyHtml)
          break
        case 'elementClick':
          onSelectElement(elementId)
          break
        case 'openPropertyEditor':
          onOpenPropertyEditor(elementId, x, y)
          break
        case 'dragStart':
          console.log('[useIframeMessages] calling onDragStart:', { elementId, edge, startX, startY })
          onDragStart(elementId, edge, startX, startY)
          break
        case 'drag':
          console.log('[useIframeMessages] calling onDrag:', { elementId, edge, deltaX, deltaY })
          onDrag(elementId, edge, deltaX, deltaY)
          break
        case 'dragEnd':
          console.log('[useIframeMessages] calling onDragEnd:', { elementId, edge, deltaX, deltaY })
          onDragEnd(elementId, edge, deltaX, deltaY)
          break
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [onSelectElement, onOpenPropertyEditor, onDragStart, onDrag, onDragEnd, sendToIframe])
}