import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

// Apply saved theme before first render — prevents flash of dark mode
;(function() {
  const t = localStorage.getItem('nox-theme');
  if (t === 'light') document.documentElement.setAttribute('data-theme', 'light');
})()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
