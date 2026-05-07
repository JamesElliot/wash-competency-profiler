import { Component, type ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { error: Error | null };

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  handleReset = () => {
    this.setState({ error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-md w-full text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-danger-50 flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-danger-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <h1 className="text-lg font-bold text-gray-900">Something went wrong</h1>
            <p className="text-sm text-gray-500 leading-relaxed">
              An unexpected error occurred. Your progress has been saved — click below to return to the start.
            </p>
            <p className="text-xs font-mono text-gray-400 bg-gray-50 rounded p-2 text-left break-all">
              {this.state.error.message}
            </p>
            <button
              onClick={this.handleReset}
              className="bg-primary-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-primary-800 transition-colors"
            >
              Return to start
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
