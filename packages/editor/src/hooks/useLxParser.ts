import { useState, useCallback, useMemo, useEffect } from 'react'
import { LxElement, ParsedNode } from '../types'
import { parseHtmlToElements, getCanonicalAttrs } from '../utils/htmlParser'
import { parsePositionAttr, parseSizeAttr, parseAspectAttr } from '../utils/parser'
import { DEFAULT_HTML } from '../utils/constants'

export type HtmlSource = 'monaco' | 'visual'

const STORAGE_KEY_FILES = 'lx-editor-files'
const STORAGE_KEY_CURRENT = 'lx-editor-current'
const STORAGE_KEY_FILE_PREFIX = 'lx-editor-file-'

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key)
    if (stored) {
      return JSON.parse(stored) as T
    }
  } catch (e) {
    console.error('[useLxParser] loadFromStorage error:', e)
  }
  return fallback
}

function saveToStorage(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.error('[useLxParser] saveToStorage error:', e)
  }
}

function getStoredFile(name: string): string | null {
  return localStorage.getItem(STORAGE_KEY_FILE_PREFIX + name)
}

function saveFile(name: string, html: string): void {
  localStorage.setItem(STORAGE_KEY_FILE_PREFIX + name, html)
}

export function useLxParser(_initialHtml: string) {
  const [files, setFiles] = useState<string[]>(() => {
    const storedFiles = loadFromStorage<string[]>(STORAGE_KEY_FILES, [])
    if (storedFiles.length === 0) {
      const defaultFiles = ['default']
      saveToStorage(STORAGE_KEY_FILES, defaultFiles)
      saveFile('default', DEFAULT_HTML)
      return defaultFiles
    }
    return storedFiles
  })

  const [currentFile, setCurrentFile] = useState<string>(() => {
    const storedCurrent = loadFromStorage<string | null>(STORAGE_KEY_CURRENT, null)
    if (storedCurrent && files.includes(storedCurrent)) {
      return storedCurrent
    }
    return files[0] || 'default'
  })

  const [html, setHtml] = useState<string>(() => {
    const stored = getStoredFile(currentFile)
    return stored || DEFAULT_HTML
  })

  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    saveToStorage(STORAGE_KEY_CURRENT, currentFile)
  }, [currentFile])

  useEffect(() => {
    saveFile(currentFile, html)
  }, [html, currentFile])

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

  const createFile = useCallback((name: string) => {
    if (files.includes(name) || !name.trim()) return
    const newFiles = [...files, name]
    setFiles(newFiles)
    saveToStorage(STORAGE_KEY_FILES, newFiles)
    const newContent = '<div id="container" lx lx-left="0" lx-width="1920" lx-top="0" lx-height="1080">\n</div>'
    saveFile(name, newContent)
    setCurrentFile(name)
    setHtml(newContent)
  }, [files])

  const deleteFile = useCallback((name: string) => {
    if (files.length <= 1) return
    const newFiles = files.filter(f => f !== name)
    setFiles(newFiles)
    saveToStorage(STORAGE_KEY_FILES, newFiles)
    localStorage.removeItem(STORAGE_KEY_FILE_PREFIX + name)
    if (currentFile === name) {
      setCurrentFile(newFiles[0])
      setHtml(getStoredFile(newFiles[0]) || '')
    }
  }, [files, currentFile])

  const switchFile = useCallback((name: string) => {
    if (!files.includes(name)) return
    const stored = getStoredFile(name)
    setCurrentFile(name)
    setHtml(stored || '')
  }, [files])

  const updateHtml = useCallback((newHtml: string | ((prev: string) => string)) => {
    if (typeof newHtml === 'function') {
      setHtml(prev => {
        const updated = newHtml(prev)
        return updated
      })
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
    files,
    currentFile,
    createFile,
    deleteFile,
    switchFile,
  }
}