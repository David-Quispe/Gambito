import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import CarritoProvider from './components/CarritoProvider.tsx'
import DeseosProvider from './components/DeseosProvider.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CarritoProvider>
      <DeseosProvider>
        <App />
      </DeseosProvider>
    </CarritoProvider>
  </StrictMode>,
)
