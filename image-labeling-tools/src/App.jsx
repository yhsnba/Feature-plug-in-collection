import React, { useState, useEffect, Suspense } from 'react'
import FluxTool from './components/FluxTool'
import KontextTool from './components/KontextTool'
import TagTool from './components/TagTool'
import ErrorBoundary from './components/ErrorBoundary'
import Loading from './components/Loading'
import { NotificationContainer } from './components/Notification'
import { TOOL_CONFIG, SERVICE_CONFIG } from './constants'
import { useLocalStorage, useKeyboard } from './hooks'
import { waitForServer, startHealthMonitoring } from './utils/healthCheck'
import { PermissionManager } from './utils/permissions'
import './App.css'

function App({ project, onBackToManager }) {
  const [activeTab, setActiveTab] = useLocalStorage('activeTab', 'flux')
  const [isLoading, setIsLoading] = useState(true)
  const [serverStatus, setServerStatus] = useState('checking')
  const [clients] = useLocalStorage('clients', [])

  // 获取项目对应的甲方信息
  const getProjectClient = () => {
    if (!project || !project.clientId) return null
    return clients.find(client => client.id === project.clientId)
  }

  // 定义所有可用的工具标签
  const allTabs = [
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

  // 根据权限过滤可用的工具
  const getAvailableTabs = () => {
    const client = getProjectClient()

    // 如果没有项目信息或甲方信息，返回所有工具（保持原有行为）
    if (!project || !client) {
      return allTabs
    }

    // 如果甲方没有services字段或services为空，返回所有工具（保持原有行为）
    if (!client.services || !Array.isArray(client.services) || client.services.length === 0) {
      return allTabs
    }

    // 根据甲方权限过滤工具
    const serviceMap = {
      'flux': SERVICE_CONFIG.SERVICES.FLUX,
      'kontext': SERVICE_CONFIG.SERVICES.KONTEXT,
      'tag': SERVICE_CONFIG.SERVICES.TAG
    }

    const filteredTabs = allTabs.filter(tab => {
      const requiredService = serviceMap[tab.id]
      return requiredService && client.services.includes(requiredService)
    })

    // 如果过滤后没有任何工具，返回所有工具（防止完全无法使用）
    return filteredTabs.length > 0 ? filteredTabs : allTabs
  }

  const tabs = getAvailableTabs()

  // 安全的标签切换函数
  const safeSetActiveTab = (tabId) => {
    const availableTabIds = tabs.map(tab => tab.id)
    if (availableTabIds.includes(tabId)) {
      setActiveTab(tabId)
    }
  }

  // 键盘快捷键
  useKeyboard({
    '1': () => safeSetActiveTab('flux'),
    '2': () => safeSetActiveTab('kontext'),
    '3': () => safeSetActiveTab('tag'),
    'ctrl+1': () => safeSetActiveTab('flux'),
    'ctrl+2': () => safeSetActiveTab('kontext'),
    'ctrl+3': () => safeSetActiveTab('tag')
  })

  // 确保当前激活的标签是有权限的
  useEffect(() => {
    const availableTabIds = tabs.map(tab => tab.id)
    if (availableTabIds.length > 0 && !availableTabIds.includes(activeTab)) {
      // 如果当前标签没有权限，切换到第一个可用的标签
      setActiveTab(availableTabIds[0])
    }
  }, [tabs, activeTab])

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
  const client = getProjectClient()

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

  // 如果没有可用的工具且确实是权限问题，显示权限提示
  if (!isLoading && serverStatus === 'connected' && tabs.length === 0 && project && client && client.services && Array.isArray(client.services) && client.services.length === 0) {
    return (
      <ErrorBoundary>
        <div className="app">
          <header className="app-header">
            <div className="app-header-top">
              {onBackToManager && (
                <button
                  className="btn btn-secondary back-btn"
                  onClick={onBackToManager}
                  title="返回项目管理"
                >
                  ← 返回项目管理
                </button>
              )}
              <div className="app-header-content">
                <h1>🚀 图像标注工具集</h1>
                {project && (
                  <div className="project-info">
                    <span className="project-name">项目: {project.name}</span>
                    {project.description && (
                      <span className="project-description">{project.description}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </header>

          <main className="app-main">
            <div className="permission-error">
              <div className="error-content">
                <div className="error-icon">🔒</div>
                <h2>权限不足</h2>
                <p>该项目的甲方没有使用任何工具的权限。</p>
                {client && (
                  <div className="client-info">
                    <p><strong>甲方:</strong> {client.name}</p>
                    <p><strong>服务包:</strong> {PermissionManager.getPackageInfo(client.package)?.name || '未设置'}</p>
                    <p><strong>可用服务:</strong> {client.services?.join(', ') || '无'}</p>
                  </div>
                )}
                <div className="error-actions">
                  <button
                    className="btn btn-primary"
                    onClick={onBackToManager}
                  >
                    ← 返回项目管理
                  </button>
                </div>
              </div>
            </div>
          </main>

          <footer className="app-footer">
            <p>基于 React + Vite + Node.js 构建</p>
          </footer>
        </div>
      </ErrorBoundary>
    )
  }

  return (
    <ErrorBoundary>
      <div className="app">
        <header className="app-header">
          <div className="app-header-top">
            {onBackToManager && (
              <button
                className="btn btn-secondary back-btn"
                onClick={onBackToManager}
                title="返回项目管理"
              >
                ← 返回项目管理
              </button>
            )}
            <div className="app-header-content">
              <h1>🚀 图像标注工具集</h1>
              {project && (
                <div className="project-info">
                  <span className="project-name">项目: {project.name}</span>
                  {project.description && (
                    <span className="project-description">{project.description}</span>
                  )}
                </div>
              )}
              <p>现代化的图像处理和标注工具</p>
            </div>
          </div>
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
