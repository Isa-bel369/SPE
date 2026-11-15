import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { failed: false } }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    if (this.state.failed) return <main className="section"><h1>Something went wrong</h1><p>Please refresh the page and try again.</p><button className="btn" onClick={() => window.location.reload()}>Refresh</button></main>
    return this.props.children
  }
}
