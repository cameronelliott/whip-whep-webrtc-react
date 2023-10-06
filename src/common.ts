import React from 'react'
import { useState, useEffect, useRef } from 'react'
import { WHEPClient } from '@cameronelliott/whip-whep/whep.js'
import { WHIPClient } from '@cameronelliott/whip-whep/whip.js'

//XXX bad
//export {React}

// to enable debug output, in the chrome console, type: localStorage.setItem('whep-debug', '1')
// to disable debug output, in the chrome console, type: localStorage.removeItem('whep-debug')
export const debug = (...args: any[]) =>
  localStorage.getItem('whep-debug') && console.log(...args)

export type PcOrNull = RTCPeerConnection | null
export type PcRef = React.MutableRefObject<PcOrNull>
export type MediaStreamOrNull = MediaStream | null

export const pcConf: RTCConfiguration = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
}

export async function mysleep() {
  debug('-- mysleep')
  const seconds = 3
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000))
}

export function destroyPCRef(ref: PcRef) {
  debug('-- destroyPCRef')
  if (ref) {
    if (ref.current) {
      ref.current.getTransceivers().forEach((x) => {
        x.stop()
      })
      ref.current.ontrack = null
      ref.current.oniceconnectionstatechange = null
      ref.current.onconnectionstatechange = null
      ref.current.close()
    }
    ref.current = null // just be explicit
    //ref.current = new RTCPeerConnection(pcConf)
  }

  // how do you check this function really does it's job?
  // you watch PC go away in chrome here: chrome://webrtc-internals/
  // how do you force the GC, either:
  // 1. force GC from chrome devtools
  // 2. add code here do to window.gc() and add --expose-gc to the process
  // I did #1 for testing
  // I also testing breaking this function to confirm my test was valid
}

export function useWhepHook(
  url: string,
  //setMediaStream: (ms: MediaStreamOrNull) => void = () => { },
  //ntries: number,
  //setNtries: (n: number) => void = () => { },
  token?: string
): [PcRef, MediaStreamOrNull] {
  const [ntries, setNtries] = useState<number>(0)
  const [mediaStream, setMediaStream] = useState<MediaStreamOrNull>(null)
  //cannot call useRef in useEffect
  const pcref = useRef<PcOrNull>(null)

  //cannot call useRef in useEffect
  const whepRef = useRef<WHEPClient | null>(null)

  const forceRender = () => setNtries(ntries + 1)

  useEffect(() => {
    debug('-- useWhepReceiverHook() useEffect entry live:')

    if (pcref.current === null) {
      pcref.current = new RTCPeerConnection(pcConf)
    }
    if (whepRef.current === null) {
      whepRef.current = new WHEPClient()
    }

    pcref.current!.ontrack = (ev) => {
      debug('-- ontrack entry kind: ', ev.track.kind)
      const ms = ev.streams[0]
      if (ms) {
        debug('-- ontrack got stream')
        setMediaStream(ms)
      } else {
        console.warn('-- ontrack empty stream')
      }
    }
    pcref.current!.addTransceiver('video', { direction: 'recvonly' })
    pcref.current!.addTransceiver('audio', { direction: 'recvonly' })
    pcref.current!.oniceconnectionstatechange = (ev) => {
      const st = (ev.target as RTCPeerConnection).iceConnectionState
      debug('-- ice state change', st)

      if (st === 'disconnected' || st === 'failed' || st === 'closed') {
        debug('-- ice state closed/etc, forcing render')
        //XXX
        // I am concerned these two state touches might cause two re - renders
        // but I hope not
        forceRender()
        //setMediaStream(null)
      }
    }

    if (pcref.current && pcref.current.iceConnectionState !== 'connected') {
      whepRef
        .current!.view(pcref.current, url, token)
        .then(() => {
          debug('-- whep.view() done OK')
        })
        .catch((err: Error) => {
          debug('-- whep.view() done ERR / sleeping', err)
          mysleep().then(() => {
            debug('-- whep.view() done ERR, forcing render')
            forceRender()
          })
        })
    }

    return () => {
      debug('-- useWhepReceiverHook() useEffect cleanup')
      destroyPCRef(pcref)
      whepRef.current!.stop().catch(() => {
        debug('-- whep.stop() done ERR')
      })
    }
  }, [ntries]) // no-array: every render, []: once, [ntries]: when ntries changes

  return [pcref, mediaStream]
}

export function useWhipHook(
  mediaStream: MediaStream,
  url: string,
  token?: string
): PcRef {
  debug('-- useWhipHook() entry')
  
  const [ntries, setNtries] = useState<number>(0)
  //cannot call useRef in useEffect
  const pcref = useRef<PcOrNull>(null)

  //cannot call useRef in useEffect
  const whipRef = useRef<WHIPClient | null>(null)

  const forceRender = () => setNtries(ntries + 1)

  useEffect(() => {
    debug('-- useWhipHook() useEffect entry')

    if (pcref.current === null) {
      pcref.current = new RTCPeerConnection(pcConf)

      for (const track of mediaStream.getTracks()) {
        pcref.current.addTransceiver(track, { direction: 'sendonly' })
      }
    }
    if (whipRef.current === null) {
      whipRef.current = new WHIPClient()
    }

    pcref.current!.oniceconnectionstatechange = (ev) => {
      const st = (ev.target as RTCPeerConnection).iceConnectionState
      debug('-- ice state change', st)

      if (st === 'disconnected' || st === 'failed' || st === 'closed') {
        debug('-- ice state closed/etc, forcing render')
        //XXX
        // I am concerned these two state touches might cause two re - renders
        // but I hope not
        forceRender()
        //setMediaStream(null)
      }
    }

    if (pcref.current && pcref.current.iceConnectionState !== 'connected') {
      whipRef
        .current!.publish(pcref.current, url, token)
        .then(() => {
          debug('-- whip.publish done OK')
        })
        .catch((err: Error) => {
          debug('-- whip.publish done ERR / sleeping', err)
          mysleep().then(() => {
            debug('-- whip.publish done ERR, forcing render')
            forceRender()
          })
        })
    }

    return () => {
      debug('-- useWhipHook() useEffect cleanup')
      destroyPCRef(pcref)
      whipRef.current!.stop().catch(() => {
        debug('-- whip.stop() done ERR')
      })
    }
  }, [ntries]) // no-array: every render, []: once, [ntries]: when ntries changes

  return pcref
}
