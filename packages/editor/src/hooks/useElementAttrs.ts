import { useState, useEffect, useCallback } from 'react'
import type { LxElement } from '../types'

const LX_ATTRS = [
  'lx-left',
  'lx-right',
  'lx-top',
  'lx-bottom',
  'lx-width',
  'lx-height',
  'lx-aspect',
]

export function useElementAttrs(element: LxElement | null) {
  const [attrs, setAttrs] = useState<Record<string, string>>({})

  useEffect(() => {
    if (element) {
      const lxAttrs: Record<string, string> = {}
      LX_ATTRS.forEach(attr => {
        lxAttrs[attr] = element.attrs[attr] || ''
      })
      setAttrs(lxAttrs)
    }
  }, [element])

  const updateAttr = useCallback((key: string, value: string) => {
    setAttrs(prev => ({ ...prev, [key]: value }))
  }, [])

  return { attrs, setAttrs: updateAttr }
}

export const LX_ATTRS_LIST = LX_ATTRS