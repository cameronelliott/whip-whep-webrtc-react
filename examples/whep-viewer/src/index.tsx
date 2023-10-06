import { createRoot } from 'react-dom/client'

// USE THIS LINE FOR PRODUCTION
//import { WhepViewer } from 'whip-whep-webrtc-react'
// USE THIS LINE FOR DEVELOPMENT
import { WhepViewer } from '../../../src/WhepViewer'
import React from 'react'

new EventSource('/esbuild').addEventListener('change', () => location.reload())

function App() {
  return (
    <React.StrictMode>
      <WhepViewer url='http://localhost:4000'></WhepViewer>
    </React.StrictMode>
  )
}

const container = document.getElementById('root')
const root = createRoot(container!) // createRoot(container!) if you use TypeScript
root.render(<App />)
