import { Buffer } from 'buffer'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

globalThis.Buffer = Buffer

createRoot(document.getElementById('root')).render(<App />)
