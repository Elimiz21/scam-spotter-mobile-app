import React from 'react'

type Props = {
  children: React.ReactNode
  fallback?: React.ReactNode
}

type State = { hasError: boolean; error?: any }

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error }
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('App crashed:', error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, fontFamily: 'ui-sans-serif, system-ui' }}>
          <h1 style={{ fontSize: 22, marginBottom: 8 }}>Something went wrong.</h1>
          <pre style={{
            whiteSpace: 'pre-wrap',
            background: '#f6f8fa',
            padding: 12,
            borderRadius: 8,
            maxWidth: 800,
            overflowX: 'auto'
          }}>
            {String(this.state.error ?? 'Unknown error')}
          </pre>
          <button onClick={this.handleReload} style={{ marginTop: 16, padding: '8px 12px', borderRadius: 8 }}>
            Reload
          </button>
        </div>
      )
    }
    return this.props.children as any
  }
}
