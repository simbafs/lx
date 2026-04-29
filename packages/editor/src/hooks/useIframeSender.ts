import { useEffect, useCallback } from 'react'

export function useIframeSender({
  iframeRef,
  renderHtmlToIframe,
}: {
  iframeRef: React.RefObject<HTMLIFrameElement | null>
  renderHtmlToIframe?: (sendFn: (html: string) => void) => void
}) {
  const sendToIframe = useCallback((html: string) => {
    iframeRef.current?.contentWindow?.postMessage({ type: 'render', html }, '*')
  }, [iframeRef])

  useEffect(() => {
    if (renderHtmlToIframe) {
      renderHtmlToIframe(sendToIframe)
    }
  }, [renderHtmlToIframe, sendToIframe])

  return sendToIframe
}
