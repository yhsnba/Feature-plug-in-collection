import React, { useState, useEffect } from 'react'
import { TIME_TRACKING_CONFIG } from '../constants'
import './TimeTracker.css'

const TimeTracker = ({ taskId, onTimeUpdate }) => {
  const [isTracking, setIsTracking] = useState(false)
  const [currentSession, setCurrentSession] = useState(null)
  const [totalTime, setTotalTime] = useState(0)
  const [sessionTime, setSessionTime] = useState(0)
  const [sessions, setSessions] = useState([])

  // 从localStorage加载时间数据
  useEffect(() => {
    const savedSessions = localStorage.getItem(`time_sessions_${taskId}`)
    if (savedSessions) {
      const parsedSessions = JSON.parse(savedSessions)
      setSessions(parsedSessions)
      
      // 计算总时间
      const total = parsedSessions.reduce((sum, session) => sum + session.duration, 0)
      setTotalTime(total)
    }

    // 检查是否有正在进行的会话
    const activeSession = localStorage.getItem(`active_session_${taskId}`)
    if (activeSession) {
      const session = JSON.parse(activeSession)
      setCurrentSession(session)
      setIsTracking(true)
      
      // 计算当前会话时间
      const elapsed = Date.now() - new Date(session.startTime).getTime()
      setSessionTime(Math.floor(elapsed / 1000))
    }
  }, [taskId])

  // 定时器更新当前会话时间
  useEffect(() => {
    let interval = null
    if (isTracking && currentSession) {
      interval = setInterval(() => {
        const elapsed = Date.now() - new Date(currentSession.startTime).getTime()
        setSessionTime(Math.floor(elapsed / 1000))
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isTracking, currentSession])

  // 开始时间跟踪
  const startTracking = () => {
    const session = {
      id: Date.now().toString(),
      taskId,
      startTime: new Date().toISOString(),
      endTime: null,
      duration: 0,
      description: '',
      status: TIME_TRACKING_CONFIG.SESSION_STATUS.ACTIVE
    }

    setCurrentSession(session)
    setIsTracking(true)
    setSessionTime(0)
    
    // 保存到localStorage
    localStorage.setItem(`active_session_${taskId}`, JSON.stringify(session))
  }

  // 暂停时间跟踪
  const pauseTracking = () => {
    if (currentSession) {
      const duration = Math.floor((Date.now() - new Date(currentSession.startTime).getTime()) / 1000)
      const updatedSession = {
        ...currentSession,
        status: TIME_TRACKING_CONFIG.SESSION_STATUS.PAUSED,
        duration
      }
      
      setCurrentSession(updatedSession)
      setIsTracking(false)
      
      localStorage.setItem(`active_session_${taskId}`, JSON.stringify(updatedSession))
    }
  }

  // 恢复时间跟踪
  const resumeTracking = () => {
    if (currentSession) {
      const updatedSession = {
        ...currentSession,
        startTime: new Date(Date.now() - currentSession.duration * 1000).toISOString(),
        status: TIME_TRACKING_CONFIG.SESSION_STATUS.ACTIVE
      }
      
      setCurrentSession(updatedSession)
      setIsTracking(true)
      
      localStorage.setItem(`active_session_${taskId}`, JSON.stringify(updatedSession))
    }
  }

  // 停止时间跟踪
  const stopTracking = (description = '') => {
    if (currentSession) {
      const endTime = new Date().toISOString()
      const duration = Math.floor((Date.now() - new Date(currentSession.startTime).getTime()) / 1000)
      
      const completedSession = {
        ...currentSession,
        endTime,
        duration,
        description,
        status: TIME_TRACKING_CONFIG.SESSION_STATUS.STOPPED
      }

      // 更新会话列表
      const updatedSessions = [...sessions, completedSession]
      setSessions(updatedSessions)
      
      // 更新总时间
      const newTotalTime = totalTime + duration
      setTotalTime(newTotalTime)
      
      // 清理当前会话
      setCurrentSession(null)
      setIsTracking(false)
      setSessionTime(0)
      
      // 保存到localStorage
      localStorage.setItem(`time_sessions_${taskId}`, JSON.stringify(updatedSessions))
      localStorage.removeItem(`active_session_${taskId}`)
      
      // 通知父组件时间更新
      if (onTimeUpdate) {
        onTimeUpdate(newTotalTime)
      }
    }
  }

  // 格式化时间显示
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  // 格式化持续时间为小时
  const formatDurationToHours = (seconds) => {
    return (seconds / 3600).toFixed(2)
  }

  return (
    <div className="time-tracker">
      <div className="tt-header">
        <h4>⏱️ 时间跟踪</h4>
        <div className="tt-total-time">
          总计: {formatDurationToHours(totalTime)}h
        </div>
      </div>

      <div className="tt-current-session">
        <div className="tt-timer">
          <span className="tt-time-display">
            {formatTime(sessionTime)}
          </span>
        </div>

        <div className="tt-controls">
          {!isTracking && !currentSession && (
            <button 
              className="btn btn-primary btn-sm"
              onClick={startTracking}
            >
              ▶️ 开始
            </button>
          )}
          
          {isTracking && (
            <>
              <button 
                className="btn btn-warning btn-sm"
                onClick={pauseTracking}
              >
                ⏸️ 暂停
              </button>
              <button 
                className="btn btn-danger btn-sm"
                onClick={() => stopTracking()}
              >
                ⏹️ 停止
              </button>
            </>
          )}
          
          {!isTracking && currentSession && currentSession.status === TIME_TRACKING_CONFIG.SESSION_STATUS.PAUSED && (
            <>
              <button 
                className="btn btn-primary btn-sm"
                onClick={resumeTracking}
              >
                ▶️ 继续
              </button>
              <button 
                className="btn btn-danger btn-sm"
                onClick={() => stopTracking()}
              >
                ⏹️ 停止
              </button>
            </>
          )}
        </div>
      </div>

      {sessions.length > 0 && (
        <div className="tt-sessions">
          <h5>历史记录</h5>
          <div className="tt-sessions-list">
            {sessions.slice(-5).reverse().map(session => (
              <div key={session.id} className="tt-session-item">
                <div className="tt-session-info">
                  <span className="tt-session-date">
                    {new Date(session.startTime).toLocaleDateString()}
                  </span>
                  <span className="tt-session-duration">
                    {formatDurationToHours(session.duration)}h
                  </span>
                </div>
                {session.description && (
                  <div className="tt-session-description">
                    {session.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default TimeTracker
