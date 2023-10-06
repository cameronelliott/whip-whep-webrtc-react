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

export function destroyPCRef(pc: RTCPeerConnection) {
  debug('-- destroyPCRef')

  pc.getTransceivers().forEach((x) => {
    x.stop()
  })
  pc.ontrack = null
  pc.oniceconnectionstatechange = null
  pc.onconnectionstatechange = null
  pc.close()
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

    pcref.current.oniceconnectionstatechange = (ev) => {
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
      if (pcref.current !== null) {
        destroyPCRef(pcref.current)
      }
      pcref.current = null
      whipRef.current!.stop().catch(() => {
        debug('-- whip.stop() done ERR')
      })
    }
  }, [ntries]) // no-array: every render, []: once, [ntries]: when ntries changes

  return pcref
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
