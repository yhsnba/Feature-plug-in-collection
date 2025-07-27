import React, { useState, useEffect } from 'react'
import { TASK_CONFIG } from '../constants'
import TimeTracker from './TimeTracker'
import ProgressManager from './ProgressManager'
import './TaskManager.css'

const TaskManager = ({ projectId, onClose }) => {
  const [tasks, setTasks] = useState([])
  const [activeView, setActiveView] = useState('list') // list, board, timeline
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)
  const [showTaskDetail, setShowTaskDetail] = useState(false)
  const [showProgressManager, setShowProgressManager] = useState(false)
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    assignee: 'all'
  })

  // 新任务表单数据
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    status: TASK_CONFIG.STATUS.TODO,
    priority: TASK_CONFIG.PRIORITIES.MEDIUM,
    type: TASK_CONFIG.TYPES.FEATURE,
    labels: [],
    assignee: '',
    estimatedHours: 0,
    dueDate: '',
    parentTaskId: null
  })

  // 从localStorage加载任务
  useEffect(() => {
    const savedTasks = localStorage.getItem(`tasks_${projectId}`)
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks))
    }
  }, [projectId])

  // 保存任务到localStorage
  const saveTasks = (updatedTasks) => {
    setTasks(updatedTasks)
    localStorage.setItem(`tasks_${projectId}`, JSON.stringify(updatedTasks))
  }

  // 创建新任务
  const handleCreateTask = () => {
    if (!newTask.title.trim()) return

    const task = {
      id: Date.now().toString(),
      projectId,
      ...newTask,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      timeSpent: 0,
      comments: []
    }

    const updatedTasks = [...tasks, task]
    saveTasks(updatedTasks)
    
    // 重置表单
    setNewTask({
      title: '',
      description: '',
      status: TASK_CONFIG.STATUS.TODO,
      priority: TASK_CONFIG.PRIORITIES.MEDIUM,
      type: TASK_CONFIG.TYPES.FEATURE,
      labels: [],
      assignee: '',
      estimatedHours: 0,
      dueDate: '',
      parentTaskId: null
    })
    setShowCreateModal(false)
  }

  // 更新任务状态
  const updateTaskStatus = (taskId, newStatus) => {
    const updatedTasks = tasks.map(task =>
      task.id === taskId
        ? { ...task, status: newStatus, updatedAt: new Date().toISOString() }
        : task
    )
    saveTasks(updatedTasks)
  }

  // 删除任务
  const deleteTask = (taskId) => {
    if (window.confirm('确定要删除这个任务吗？')) {
      const updatedTasks = tasks.filter(task => task.id !== taskId)
      saveTasks(updatedTasks)
    }
  }

  // 更新任务时间
  const handleTimeUpdate = (taskId, totalTime) => {
    const updatedTasks = tasks.map(task =>
      task.id === taskId
        ? { ...task, timeSpent: totalTime, updatedAt: new Date().toISOString() }
        : task
    )
    saveTasks(updatedTasks)
  }

  // 打开任务详情
  const openTaskDetail = (task) => {
    setSelectedTask(task)
    setShowTaskDetail(true)
  }

  // 关闭任务详情
  const closeTaskDetail = () => {
    setSelectedTask(null)
    setShowTaskDetail(false)
  }

  // 获取状态颜色
  const getStatusColor = (status) => {
    const colors = {
      [TASK_CONFIG.STATUS.TODO]: '#6c757d',
      [TASK_CONFIG.STATUS.IN_PROGRESS]: '#007bff',
      [TASK_CONFIG.STATUS.IN_REVIEW]: '#ffc107',
      [TASK_CONFIG.STATUS.COMPLETED]: '#28a745',
      [TASK_CONFIG.STATUS.CANCELLED]: '#dc3545'
    }
    return colors[status] || '#6c757d'
  }

  // 获取优先级颜色
  const getPriorityColor = (priority) => {
    const colors = {
      [TASK_CONFIG.PRIORITIES.LOW]: '#28a745',
      [TASK_CONFIG.PRIORITIES.MEDIUM]: '#ffc107',
      [TASK_CONFIG.PRIORITIES.HIGH]: '#fd7e14',
      [TASK_CONFIG.PRIORITIES.URGENT]: '#dc3545'
    }
    return colors[priority] || '#6c757d'
  }

  // 过滤任务
  const filteredTasks = tasks.filter(task => {
    if (filters.status !== 'all' && task.status !== filters.status) return false
    if (filters.priority !== 'all' && task.priority !== filters.priority) return false
    if (filters.assignee !== 'all' && task.assignee !== filters.assignee) return false
    return true
  })

  // 按状态分组任务（看板视图用）
  const tasksByStatus = {
    [TASK_CONFIG.STATUS.TODO]: filteredTasks.filter(t => t.status === TASK_CONFIG.STATUS.TODO),
    [TASK_CONFIG.STATUS.IN_PROGRESS]: filteredTasks.filter(t => t.status === TASK_CONFIG.STATUS.IN_PROGRESS),
    [TASK_CONFIG.STATUS.IN_REVIEW]: filteredTasks.filter(t => t.status === TASK_CONFIG.STATUS.IN_REVIEW),
    [TASK_CONFIG.STATUS.COMPLETED]: filteredTasks.filter(t => t.status === TASK_CONFIG.STATUS.COMPLETED)
  }

  return (
    <div className="task-manager">
      {/* 头部工具栏 */}
      <div className="tm-header">
        <div className="tm-header-left">
          <h2>📋 任务管理</h2>
          <div className="tm-view-switcher">
            <button 
              className={activeView === 'list' ? 'active' : ''}
              onClick={() => setActiveView('list')}
            >
              📋 列表
            </button>
            <button 
              className={activeView === 'board' ? 'active' : ''}
              onClick={() => setActiveView('board')}
            >
              📊 看板
            </button>
          </div>
        </div>
        <div className="tm-header-right">
          <button
            className="btn btn-info"
            onClick={() => setShowProgressManager(true)}
          >
            📊 进度分析
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            ➕ 新建任务
          </button>
          <button
            className="btn btn-secondary"
            onClick={onClose}
          >
            ✖️ 关闭
          </button>
        </div>
      </div>

      {/* 过滤器 */}
      <div className="tm-filters">
        <select 
          value={filters.status} 
          onChange={(e) => setFilters({...filters, status: e.target.value})}
        >
          <option value="all">所有状态</option>
          <option value={TASK_CONFIG.STATUS.TODO}>待办</option>
          <option value={TASK_CONFIG.STATUS.IN_PROGRESS}>进行中</option>
          <option value={TASK_CONFIG.STATUS.IN_REVIEW}>待审核</option>
          <option value={TASK_CONFIG.STATUS.COMPLETED}>已完成</option>
        </select>
        
        <select 
          value={filters.priority} 
          onChange={(e) => setFilters({...filters, priority: e.target.value})}
        >
          <option value="all">所有优先级</option>
          <option value={TASK_CONFIG.PRIORITIES.LOW}>低</option>
          <option value={TASK_CONFIG.PRIORITIES.MEDIUM}>中</option>
          <option value={TASK_CONFIG.PRIORITIES.HIGH}>高</option>
          <option value={TASK_CONFIG.PRIORITIES.URGENT}>紧急</option>
        </select>
      </div>

      {/* 任务内容区域 */}
      <div className="tm-content">
        {activeView === 'list' && (
          <div className="tm-task-list">
            {filteredTasks.map(task => (
              <div key={task.id} className="tm-task-item">
                <div className="tm-task-header">
                  <h4>{task.title}</h4>
                  <div className="tm-task-badges">
                    <span 
                      className="tm-status-badge"
                      style={{ backgroundColor: getStatusColor(task.status) }}
                    >
                      {task.status}
                    </span>
                    <span 
                      className="tm-priority-badge"
                      style={{ backgroundColor: getPriorityColor(task.priority) }}
                    >
                      {task.priority}
                    </span>
                  </div>
                </div>
                <p className="tm-task-description">{task.description}</p>
                <div className="tm-task-meta">
                  <span>类型: {task.type}</span>
                  <span>预估: {task.estimatedHours}h</span>
                  <span>已用: {((task.timeSpent || 0) / 3600).toFixed(2)}h</span>
                  {task.dueDate && <span>截止: {new Date(task.dueDate).toLocaleDateString()}</span>}
                </div>
                <div className="tm-task-actions">
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => openTaskDetail(task)}
                  >
                    ⏱️ 详情
                  </button>
                  <select
                    value={task.status}
                    onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                  >
                    <option value={TASK_CONFIG.STATUS.TODO}>待办</option>
                    <option value={TASK_CONFIG.STATUS.IN_PROGRESS}>进行中</option>
                    <option value={TASK_CONFIG.STATUS.IN_REVIEW}>待审核</option>
                    <option value={TASK_CONFIG.STATUS.COMPLETED}>已完成</option>
                    <option value={TASK_CONFIG.STATUS.CANCELLED}>已取消</option>
                  </select>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => deleteTask(task.id)}
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeView === 'board' && (
          <div className="tm-kanban-board">
            {Object.entries(tasksByStatus).map(([status, statusTasks]) => (
              <div key={status} className="tm-kanban-column">
                <div className="tm-column-header">
                  <h3>{status}</h3>
                  <span className="tm-task-count">{statusTasks.length}</span>
                </div>
                <div className="tm-column-tasks">
                  {statusTasks.map(task => (
                    <div
                      key={task.id}
                      className="tm-kanban-card"
                      onClick={() => openTaskDetail(task)}
                    >
                      <h4>{task.title}</h4>
                      <p>{task.description}</p>
                      <div className="tm-card-meta">
                        <span>预估: {task.estimatedHours}h</span>
                        <span>已用: {((task.timeSpent || 0) / 3600).toFixed(2)}h</span>
                      </div>
                      <div className="tm-card-footer">
                        <span
                          className="tm-priority-badge"
                          style={{ backgroundColor: getPriorityColor(task.priority) }}
                        >
                          {task.priority}
                        </span>
                        <span className="tm-estimated-hours">
                          {task.dueDate && new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 创建任务模态框 */}
      {showCreateModal && (
        <div className="tm-modal-overlay">
          <div className="tm-modal">
            <div className="tm-modal-header">
              <h3>创建新任务</h3>
              <button onClick={() => setShowCreateModal(false)}>✖️</button>
            </div>
            <div className="tm-modal-body">
              <div className="tm-form-group">
                <label>任务标题 *</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                  placeholder="输入任务标题"
                />
              </div>
              <div className="tm-form-group">
                <label>任务描述</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                  placeholder="详细描述任务内容"
                />
              </div>
              <div className="tm-form-row">
                <div className="tm-form-group">
                  <label>优先级</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                  >
                    <option value={TASK_CONFIG.PRIORITIES.LOW}>低</option>
                    <option value={TASK_CONFIG.PRIORITIES.MEDIUM}>中</option>
                    <option value={TASK_CONFIG.PRIORITIES.HIGH}>高</option>
                    <option value={TASK_CONFIG.PRIORITIES.URGENT}>紧急</option>
                  </select>
                </div>
                <div className="tm-form-group">
                  <label>任务类型</label>
                  <select
                    value={newTask.type}
                    onChange={(e) => setNewTask({...newTask, type: e.target.value})}
                  >
                    <option value={TASK_CONFIG.TYPES.FEATURE}>功能</option>
                    <option value={TASK_CONFIG.TYPES.BUG}>缺陷</option>
                    <option value={TASK_CONFIG.TYPES.IMPROVEMENT}>改进</option>
                    <option value={TASK_CONFIG.TYPES.RESEARCH}>研究</option>
                    <option value={TASK_CONFIG.TYPES.DOCUMENTATION}>文档</option>
                  </select>
                </div>
              </div>
              <div className="tm-form-row">
                <div className="tm-form-group">
                  <label>预估工时 (小时)</label>
                  <input
                    type="number"
                    value={newTask.estimatedHours}
                    onChange={(e) => setNewTask({...newTask, estimatedHours: parseInt(e.target.value) || 0})}
                    min="0"
                  />
                </div>
                <div className="tm-form-group">
                  <label>截止日期</label>
                  <input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                  />
                </div>
              </div>
            </div>
            <div className="tm-modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowCreateModal(false)}
              >
                取消
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleCreateTask}
              >
                创建任务
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 任务详情模态框 */}
      {showTaskDetail && selectedTask && (
        <div className="tm-modal-overlay">
          <div className="tm-modal tm-task-detail-modal">
            <div className="tm-modal-header">
              <h3>📋 {selectedTask.title}</h3>
              <button onClick={closeTaskDetail}>✖️</button>
            </div>
            <div className="tm-modal-body">
              <div className="tm-task-detail-content">
                <div className="tm-task-info">
                  <p><strong>描述：</strong> {selectedTask.description || '无描述'}</p>
                  <div className="tm-task-detail-meta">
                    <div className="tm-meta-item">
                      <span>状态：</span>
                      <span
                        className="tm-status-badge"
                        style={{ backgroundColor: getStatusColor(selectedTask.status) }}
                      >
                        {selectedTask.status}
                      </span>
                    </div>
                    <div className="tm-meta-item">
                      <span>优先级：</span>
                      <span
                        className="tm-priority-badge"
                        style={{ backgroundColor: getPriorityColor(selectedTask.priority) }}
                      >
                        {selectedTask.priority}
                      </span>
                    </div>
                    <div className="tm-meta-item">
                      <span>类型：</span>
                      <span>{selectedTask.type}</span>
                    </div>
                    <div className="tm-meta-item">
                      <span>预估工时：</span>
                      <span>{selectedTask.estimatedHours}h</span>
                    </div>
                    {selectedTask.dueDate && (
                      <div className="tm-meta-item">
                        <span>截止日期：</span>
                        <span>{new Date(selectedTask.dueDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 时间跟踪器 */}
                <TimeTracker
                  taskId={selectedTask.id}
                  onTimeUpdate={(totalTime) => handleTimeUpdate(selectedTask.id, totalTime)}
                />
              </div>
            </div>
            <div className="tm-modal-footer">
              <button
                className="btn btn-secondary"
                onClick={closeTaskDetail}
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 进度管理器 */}
      {showProgressManager && (
        <ProgressManager
          projectId={projectId}
          onClose={() => setShowProgressManager(false)}
        />
      )}
    </div>
  )
}

export default TaskManager
