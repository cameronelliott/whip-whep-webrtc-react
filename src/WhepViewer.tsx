import { useEffect, useRef, useState } from 'react'
import { ReactNode } from 'react'
import React from 'react'
import {
  MediaStreamOrNull,
  PcOrNull,
  PcOrNullRef,
  debug,
  destroyPC,
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
  const [pcref, stream, isConnected] = useWhepUseEffect(url, token)

  debug('WhepViewer returning JSX isconn', isConnected)

  return (
    <WhepViewerContext.Provider value={{ pcref, stream, isConnected }}>
      {children}
    </WhepViewerContext.Provider>
  )
}

export const WhepViewerContext = React.createContext<{
  pcref: PcOrNullRef | null
  stream: MediaStreamOrNull
  isConnected: boolean
}>({
  pcref: null,
  stream: null,
  isConnected: false,
})
