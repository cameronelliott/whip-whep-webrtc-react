import { useEffect, useRef, useState } from 'react'
import {
  MediaStreamOrNull,
  debug,
  destroyPCRef,
  mysleep,
  pcConf,
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

export function useWhepUseEffect(
  url: string,
  token?: string
): [MediaStream, boolean] {
  //
  debug('-- useWhepUseEffect() entry')

  const [counter, setCounter] = useState(0) // this is used to restart a connection
  const [conn, setConnected] = useState(false) // this is used change css styles
  const forceRender = () => setCounter(counter + 1) // convienence function

  // this only gets created once, and is never destroyed
  // tracks get added and removed from it inside ontrack()
  const stream = useRef<MediaStreamOrNull>(null)
  if (stream.current === null) {
    stream.current = new MediaStream()
  }

  useEffect(() => {
    debug('-- useWhepHook() useEffect entry')

    const pc = new RTCPeerConnection(pcConf)

    const whep = new WHEPClient()

    pc.ontrack = (ev) => {
      debug('-- ontrack entry kind: ', ev.track.kind)
      if (ev.streams[0]) {
        // delete the existing tracks
        stream
          .current!.getTracks()
          .forEach((t) => stream.current!.removeTrack(t))

        debug('-- ontrack got stream')
        for (const tr of ev.streams[0].getTracks()) {
          debug('-- ontrack receiver kind: ', tr.kind)
          stream.current!.addTrack(tr)
        }
      } else {
        console.warn('-- ontrack empty stream')
      }
    }
    pc.addTransceiver('video', { direction: 'recvonly' })
    pc.addTransceiver('audio', { direction: 'recvonly' })
    pc.oniceconnectionstatechange = (ev) => {
      const st = (ev.target as RTCPeerConnection).iceConnectionState
      debug('-- ice state change', st)

      if (st === 'disconnected' || st === 'failed' || st === 'closed') {
        forceRender() // two state updates, two renders? :()
        setConnected(false)
      }

      if (st === 'connected') {
        setConnected(true)
      }
    }

    whep
      .view(pc, url, token)
      .then(() => {
        debug('-- whep.view() done OK')
      })
      .catch((err: Error) => {
        debug('-- whep.view() done ERR / sleeping', err)
        mysleep().then(() => {
          debug('-- whep.view() done ERR, forcing render')
          forceRender() // two state updates, two renders? :()
          setConnected(false)
        })
      })

    // return the cleanup function to be called on component unmount
    return () => {
      debug('-- useWhepReceiverHook() useEffect cleanup')
      destroyPCRef(pc)
      whep.stop().catch(() => {
        debug('-- whep.stop() done ERR')
      })
    }
  }, [counter]) // no-array: every render, []: just-a-single-time, [xxx]: when xxx changes

  return [stream.current!, conn]
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
