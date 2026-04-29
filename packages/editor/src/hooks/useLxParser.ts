import { useState, useCallback, useMemo } from 'react'
import { LxElement, ParsedNode } from '../types'
import { parseHtmlToElements, getCanonicalAttrs } from '../utils/htmlParser'
import { parsePositionAttr, parseSizeAttr, parseAspectAttr } from '../utils/parser'

export type HtmlSource = 'monaco' | 'visual'

export function useLxParser(initialHtml: string) {
  const [html, setHtml] = useState(initialHtml)
  const [error, setError] = useState<string | null>(null)

  const elements = useMemo(() => {
    try {
      setError(null)
      return parseHtmlToElements(html)
    } catch (e) {
      setError(String(e))
      return []
    }
  }, [html])

  const parsedNodes = useMemo((): ParsedNode[] => {
    const nodes: ParsedNode[] = []
    function traverse(els: LxElement[]) {
      for (const el of els) {
        const canonical = getCanonicalAttrs(el.attrs)
        const node: ParsedNode = {
          id: el.id,
          el: null,
          left: parsePositionAttr(canonical['lx-left']),
          right: parsePositionAttr(canonical['lx-right']),
          top: parsePositionAttr(canonical['lx-top']),
          bottom: parsePositionAttr(canonical['lx-bottom']),
          width: parseSizeAttr(canonical['lx-width']),
          height: parseSizeAttr(canonical['lx-height']),
          aspect: parseAspectAttr(canonical['lx-aspect']),
        }
        nodes.push(node)
        traverse(el.children)
      }
    }
    traverse(elements)
    return nodes
  }, [elements])

  const updateHtml = useCallback((newHtml: string | ((prev: string) => string)) => {
    if (typeof newHtml === 'function') {
      setHtml(newHtml)
    } else {
      setHtml(newHtml)
    }
  }, [])

  const [currentSource, setCurrentSource] = useState<HtmlSource>('monaco')

  return {
    html,
    elements,
    parsedNodes,
    error,
    updateHtml,
    currentSource,
    setCurrentSource,
  }
}