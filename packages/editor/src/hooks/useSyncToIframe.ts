import { useEffect } from 'react'
import type { LxElement } from '../types'

export function useSyncToIframe({
  elements,
  sendToIframe,
}: {
  elements: LxElement[]
  sendToIframe: (html: string) => void
}) {
  useEffect(() => {
    const lxElements = elements.filter(el => el.attrs['lx'] !== undefined)

    const serializeElements = (els: LxElement[]): string => {
      return els.map(el => {
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

    const html = `<!DOCTYPE html>
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
    sendToIframe(html)
  }, [elements, sendToIframe])
}
