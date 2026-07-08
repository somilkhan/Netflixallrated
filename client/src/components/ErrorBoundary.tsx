import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  crashed: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { crashed: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { crashed: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('[ErrorBoundary] Caught:', error, info.componentStack);
  }

  render() {
    if (this.state.crashed) {
      return this.props.fallback ?? (
        <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center">
          <p className="text-4xl mb-4">⚠️</p>
          <p className="font-serif text-xl font-semibold mb-2">Kuch toot gaya</p>
          <p className="text-ink-faint text-sm mb-6 max-w-xs">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => this.setState({ crashed: false, error: null })}
            className="font-mono text-xs px-4 py-2 rounded-full border border-maroon text-maroon-bright hover:bg-maroon/10 transition-colors"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
