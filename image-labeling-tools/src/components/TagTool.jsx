import React, { useState, useRef } from 'react'
import { apiService, utils } from '../services/api'
import { notify } from './Notification'

// 映射字典
const angleMap = {
  '特写': 'close-up',
  '近景': 'medium close-up',
  '中景': 'medium shot',
  '全景': 'full shot'
}

const directionMap = {
  '正面': ['Front View', 'Shoot in front of the subject'],
  '背面': ['Back View', 'Shoot behind the subject'],
  '左侧': ['Left Side View', 'Shoot on the left side of the subject'],
  '右侧': ['Right Side View', 'Shoot on the right side of the subject'],
  '左前方': ['Front-Left View', 'Shoot from the front left of the subject'],
  '右前方': ['Front-Right View', 'Shoot from the front right of the subject'],
  '左后方': ['Rear-Left View', 'Shoot from the rear left of the subject'],
  '右后方': ['Rear-Right View', 'Shoot from the rear right of the subject']
}

const compositionMap = {
  '仰拍': 'Low - Angle Shot',
  '平拍': 'Eye - level shot',
  '俯拍': 'Overhead Shot'
}

function TagTool() {
  const [images, setImages] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [formData, setFormData] = useState({
    trigger: 'yimadaiclothing',
    structure: '',
    angle: '特写',
    direction: '正面',
    composition: '平拍',
    namingPrefix: ''
  })
  const [progress, setProgress] = useState(0)
  const [outputPath, setOutputPath] = useState('')
  const [fixedLabel, setFixedLabel] = useState(false)
  const [log, setLog] = useState([])

  const filesRef = useRef()

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

  const handleImagesUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    try {
      // 验证所有文件
      files.forEach(file => utils.validateImageFile(file))

      const response = await apiService.uploadMultiple(files)
      // 按文件名自然排序
      const sortedFiles = response.files.sort(utils.naturalSort)
      setImages(sortedFiles)
      setCurrentIndex(0)
      setProgress(0)
      addLog(`✅ 图片加载成功，共 ${sortedFiles.length} 张图片`, 'success')
      notify.success(`图片加载成功，共 ${sortedFiles.length} 张图片`)
    } catch (error) {
      addLog(`❌ 图片上传失败: ${error.message}`, 'error')
      notify.error(`图片上传失败: ${error.message}`)
    }
  }

  const saveAndNext = async () => {
    if (!images[currentIndex] || !formData.trigger.trim() || !formData.structure.trim()) {
      const message = '⚠️ 请输入触发词和服装结构描述'
      addLog(message, 'warning')
      notify.warning('请输入触发词和服装结构描述')
      return
    }

    try {
      const angle = angleMap[formData.angle]
      const [directionView, directionDesc] = directionMap[formData.direction]
      const composition = compositionMap[formData.composition]

      const label = `${formData.trigger}, ${formData.structure}, ${angle}, ${directionView}, ${directionDesc}, ${composition}`

      // 使用当前索引+1作为文件名（第几张）
      const imageNumber = (currentIndex + 1).toString()

      // 保存当前图片到输出路径
      await apiService.saveImage(images[currentIndex].filename, imageNumber, outputPath)

      // 保存标签文件
      await apiService.saveLabel(imageNumber, label, outputPath)

      // 更新进度
      const newProgress = Math.round(((currentIndex + 1) / images.length) * 100)
      setProgress(newProgress)

      addLog(`✅ 保存：第 ${currentIndex + 1} 张图片和标签`, 'success')
      notify.success(`第 ${currentIndex + 1} 张图片和标签保存成功！`)

      // 移动到下一张
      if (currentIndex < images.length - 1) {
        setCurrentIndex(currentIndex + 1)
        // 如果没有固定标签，只清空可变字段
        if (!fixedLabel) {
          setFormData(prev => ({
            ...prev,
            structure: '',
            namingPrefix: ''
          }))
        }
      } else {
        // 所有图片处理完成，询问是否生成训练配置
        addLog('🎉 所有图片已处理完毕', 'success')
        const shouldGenerateConfig = window.confirm('🎯 所有图片已打标完成，是否自动生成训练参数文件？')
        if (shouldGenerateConfig) {
          try {
            await apiService.saveLabel('训练配置', '# 待自动填充训练参数\n', outputPath)
            addLog('✅ 已生成配置文件: 训练配置.toml', 'success')
            notify.success('✅ 已生成配置文件: 训练配置.toml')
          } catch (error) {
            addLog(`❌ 配置文件生成失败: ${error.message}`, 'error')
            notify.error(`配置文件生成失败: ${error.message}`)
          }
        } else {
          addLog('🎉 所有图片已完成标注！', 'success')
          notify.success('🎉 所有图片已完成标注！')
        }
      }
    } catch (error) {
      addLog(`❌ 保存失败: ${error.message}`, 'error')
      notify.error(`保存失败: ${error.message}`)
    }
  }

  const goBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      // 如果没有固定标签，清空可变字段
      if (!fixedLabel) {
        setFormData(prev => ({
          ...prev,
          structure: '',
          namingPrefix: ''
        }))
      }
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <div className="tool-container">
      <div className="tool-header">
        <h2>🎨 专业标注工具</h2>
        <p>专门用于服装图像的专业标注，支持多字段标注和自定义命名</p>
      </div>

      <div className="image-container" style={{
        marginBottom: '2.5rem',
        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05), rgba(118, 75, 162, 0.05))',
        border: '3px solid rgba(102, 126, 234, 0.2)'
      }}>
        {images[currentIndex] ? (
          <img
            src={`http://localhost:3004${images[currentIndex].path}`}
            alt="当前图片"
            className="image-preview"
          />
        ) : (
          <div style={{
            fontSize: '1.3rem',
            color: '#667eea',
            fontWeight: '600'
          }}>
            🖼️ 图片预览区
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
        <div className="form-group">
          <label className="form-label">🧬 触发词</label>
          <input
            type="text"
            className="form-input"
            value={formData.trigger}
            onChange={(e) => handleInputChange('trigger', e.target.value)}
            placeholder="输入触发词（例如：yimadaiclothing）"
          />
        </div>

        <div className="form-group">
          <label className="form-label">👕 服装结构</label>
          <input
            type="text"
            className="form-input"
            value={formData.structure}
            onChange={(e) => handleInputChange('structure', e.target.value)}
            placeholder="请输入服装结构描述（英文）"
          />
        </div>

        <div className="form-group">
          <label className="form-label">📐 拍摄景别</label>
          <select
            className="form-select"
            value={formData.angle}
            onChange={(e) => handleInputChange('angle', e.target.value)}
          >
            {Object.keys(angleMap).map(key => (
              <option key={key} value={key}>{key}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">🧭 拍摄方位</label>
          <select
            className="form-select"
            value={formData.direction}
            onChange={(e) => handleInputChange('direction', e.target.value)}
          >
            {Object.keys(directionMap).map(key => (
              <option key={key} value={key}>{key}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">📷 构图角度</label>
          <select
            className="form-select"
            value={formData.composition}
            onChange={(e) => handleInputChange('composition', e.target.value)}
          >
            {Object.keys(compositionMap).map(key => (
              <option key={key} value={key}>{key}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">📛 图片命名前缀</label>
          <input
            type="text"
            className="form-input"
            value={formData.namingPrefix}
            onChange={(e) => handleInputChange('namingPrefix', e.target.value)}
            placeholder="输入图片前缀名称"
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">📊 进度：</label>
        <div className="progress">
          <div 
            className="progress-bar" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
          第 {currentIndex + 1} 张 / 共 {images.length} 张 ({progress}%)
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem',
        padding: '1.5rem',
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '15px',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <button
          className="btn btn-primary"
          onClick={() => filesRef.current?.click()}
        >
          📂 选择图片目录
        </button>
        <button className="btn btn-secondary" onClick={handleOutputPathSelect}>
          📂 设置输出路径
        </button>
        <button
          className="btn btn-success"
          onClick={saveAndNext}
          disabled={!images[currentIndex] || !formData.trigger.trim() || !formData.structure.trim()}
        >
          💾 保存第 {currentIndex + 1} 张
        </button>
        <button
          className="btn btn-secondary"
          onClick={goBack}
          disabled={currentIndex <= 0}
        >
          ◀️ 上一张
        </button>
      </div>

      {outputPath && (
        <div className="form-group" style={{ marginBottom: '1rem' }}>
          <span className="form-label">输出路径: {outputPath}</span>
        </div>
      )}

      <div className="form-group" style={{ marginBottom: '2rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
          <input
            type="checkbox"
            checked={fixedLabel}
            onChange={(e) => setFixedLabel(e.target.checked)}
          />
          📌 固定标签（下一张时保持触发词和选项不变，只清空结构描述和命名前缀）
        </label>
      </div>

      <input
        ref={filesRef}
        type="file"
        accept="image/*"
        multiple
        webkitdirectory=""
        onChange={handleImagesUpload}
        style={{ display: 'none' }}
      />


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
        💡 提示：填写完所有必要字段后，点击"保存并下一张"来处理图片
      </div>
    </div>
  )
}

export default TagTool
