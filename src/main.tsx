import React from 'react'
import ReactDOM from 'react-dom/client'
import RootShell from './boot/RootShell'

// Ensure #root exists
let container = document.getElementById('root')
if (!container) {
  container = document.createElement('div')
  container.id = 'root'
  document.body.appendChild(container)
}

const root = ReactDOM.createRoot(container as HTMLElement)
root.render(
  <React.StrictMode>
    <RootShell />
  </React.StrictMode>
)

// Log mount in prod for sanity check
if (import.meta.env?.MODE !== 'development') {
  console.log('✅ App mounted')
}

// Catch any unhandled runtime errors
window.addEventListener('error', (e) => {
  console.error('Global error:', e.error || e.message || e)
})
