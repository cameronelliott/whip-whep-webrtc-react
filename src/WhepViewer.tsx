import { useEffect, useRef, useState } from 'react'
import { ReactNode } from 'react'
import React from 'react'
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
  children: ReactNode
}

export const WhepViewer: React.FC<WhepViewerProps> = ({
  children,
  url,
  token,
}) => {
  //export function WhepViewer(props: WhepViewerProps) {
  debug('Entered WhepViewer')

  // stream should never be null or change instances
  const [mediaStream, pc] = useWhepUseEffect(url, token)
  const isConnected = pc.iceConnectionState === 'connected'

  debug('WhepViewer returning JSX')

  return (
    <WhepViewerContext.Provider value={{ mediaStream, isConnected }}>
      {children}
    </WhepViewerContext.Provider>
  )
}

export const WhepViewerContext = React.createContext<{
  mediaStream: MediaStreamOrNull
  isConnected: boolean
}>({
  mediaStream: null,
  isConnected: false,
})
