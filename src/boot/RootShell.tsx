import React, { Suspense } from 'react'
import ErrorBoundary from '../components/ErrorBoundary'

const App = React.lazy(() => import('../App'))

export default function RootShell() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<div style={{ padding: 24 }}>Loading…</div>}>
        <App />
      </Suspense>
    </ErrorBoundary>
  )
}
