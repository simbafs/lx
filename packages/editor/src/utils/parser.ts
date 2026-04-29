import { Edge, SizeExpr, AspectExpr, PositionExpr } from '../types'
import { POSITION_RE, RELATIVE_RE, FIXED_SIZE_RE, RANGE_SIZE_RE, ASPECT_RE } from './constants'

export function parsePositionAttr(value: string | undefined): PositionExpr | null {
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

export function parseSizeAttr(value: string | undefined): SizeExpr | null {
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

export function parseAspectAttr(value: string | undefined): AspectExpr | null {
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