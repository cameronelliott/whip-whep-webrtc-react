import { useEffect, useRef } from 'react'
import { debug, useWhipHook } from './common.js'

export type WhipSenderProps = {
  mediaStream: MediaStream
  url: string
  token?: string
}

export function WhipSender(props: WhipSenderProps) {
  debug('Entered WhepViewer')

  const pcref = useWhipHook(props.mediaStream, props.url, props.token)

  // useEffect(() => {
  //   if (vidref.current) {
  //     vidref.current.srcObject = mediaStream
  //   }
  // }, [mediaStream, vidref])

  debug('WhepViewer returning JSX')

  // if (mediaStream === null) {
  //   return <video autoPlay={true} muted controls />
  // } else {
  //   return <video autoPlay={true} muted controls ref={vidref} />
  // }

  return <></>
}
