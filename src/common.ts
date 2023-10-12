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
  const seconds = 5
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

/*
this hook will run every time the call component is rendered
hooks should not be inside conditionals, so it should get called every time

our call to useEffect will run the first time through, and when the
condition array indicates it should be called again

we want the useEffect to run when:
- the first render
- the props change (url, token) (first render is a prop change)
- the ice state goes to 'disconnected' or 'failed' or 'closed'
- not when the ice state goes to 'connected'
*/

// do we want the component using this hook to dial on every render?
// dial on every render makes the logic simpler, but is it the right thing to do?
// whenever a parent renders, generally all the children render too
// so if the parent is re-rendering, the child will re-dial.
// this is probably not what we want.
// we could use React.memo() to prevent a render on each parent render.
// but that's not the right thing to do either.

//DECISION: don't use React.memo() to prevent a render on each parent render.
//DECISION: don't dial on every render, thus use useEffect() with a condition array

export function useWhepUseEffect(
  url: string,
  token?: string
): [MediaStream, RTCPeerConnection] {
  //
  debug('-- hook entry')

  const newPc = () => {
    debug('-- newPc')
    const pc = new RTCPeerConnection(pcConf)
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
        //see if we can prevent the video element from resizing to 2x2
        //effectively, disappearing
        stream.current!.getTracks().forEach((t) => t.stop())
        stream
          .current!.getTracks()
          .forEach((t) => stream.current!.removeTrack(t))
        destroyPCRef(pc)

        forceRender() // two state updates, two renders? :()
      }

      if (st === 'connected') {
        // do nothing
      }
    }
    return pc
  }
  const [pc, setPc] = useState(() => newPc()) // lazy init!
  const forceRender = () => {
    debug('-- forceRender')
    return setPc(newPc())
  }

  // this only gets created once, and is never destroyed
  // tracks get added and removed from it inside ontrack()
  const stream = useRef<MediaStreamOrNull>(null)
  if (stream.current === null) {
    debug('-- stream.current is null, creating new MediaStream')
    stream.current = new MediaStream()
  }
  debug('-- before useeffect ss=', pc.signalingState)
  useEffect(() => {
    debug('-- useEffect entry ss=', pc.signalingState)

    const whep = new WHEPClient()

    debug('-- pre whep.view()')
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
        })
      })
    debug('-- post whep.view()')

    // return the cleanup function to be called on component unmount
    return () => {
      debug('-- useEffect cleanup')
      destroyPCRef(pc)
      whep.stop().catch(() => {
        debug('-- whep.stop() done ERR')
      })
    }
  }, [pc]) // no-array: every render, []: just-a-single-time, [xxx]: when xxx changes

  return [stream.current!, pc]
}
