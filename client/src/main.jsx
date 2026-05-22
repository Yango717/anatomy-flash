import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';
import './styles/modules.css';
import './styles/content.css';
import './styles/quiz.css';
import './styles/responsive.css';
import './styles/print.css';

window._afLog?.('Boot: React module loaded', 'ok');

// Error boundary
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    window._afLog?.('REACT ERROR: ' + error.message, 'err');
    return { error };
  }
  render() {
    if (this.state.error) {
      return React.createElement('div', { style: { marginTop: '220px', padding: '20px', fontFamily: 'monospace', color: '#e74c3c' } },
        React.createElement('h2', null, '应用崩溃'),
        React.createElement('pre', null, this.state.error.message),
        React.createElement('pre', { style: { fontSize: '11px', color: '#999' } }, this.state.error.stack)
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  React.createElement(ErrorBoundary, null,
    React.createElement(React.StrictMode, null,
      React.createElement(App)
    )
  )
);
window._afLog?.('Boot: React render called', 'ok');
