import React from 'react'

const Loading = ({ 
  size = 'medium', 
  text = '加载中...', 
  overlay = false,
  progress = null 
}) => {
  const sizeClasses = {
    small: 'loading-small',
    medium: 'loading-medium',
    large: 'loading-large'
  }

  const LoadingSpinner = () => (
    <div className={`loading-spinner ${sizeClasses[size]}`}>
      <div className="spinner-ring">
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
      {text && <div className="loading-text">{text}</div>}
      {progress !== null && (
        <div className="loading-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="progress-text">{progress}%</div>
        </div>
      )}
    </div>
  )

  if (overlay) {
    return (
      <div className="loading-overlay">
        <LoadingSpinner />
      </div>
    )
  }

  return <LoadingSpinner />
}

// 骨架屏组件
export const SkeletonLoader = ({ 
  lines = 3, 
  height = '20px', 
  className = '' 
}) => (
  <div className={`skeleton-loader ${className}`}>
    {Array.from({ length: lines }, (_, index) => (
      <div 
        key={index}
        className="skeleton-line"
        style={{ 
          height,
          width: index === lines - 1 ? '60%' : '100%'
        }}
      ></div>
    ))}
  </div>
)

// 图片加载占位符
export const ImagePlaceholder = ({ 
  width = '100%', 
  height = '200px',
  text = '图片加载中...'
}) => (
  <div 
    className="image-placeholder"
    style={{ width, height }}
  >
    <div className="placeholder-content">
      <div className="placeholder-icon">🖼️</div>
      <div className="placeholder-text">{text}</div>
    </div>
  </div>
)

export default Loading
