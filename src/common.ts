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
