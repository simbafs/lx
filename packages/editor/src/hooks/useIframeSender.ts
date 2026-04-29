import { useEffect, useCallback } from 'react'
import type { IframeMessage } from '../types'

export function useIframeSender({
  iframeRef,
  renderHtmlToIframe,
}: {
  iframeRef: React.RefObject<HTMLIFrameElement | null>
  renderHtmlToIframe?: (sendFn: (message: IframeMessage) => void) => void
}) {
  const sendToIframe = useCallback((message: IframeMessage) => {
    iframeRef.current?.contentWindow?.postMessage(message, '*')
  }, [iframeRef])

  useEffect(() => {
    if (renderHtmlToIframe) {
      renderHtmlToIframe(sendToIframe)
    }
  }, [renderHtmlToIframe, sendToIframe])

  return sendToIframe
}
