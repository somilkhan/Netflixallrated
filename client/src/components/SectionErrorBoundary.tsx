import { Component, ReactNode } from 'react';
import { RefreshCw, TriangleAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
  label?: string;
}

interface State {
  crashed: boolean;
}

/** Lightweight error boundary for content sections/rows.
 *  Catches errors in a single row so the rest of the page still renders. */
export default class SectionErrorBoundary extends Component<Props, State> {
  state: State = { crashed: false };

  static getDerivedStateFromError(): State {
    return { crashed: true };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error(`[SectionErrorBoundary${this.props.label ? ` ${this.props.label}` : ''}]`, error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ crashed: false });
  };

  render() {
    if (this.state.crashed) {
      return (
        <div className="py-8 px-4 md:px-6">
          <div className="flex items-center gap-3 rounded-[8px] bg-white/[0.04] border border-white/[0.06] px-4 py-3">
            <TriangleAlert size={16} className="text-amber-400/70 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white/70">
                {this.props.label ? `${this.props.label} couldn't load.` : "This section couldn't load."}
              </p>
            </div>
            <button
              type="button"
              onClick={this.handleReset}
              className="shrink-0 inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-[8px] bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <RefreshCw size={11} /> Retry
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
