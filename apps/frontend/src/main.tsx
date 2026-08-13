import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import App from './App'
import './styles/globals.css'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <Toaster
          position="top-center"
          duration={6000}
          closeButton
          toastOptions={{
            style: {
              fontFamily: 'inherit',
            },
            classNames: {
              default: 'toast-base toast-default',
              success: 'toast-base toast-success',
              error: 'toast-base toast-error',
              info: 'toast-base toast-info',
              closeButton: 'toast-close-button',
            },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
)
