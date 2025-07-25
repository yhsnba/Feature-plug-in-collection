import React, { useState } from 'react'
import FluxTool from './components/FluxTool'
import KontextTool from './components/KontextTool'
import TagTool from './components/TagTool'
import { NotificationContainer } from './components/Notification'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('flux')

  const tabs = [
    { id: 'flux', name: '🖼️ Flux IC-LoRA 拼接工具', component: FluxTool },
    { id: 'kontext', name: '📷 KontextLora 标注工具', component: KontextTool },
    { id: 'tag', name: '🎨 专业标注工具', component: TagTool }
  ]

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component

  return (
    <div className="app">
      <header className="app-header">
        <h1>🚀 图像标注工具集</h1>
        <p>现代化的图像处理和标注工具</p>
      </header>

      <nav className="tab-nav">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.name}
          </button>
        ))}
      </nav>

      <main className="app-main">
        {ActiveComponent && <ActiveComponent />}
      </main>

      <footer className="app-footer">
        <p>基于 React + Vite + Node.js 构建</p>
      </footer>

      <NotificationContainer />
    </div>
  )
}

export default App
