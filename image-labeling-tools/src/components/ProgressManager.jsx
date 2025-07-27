import React, { useState, useEffect } from 'react'
import { TASK_CONFIG } from '../constants'
import './ProgressManager.css'

const ProgressManager = ({ projectId, onClose }) => {
  const [tasks, setTasks] = useState([])
  const [progressData, setProgressData] = useState({
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    todoTasks: 0,
    totalEstimatedHours: 0,
    totalSpentHours: 0,
    completionRate: 0,
    timeEfficiency: 0
  })

  // 加载任务数据
  useEffect(() => {
    const savedTasks = localStorage.getItem(`tasks_${projectId}`)
    if (savedTasks) {
      const parsedTasks = JSON.parse(savedTasks)
      setTasks(parsedTasks)
      calculateProgress(parsedTasks)
    }
  }, [projectId])

  // 计算进度数据
  const calculateProgress = (taskList) => {
    const totalTasks = taskList.length
    const completedTasks = taskList.filter(t => t.status === TASK_CONFIG.STATUS.COMPLETED).length
    const inProgressTasks = taskList.filter(t => t.status === TASK_CONFIG.STATUS.IN_PROGRESS).length
    const todoTasks = taskList.filter(t => t.status === TASK_CONFIG.STATUS.TODO).length
    
    const totalEstimatedHours = taskList.reduce((sum, task) => sum + (task.estimatedHours || 0), 0)
    const totalSpentHours = taskList.reduce((sum, task) => sum + ((task.timeSpent || 0) / 3600), 0)
    
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
    // 时间效率：当实际用时大于0时，计算预估工时与实际用时的比率
    // 如果实际用时为0或很少，显示为0%
    const timeEfficiency = totalSpentHours > 0.01 ? (totalEstimatedHours / totalSpentHours) * 100 : 0

    setProgressData({
      totalTasks,
      completedTasks,
      inProgressTasks,
      todoTasks,
      totalEstimatedHours,
      totalSpentHours,
      completionRate,
      timeEfficiency: isFinite(timeEfficiency) ? timeEfficiency : 0
    })
  }

  // 按优先级分组任务
  const tasksByPriority = {
    [TASK_CONFIG.PRIORITIES.URGENT]: tasks.filter(t => t.priority === TASK_CONFIG.PRIORITIES.URGENT),
    [TASK_CONFIG.PRIORITIES.HIGH]: tasks.filter(t => t.priority === TASK_CONFIG.PRIORITIES.HIGH),
    [TASK_CONFIG.PRIORITIES.MEDIUM]: tasks.filter(t => t.priority === TASK_CONFIG.PRIORITIES.MEDIUM),
    [TASK_CONFIG.PRIORITIES.LOW]: tasks.filter(t => t.priority === TASK_CONFIG.PRIORITIES.LOW)
  }

  // 按类型分组任务
  const tasksByType = {
    [TASK_CONFIG.TYPES.FEATURE]: tasks.filter(t => t.type === TASK_CONFIG.TYPES.FEATURE),
    [TASK_CONFIG.TYPES.BUG]: tasks.filter(t => t.type === TASK_CONFIG.TYPES.BUG),
    [TASK_CONFIG.TYPES.IMPROVEMENT]: tasks.filter(t => t.type === TASK_CONFIG.TYPES.IMPROVEMENT),
    [TASK_CONFIG.TYPES.RESEARCH]: tasks.filter(t => t.type === TASK_CONFIG.TYPES.RESEARCH),
    [TASK_CONFIG.TYPES.DOCUMENTATION]: tasks.filter(t => t.type === TASK_CONFIG.TYPES.DOCUMENTATION)
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

  // 获取类型颜色
  const getTypeColor = (type) => {
    const colors = {
      [TASK_CONFIG.TYPES.FEATURE]: '#007bff',
      [TASK_CONFIG.TYPES.BUG]: '#dc3545',
      [TASK_CONFIG.TYPES.IMPROVEMENT]: '#28a745',
      [TASK_CONFIG.TYPES.RESEARCH]: '#6f42c1',
      [TASK_CONFIG.TYPES.DOCUMENTATION]: '#17a2b8'
    }
    return colors[type] || '#6c757d'
  }

  return (
    <div className="progress-manager">
      {/* 头部 */}
      <div className="pm-header">
        <div className="pm-header-left">
          <h2>📊 项目进度分析</h2>
        </div>
        <div className="pm-header-right">
          <button 
            className="btn btn-secondary"
            onClick={onClose}
          >
            ✖️ 关闭
          </button>
        </div>
      </div>

      <div className="pm-content">
        {/* 总体进度卡片 */}
        <div className="pm-overview-cards">
          <div className="pm-progress-card">
            <div className="pm-card-header">
              <h3>📈 完成进度</h3>
              <span className="pm-percentage">{progressData.completionRate.toFixed(1)}%</span>
            </div>
            <div className="pm-progress-bar">
              <div 
                className="pm-progress-fill"
                style={{ width: `${progressData.completionRate}%` }}
              ></div>
            </div>
            <div className="pm-progress-details">
              <span>已完成: {progressData.completedTasks}</span>
              <span>总任务: {progressData.totalTasks}</span>
            </div>
          </div>

          <div className="pm-time-card">
            <div className="pm-card-header">
              <h3>⏱️ 时间统计</h3>
              <span className="pm-time-ratio">
                {progressData.totalSpentHours.toFixed(1)}h / {progressData.totalEstimatedHours.toFixed(1)}h
              </span>
            </div>
            <div className="pm-time-details">
              <div className="pm-time-item">
                <span>预估工时:</span>
                <span>{progressData.totalEstimatedHours.toFixed(1)}h</span>
              </div>
              <div className="pm-time-item">
                <span>实际用时:</span>
                <span>{progressData.totalSpentHours.toFixed(1)}h</span>
              </div>
              <div className="pm-time-item">
                <span>时间效率:</span>
                <span className={progressData.timeEfficiency > 100 ? 'pm-efficiency-good' : 'pm-efficiency-poor'}>
                  {progressData.timeEfficiency.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 任务状态分布 */}
        <div className="pm-status-distribution">
          <h3>📋 任务状态分布</h3>
          <div className="pm-status-grid">
            <div className="pm-status-item pm-status-todo">
              <div className="pm-status-count">{progressData.todoTasks}</div>
              <div className="pm-status-label">待办</div>
            </div>
            <div className="pm-status-item pm-status-progress">
              <div className="pm-status-count">{progressData.inProgressTasks}</div>
              <div className="pm-status-label">进行中</div>
            </div>
            <div className="pm-status-item pm-status-completed">
              <div className="pm-status-count">{progressData.completedTasks}</div>
              <div className="pm-status-label">已完成</div>
            </div>
          </div>
        </div>

        {/* 优先级分析 */}
        <div className="pm-priority-analysis">
          <h3>🎯 优先级分析</h3>
          <div className="pm-priority-grid">
            {Object.entries(tasksByPriority).map(([priority, priorityTasks]) => (
              <div key={priority} className="pm-priority-item">
                <div className="pm-priority-header">
                  <span 
                    className="pm-priority-badge"
                    style={{ backgroundColor: getPriorityColor(priority) }}
                  >
                    {priority}
                  </span>
                  <span className="pm-priority-count">{priorityTasks.length}</span>
                </div>
                <div className="pm-priority-progress">
                  <div className="pm-priority-stats">
                    <span>完成: {priorityTasks.filter(t => t.status === TASK_CONFIG.STATUS.COMPLETED).length}</span>
                    <span>进行: {priorityTasks.filter(t => t.status === TASK_CONFIG.STATUS.IN_PROGRESS).length}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 类型分析 */}
        <div className="pm-type-analysis">
          <h3>🏷️ 任务类型分析</h3>
          <div className="pm-type-grid">
            {Object.entries(tasksByType).map(([type, typeTasks]) => (
              typeTasks.length > 0 && (
                <div key={type} className="pm-type-item">
                  <div className="pm-type-header">
                    <span 
                      className="pm-type-badge"
                      style={{ backgroundColor: getTypeColor(type) }}
                    >
                      {type}
                    </span>
                    <span className="pm-type-count">{typeTasks.length}</span>
                  </div>
                  <div className="pm-type-details">
                    <div className="pm-type-progress-bar">
                      <div 
                        className="pm-type-progress-fill"
                        style={{ 
                          width: `${typeTasks.length > 0 ? (typeTasks.filter(t => t.status === TASK_CONFIG.STATUS.COMPLETED).length / typeTasks.length) * 100 : 0}%`,
                          backgroundColor: getTypeColor(type)
                        }}
                      ></div>
                    </div>
                    <span className="pm-type-percentage">
                      {typeTasks.length > 0 ? ((typeTasks.filter(t => t.status === TASK_CONFIG.STATUS.COMPLETED).length / typeTasks.length) * 100).toFixed(0) : 0}%
                    </span>
                  </div>
                </div>
              )
            ))}
          </div>
        </div>

        {/* 最近活动 */}
        <div className="pm-recent-activity">
          <h3>🕒 最近活动</h3>
          <div className="pm-activity-list">
            {tasks
              .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
              .slice(0, 5)
              .map(task => (
                <div key={task.id} className="pm-activity-item">
                  <div className="pm-activity-info">
                    <span className="pm-activity-title">{task.title}</span>
                    <span className="pm-activity-status">{task.status}</span>
                  </div>
                  <div className="pm-activity-time">
                    {new Date(task.updatedAt).toLocaleString()}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProgressManager
