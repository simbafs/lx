import { useState, useEffect, useCallback } from 'react'
import type { LxElement } from '../types'
import { LX_ATTRS_LIST } from '../utils/constants'

export function useElementAttrs(element: LxElement | null) {
  const [attrs, setAttrs] = useState<Record<string, string>>({})

  useEffect(() => {
    if (element) {
      const lxAttrs: Record<string, string> = {}
      LX_ATTRS_LIST.forEach(attr => {
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