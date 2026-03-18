import { Component, type ErrorInfo, type ReactNode } from 'react'

interface AppErrorBoundaryProps {
  children: ReactNode
}

interface AppErrorBoundaryState {
  hasError: boolean
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[frontend] render failed:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="app-error-boundary" role="alert">
          <div className="app-error-boundary__title">页面加载失败</div>
          <div className="app-error-boundary__text">
            应用遇到了运行时错误，请刷新页面重试。
          </div>
          <div className="app-error-boundary__text">
            The app hit a runtime error. Please refresh to retry.
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
