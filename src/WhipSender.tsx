import { useEffect, useRef } from 'react'
import { debug, useWhipUseEffect } from './common.js'

export type WhipSenderProps = {
  mediaStream: MediaStream
  url: string
  token?: string
}

export function WhipSender(props: WhipSenderProps) {
  debug('Entered WhipSender')

  let conn = false

  conn = useWhipUseEffect(props.mediaStream, props.url, props.token)

  debug('WhipSender returning JSX')

  const style = { border: '', opacity: 0.5 }
  if (conn) {
    style.border = ''
    style.opacity = 1
  }

  // create an attributes va
  const attributes = {
    controls: true,
    style: style,
    autoPlay: true,
    muted: true,
  }

  const setSrcObject = (v: HTMLVideoElement | null) => {
    if (v && v instanceof HTMLVideoElement) {
      v.srcObject = props.mediaStream
    }
  }

  //  <video {...attributes} ref={(x) => (x!.srcObject = props.mediaStream)} />

  return <video {...attributes} ref={(z) => setSrcObject(z)} />
}
