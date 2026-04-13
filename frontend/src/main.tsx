import { createRoot } from 'react-dom/client'
import './index.css'
import { LoadingProvider } from './hooks/useLoading'
import { AuthProvider } from './hooks/useAuth'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <AuthProvider>
    <LoadingProvider>
      <App />
    </LoadingProvider>
  </AuthProvider>
)
