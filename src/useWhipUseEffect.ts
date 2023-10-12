import { WHIPClient } from "@cameronelliott/whip-whep/whip"
import { useState, useEffect } from "react"
import { debug, pcConf, mysleep, destroyPCRef } from "./common"

export function useWhipUseEffect(
  ms: MediaStream,
  url: string,
  token?: string
): boolean {
  //
  debug('-- useWhipUseEffect() entry')

  const [counter, setCounter] = useState(0) // this is used to restart a connection
  const [conn, setConnected] = useState(false) // this is used change css styles
  const forceRender = () => setCounter(counter + 1) // convienence function

  useEffect(() => {
    debug('-- useWhipUseEffect() useEffect entry')

    const pc = new RTCPeerConnection(pcConf)

    const whip = new WHIPClient()

    for (const track of ms.getTracks()) {
      pc.addTransceiver(track, { direction: 'sendonly' })
    }

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
    debug('-- whip.publish() entry')
    whip
      .publish(pc, url, token)
      .then(() => {
        debug('-- whip.publish() done OK')
      })
      .catch((err: Error) => {
        debug('-- whip.publish() done ERR / sleeping', err)
        mysleep().then(() => {
          debug('-- whip.publish() done ERR, forcing render')
          forceRender() // two state updates, two renders? :()
          setConnected(false)
        })
      })

    // return the cleanup function to be called on component unmount
    return () => {
      debug('-- useWhipUseEffect() useEffect cleanup')
      destroyPCRef(pc)
      whip.stop().catch(() => {
        debug('-- whep.stop() done ERR')
      })
    }
  }, [counter]) // no-array: every render, []: just-a-single-time, [xxx]: when xxx changes

  return conn
}
