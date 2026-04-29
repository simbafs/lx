import { useEffect } from 'react'
import type { LxElement, IframeMessage } from '../types'

export function useSyncToIframe({
  elements,
  sendToIframe,
}: {
  elements: LxElement[]
  sendToIframe: (message: IframeMessage) => void
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

    const html = serializeElements(lxElements)
    sendToIframe({ type: 'render', html })
  }, [elements, sendToIframe])
}
