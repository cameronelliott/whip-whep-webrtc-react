import { createRoot } from 'react-dom/client';
import { WhepViewer } from 'whip-whep-webrtc-react';

new EventSource('/esbuild').addEventListener('change', () => location.reload());

function App() {
  return <WhepViewer url='http://localhost:4000'></WhepViewer>;
}

import React from 'react';
// import { React as ReactFromAnotherModule } from '../../../src/common.js';

// if (React !== ReactFromAnotherModule) {
//     console.warn("Multiple React instances detected!");
// }


//ReactDOM.render(<App />, document.getElementById('root'));

const container = document.getElementById('root');
const root = createRoot(container!); // createRoot(container!) if you use TypeScript
root.render(<App />);
