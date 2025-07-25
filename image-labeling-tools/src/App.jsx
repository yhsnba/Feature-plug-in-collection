import React, { useState, useEffect, Suspense } from 'react'
import FluxTool from './components/FluxTool'
import KontextTool from './components/KontextTool'
import TagTool from './components/TagTool'
import ErrorBoundary from './components/ErrorBoundary'
import Loading from './components/Loading'
import { NotificationContainer } from './components/Notification'
import { TOOL_CONFIG } from './constants'
import { useLocalStorage, useKeyboard } from './hooks'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useLocalStorage('activeTab', 'flux')
  const [isLoading, setIsLoading] = useState(true)

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

  // 初始化加载
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component
  const activeTabInfo = tabs.find(tab => tab.id === activeTab)

  if (isLoading) {
    return (
      <div className="app">
        <Loading
          size="large"
          text="正在加载图像标注工具集..."
          overlay={true}
        />
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
