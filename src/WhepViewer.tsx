import { useEffect, useRef } from 'react'
import { debug, useWhepHook } from './common.js'

export type WhepViewerProps = {
  url: string
  token?: string
}

export function WhepViewer(props: WhepViewerProps) {
  debug('Entered WhepViewer')

  const vidref = useRef<HTMLVideoElement>(null)

  const [pcref, mediaStream] = useWhepHook(props.url, props.token)

  useEffect(() => {
    if (vidref.current) {
      vidref.current.srcObject = mediaStream
    }
  }, [mediaStream, vidref])

  debug('WhepViewer returning JSX')

  if (mediaStream === null) {
    return <video autoPlay={true} muted controls />
  } else {
    return <video autoPlay={true} muted controls ref={vidref} />
  }
}
