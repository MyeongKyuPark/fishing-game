import { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { err: null }; }
  static getDerivedStateFromError(e) { return { err: String(e) }; }
  render() {
    if (this.state.err) {
      return (
        <div style={{
          color: '#ff8888', background: '#111', padding: 32,
          fontFamily: 'monospace', fontSize: 14, whiteSpace: 'pre-wrap',
          minHeight: '100vh',
        }}>
          <b>⚠ 오류 발생</b>{'\n\n'}{this.state.err}{'\n\n'}
          <button
            style={{ padding: '8px 16px', cursor: 'pointer' }}
            onClick={() => this.setState({ err: null })}
          >새로고침</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Register Service Worker for PWA / offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {/* SW registration failed — offline unavailable */});
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
