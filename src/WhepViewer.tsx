import { useEffect, useRef, useState } from 'react';
import {
  MediaStreamOrNull,
  debug,
  useWhepHook,
  WhepViewerProps,
} from './common.js';

export function WhepViewer(props: WhepViewerProps) {
  console.log('Entered WhepViewer-nonnative');

  const vidref = useRef<HTMLVideoElement>(null);

  const [pcref, mediaStream] = useWhepHook(props.url, props.token);

  useEffect(() => {
    if (vidref.current) {
      vidref.current.srcObject = mediaStream;
    }
  }, [mediaStream, vidref]);

  debug('ParentComponent returning JSX');

  if (mediaStream === null) {
    return <video autoPlay={true} muted controls />;
  } else {
    return <video autoPlay={true} muted controls ref={vidref} />;
  }
}
