import React, { useState, useRef } from 'react'
import { apiService, utils } from '../services/api'
import { notify } from './Notification'

function FluxTool() {
  const [leftImage, setLeftImage] = useState(null)
  const [rightImages, setRightImages] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [mergedImage, setMergedImage] = useState(null)
  const [label, setLabel] = useState('')
  const [log, setLog] = useState([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [outputPath, setOutputPath] = useState('')
  const [fixedLabel, setFixedLabel] = useState(false)
  const [processedFiles, setProcessedFiles] = useState([]) // 记录已处理的文件
  const [globalCounter, setGlobalCounter] = useState(1) // 全局计数器，跨组保持


  const leftFileRef = useRef()
  const rightFilesRef = useRef()

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString()
    setLog(prev => [...prev, { message, type, timestamp }])
  }

  const handleLeftImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      utils.validateImageFile(file)
      const response = await apiService.uploadSingle(file)
      setLeftImage(response)
      addLog(`✅ 左图上传成功: ${file.name}`, 'success')
      notify.success(`左图上传成功: ${file.name}`)
      updatePreview()
    } catch (error) {
      addLog(`❌ 左图上传失败: ${error.message}`, 'error')
      notify.error(`左图上传失败: ${error.message}`)
    }
  }

  const handleRightImagesUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    try {
      // 验证所有文件
      files.forEach(file => utils.validateImageFile(file))

      const response = await apiService.uploadMultiple(files)
      const sortedFiles = response.files.sort(utils.naturalSort)
      setRightImages(sortedFiles)
      setCurrentIndex(0)
      addLog(`✅ 右图文件夹加载完成，共 ${sortedFiles.length} 张图像`, 'success')
      notify.success(`右图文件夹加载完成，共 ${sortedFiles.length} 张图像`)
      updatePreview()
    } catch (error) {
      addLog(`❌ 右图上传失败: ${error.message}`, 'error')
      notify.error(`右图上传失败: ${error.message}`)
    }
  }

  const updatePreview = async () => {
    if (!leftImage || !rightImages[currentIndex]) {
      setMergedImage(null)
      return
    }

    try {
      setIsProcessing(true)
      // 使用全局计数器作为预览文件名
      const previewName = `preview-${globalCounter}`
      const response = await apiService.mergeImages(
        leftImage.filename,
        rightImages[currentIndex].filename,
        '', // 预览不使用输出路径
        previewName
      )
      setMergedImage(response)
    } catch (error) {
      addLog(`❌ 预览生成失败: ${error.message}`, 'error')
      notify.error(`预览生成失败: ${error.message}`)
      setMergedImage(null)
    } finally {
      setIsProcessing(false)
    }
  }

  const processOne = async () => {
    if (!leftImage || !rightImages[currentIndex] || !label.trim()) {
      const message = '⚠️ 请确保左图、右图和标签都已设置'
      addLog(message, 'warning')
      notify.warning('请确保左图、右图和标签都已设置')
      return
    }

    try {
      setIsProcessing(true)

      // 使用全局计数器作为文件名
      const finalName = globalCounter.toString()

      // 生成最终的拼接图片
      const mergeResponse = await apiService.mergeImages(
        leftImage.filename,
        rightImages[currentIndex].filename,
        outputPath,
        finalName
      )

      // 保存标签
      await apiService.saveLabel(finalName, label.trim(), outputPath)

      // 记录已处理的文件
      const processedFile = {
        index: currentIndex,
        imageNumber: globalCounter,
        mergedImage: mergeResponse.mergedImage,
        label: label.trim()
      }
      setProcessedFiles(prev => [...prev, processedFile])

      const message = `✅ 保存：第 ${globalCounter} 张拼接图和标签`
      addLog(message, 'success')
      notify.success(`第 ${globalCounter} 张拼接图和标签保存成功`)

      // 增加全局计数器
      setGlobalCounter(globalCounter + 1)

      // 移动到下一张
      if (currentIndex < rightImages.length - 1) {
        setCurrentIndex(currentIndex + 1)
        // 如果没有固定标签，清空标签
        if (!fixedLabel) {
          setLabel('')
        }
        updatePreview()
      } else {
        const completeMessage = '🎉 所有右图已处理完毕'
        addLog(completeMessage, 'success')
        notify.success('所有右图已处理完毕！')
      }
    } catch (error) {
      addLog(`❌ 处理失败: ${error.message}`, 'error')
      notify.error(`处理失败: ${error.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const undoLast = async () => {
    if (processedFiles.length === 0) {
      const message = '⚠️ 没有可以撤回的记录'
      addLog(message, 'warning')
      notify.warning('没有可以撤回的记录')
      return
    }

    try {
      // 获取最后一个处理的文件
      const lastProcessed = processedFiles[processedFiles.length - 1]

      // 删除合并的图像和标签文件（使用索引名称）
      const imageFileName = `${lastProcessed.imageNumber}.png`
      const labelFileName = `${lastProcessed.imageNumber}.txt`

      try {
        await apiService.deleteFile(imageFileName)
        addLog(`🗑️ 删除图片文件: ${imageFileName}`, 'info')
      } catch (error) {
        addLog(`⚠️ 删除图片文件失败: ${error.message}`, 'warning')
      }

      try {
        await apiService.deleteFile(labelFileName)
        addLog(`🗑️ 删除标签文件: ${labelFileName}`, 'info')
      } catch (error) {
        addLog(`⚠️ 删除标签文件失败: ${error.message}`, 'warning')
      }

      // 移除记录并恢复状态
      setProcessedFiles(prev => prev.slice(0, -1))
      setCurrentIndex(lastProcessed.index)
      setLabel(lastProcessed.label)
      setGlobalCounter(lastProcessed.imageNumber) // 恢复全局计数器

      addLog(`↩️ 撤回成功，恢复到第 ${lastProcessed.imageNumber} 张`, 'success')
      notify.success('撤回成功')
      updatePreview()
    } catch (error) {
      addLog(`❌ 撤回失败: ${error.message}`, 'error')
      notify.error(`撤回失败: ${error.message}`)
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

  const resetCounter = () => {
    const newStart = prompt('请输入新的起始编号：', '1')
    if (newStart && !isNaN(newStart) && parseInt(newStart) > 0) {
      const startNumber = parseInt(newStart)
      setGlobalCounter(startNumber)
      addLog(`🔄 计数器重置为: ${startNumber}`, 'info')
      notify.success(`计数器重置为: ${startNumber}`)
    }
  }

  React.useEffect(() => {
    updatePreview()
  }, [currentIndex, leftImage, rightImages])

  return (
    <div className="tool-container">
      <div className="tool-header">
        <h2>🖼️ Flux IC-LoRA 图像拼接工具</h2>
        <p>将左图与右图文件夹中的图片进行水平拼接，并添加标签</p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2.5rem',
        padding: '1.5rem',
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '15px',
        backdropFilter: 'blur(10px)'
      }}>
        <button className="btn btn-primary" onClick={() => leftFileRef.current?.click()}>
          🖼️ 选择左图
        </button>
        <button className="btn btn-primary" onClick={() => rightFilesRef.current?.click()}>
          📁 选择右图文件夹
        </button>
        <button className="btn btn-secondary" onClick={handleOutputPathSelect}>
          📂 设置输出路径
        </button>
        <button className="btn btn-secondary" onClick={resetCounter}>
          🔄 重置编号
        </button>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(102, 126, 234, 0.1)',
          borderRadius: '12px',
          padding: '1rem',
          border: '2px solid rgba(102, 126, 234, 0.2)'
        }}>
          <span style={{
            fontWeight: '600',
            color: '#2d3748',
            fontSize: '1.1rem'
          }}>
            📌 当前组：第 {currentIndex + 1} 张 / 共 {rightImages.length} 张<br/>
            🔢 下一张编号：第 {globalCounter} 张
          </span>
        </div>
      </div>

      <input
        ref={leftFileRef}
        type="file"
        accept="image/*"
        onChange={handleLeftImageUpload}
        style={{ display: 'none' }}
      />
      <input
        ref={rightFilesRef}
        type="file"
        accept="image/*"
        multiple
        webkitdirectory=""
        onChange={handleRightImagesUpload}
        style={{ display: 'none' }}
      />


      {leftImage && (
        <div className="form-group">
          <span className="form-label">左图路径: {leftImage.originalname}</span>
        </div>
      )}

      {rightImages.length > 0 && (
        <div className="form-group">
          <span className="form-label">右图: 已加载 {rightImages.length} 张图片</span>
        </div>
      )}

      {outputPath && (
        <div className="form-group">
          <span className="form-label">输出路径: {outputPath}</span>
        </div>
      )}

      {processedFiles.length > 0 && (
        <div className="form-group">
          <span className="form-label" style={{ color: '#28a745' }}>
            ✅ 已完成: {processedFiles.length} 张图片
          </span>
        </div>
      )}

      <div className="image-container" style={{ marginBottom: '2rem' }}>
        {isProcessing ? (
          <div>🔄 正在处理...</div>
        ) : mergedImage ? (
          <img 
            src={`http://localhost:3004${mergedImage.path}`}
            alt="拼接预览" 
            className="image-preview"
          />
        ) : (
          <div>📷 拼接预览区域</div>
        )}
      </div>

      <div className="form-group">
        <label className="form-label">🌿 标签输入：</label>
        <textarea
          className="form-textarea"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="请输入图像标签..."
        />
        <div style={{ marginTop: '0.5rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
            <input
              type="checkbox"
              checked={fixedLabel}
              onChange={(e) => setFixedLabel(e.target.checked)}
            />
            📌 固定标签（下一张时保持标签不变）
          </label>
        </div>
      </div>

      <div style={{
        display: 'flex',
        gap: '1.5rem',
        marginBottom: '2.5rem',
        justifyContent: 'center',
        flexWrap: 'wrap'
      }}>
        <button
          className="btn btn-success"
          onClick={processOne}
          disabled={isProcessing || !leftImage || !rightImages[currentIndex] || !label.trim() || !mergedImage}
          style={{ minWidth: '200px' }}
        >
          ✅ 保存第 {globalCounter} 张
        </button>
        <button
          className="btn btn-secondary"
          onClick={undoLast}
          disabled={isProcessing || processedFiles.length === 0}
          style={{ minWidth: '150px' }}
        >
          ↩️ 撤回上一步
        </button>
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
    </div>
  )
}

export default FluxTool
