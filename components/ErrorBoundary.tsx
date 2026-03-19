'use client'
import { Component, ReactNode } from 'react'

interface Props { children: ReactNode; fallback?: ReactNode }
interface State { hasError: boolean; error?: Error }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
          <div className="text-center max-w-md">
            <h2 className="text-xl font-bold text-gray-800 mb-2">發生錯誤</h2>
            <p className="text-gray-500 mb-4 text-sm">
              很抱歉，頁面發生問題。請重新整理頁面或返回首頁。
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => window.location.reload()}
                className="bg-slate-600 text-white px-4 py-2 rounded-lg text-sm">
                重新整理
              </button>
              <a href="/" className="border border-slate-300 text-slate-600 px-4 py-2 rounded-lg text-sm">
                返回首頁
              </a>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
