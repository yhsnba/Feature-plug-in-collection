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
  const [singleImageMode, setSingleImageMode] = useState(false) // 新增：单张图片模式
  const [singleOriginalImage, setSingleOriginalImage] = useState(null) // 新增：单张原图
  const [singleTargetImage, setSingleTargetImage] = useState(null) // 新增：单张目标图

  const originalFilesRef = useRef()
  const targetFilesRef = useRef()
  const singleOriginalRef = useRef() // 新增：单张原图选择引用
  const singleTargetRef = useRef() // 新增：单张目标图选择引用

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString()
    setLog(prev => [...prev, { message, type, timestamp }])
  }

  // 模式切换处理
  const handleModeSwitch = (mode) => {
    setSingleImageMode(mode)
    setCurrentIndex(0)
    if (!fixedLabel) {
      setLabel('')
    }

    if (mode) {
      addLog('🔄 切换到单张模式', 'info')
    } else {
      addLog('🔄 切换到文件夹模式', 'info')
      // 清空单张图片数据
      setSingleOriginalImage(null)
      setSingleTargetImage(null)
    }
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

  // 新增：处理单张原图上传
  const handleSingleOriginalUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      utils.validateImageFile(file)
      const response = await apiService.uploadSingle(file)
      setSingleOriginalImage(response.file)
      addLog(`✅ 单张原图加载成功: ${file.name}`, 'success')
      notify.success(`单张原图加载成功: ${file.name}`)
    } catch (error) {
      addLog(`❌ 单张原图上传失败: ${error.message}`, 'error')
      notify.error(`单张原图上传失败: ${error.message}`)
    }
  }

  // 新增：处理单张目标图上传
  const handleSingleTargetUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      utils.validateImageFile(file)
      const response = await apiService.uploadSingle(file)
      setSingleTargetImage(response.file)
      setCurrentIndex(0) // 重置索引
      addLog(`✅ 单张目标图加载成功: ${file.name}`, 'success')
      notify.success(`单张目标图加载成功: ${file.name}`)
    } catch (error) {
      addLog(`❌ 单张目标图上传失败: ${error.message}`, 'error')
      notify.error(`单张目标图上传失败: ${error.message}`)
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
    if (!label.trim()) {
      notify.warning('请输入标签内容！')
      return
    }

    // 验证不同模式的输入
    if (singleImageMode) {
      // 单张模式：需要单张原图 + (单张目标图 或 目标图文件夹)
      if (!singleOriginalImage) {
        const message = '⚠️ 请先选择单张原图！'
        addLog(message, 'warning')
        notify.warning('请先选择单张原图！')
        return
      }

      // 检查目标图：单张目标图 或 目标图文件夹
      if (!singleTargetImage && (!targetImages || targetImages.length === 0 || !targetImages[currentIndex])) {
        const message = '⚠️ 请选择单张目标图或加载目标图文件夹！'
        addLog(message, 'warning')
        notify.warning('请选择单张目标图或加载目标图文件夹！')
        return
      }
    } else {
      // 文件夹模式：需要原图文件夹 + 目标图文件夹
      if (!originalImages[currentIndex] || !targetImages[currentIndex]) {
        const message = '⚠️ 请确保加载了原图文件夹和目标图文件夹！'
        addLog(message, 'warning')
        notify.warning('请确保加载了原图文件夹和目标图文件夹！')
        return
      }
    }

    try {
      // 使用当前索引+1作为文件名（第几对）
      const pairNumber = (currentIndex + 1).toString()

      // 保存标签文件
      await apiService.saveLabel(pairNumber, label.trim(), outputPath)

      // 复制并重命名图像文件
      let originalFile, targetFile

      if (singleImageMode) {
        // 单张原图模式
        originalFile = singleOriginalImage.filename
        // 优先使用单张目标图，否则使用目标图文件夹中的当前图
        targetFile = singleTargetImage ? singleTargetImage.filename : targetImages[currentIndex].filename
      } else {
        // 文件夹模式：原图和目标图一一对应
        originalFile = originalImages[currentIndex].filename
        targetFile = targetImages[currentIndex].filename
      }

      await apiService.copyRenameFiles(originalFile, targetFile, pairNumber, outputPath)

      // 更新进度
      let totalImages
      if (singleImageMode) {
        // 单张模式：如果有单张目标图就是1，否则是目标图文件夹的数量
        totalImages = singleTargetImage ? 1 : targetImages.length
      } else {
        // 文件夹模式：取两个文件夹的最小值
        totalImages = Math.min(originalImages.length, targetImages.length)
      }

      const newProgress = Math.round(((currentIndex + 1) / totalImages) * 100)
      setProgress(newProgress)

      addLog(`✅ 保存：第 ${currentIndex + 1} 对图像和标签`, 'success')
      notify.success(`第 ${currentIndex + 1} 对图像和标签已成功保存！`)

      // 清空输入并移动到下一对图像
      if (!fixedLabel) {
        setLabel('')
      }

      // 移动到下一张图像
      let maxIndex
      if (singleImageMode) {
        maxIndex = singleTargetImage ? 0 : targetImages.length - 1
      } else {
        maxIndex = Math.min(originalImages.length, targetImages.length) - 1
      }

      if (currentIndex < maxIndex) {
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
    let maxIndex

    if (singleImageMode) {
      // 单张模式：如果有单张目标图就只有1张，否则是目标图文件夹的数量
      maxIndex = singleTargetImage ? 1 : targetImages.length
    } else {
      // 文件夹模式：取两个文件夹的最小值
      maxIndex = Math.min(originalImages.length, targetImages.length)
    }

    if (newIndex >= 0 && newIndex < maxIndex) {
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
          {/* 模式切换按钮 */}
          <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
            <button
              className={`btn ${!singleImageMode ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => handleModeSwitch(false)}
              style={{ flex: 1, fontSize: '0.9rem', padding: '0.5rem' }}
            >
              📂 文件夹模式
            </button>
            <button
              className={`btn ${singleImageMode ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => handleModeSwitch(true)}
              style={{ flex: 1, fontSize: '0.9rem', padding: '0.5rem' }}
            >
              🖼️ 单张模式
            </button>
          </div>

          {/* 上传按钮 */}
          {singleImageMode ? (
            <button
              className="btn btn-primary"
              onClick={() => singleOriginalRef.current?.click()}
              style={{ width: '100%', marginBottom: '1.5rem' }}
            >
              🖼️ 加载单张原图
            </button>
          ) : (
            <button
              className="btn btn-primary"
              onClick={() => originalFilesRef.current?.click()}
              style={{ width: '100%', marginBottom: '1.5rem' }}
            >
              📂 加载原图文件夹
            </button>
          )}

          <div className="image-container">
            {singleImageMode ? (
              // 单张原图模式显示
              singleOriginalImage ? (
                <img
                  src={`http://localhost:3004${singleOriginalImage.path}`}
                  alt="单张原图"
                  className="image-preview"
                />
              ) : (
                <div style={{
                  fontSize: '1.2rem',
                  color: '#667eea',
                  fontWeight: '600'
                }}>
                  🖼️ 单张原图预览区
                </div>
              )
            ) : (
              // 文件夹模式显示
              originalImages[currentIndex] ? (
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
              )
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
          {/* 目标图上传按钮 */}
          {singleImageMode ? (
            <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn btn-primary"
                onClick={() => singleTargetRef.current?.click()}
                style={{ flex: 1, fontSize: '0.9rem', padding: '0.5rem' }}
              >
                🖼️ 单张目标图
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => targetFilesRef.current?.click()}
                style={{ flex: 1, fontSize: '0.9rem', padding: '0.5rem' }}
              >
                📂 目标图文件夹
              </button>
            </div>
          ) : (
            <button
              className="btn btn-primary"
              onClick={() => targetFilesRef.current?.click()}
              style={{ width: '100%', marginBottom: '1.5rem' }}
            >
              📂 加载目标图文件夹
            </button>
          )}

          <div className="image-container">
            {singleImageMode && singleTargetImage ? (
              // 单张目标图模式显示
              <img
                src={`http://localhost:3004${singleTargetImage.path}`}
                alt="单张目标图"
                className="image-preview"
              />
            ) : targetImages[currentIndex] ? (
              // 文件夹模式或单张原图+目标图文件夹模式显示
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

      {/* 隐藏的文件输入元素 */}
      <input
        type="file"
        ref={originalFilesRef}
        onChange={handleOriginalImagesUpload}
        multiple
        accept="image/*"
        style={{ display: 'none' }}
      />
      <input
        type="file"
        ref={targetFilesRef}
        onChange={handleTargetImagesUpload}
        multiple
        accept="image/*"
        style={{ display: 'none' }}
      />
      <input
        type="file"
        ref={singleOriginalRef}
        onChange={handleSingleOriginalUpload}
        accept="image/*"
        style={{ display: 'none' }}
      />
      <input
        type="file"
        ref={singleTargetRef}
        onChange={handleSingleTargetUpload}
        accept="image/*"
        style={{ display: 'none' }}
      />
    </div>
  )
}

export default KontextTool
