import { createRoot } from 'react-dom/client'

// USE THIS LINE FOR PRODUCTION
//import { WhepViewer } from 'whip-whep-webrtc-react'
// USE THIS LINE FOR DEVELOPMENT
import { WhepViewerContext, WhepViewer } from '../../../src/WhepViewer'
import React from 'react'
import { MediaStreamOrNull, debug } from '../../../src/common'

new EventSource('/esbuild').addEventListener('change', () => location.reload())

function App() {
  const videoGood = { opacity: 1, width: '100%' }
  const videoBad = { opacity: 0.5, width: '100%', border: '8px solid red' }

  return (
    <React.StrictMode>
      <WhepViewer url='http://localhost:4000'>
        <WhepViewerContext.Consumer>
          {({ isConnected, stream }) => {
            return (
              <video
                muted
                autoPlay
                controls
                ref={(vid) => {
                  vid && (vid.srcObject = stream)
                }}
                style={isConnected ? videoGood : videoBad}
              />
            )
          }}
        </WhepViewerContext.Consumer>
      </WhepViewer>
    </React.StrictMode>
  )
}

const container = document.getElementById('root')

const root = createRoot(container!) // createRoot(container!) if you use TypeScript
root.render(<App />)
