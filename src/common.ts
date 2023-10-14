import React, { useCallback } from 'react'
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

export function destroyPC(pc: RTCPeerConnection) {
  debug('-- destroyPCRef')

  pc.getTransceivers().forEach((x) => {
    try {
      x.stop()
    } catch (err) {}
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

// Re-renders:
// We want a re-render whenever my version of the connection state changes,
// as that will get passed to children, and they will re-render.
// this is mostly important for showing the state of video elements.
// connection metrics will get their own wrapper with their own callbacks,
// so the element hosting this hook need not worry about them.

//hasFailed: boolean may get set twice, this is why i dont use counter: number
// it can get set by the transition from say iceconn/new -> iceconn/disconnected
// but it can ALSO get set by the throw inside the whep.view() promise
export type PcOrNullRef = React.MutableRefObject<PcOrNull>

export function useWhepUseEffect(
  url: string,
  token?: string
): [PcOrNullRef, MediaStream, boolean] {
  //
  debug('-- hook entry')

  //#region newpcfn def
  const newPcFn = () => {
    debug('-- newPc')
    const pc = new RTCPeerConnection(pcConf)
    pc.ontrack = (ev) => {
      debug('-- ontrack entry kind: ', ev.track.kind)
      if (ev.streams[0]) {
        // delete the existing tracks
        stream.getTracks().forEach((t) => stream.removeTrack(t))

        debug('-- ontrack got stream')
        for (const tr of ev.streams[0].getTracks()) {
          debug('-- ontrack receiver kind: ', tr.kind)
          stream.addTrack(tr)
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
        stream.getTracks().forEach((t) => t.stop())
        stream.getTracks().forEach((t) => stream.removeTrack(t))
        destroyPC(pc)

        // we don't sleep here
        forceRender()
        setIsConnected(false)
      }

      if (st === 'connected') {
        setIsConnected(true)
      }
    }
    return pc
  }
  //#endregion

  // since we want to return a PC, AND how React.StrictMode works, (useEffect() runs twice)
  // we MUST use a REF to hold the PC, and not a useState() hook
  const pcref = useRef<PcOrNull>(null) //hook 1
  // dont initializer here, just in the effect

  const [stream] = useState(() => new MediaStream()) // lazy init!, do not use setter!
  const [isConnected, setIsConnected] = useState(false) //hook 2
  const [counter, setCounter] = useState(0) //hook 3
  const forceRender = () => setCounter(counter + 1)

  // we want the useeffect to run when:
  // 1st time through
  // and on transition from connected -> disconnected

  //#region dialwhep def
  const dialWhep = useCallback(() => {
    const whep = new WHEPClient()

    debug('-- pre whep.view()')
    whep
      .view(pcref.current!, url, token)
      .then(() => {
        debug('-- whep.view() done OK')
      })
      .catch((err: Error) => {
        debug('-- whep.view() done ERR / sleeping', err)
        mysleep().then(() => {
          debug('-- whep.view() done ERR, forcing render')
          forceRender()
          setIsConnected(false)
        })
      })
    debug('-- post whep.view()')
    return whep
  }, [url, token]) // only re-create the callback if url or token changes
  //#endregion

  debug('-- useeffect before')
  useEffect(() => {
    debug('-- useeffect inside')

    pcref.current = newPcFn()

    const whep = dialWhep()

    // return the cleanup function to be called on component unmount
    return () => {
      debug('-- useeffect cleanup')
      destroyPC(pcref.current!)
      pcref.current = null
      whep.stop().catch(() => {
        debug('-- whep.stop() error')
      })
    }
  }, [counter]) // no-array: every render, []: just-a-single-time, [xxx]: when xxx changes

  debug('-- hook exit with status: ', isConnected)
  return [pcref, stream, isConnected]
}
