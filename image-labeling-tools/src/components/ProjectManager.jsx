import React, { useState, useEffect } from 'react'
import { PROJECT_CONFIG, CLIENT_CONFIG, SERVICE_CONFIG } from '../constants'
import { useLocalStorage } from '../hooks'
import { PermissionManager } from '../utils/permissions'
import DeploymentManager from './DeploymentManager'
import TaskManager from './TaskManager'
import './ProjectManager.css'

const ProjectManager = ({ onProjectSelect, onNavigate }) => {
  const [projects, setProjects] = useLocalStorage('projects', [])
  const [clients, setClients] = useLocalStorage('clients', [])
  const [activeView, setActiveView] = useState('dashboard')
  const [selectedProject, setSelectedProject] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showClientModal, setShowClientModal] = useState(false)
  const [showTaskManager, setShowTaskManager] = useState(false)
  const [taskManagerProjectId, setTaskManagerProjectId] = useState(null)

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
    requirements: '',
    package: 'basic', // 默认基础版
    services: [] // 将根据package自动设置
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

  // 编辑项目
  const handleEditProject = () => {
    if (!selectedProject.name.trim()) return

    const updatedProjects = projects.map(project =>
      project.id === selectedProject.id ? selectedProject : project
    )

    setProjects(updatedProjects)
    setShowEditModal(false)
    setSelectedProject(null)
  }

  // 创建新甲方
  const handleCreateClient = () => {
    if (!newClient.name.trim()) return

    // 根据选择的服务包设置服务权限
    const services = PermissionManager.getServicesFromPackage(newClient.package)

    const client = {
      id: Date.now().toString(),
      ...newClient,
      services, // 设置服务权限
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
      requirements: '',
      package: 'basic',
      services: []
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

  // 获取选中甲方的可用项目类型
  const getAvailableProjectTypes = () => {
    if (!newProject.clientId) {
      return []
    }
    const client = clients.find(c => c.id === newProject.clientId)
    return client ? PermissionManager.getAvailableProjectTypes(client) : []
  }

  // 检查甲方是否可以使用指定功能模块
  const canUseModule = (projectId, module) => {
    const project = projects.find(p => p.id === projectId)
    const client = project ? clients.find(c => c.id === project.clientId) : null
    return project && client ? PermissionManager.canUseModule(project, client, module) : false
  }

  // 打开任务管理器
  const openTaskManager = (projectId) => {
    setTaskManagerProjectId(projectId)
    setShowTaskManager(true)
  }

  // 关闭任务管理器
  const closeTaskManager = () => {
    setShowTaskManager(false)
    setTaskManagerProjectId(null)
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
                        {canUseModule(project.id, 'task_manager') && (
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => openTaskManager(project.id)}
                          >
                            📋 任务
                          </button>
                        )}
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
                      {canUseModule(project.id, 'task_manager') && (
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => openTaskManager(project.id)}
                        >
                          📋 任务
                        </button>
                      )}
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => {
                          setSelectedProject(project)
                          setShowEditModal(true)
                        }}
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
                      <p><strong>服务包:</strong> {PermissionManager.getPackageInfo(client.package)?.name || '未设置'}</p>
                    </div>
                    <div className="pm-client-projects">
                      <p><strong>项目数:</strong> {projects.filter(p => p.clientId === client.id).length}</p>
                      <p><strong>可用服务:</strong> {client.services?.join(', ') || '无'}</p>
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
                    disabled={!newProject.clientId}
                  >
                    {!newProject.clientId ? (
                      <option value="">请先选择甲方</option>
                    ) : (
                      <>
                        {getAvailableProjectTypes().includes(PROJECT_CONFIG.TYPES.FLUX) && (
                          <option value={PROJECT_CONFIG.TYPES.FLUX}>Flux拼接工具</option>
                        )}
                        {getAvailableProjectTypes().includes(PROJECT_CONFIG.TYPES.KONTEXT) && (
                          <option value={PROJECT_CONFIG.TYPES.KONTEXT}>Kontext标注工具</option>
                        )}
                        {getAvailableProjectTypes().includes(PROJECT_CONFIG.TYPES.TAG) && (
                          <option value={PROJECT_CONFIG.TYPES.TAG}>专业标注工具</option>
                        )}
                        {getAvailableProjectTypes().includes(PROJECT_CONFIG.TYPES.CUSTOM) && (
                          <option value={PROJECT_CONFIG.TYPES.CUSTOM}>自定义</option>
                        )}
                        {getAvailableProjectTypes().length === 0 && (
                          <option value="">该甲方暂无可用项目类型</option>
                        )}
                      </>
                    )}
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

      {/* 编辑项目模态框 */}
      {showEditModal && selectedProject && (
        <div className="pm-modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="pm-modal" onClick={e => e.stopPropagation()}>
            <div className="pm-modal-header">
              <h3>编辑项目</h3>
              <button onClick={() => setShowEditModal(false)}>✕</button>
            </div>
            <div className="pm-modal-body">
              <div className="pm-form-row">
                <div className="pm-form-group">
                  <label>项目名称</label>
                  <input
                    type="text"
                    value={selectedProject.name}
                    onChange={(e) => setSelectedProject({...selectedProject, name: e.target.value})}
                    placeholder="输入项目名称"
                  />
                </div>
                <div className="pm-form-group">
                  <label>甲方</label>
                  <select
                    value={selectedProject.clientId}
                    onChange={(e) => setSelectedProject({...selectedProject, clientId: e.target.value})}
                  >
                    <option value="">选择甲方</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>{client.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="pm-form-group">
                <label>项目描述</label>
                <textarea
                  value={selectedProject.description}
                  onChange={(e) => setSelectedProject({...selectedProject, description: e.target.value})}
                  placeholder="详细描述项目内容和目标"
                  rows="3"
                />
              </div>
              <div className="pm-form-row">
                <div className="pm-form-group">
                  <label>项目类型</label>
                  <select
                    value={selectedProject.type}
                    onChange={(e) => setSelectedProject({...selectedProject, type: e.target.value})}
                  >
                    <option value={PROJECT_CONFIG.TYPES.FLUX}>Flux</option>
                    <option value={PROJECT_CONFIG.TYPES.STABLE_DIFFUSION}>Stable Diffusion</option>
                    <option value={PROJECT_CONFIG.TYPES.MIDJOURNEY}>Midjourney</option>
                    <option value={PROJECT_CONFIG.TYPES.CUSTOM}>自定义</option>
                  </select>
                </div>
                <div className="pm-form-group">
                  <label>优先级</label>
                  <select
                    value={selectedProject.priority}
                    onChange={(e) => setSelectedProject({...selectedProject, priority: e.target.value})}
                  >
                    <option value={PROJECT_CONFIG.PRIORITIES.LOW}>低</option>
                    <option value={PROJECT_CONFIG.PRIORITIES.MEDIUM}>中</option>
                    <option value={PROJECT_CONFIG.PRIORITIES.HIGH}>高</option>
                    <option value={PROJECT_CONFIG.PRIORITIES.URGENT}>紧急</option>
                  </select>
                </div>
              </div>
              <div className="pm-form-row">
                <div className="pm-form-group">
                  <label>截止日期</label>
                  <input
                    type="date"
                    value={selectedProject.deadline}
                    onChange={(e) => setSelectedProject({...selectedProject, deadline: e.target.value})}
                  />
                </div>
                <div className="pm-form-group">
                  <label>预算</label>
                  <input
                    type="text"
                    value={selectedProject.budget}
                    onChange={(e) => setSelectedProject({...selectedProject, budget: e.target.value})}
                    placeholder="输入项目预算"
                  />
                </div>
              </div>
            </div>
            <div className="pm-modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                取消
              </button>
              <button className="btn btn-primary" onClick={handleEditProject}>
                保存修改
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
                <label>服务包</label>
                <select
                  value={newClient.package}
                  onChange={e => setNewClient({...newClient, package: e.target.value})}
                >
                  {Object.entries(SERVICE_CONFIG.PACKAGES).map(([key, pkg]) => (
                    <option key={key} value={pkg.id}>{pkg.name} - {pkg.description}</option>
                  ))}
                </select>
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

      {/* 任务管理器 */}
      {showTaskManager && taskManagerProjectId && (
        <TaskManager
          projectId={taskManagerProjectId}
          onClose={closeTaskManager}
        />
      )}
    </div>
  )
}

export default ProjectManager
