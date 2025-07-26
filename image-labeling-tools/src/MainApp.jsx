import React, { useState } from 'react'
import ProjectManager from './components/ProjectManager'
import App from './App'
import { useLocalStorage } from './hooks'

const MainApp = () => {
  const [currentView, setCurrentView] = useState('project-manager')
  const [selectedProject, setSelectedProject] = useState(null)
  const [projects] = useLocalStorage('projects', [])

  // 处理项目选择
  const handleProjectSelect = (project) => {
    setSelectedProject(project)
    setCurrentView('project-tools')
  }

  // 返回项目管理器
  const handleBackToManager = () => {
    setSelectedProject(null)
    setCurrentView('project-manager')
  }

  // 导航到不同视图
  const handleNavigate = (view) => {
    setCurrentView(view)
  }

  return (
    <div className="main-app">
      {currentView === 'project-manager' && (
        <ProjectManager 
          onProjectSelect={handleProjectSelect}
          onNavigate={handleNavigate}
        />
      )}
      
      {currentView === 'project-tools' && selectedProject && (
        <App 
          project={selectedProject}
          onBackToManager={handleBackToManager}
        />
      )}
    </div>
  )
}

export default MainApp
