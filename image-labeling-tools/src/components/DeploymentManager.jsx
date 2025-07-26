import React, { useState, useEffect } from 'react'
import { DEPLOYMENT_CONFIG, PROJECT_CONFIG } from '../constants'
import { useLocalStorage } from '../hooks'
import './DeploymentManager.css'

const DeploymentManager = ({ projects, clients }) => {
  const [deployments, setDeployments] = useLocalStorage('deployments', [])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedDeployment, setSelectedDeployment] = useState(null)
  const [deploymentLogs, setDeploymentLogs] = useState({})

  const [newDeployment, setNewDeployment] = useState({
    name: '',
    projectId: '',
    environment: DEPLOYMENT_CONFIG.ENVIRONMENTS.PRODUCTION,
    platform: DEPLOYMENT_CONFIG.PLATFORMS.DOCKER,
    domain: '',
    port: '5174',
    apiPort: '3004',
    config: {
      enableSSL: false,
      customDomain: '',
      envVars: {},
      buildCommand: 'npm run build',
      startCommand: 'npm start'
    }
  })

  // 创建新部署
  const handleCreateDeployment = () => {
    if (!newDeployment.name.trim() || !newDeployment.projectId) return

    const deployment = {
      id: Date.now().toString(),
      ...newDeployment,
      status: DEPLOYMENT_CONFIG.STATUS.PENDING,
      createdAt: new Date().toISOString(),
      lastDeployedAt: null,
      deployCount: 0
    }

    setDeployments([...deployments, deployment])
    setNewDeployment({
      name: '',
      projectId: '',
      environment: DEPLOYMENT_CONFIG.ENVIRONMENTS.PRODUCTION,
      platform: DEPLOYMENT_CONFIG.PLATFORMS.DOCKER,
      domain: '',
      port: '5174',
      apiPort: '3004',
      config: {
        enableSSL: false,
        customDomain: '',
        envVars: {},
        buildCommand: 'npm run build',
        startCommand: 'npm start'
      }
    })
    setShowCreateModal(false)
  }

  // 模拟部署过程
  const handleDeploy = async (deploymentId) => {
    const deployment = deployments.find(d => d.id === deploymentId)
    if (!deployment) return

    // 更新状态为部署中
    setDeployments(prev => prev.map(d => 
      d.id === deploymentId 
        ? { ...d, status: DEPLOYMENT_CONFIG.STATUS.DEPLOYING }
        : d
    ))

    // 模拟部署日志
    const logs = [
      '🚀 开始部署...',
      '📦 构建Docker镜像...',
      '⬆️ 推送到容器仓库...',
      '🔧 配置环境变量...',
      '🌐 设置域名和SSL...',
      '✅ 部署完成！'
    ]

    setDeploymentLogs(prev => ({ ...prev, [deploymentId]: [] }))

    // 逐步显示日志
    for (let i = 0; i < logs.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      setDeploymentLogs(prev => ({
        ...prev,
        [deploymentId]: [...(prev[deploymentId] || []), logs[i]]
      }))
    }

    // 更新部署状态
    setDeployments(prev => prev.map(d => 
      d.id === deploymentId 
        ? { 
            ...d, 
            status: DEPLOYMENT_CONFIG.STATUS.SUCCESS,
            lastDeployedAt: new Date().toISOString(),
            deployCount: d.deployCount + 1
          }
        : d
    ))
  }

  // 删除部署
  const handleDeleteDeployment = (deploymentId) => {
    if (window.confirm('确定要删除这个部署配置吗？')) {
      setDeployments(deployments.filter(d => d.id !== deploymentId))
    }
  }

  // 获取项目名称
  const getProjectName = (projectId) => {
    const project = projects.find(p => p.id === projectId)
    return project ? project.name : '未知项目'
  }

  // 获取甲方名称
  const getClientName = (projectId) => {
    const project = projects.find(p => p.id === projectId)
    if (!project) return '未知甲方'
    const client = clients.find(c => c.id === project.clientId)
    return client ? client.name : '未指定甲方'
  }

  // 获取状态颜色
  const getStatusColor = (status) => {
    switch (status) {
      case DEPLOYMENT_CONFIG.STATUS.SUCCESS: return '#28a745'
      case DEPLOYMENT_CONFIG.STATUS.DEPLOYING: return '#ffc107'
      case DEPLOYMENT_CONFIG.STATUS.FAILED: return '#dc3545'
      case DEPLOYMENT_CONFIG.STATUS.PENDING: return '#6c757d'
      default: return '#6c757d'
    }
  }

  // 生成部署URL
  const getDeploymentUrl = (deployment) => {
    if (deployment.config.customDomain) {
      return `https://${deployment.config.customDomain}`
    }
    if (deployment.domain) {
      return `http://${deployment.domain}:${deployment.port}`
    }
    return `http://localhost:${deployment.port}`
  }

  // 生成Docker命令
  const generateDockerCommands = (deployment) => {
    const project = projects.find(p => p.id === deployment.projectId)
    if (!project) return []

    return [
      '# 构建Docker镜像',
      `docker build -t ${project.name.toLowerCase()}-${deployment.environment} .`,
      '',
      '# 运行容器',
      `docker run -d \\`,
      `  --name ${project.name.toLowerCase()}-${deployment.environment} \\`,
      `  -p ${deployment.port}:5174 \\`,
      `  -p ${deployment.apiPort}:3004 \\`,
      `  -e NODE_ENV=${deployment.environment} \\`,
      `  -e PORT=3004 \\`,
      `  -e VITE_API_BASE_URL=http://localhost:${deployment.apiPort}/api \\`,
      `  ${project.name.toLowerCase()}-${deployment.environment}`,
      '',
      '# 查看日志',
      `docker logs -f ${project.name.toLowerCase()}-${deployment.environment}`
    ]
  }

  return (
    <div className="deployment-manager">
      <div className="dm-header">
        <h2>🚀 部署管理</h2>
        <button 
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          ➕ 新建部署
        </button>
      </div>

      <div className="dm-deployments">
        {deployments.length === 0 ? (
          <div className="dm-empty">
            <div className="dm-empty-icon">🚀</div>
            <h3>还没有部署配置</h3>
            <p>创建第一个部署配置来开始管理项目部署</p>
            <button 
              className="btn btn-primary"
              onClick={() => setShowCreateModal(true)}
            >
              创建部署配置
            </button>
          </div>
        ) : (
          <div className="dm-deployment-grid">
            {deployments.map(deployment => (
              <div key={deployment.id} className="dm-deployment-card">
                <div className="dm-deployment-header">
                  <h3>{deployment.name}</h3>
                  <span 
                    className="dm-status-badge"
                    style={{ backgroundColor: getStatusColor(deployment.status) }}
                  >
                    {deployment.status}
                  </span>
                </div>

                <div className="dm-deployment-info">
                  <div className="dm-info-row">
                    <span className="dm-label">项目:</span>
                    <span>{getProjectName(deployment.projectId)}</span>
                  </div>
                  <div className="dm-info-row">
                    <span className="dm-label">甲方:</span>
                    <span>{getClientName(deployment.projectId)}</span>
                  </div>
                  <div className="dm-info-row">
                    <span className="dm-label">环境:</span>
                    <span>{deployment.environment}</span>
                  </div>
                  <div className="dm-info-row">
                    <span className="dm-label">平台:</span>
                    <span>{deployment.platform}</span>
                  </div>
                  <div className="dm-info-row">
                    <span className="dm-label">访问地址:</span>
                    <a 
                      href={getDeploymentUrl(deployment)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="dm-url-link"
                    >
                      {getDeploymentUrl(deployment)}
                    </a>
                  </div>
                  {deployment.lastDeployedAt && (
                    <div className="dm-info-row">
                      <span className="dm-label">最后部署:</span>
                      <span>{new Date(deployment.lastDeployedAt).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="dm-info-row">
                    <span className="dm-label">部署次数:</span>
                    <span>{deployment.deployCount}</span>
                  </div>
                </div>

                {deploymentLogs[deployment.id] && (
                  <div className="dm-deployment-logs">
                    <h4>部署日志:</h4>
                    <div className="dm-logs">
                      {deploymentLogs[deployment.id].map((log, index) => (
                        <div key={index} className="dm-log-line">{log}</div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="dm-deployment-actions">
                  <button 
                    className="btn btn-sm btn-primary"
                    onClick={() => handleDeploy(deployment.id)}
                    disabled={deployment.status === DEPLOYMENT_CONFIG.STATUS.DEPLOYING}
                  >
                    {deployment.status === DEPLOYMENT_CONFIG.STATUS.DEPLOYING ? '部署中...' : '🚀 部署'}
                  </button>
                  <button 
                    className="btn btn-sm btn-secondary"
                    onClick={() => setSelectedDeployment(deployment)}
                  >
                    📋 查看配置
                  </button>
                  <button 
                    className="btn btn-sm btn-danger"
                    onClick={() => handleDeleteDeployment(deployment.id)}
                  >
                    🗑️ 删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 创建部署模态框 */}
      {showCreateModal && (
        <div className="dm-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="dm-modal" onClick={e => e.stopPropagation()}>
            <div className="dm-modal-header">
              <h3>创建部署配置</h3>
              <button onClick={() => setShowCreateModal(false)}>✕</button>
            </div>
            <div className="dm-modal-body">
              <div className="dm-form-group">
                <label>部署名称</label>
                <input
                  type="text"
                  value={newDeployment.name}
                  onChange={e => setNewDeployment({...newDeployment, name: e.target.value})}
                  placeholder="输入部署名称"
                />
              </div>
              <div className="dm-form-group">
                <label>选择项目</label>
                <select
                  value={newDeployment.projectId}
                  onChange={e => setNewDeployment({...newDeployment, projectId: e.target.value})}
                >
                  <option value="">选择项目</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                  ))}
                </select>
              </div>
              <div className="dm-form-row">
                <div className="dm-form-group">
                  <label>环境</label>
                  <select
                    value={newDeployment.environment}
                    onChange={e => setNewDeployment({...newDeployment, environment: e.target.value})}
                  >
                    <option value={DEPLOYMENT_CONFIG.ENVIRONMENTS.DEVELOPMENT}>开发环境</option>
                    <option value={DEPLOYMENT_CONFIG.ENVIRONMENTS.STAGING}>测试环境</option>
                    <option value={DEPLOYMENT_CONFIG.ENVIRONMENTS.PRODUCTION}>生产环境</option>
                  </select>
                </div>
                <div className="dm-form-group">
                  <label>平台</label>
                  <select
                    value={newDeployment.platform}
                    onChange={e => setNewDeployment({...newDeployment, platform: e.target.value})}
                  >
                    <option value={DEPLOYMENT_CONFIG.PLATFORMS.DOCKER}>Docker</option>
                    <option value={DEPLOYMENT_CONFIG.PLATFORMS.VERCEL}>Vercel</option>
                    <option value={DEPLOYMENT_CONFIG.PLATFORMS.NETLIFY}>Netlify</option>
                    <option value={DEPLOYMENT_CONFIG.PLATFORMS.AWS}>AWS</option>
                    <option value={DEPLOYMENT_CONFIG.PLATFORMS.CUSTOM}>自定义</option>
                  </select>
                </div>
              </div>
              <div className="dm-form-row">
                <div className="dm-form-group">
                  <label>域名/IP</label>
                  <input
                    type="text"
                    value={newDeployment.domain}
                    onChange={e => setNewDeployment({...newDeployment, domain: e.target.value})}
                    placeholder="例: example.com 或 192.168.1.100"
                  />
                </div>
                <div className="dm-form-group">
                  <label>前端端口</label>
                  <input
                    type="number"
                    value={newDeployment.port}
                    onChange={e => setNewDeployment({...newDeployment, port: e.target.value})}
                    placeholder="5174"
                  />
                </div>
              </div>
              <div className="dm-form-group">
                <label>API端口</label>
                <input
                  type="number"
                  value={newDeployment.apiPort}
                  onChange={e => setNewDeployment({...newDeployment, apiPort: e.target.value})}
                  placeholder="3004"
                />
              </div>
            </div>
            <div className="dm-modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                取消
              </button>
              <button className="btn btn-primary" onClick={handleCreateDeployment}>
                创建部署
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 查看配置模态框 */}
      {selectedDeployment && (
        <div className="dm-modal-overlay" onClick={() => setSelectedDeployment(null)}>
          <div className="dm-modal dm-config-modal" onClick={e => e.stopPropagation()}>
            <div className="dm-modal-header">
              <h3>部署配置 - {selectedDeployment.name}</h3>
              <button onClick={() => setSelectedDeployment(null)}>✕</button>
            </div>
            <div className="dm-modal-body">
              <div className="dm-config-section">
                <h4>🐳 Docker 命令</h4>
                <pre className="dm-code-block">
                  {generateDockerCommands(selectedDeployment).join('\n')}
                </pre>
              </div>
              <div className="dm-config-section">
                <h4>🔧 环境变量</h4>
                <div className="dm-env-vars">
                  <div className="dm-env-var">
                    <span>NODE_ENV</span>
                    <span>{selectedDeployment.environment}</span>
                  </div>
                  <div className="dm-env-var">
                    <span>PORT</span>
                    <span>{selectedDeployment.apiPort}</span>
                  </div>
                  <div className="dm-env-var">
                    <span>VITE_API_BASE_URL</span>
                    <span>http://{selectedDeployment.domain || 'localhost'}:{selectedDeployment.apiPort}/api</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="dm-modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedDeployment(null)}>
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DeploymentManager
