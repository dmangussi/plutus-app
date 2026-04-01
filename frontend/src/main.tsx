import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { LoadingProvider } from './hooks/useLoading'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LoadingProvider>
      <App />
    </LoadingProvider>
  </StrictMode>
)
