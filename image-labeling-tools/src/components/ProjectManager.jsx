import React, { useState, useEffect } from 'react'
import { PROJECT_CONFIG, CLIENT_CONFIG } from '../constants'
import { useLocalStorage } from '../hooks'
import DeploymentManager from './DeploymentManager'
import './ProjectManager.css'

const ProjectManager = ({ onProjectSelect, onNavigate }) => {
  const [projects, setProjects] = useLocalStorage('projects', [])
  const [clients, setClients] = useLocalStorage('clients', [])
  const [activeView, setActiveView] = useState('dashboard')
  const [selectedProject, setSelectedProject] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showClientModal, setShowClientModal] = useState(false)

  // 创建新项目的表单数据
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    clientId: '',
    type: PROJECT_CONFIG.TYPES.FLUX,
    priority: PROJECT_CONFIG.PRIORITIES.MEDIUM,
    tools: ['flux'],
    customConfig: {},
    deadline: '',
    budget: ''
  })

  // 创建新甲方的表单数据
  const [newClient, setNewClient] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    type: CLIENT_CONFIG.TYPES.ENTERPRISE,
    industry: CLIENT_CONFIG.INDUSTRIES.AI_ML,
    description: '',
    requirements: ''
  })

  // 获取项目统计信息
  const getProjectStats = () => {
    const total = projects.length
    const active = projects.filter(p => p.status === PROJECT_CONFIG.STATUS.ACTIVE).length
    const completed = projects.filter(p => p.status === PROJECT_CONFIG.STATUS.COMPLETED).length
    const clients_count = clients.length

    return { total, active, completed, clients_count }
  }

  // 创建新项目
  const handleCreateProject = () => {
    if (!newProject.name.trim()) return

    const project = {
      id: Date.now().toString(),
      ...newProject,
      status: PROJECT_CONFIG.STATUS.ACTIVE,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    setProjects([...projects, project])
    setNewProject({
      name: '',
      description: '',
      clientId: '',
      type: PROJECT_CONFIG.TYPES.FLUX,
      priority: PROJECT_CONFIG.PRIORITIES.MEDIUM,
      tools: ['flux'],
      customConfig: {},
      deadline: '',
      budget: ''
    })
    setShowCreateModal(false)
  }

  // 创建新甲方
  const handleCreateClient = () => {
    if (!newClient.name.trim()) return

    const client = {
      id: Date.now().toString(),
      ...newClient,
      status: CLIENT_CONFIG.STATUS.ACTIVE,
      createdAt: new Date().toISOString(),
      projects: []
    }

    setClients([...clients, client])
    setNewClient({
      name: '',
      company: '',
      email: '',
      phone: '',
      type: CLIENT_CONFIG.TYPES.ENTERPRISE,
      industry: CLIENT_CONFIG.INDUSTRIES.AI_ML,
      description: '',
      requirements: ''
    })
    setShowClientModal(false)
  }

  // 删除项目
  const handleDeleteProject = (projectId) => {
    if (window.confirm('确定要删除这个项目吗？')) {
      setProjects(projects.filter(p => p.id !== projectId))
    }
  }

  // 获取甲方名称
  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId)
    return client ? client.name : '未指定甲方'
  }

  // 获取状态颜色
  const getStatusColor = (status) => {
    switch (status) {
      case PROJECT_CONFIG.STATUS.ACTIVE: return '#28a745'
      case PROJECT_CONFIG.STATUS.COMPLETED: return '#007bff'
      case PROJECT_CONFIG.STATUS.INACTIVE: return '#6c757d'
      case PROJECT_CONFIG.STATUS.ARCHIVED: return '#dc3545'
      default: return '#6c757d'
    }
  }

  // 获取优先级颜色
  const getPriorityColor = (priority) => {
    switch (priority) {
      case PROJECT_CONFIG.PRIORITIES.URGENT: return '#dc3545'
      case PROJECT_CONFIG.PRIORITIES.HIGH: return '#fd7e14'
      case PROJECT_CONFIG.PRIORITIES.MEDIUM: return '#ffc107'
      case PROJECT_CONFIG.PRIORITIES.LOW: return '#28a745'
      default: return '#6c757d'
    }
  }

  const stats = getProjectStats()

  return (
    <div className="project-manager">
      {/* 顶部导航 */}
      <header className="pm-header">
        <div className="pm-header-content">
          <h1>🚀 项目管理中心</h1>
          <p>管理图像标注工具项目和甲方信息</p>
        </div>
        <div className="pm-header-actions">
          <button 
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            ➕ 新建项目
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => setShowClientModal(true)}
          >
            👥 添加甲方
          </button>
        </div>
      </header>

      {/* 侧边导航 */}
      <div className="pm-layout">
        <nav className="pm-sidebar">
          <div className="pm-nav-item" onClick={() => setActiveView('dashboard')}>
            <span className={activeView === 'dashboard' ? 'active' : ''}>
              📊 仪表盘
            </span>
          </div>
          <div className="pm-nav-item" onClick={() => setActiveView('projects')}>
            <span className={activeView === 'projects' ? 'active' : ''}>
              📁 项目管理
            </span>
          </div>
          <div className="pm-nav-item" onClick={() => setActiveView('clients')}>
            <span className={activeView === 'clients' ? 'active' : ''}>
              👥 甲方管理
            </span>
          </div>
          <div className="pm-nav-item" onClick={() => setActiveView('deployments')}>
            <span className={activeView === 'deployments' ? 'active' : ''}>
              🚀 部署管理
            </span>
          </div>
        </nav>

        {/* 主内容区 */}
        <main className="pm-main">
          {activeView === 'dashboard' && (
            <div className="pm-dashboard">
              <div className="pm-stats">
                <div className="pm-stat-card">
                  <div className="pm-stat-icon">📁</div>
                  <div className="pm-stat-info">
                    <h3>{stats.total}</h3>
                    <p>总项目数</p>
                  </div>
                </div>
                <div className="pm-stat-card">
                  <div className="pm-stat-icon">⚡</div>
                  <div className="pm-stat-info">
                    <h3>{stats.active}</h3>
                    <p>活跃项目</p>
                  </div>
                </div>
                <div className="pm-stat-card">
                  <div className="pm-stat-icon">✅</div>
                  <div className="pm-stat-info">
                    <h3>{stats.completed}</h3>
                    <p>已完成</p>
                  </div>
                </div>
                <div className="pm-stat-card">
                  <div className="pm-stat-icon">👥</div>
                  <div className="pm-stat-info">
                    <h3>{stats.clients_count}</h3>
                    <p>甲方数量</p>
                  </div>
                </div>
              </div>

              <div className="pm-recent-projects">
                <h2>最近项目</h2>
                <div className="pm-project-grid">
                  {projects.slice(0, 6).map(project => (
                    <div key={project.id} className="pm-project-card">
                      <div className="pm-project-header">
                        <h3>{project.name}</h3>
                        <span 
                          className="pm-status-badge"
                          style={{ backgroundColor: getStatusColor(project.status) }}
                        >
                          {project.status}
                        </span>
                      </div>
                      <p>{project.description}</p>
                      <div className="pm-project-meta">
                        <span>甲方: {getClientName(project.clientId)}</span>
                        <span 
                          className="pm-priority-badge"
                          style={{ backgroundColor: getPriorityColor(project.priority) }}
                        >
                          {project.priority}
                        </span>
                      </div>
                      <div className="pm-project-actions">
                        <button 
                          className="btn btn-sm btn-primary"
                          onClick={() => onProjectSelect(project)}
                        >
                          打开项目
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeView === 'projects' && (
            <div className="pm-projects">
              <div className="pm-section-header">
                <h2>项目管理</h2>
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowCreateModal(true)}
                >
                  ➕ 新建项目
                </button>
              </div>
              
              <div className="pm-projects-list">
                {projects.map(project => (
                  <div key={project.id} className="pm-project-item">
                    <div className="pm-project-info">
                      <h3>{project.name}</h3>
                      <p>{project.description}</p>
                      <div className="pm-project-details">
                        <span>甲方: {getClientName(project.clientId)}</span>
                        <span>类型: {project.type}</span>
                        <span>创建时间: {new Date(project.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="pm-project-status">
                      <span 
                        className="pm-status-badge"
                        style={{ backgroundColor: getStatusColor(project.status) }}
                      >
                        {project.status}
                      </span>
                      <span 
                        className="pm-priority-badge"
                        style={{ backgroundColor: getPriorityColor(project.priority) }}
                      >
                        {project.priority}
                      </span>
                    </div>
                    <div className="pm-project-actions">
                      <button 
                        className="btn btn-sm btn-primary"
                        onClick={() => onProjectSelect(project)}
                      >
                        打开
                      </button>
                      <button 
                        className="btn btn-sm btn-secondary"
                        onClick={() => setSelectedProject(project)}
                      >
                        编辑
                      </button>
                      <button 
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDeleteProject(project.id)}
                      >
                        删除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeView === 'clients' && (
            <div className="pm-clients">
              <div className="pm-section-header">
                <h2>甲方管理</h2>
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowClientModal(true)}
                >
                  👥 添加甲方
                </button>
              </div>
              
              <div className="pm-clients-grid">
                {clients.map(client => (
                  <div key={client.id} className="pm-client-card">
                    <div className="pm-client-header">
                      <h3>{client.name}</h3>
                      <span className="pm-client-type">{client.type}</span>
                    </div>
                    <div className="pm-client-info">
                      <p><strong>公司:</strong> {client.company}</p>
                      <p><strong>邮箱:</strong> {client.email}</p>
                      <p><strong>电话:</strong> {client.phone}</p>
                      <p><strong>行业:</strong> {client.industry}</p>
                    </div>
                    <div className="pm-client-projects">
                      <p><strong>项目数:</strong> {projects.filter(p => p.clientId === client.id).length}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeView === 'deployments' && (
            <DeploymentManager
              projects={projects}
              clients={clients}
            />
          )}
        </main>
      </div>

      {/* 创建项目模态框 */}
      {showCreateModal && (
        <div className="pm-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="pm-modal" onClick={e => e.stopPropagation()}>
            <div className="pm-modal-header">
              <h3>创建新项目</h3>
              <button onClick={() => setShowCreateModal(false)}>✕</button>
            </div>
            <div className="pm-modal-body">
              <div className="pm-form-group">
                <label>项目名称</label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={e => setNewProject({...newProject, name: e.target.value})}
                  placeholder="输入项目名称"
                />
              </div>
              <div className="pm-form-group">
                <label>项目描述</label>
                <textarea
                  value={newProject.description}
                  onChange={e => setNewProject({...newProject, description: e.target.value})}
                  placeholder="输入项目描述"
                />
              </div>
              <div className="pm-form-row">
                <div className="pm-form-group">
                  <label>甲方</label>
                  <select
                    value={newProject.clientId}
                    onChange={e => setNewProject({...newProject, clientId: e.target.value})}
                  >
                    <option value="">选择甲方</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>{client.name}</option>
                    ))}
                  </select>
                </div>
                <div className="pm-form-group">
                  <label>项目类型</label>
                  <select
                    value={newProject.type}
                    onChange={e => setNewProject({...newProject, type: e.target.value})}
                  >
                    <option value={PROJECT_CONFIG.TYPES.FLUX}>Flux拼接工具</option>
                    <option value={PROJECT_CONFIG.TYPES.KONTEXT}>Kontext标注工具</option>
                    <option value={PROJECT_CONFIG.TYPES.TAG}>专业标注工具</option>
                    <option value={PROJECT_CONFIG.TYPES.CUSTOM}>自定义</option>
                  </select>
                </div>
              </div>
              <div className="pm-form-row">
                <div className="pm-form-group">
                  <label>优先级</label>
                  <select
                    value={newProject.priority}
                    onChange={e => setNewProject({...newProject, priority: e.target.value})}
                  >
                    <option value={PROJECT_CONFIG.PRIORITIES.LOW}>低</option>
                    <option value={PROJECT_CONFIG.PRIORITIES.MEDIUM}>中</option>
                    <option value={PROJECT_CONFIG.PRIORITIES.HIGH}>高</option>
                    <option value={PROJECT_CONFIG.PRIORITIES.URGENT}>紧急</option>
                  </select>
                </div>
                <div className="pm-form-group">
                  <label>截止日期</label>
                  <input
                    type="date"
                    value={newProject.deadline}
                    onChange={e => setNewProject({...newProject, deadline: e.target.value})}
                  />
                </div>
              </div>
            </div>
            <div className="pm-modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                取消
              </button>
              <button className="btn btn-primary" onClick={handleCreateProject}>
                创建项目
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 创建甲方模态框 */}
      {showClientModal && (
        <div className="pm-modal-overlay" onClick={() => setShowClientModal(false)}>
          <div className="pm-modal" onClick={e => e.stopPropagation()}>
            <div className="pm-modal-header">
              <h3>添加甲方</h3>
              <button onClick={() => setShowClientModal(false)}>✕</button>
            </div>
            <div className="pm-modal-body">
              <div className="pm-form-row">
                <div className="pm-form-group">
                  <label>联系人姓名</label>
                  <input
                    type="text"
                    value={newClient.name}
                    onChange={e => setNewClient({...newClient, name: e.target.value})}
                    placeholder="输入联系人姓名"
                  />
                </div>
                <div className="pm-form-group">
                  <label>公司名称</label>
                  <input
                    type="text"
                    value={newClient.company}
                    onChange={e => setNewClient({...newClient, company: e.target.value})}
                    placeholder="输入公司名称"
                  />
                </div>
              </div>
              <div className="pm-form-row">
                <div className="pm-form-group">
                  <label>邮箱</label>
                  <input
                    type="email"
                    value={newClient.email}
                    onChange={e => setNewClient({...newClient, email: e.target.value})}
                    placeholder="输入邮箱地址"
                  />
                </div>
                <div className="pm-form-group">
                  <label>电话</label>
                  <input
                    type="tel"
                    value={newClient.phone}
                    onChange={e => setNewClient({...newClient, phone: e.target.value})}
                    placeholder="输入电话号码"
                  />
                </div>
              </div>
              <div className="pm-form-row">
                <div className="pm-form-group">
                  <label>客户类型</label>
                  <select
                    value={newClient.type}
                    onChange={e => setNewClient({...newClient, type: e.target.value})}
                  >
                    <option value={CLIENT_CONFIG.TYPES.ENTERPRISE}>企业客户</option>
                    <option value={CLIENT_CONFIG.TYPES.STARTUP}>初创公司</option>
                    <option value={CLIENT_CONFIG.TYPES.INDIVIDUAL}>个人客户</option>
                    <option value={CLIENT_CONFIG.TYPES.GOVERNMENT}>政府机构</option>
                  </select>
                </div>
                <div className="pm-form-group">
                  <label>所属行业</label>
                  <select
                    value={newClient.industry}
                    onChange={e => setNewClient({...newClient, industry: e.target.value})}
                  >
                    <option value={CLIENT_CONFIG.INDUSTRIES.AI_ML}>AI/机器学习</option>
                    <option value={CLIENT_CONFIG.INDUSTRIES.ECOMMERCE}>电商</option>
                    <option value={CLIENT_CONFIG.INDUSTRIES.HEALTHCARE}>医疗健康</option>
                    <option value={CLIENT_CONFIG.INDUSTRIES.EDUCATION}>教育</option>
                    <option value={CLIENT_CONFIG.INDUSTRIES.FINANCE}>金融</option>
                    <option value={CLIENT_CONFIG.INDUSTRIES.MANUFACTURING}>制造业</option>
                    <option value={CLIENT_CONFIG.INDUSTRIES.OTHER}>其他</option>
                  </select>
                </div>
              </div>
              <div className="pm-form-group">
                <label>需求描述</label>
                <textarea
                  value={newClient.requirements}
                  onChange={e => setNewClient({...newClient, requirements: e.target.value})}
                  placeholder="描述客户的具体需求"
                />
              </div>
            </div>
            <div className="pm-modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowClientModal(false)}>
                取消
              </button>
              <button className="btn btn-primary" onClick={handleCreateClient}>
                添加甲方
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProjectManager
