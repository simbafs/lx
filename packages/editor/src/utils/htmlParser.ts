import { LxElement } from '../types'

const LX_ATTRS = [
  'lx-left',
  'lx-right',
  'lx-top',
  'lx-bottom',
  'lx-width',
  'lx-height',
  'lx-aspect',
  'lx-l',
  'lx-r',
  'lx-t',
  'lx-b',
  'lx-w',
  'lx-h',
  'lx-a',
  'lx',
]

const ATTR_ALIAS: Record<string, string> = {
  'lx-l': 'lx-left',
  'lx-r': 'lx-right',
  'lx-t': 'lx-top',
  'lx-b': 'lx-bottom',
  'lx-w': 'lx-width',
  'lx-h': 'lx-height',
  'lx-a': 'lx-aspect',
}

export function parseHtmlToElements(html: string): LxElement[] {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  return Array.from(doc.body.children).map(parseElement)
}

function parseElement(el: Element): LxElement {
  const attrs: Record<string, string> = {}

  for (const attr of el.attributes) {
    if (LX_ATTRS.includes(attr.name) || attr.name.startsWith('data-lx-')) {
      attrs[attr.name] = attr.value
    }
  }

  const children: LxElement[] = []
  for (const child of el.children) {
    children.push(parseElement(child))
  }

  const text = el.textContent?.trim()

  return {
    id: el.id || generateId(),
    tagName: el.tagName.toLowerCase(),
    attrs,
    children,
    text: text && children.length === 0 ? text : undefined,
  }
}

function generateId(): string {
  return 'el-' + Math.random().toString(36).substring(2, 9)
}

export function getCanonicalAttrs(attrs: Record<string, string>): Record<string, string> {
  const canonical: Record<string, string> = {}

  for (const [key, value] of Object.entries(attrs)) {
    const canonicalKey = ATTR_ALIAS[key] || key
    if (canonicalKey.startsWith('lx-')) {
      canonical[canonicalKey] = value
    }
  }

  return canonical
}

export function normalizePositionValue(value: string): string {
  if (/^\d+(\.\d+)?$/.test(value)) {
    return `body.left+${value}`
  }
  if (/^(previous|next)\./.test(value)) {
    return value
  }
  if (/^{/.test(value)) {
    return `body.left+${value}`
  }
  return value
}

export function serializeToHtml(elements: LxElement[]): string {
  return elements.map(el => serializeElement(el)).join('\n')
}

function serializeElement(el: LxElement): string {
  const attrStr = Object.entries(el.attrs)
    .map(([k, v]) => `${k}="${v}"`)
    .join(' ')

  const attrsPart = attrStr ? ' ' + attrStr : ''
  const idPart = el.id ? ` id="${el.id}"` : ''

  if (el.children.length === 0) {
    if (el.text) {
      return `<${el.tagName}${idPart}${attrsPart}>${el.text}</${el.tagName}>`
    }
    return `<${el.tagName}${idPart}${attrsPart}></${el.tagName}>`
  }

  const childrenStr = el.children.map(c => serializeElement(c)).join('\n')
  return `<${el.tagName}${idPart}${attrsPart}>\n${childrenStr}\n</${el.tagName}>`
}

export function extractAllElementIds(elements: LxElement[]): string[] {
  const ids: string[] = []
  function traverse(els: LxElement[]) {
    for (const el of els) {
      if (el.id) ids.push(el.id)
      traverse(el.children)
    }
  }
  traverse(elements)
  return ids
}
