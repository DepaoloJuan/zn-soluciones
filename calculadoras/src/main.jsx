import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { NeonAuthUIProvider } from '@neondatabase/neon-js/auth/react'
import { authClient } from './lib/auth'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <NeonAuthUIProvider authClient={authClient}>
      <App />
    </NeonAuthUIProvider>
  </StrictMode>,
)
