import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

import { AuthProvider } from './context/AuthContext'          // <-- add this
import { LoadingProvider } from './context/LoadingContext'
import Preloader from './components/UI/Preloader'
import RouteChangeLoader from './components/UI/RouteChangeLoader'

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('#root not found')

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>                                      
        <LoadingProvider>
          <App />
          <Preloader />
          <RouteChangeLoader />
        </LoadingProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)

// (optional) remove any HTML boot preloader if present
queueMicrotask(() => {
  const el = document.getElementById('app-preloader')
  if (el) {
    el.classList.add('preloader--hide')
    setTimeout(() => el.parentNode && el.parentNode.removeChild(el), 600)
  }
})
