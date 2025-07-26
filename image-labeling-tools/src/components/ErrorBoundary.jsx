import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    })
    
    // 记录错误到控制台
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    // 这里可以添加错误报告服务
    // reportError(error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-boundary-content">
            <div className="error-icon">⚠️</div>
            <h2>出现了一些问题</h2>
            <p>应用程序遇到了意外错误，我们正在努力修复。</p>
            
            <div className="error-actions">
              <button 
                className="btn btn-primary" 
                onClick={this.handleReset}
              >
                🔄 重试
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={this.handleReload}
              >
                🔃 刷新页面
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <details className="error-details">
                <summary>错误详情 (开发模式)</summary>
                <div className="error-stack">
                  <h4>错误信息:</h4>
                  <pre>{this.state.error && this.state.error.toString()}</pre>
                  
                  <h4>组件堆栈:</h4>
                  <pre>{this.state.errorInfo.componentStack}</pre>
                </div>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
