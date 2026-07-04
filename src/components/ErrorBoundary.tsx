/**
 * src/components/ErrorBoundary.tsx
 *
 * Har major component ko isse wrap karo taaki agar wo crash ho,
 * poori website na gire — aur error agent ko report ho jaye
 * componentName ke saath.
 *
 * Usage:
 *   <ErrorBoundary componentName="HeroBanner">
 *     <HeroBanner />
 *   </ErrorBoundary>
 */

import { Component, type ErrorInfo, type ReactNode } from "react";
import { reportReactError } from "../lib/errorReporter";

interface Props {
  children: ReactNode;
  componentName: string;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    reportReactError(this.props.componentName, error, errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div style={{ padding: "1rem", color: "#999", fontSize: "0.85rem" }}>
            Kuch gadbad ho gayi is section mein. Team ko report ho gaya hai.
          </div>
        )
      );
    }
    return this.props.children;
  }
}
