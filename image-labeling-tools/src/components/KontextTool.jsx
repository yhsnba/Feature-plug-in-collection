import React, { useState, useRef } from 'react'
import { apiService, utils } from '../services/api'
import { notify } from './Notification'

function KontextTool() {
  const [originalImages, setOriginalImages] = useState([])
  const [targetImages, setTargetImages] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [label, setLabel] = useState('')
  const [progress, setProgress] = useState(0)
  const [outputPath, setOutputPath] = useState('')
  const [fixedLabel, setFixedLabel] = useState(false)
  const [log, setLog] = useState([])

  const originalFilesRef = useRef()
  const targetFilesRef = useRef()

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString()
    setLog(prev => [...prev, { message, type, timestamp }])
  }

  const handleOutputPathSelect = () => {
    const path = prompt('请输入输出文件夹路径：', 'E:\\挖藕\\素材\\测试\\cs')
    if (path && path.trim()) {
      setOutputPath(path.trim())
      addLog(`📁 输出路径设置为: ${path.trim()}`, 'info')
      notify.success(`输出路径设置成功: ${path.trim()}`)
    }
  }

  const handleOriginalImagesUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    try {
      // 验证所有文件
      files.forEach(file => utils.validateImageFile(file))

      const response = await apiService.uploadMultiple(files)
      // 按文件名自然排序
      const sortedFiles = response.files.sort(utils.naturalSort)
      setOriginalImages(sortedFiles)
      setCurrentIndex(0)
      addLog(`✅ 原图加载成功，共 ${sortedFiles.length} 张图片`, 'success')
      notify.success(`原图加载成功，共 ${sortedFiles.length} 张图片`)
    } catch (error) {
      addLog(`❌ 原图上传失败: ${error.message}`, 'error')
      notify.error(`原图上传失败: ${error.message}`)
    }
  }

  const handleTargetImagesUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    try {
      // 验证所有文件
      files.forEach(file => utils.validateImageFile(file))

      const response = await apiService.uploadMultiple(files)
      // 按文件名自然排序
      const sortedFiles = response.files.sort(utils.naturalSort)
      setTargetImages(sortedFiles)
      setCurrentIndex(0)
      addLog(`✅ 目标图加载成功，共 ${sortedFiles.length} 张图片`, 'success')
      notify.success(`目标图加载成功，共 ${sortedFiles.length} 张图片`)
    } catch (error) {
      addLog(`❌ 目标图上传失败: ${error.message}`, 'error')
      notify.error(`目标图上传失败: ${error.message}`)
    }
  }

  const saveLabel = async () => {
    if (!originalImages[currentIndex] || !targetImages[currentIndex] || !label.trim()) {
      const message = '⚠️ 请确保选择了原图、目标图并输入了标签！'
      addLog(message, 'warning')
      notify.warning('请确保选择了原图、目标图并输入了标签！')
      return
    }

    try {
      // 使用当前索引+1作为文件名（第几对）
      const pairNumber = (currentIndex + 1).toString()

      // 保存标签文件
      await apiService.saveLabel(pairNumber, label.trim(), outputPath)

      // 复制并重命名图像文件
      await apiService.copyRenameFiles(
        originalImages[currentIndex].filename,
        targetImages[currentIndex].filename,
        pairNumber,
        outputPath
      )

      // 更新进度
      const newProgress = Math.round(((currentIndex + 1) / originalImages.length) * 100)
      setProgress(newProgress)

      addLog(`✅ 保存：第 ${currentIndex + 1} 对图像和标签`, 'success')
      notify.success(`第 ${currentIndex + 1} 对图像和标签已成功保存！`)

      // 清空输入并移动到下一对图像
      if (!fixedLabel) {
        setLabel('')
      }

      if (currentIndex < originalImages.length - 1 && currentIndex < targetImages.length - 1) {
        setCurrentIndex(currentIndex + 1)
      } else {
        addLog('🎉 所有图像已标注完毕！', 'success')
        notify.success('🎉 所有图像已标注完毕！')
      }
    } catch (error) {
      addLog(`❌ 保存失败: ${error.message}`, 'error')
      notify.error(`保存失败: ${error.message}`)
    }
  }

  const navigateImage = (direction) => {
    const newIndex = currentIndex + direction
    if (newIndex >= 0 && newIndex < Math.min(originalImages.length, targetImages.length)) {
      setCurrentIndex(newIndex)
      // 如果没有固定标签，清空标签
      if (!fixedLabel) {
        setLabel('')
      }
    }
  }

  // 键盘导航
  React.useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'ArrowLeft') {
        navigateImage(-1)
      } else if (e.key === 'ArrowRight') {
        navigateImage(1)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [currentIndex, originalImages, targetImages])

  return (
    <div className="tool-container">
      <div className="tool-header">
        <h2>📷 KontextLora 标注工具</h2>
        <p>同时显示原图和目标图，为图像对添加标签</p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '2.5rem',
        marginBottom: '2.5rem',
        padding: '1.5rem',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '20px',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        {/* 原图区域 */}
        <div style={{
          background: 'rgba(102, 126, 234, 0.05)',
          borderRadius: '15px',
          padding: '1.5rem',
          border: '2px solid rgba(102, 126, 234, 0.1)'
        }}>
          <button
            className="btn btn-primary"
            onClick={() => originalFilesRef.current?.click()}
            style={{ width: '100%', marginBottom: '1.5rem' }}
          >
            📂 加载原图文件夹
          </button>
          <div className="image-container">
            {originalImages[currentIndex] ? (
              <img
                src={`http://localhost:3004${originalImages[currentIndex].path}`}
                alt="原图"
                className="image-preview"
              />
            ) : (
              <div style={{
                fontSize: '1.2rem',
                color: '#667eea',
                fontWeight: '600'
              }}>
                📷 原图预览区
              </div>
            )}
          </div>
        </div>

        {/* 目标图区域 */}
        <div style={{
          background: 'rgba(118, 75, 162, 0.05)',
          borderRadius: '15px',
          padding: '1.5rem',
          border: '2px solid rgba(118, 75, 162, 0.1)'
        }}>
          <button
            className="btn btn-primary"
            onClick={() => targetFilesRef.current?.click()}
            style={{ width: '100%', marginBottom: '1.5rem' }}
          >
            📂 加载目标图文件夹
          </button>
          <div className="image-container">
            {targetImages[currentIndex] ? (
              <img
                src={`http://localhost:3004${targetImages[currentIndex].path}`}
                alt="目标图"
                className="image-preview"
              />
            ) : (
              <div style={{
                fontSize: '1.2rem',
                color: '#764ba2',
                fontWeight: '600'
              }}>
                📷 目标图预览区
              </div>
            )}
          </div>
        </div>
      </div>

      <input
        ref={originalFilesRef}
        type="file"
        accept="image/*"
        multiple
        webkitdirectory=""
        onChange={handleOriginalImagesUpload}
        style={{ display: 'none' }}
      />
      <input
        ref={targetFilesRef}
        type="file"
        accept="image/*"
        multiple
        webkitdirectory=""
        onChange={handleTargetImagesUpload}
        style={{ display: 'none' }}
      />


      <div className="form-group">
        <label className="form-label">🏷️ 标签输入：</label>
        <input
          type="text"
          className="form-input"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="请输入标签..."
        />
        <div style={{ marginTop: '0.5rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
            <input
              type="checkbox"
              checked={fixedLabel}
              onChange={(e) => setFixedLabel(e.target.checked)}
            />
            📌 固定标签（下一对时保持标签不变）
          </label>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <button className="btn btn-secondary" onClick={handleOutputPathSelect}>
          📂 设置输出路径
        </button>
        <button
          className="btn btn-success"
          onClick={saveLabel}
          disabled={!originalImages[currentIndex] || !targetImages[currentIndex] || !label.trim()}
        >
          💾 保存第 {currentIndex + 1} 对
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => navigateImage(-1)}
          disabled={currentIndex <= 0}
        >
          ◀️ 上一对
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => navigateImage(1)}
          disabled={currentIndex >= Math.min(originalImages.length, targetImages.length) - 1}
        >
          ▶️ 下一对
        </button>
      </div>

      {outputPath && (
        <div className="form-group" style={{ marginBottom: '1rem' }}>
          <span className="form-label">输出路径: {outputPath}</span>
        </div>
      )}

      <div className="form-group">
        <label className="form-label">📊 进度：</label>
        <div className="progress">
          <div 
            className="progress-bar" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
          第 {currentIndex + 1} 对 / 共 {Math.min(originalImages.length, targetImages.length)} 对 ({progress}%)
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">📝 日志输出：</label>
        <div style={{
          height: '150px',
          overflow: 'auto',
          border: '2px solid #e9ecef',
          borderRadius: '8px',
          padding: '1rem',
          backgroundColor: '#f8f9fa',
          fontFamily: 'monospace',
          fontSize: '0.9rem'
        }}>
          {log.map((entry, index) => (
            <div key={index} style={{
              color: entry.type === 'error' ? '#dc3545' :
                     entry.type === 'success' ? '#28a745' :
                     entry.type === 'warning' ? '#ffc107' : '#333',
              marginBottom: '0.25rem'
            }}>
              [{entry.timestamp}] {entry.message}
            </div>
          ))}
        </div>
      </div>

      <div style={{
        padding: '1rem',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        fontSize: '0.9rem',
        color: '#666'
      }}>
        💡 提示：使用左右箭头键可以快速切换图像对
      </div>
    </div>
  )
}

export default KontextTool
