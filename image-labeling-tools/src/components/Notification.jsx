import React, { useState, useEffect } from 'react'
import './Notification.css'

const Notification = ({ message, type = 'info', duration = 3000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(() => {
        onClose && onClose()
      }, 300) // 等待动画完成
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅'
      case 'error':
        return '❌'
      case 'warning':
        return '⚠️'
      default:
        return 'ℹ️'
    }
  }

  return (
    <div className={`notification notification-${type} ${isVisible ? 'show' : 'hide'}`}>
      <span className="notification-icon">{getIcon()}</span>
      <span className="notification-message">{message}</span>
      <button 
        className="notification-close" 
        onClick={() => {
          setIsVisible(false)
          setTimeout(() => onClose && onClose(), 300)
        }}
      >
        ×
      </button>
    </div>
  )
}

// 通知管理器
export const NotificationManager = {
  notifications: [],
  listeners: [],

  add: (message, type = 'info', duration = 3000) => {
    const id = Date.now() + Math.random()
    const notification = { id, message, type, duration }
    
    NotificationManager.notifications.push(notification)
    NotificationManager.notify()
    
    return id
  },

  remove: (id) => {
    NotificationManager.notifications = NotificationManager.notifications.filter(n => n.id !== id)
    NotificationManager.notify()
  },

  clear: () => {
    NotificationManager.notifications = []
    NotificationManager.notify()
  },

  subscribe: (listener) => {
    NotificationManager.listeners.push(listener)
    return () => {
      NotificationManager.listeners = NotificationManager.listeners.filter(l => l !== listener)
    }
  },

  notify: () => {
    NotificationManager.listeners.forEach(listener => listener(NotificationManager.notifications))
  }
}

// 通知容器组件
export const NotificationContainer = () => {
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    const unsubscribe = NotificationManager.subscribe(setNotifications)
    return unsubscribe
  }, [])

  return (
    <div className="notification-container">
      {notifications.map(notification => (
        <Notification
          key={notification.id}
          message={notification.message}
          type={notification.type}
          duration={notification.duration}
          onClose={() => NotificationManager.remove(notification.id)}
        />
      ))}
    </div>
  )
}

// 便捷方法
export const notify = {
  success: (message, duration) => NotificationManager.add(message, 'success', duration),
  error: (message, duration) => NotificationManager.add(message, 'error', duration),
  warning: (message, duration) => NotificationManager.add(message, 'warning', duration),
  info: (message, duration) => NotificationManager.add(message, 'info', duration),
}

export default Notification
