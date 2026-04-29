import { useState, useCallback, useMemo } from 'react'
import { LxElement, ParsedNode, Edge, SizeExpr, AspectExpr, PositionExpr } from '../types'
import { parseHtmlToElements, getCanonicalAttrs } from '../utils/htmlParser'

export type HtmlSource = 'monaco' | 'visual'

const POSITION_RE = /^(body|#([A-Za-z_][\w\-:.]*))\.(left|right|top|bottom)([+-]\d+(?:\.\d+)?)?$/
const RELATIVE_RE = /^(previous|next)\.(left|right|top|bottom)([+-]\d+(?:\.\d+)?)?$/
const FIXED_SIZE_RE = /^-?\d+(?:\.\d+)?$/
const RANGE_SIZE_RE = /^(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)$/
const ASPECT_RE = /^(\d+(?:\.\d+)?):(\d+(?:\.\d+)?)$/

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

function parsePositionAttr(value: string | undefined): PositionExpr | null {
  if (!value) return null

  const relativeMatch = value.match(RELATIVE_RE)
  if (relativeMatch) {
    return {
      type: 'element-ref',
      edge: relativeMatch[2] as Edge,
      offset: parseFloat(relativeMatch[3] || '0'),
      raw: value,
      targetId: relativeMatch[1],
    }
  }

  const match = value.match(POSITION_RE)
  if (match) {
    return {
      type: match[1] === 'body' ? 'body-ref' : 'element-ref',
      edge: match[3] as Edge,
      offset: parseFloat(match[4] || '0'),
      raw: value,
      targetId: match[2],
    }
  }

  return {
    type: 'body-ref',
    edge: 'left',
    offset: parseFloat(value) || 0,
    raw: value,
  }
}

function parseSizeAttr(value: string | undefined): SizeExpr | null {
  if (!value) return null

  if (RANGE_SIZE_RE.test(value)) {
    const match = value.match(RANGE_SIZE_RE)!
    return {
      type: 'range',
      min: parseFloat(match[1]),
      max: parseFloat(match[2]),
      raw: value,
    }
  }

  if (FIXED_SIZE_RE.test(value)) {
    return {
      type: 'fixed',
      value: parseFloat(value),
      raw: value,
    }
  }

  return null
}

function parseAspectAttr(value: string | undefined): AspectExpr | null {
  if (!value) return null

  const match = value.match(ASPECT_RE)
  if (match) {
    const width = parseFloat(match[1])
    const height = parseFloat(match[2])
    return {
      type: 'aspect',
      width,
      height,
      ratio: width / height,
      raw: value,
    }
  }

  return null
}
