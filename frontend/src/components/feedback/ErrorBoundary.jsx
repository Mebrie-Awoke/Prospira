import { Component } from 'react'
import './error-boundary.css'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    // Keep diagnostic details in the browser console, never in the customer UI.
    console.error('Prospira interface error:', error, info)
  }

  handleRetry = () => {
    this.setState({ hasError: false })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="app-error-screen" role="alert">
          <div className="app-error-card">
            <span className="app-error-icon"><AlertTriangle size={22} /></span>
            <h1>Something went wrong</h1>
            <p>We couldn't display this page. Please try again.</p>
            <button type="button" className="button button-primary" onClick={this.handleRetry}>
              <RefreshCw size={15} /> Reload page
            </button>
          </div>
        </main>
      )
    }
    return this.props.children
  }
}
