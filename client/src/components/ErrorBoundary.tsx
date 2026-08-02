import { Component, ReactNode } from 'react';
import { RefreshCw, Home, TriangleAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
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
    // Could send to error tracking service here
  }

  handleReset = () => {
    this.setState({ crashed: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.crashed) {
      return this.props.fallback ?? <ErrorFallback onReset={this.handleReset} error={this.state.error} />;
    }
    return this.props.children;
  }
}

/** Netflix-style error fallback UI */
function ErrorFallback({ onReset, error }: { onReset: () => void; error: Error | null }) {
  const nav = useNavigate();
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center bg-black">
      <div className="mb-6 flex items-center justify-center w-16 h-16 rounded-full bg-white/[0.06]">
        <TriangleAlert className="text-amber-400/80" size={28} />
      </div>
      <h1 className="text-[22px] font-bold text-white mb-2 tracking-tight">Something went wrong</h1>
      <p className="text-white/45 text-sm mb-8 max-w-xs leading-relaxed">
        We couldn't load this part of Allrated. You can try again or go back home.
      </p>
      {error && process.env.NODE_ENV === 'development' && (
        <pre className="mb-6 max-w-lg overflow-auto rounded-[8px] bg-white/[0.04] px-4 py-3 text-left text-[11px] text-red-300/80">
          {error.message}
{error.stack}
        </pre>
      )}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-2 text-sm px-5 py-2.5 rounded-[8px] bg-white text-black font-semibold hover:bg-white/90 active:scale-[0.97] transition-all"
        >
          <RefreshCw size={14} /> Try again
        </button>
        <button
          type="button"
          onClick={() => nav('/')}
          className="inline-flex items-center gap-2 text-sm px-5 py-2.5 rounded-[8px] bg-white/10 text-white font-medium hover:bg-white/20 active:scale-[0.97] transition-all"
        >
          <Home size={14} /> Go Home
        </button>
      </div>
    </div>
  );
}
