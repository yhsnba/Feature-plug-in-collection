import React, { useState, useEffect, Suspense } from 'react'
import FluxTool from './components/FluxTool'
import KontextTool from './components/KontextTool'
import TagTool from './components/TagTool'
import ErrorBoundary from './components/ErrorBoundary'
import Loading from './components/Loading'
import { NotificationContainer } from './components/Notification'
import { TOOL_CONFIG } from './constants'
import { useLocalStorage, useKeyboard } from './hooks'
import { waitForServer, startHealthMonitoring } from './utils/healthCheck'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useLocalStorage('activeTab', 'flux')
  const [isLoading, setIsLoading] = useState(true)
  const [serverStatus, setServerStatus] = useState('checking')

  const tabs = [
    {
      id: 'flux',
      name: `${TOOL_CONFIG.FLUX.ICON} ${TOOL_CONFIG.FLUX.NAME}`,
      component: FluxTool,
      description: TOOL_CONFIG.FLUX.DESCRIPTION
    },
    {
      id: 'kontext',
      name: `${TOOL_CONFIG.KONTEXT.ICON} ${TOOL_CONFIG.KONTEXT.NAME}`,
      component: KontextTool,
      description: TOOL_CONFIG.KONTEXT.DESCRIPTION
    },
    {
      id: 'tag',
      name: `${TOOL_CONFIG.TAG.ICON} ${TOOL_CONFIG.TAG.NAME}`,
      component: TagTool,
      description: TOOL_CONFIG.TAG.DESCRIPTION
    }
  ]

  // 键盘快捷键
  useKeyboard({
    '1': () => setActiveTab('flux'),
    '2': () => setActiveTab('kontext'),
    '3': () => setActiveTab('tag'),
    'ctrl+1': () => setActiveTab('flux'),
    'ctrl+2': () => setActiveTab('kontext'),
    'ctrl+3': () => setActiveTab('tag')
  })

  // 初始化加载和服务器健康检查
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setServerStatus('connecting')
        const serverReady = await waitForServer()

        if (serverReady) {
          setServerStatus('connected')
          // 启动健康监控
          const stopMonitoring = startHealthMonitoring()

          // 清理函数
          return () => stopMonitoring()
        } else {
          setServerStatus('failed')
        }
      } catch (error) {
        console.error('App initialization failed:', error)
        setServerStatus('failed')
      } finally {
        setIsLoading(false)
      }
    }

    initializeApp()
  }, [])

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component
  const activeTabInfo = tabs.find(tab => tab.id === activeTab)

  if (isLoading) {
    const loadingText = serverStatus === 'checking' ? '正在检查服务器状态...' :
                       serverStatus === 'connecting' ? '正在连接服务器...' :
                       '正在加载图像标注工具集...'

    return (
      <div className="app">
        <Loading
          size="large"
          text={loadingText}
          overlay={true}
        />
      </div>
    )
  }

  if (serverStatus === 'failed') {
    return (
      <div className="app">
        <div className="server-error">
          <div className="error-content">
            <div className="error-icon">🔌</div>
            <h2>服务器连接失败</h2>
            <p>无法连接到后端服务器，请确保服务器正在运行。</p>
            <div className="error-actions">
              <button
                className="btn btn-primary"
                onClick={() => window.location.reload()}
              >
                🔄 重新连接
              </button>
            </div>
            <div className="error-help">
              <h4>解决方案：</h4>
              <ul>
                <li>确保运行了 <code>npm start</code></li>
                <li>检查端口3004是否被占用</li>
                <li>查看控制台错误信息</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className="app">
        <header className="app-header">
          <h1>🚀 图像标注工具集</h1>
          <p>现代化的图像处理和标注工具</p>
          {activeTabInfo && (
            <div className="active-tool-info">
              <span className="tool-description">{activeTabInfo.description}</span>
            </div>
          )}
        </header>

        <nav className="tab-nav">
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              title={`${tab.description} (快捷键: ${index + 1})`}
            >
              {tab.name}
            </button>
          ))}
        </nav>

        <main className="app-main">
          <Suspense fallback={<Loading text="正在加载工具..." />}>
            {ActiveComponent && <ActiveComponent />}
          </Suspense>
        </main>

        <footer className="app-footer">
          <p>基于 React + Vite + Node.js 构建 | 快捷键: 1-3 或 Ctrl+1-3 切换工具</p>
        </footer>

        <NotificationContainer />
      </div>
    </ErrorBoundary>
  )
}

export default App
