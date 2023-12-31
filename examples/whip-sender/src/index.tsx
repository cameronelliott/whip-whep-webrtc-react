import { createRoot } from 'react-dom/client'

// USE THIS LINE FOR PRODUCTION
//import { WhepViewer } from 'whip-whep-webrtc-react'
// USE THIS LINE FOR DEVELOPMENT
import { WhipSender } from '../../../src/WhipSender'
import { useEffect, useRef, useState } from 'react'

new EventSource('/esbuild').addEventListener('change', () => location.reload())

const container = document.getElementById('root')
const root = createRoot(container!) // createRoot(container!) if you use TypeScript
root.render(<App />)

function App() {
  return <Foo />
}

function Foo() {
  const [stream, setStream] = useState<MediaStream | null>(null)

  if (stream === null) {
    navigator.mediaDevices
      .getUserMedia({
        audio: true,
        video: true,
      })
      .then((str) => {
        console.log('got microphone and camera')
        setStream(str)
      })
      .catch((err) => {
        console.log('error getting microphone and camera', err)
      })
  }

  return (
    <WhipSender
      mediaStream={stream!}
      url='http://localhost:8080/whip'
    ></WhipSender>
  )
}
