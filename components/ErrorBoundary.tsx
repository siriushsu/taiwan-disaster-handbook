"use client";
import { Component, ReactNode } from "react";
import Link from "next/link";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  label?: string;
}
interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    // Log to console so errors remain visible during development/monitoring
    console.error(
      `[ErrorBoundary${this.props.label ? ":" + this.props.label : ""}] Caught error:`,
      error,
      info.componentStack,
    );
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="min-h-screen flex items-center justify-center bg-surface p-6">
            <div className="text-center max-w-md">
              <h2 className="text-xl font-bold text-text mb-2">發生錯誤</h2>
              <p className="text-text-muted mb-4 text-sm">
                很抱歉，頁面發生問題。請重新整理頁面或返回首頁。
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => window.location.reload()}
                  className="bg-primary text-white px-4 py-2 rounded-lg text-sm"
                >
                  重新整理
                </button>
                <Link
                  href="/"
                  className="border border-border text-primary px-4 py-2 rounded-lg text-sm"
                >
                  返回首頁
                </Link>
              </div>
            </div>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
