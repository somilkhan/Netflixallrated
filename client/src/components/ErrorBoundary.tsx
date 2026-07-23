import { Component, ReactNode } from 'react';
import { RefreshCw, TriangleAlert } from 'lucide-react';

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
          <TriangleAlert className="mb-4 text-amber-300/80" size={36} />
          <p className="text-xl font-semibold mb-2">Something went wrong</p>
          <p className="text-white/45 text-sm mb-6 max-w-xs">
            We couldn’t load this part of Allrated. Try again or return home.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-xl bg-white text-black font-semibold hover:bg-white/90 transition-colors"
          >
            <RefreshCw size={14} /> Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
