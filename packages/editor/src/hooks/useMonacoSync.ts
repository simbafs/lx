import { useEffect, useRef } from 'react'
import type { CodeEditorRef } from '../components/CodeEditor'
import type { HtmlSource } from './useLxParser'

export function useMonacoSync({
  html,
  currentSource,
  codeEditorRef,
}: {
  html: string
  currentSource: HtmlSource
  codeEditorRef: React.RefObject<CodeEditorRef | null>
}) {
  const isSyncingMonacoRef = useRef(false)

  useEffect(() => {
    if (currentSource === 'visual' && codeEditorRef.current && !isSyncingMonacoRef.current) {
      console.log('[useMonacoSync] syncing Monaco with html, source:', currentSource)
      isSyncingMonacoRef.current = true
      codeEditorRef.current.setValue(html)
      isSyncingMonacoRef.current = false
    }
  }, [html, currentSource, codeEditorRef])
}