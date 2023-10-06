import { useEffect, useRef, useState } from 'react'
import {
  MediaStreamOrNull,
  debug,
  destroyPCRef,
  mysleep,
  pcConf,
  useWhepUseEffect,
} from './common.js'
import { WHEPClient } from '@cameronelliott/whip-whep/whep.js'

export type WhepViewerProps = {
  url: string
  token?: string
}

/*
theory of operation:

WhepViewer is wrapped with a React.memo() call, so it will only be
re-rendered when the props change.  The props are the url and token



there is a single useEffect() hook that runs just once the component is mounted. 
to make this happen, the dependency array is empty.  this is the only place
where the mediaStream is set, so it is the only place where the video element








*/

export type WhepConnectProps = {
  url: string
  token: string
  setMediaStream: (ms: MediaStream) => void
  forceRender: () => void
}

export function WhepViewer(props: WhepViewerProps) {
  debug('Entered WhepViewer')

  const vidref = useRef<HTMLVideoElement>(null)

  // stream should never be null or change instances
  const [stream, conn] = useWhepUseEffect(props.url, props.token)

  useEffect(() => {
    debug('WhepViewer useEffect entry')

    if (vidref.current !== null) {
      debug('WhepViewer useEffect setting srcObject')
      vidref.current!.srcObject = stream
    }
  }, [vidref])

  debug('WhepViewer returning JSX')

  //const style = { border: '5px solid red', opacity: 0.5 }
  const style = { border: '', opacity: 0.5 }
  if (conn) {
    style.border = ''
    style.opacity = 1
  }

  // create an attributes var
  const attributes = {
    controls: true,
    style: style,
    autoPlay: true,
    muted: true,
  }

  return <video {...attributes} ref={vidref} />
}
