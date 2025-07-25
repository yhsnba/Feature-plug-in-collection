import axios from 'axios'
import { API_CONFIG, ERROR_MESSAGES } from '../constants'
import { handleError, retry } from '../utils'

const API_BASE = API_CONFIG.BASE_URL

// 创建axios实例
const api = axios.create({
  baseURL: API_BASE,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 添加请求时间戳和请求ID
    config.metadata = {
      startTime: new Date(),
      requestId: Date.now().toString(36) + Math.random().toString(36).substr(2)
    }
    console.log(`🚀 API Request [${config.metadata.requestId}]: ${config.method?.toUpperCase()} ${config.url}`)
    return config
  },
  (error) => {
    console.error('❌ API Request Error:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    // 计算请求时间
    const endTime = new Date()
    const duration = endTime - response.config.metadata.startTime
    const requestId = response.config.metadata.requestId

    console.log(`✅ API Response [${requestId}]: ${response.status} ${response.config.url} (${duration}ms)`)
    return response
  },
  (error) => {
    const requestId = error.config?.metadata?.requestId || 'unknown'
    console.error(`❌ API Response Error [${requestId}]:`, error)

    // 使用统一的错误处理函数
    const errorMessage = handleError(error, 'API请求')
    return Promise.reject(new Error(errorMessage))
  }
)

// 带重试的API请求包装器
const withRetry = (apiCall, retries = API_CONFIG.RETRY_ATTEMPTS) => {
  return retry(apiCall, retries, 1000)
}

// API方法
export const apiService = {
  // 上传单个文件
  uploadSingle: async (file, onProgress) => {
    return withRetry(async () => {
      const formData = new FormData()
      formData.append('image', file)
      const response = await api.post('/upload-single', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: onProgress
      })
      return response.data
    })
  },

  // 上传多个文件
  uploadMultiple: async (files, onProgress) => {
    return withRetry(async () => {
      const formData = new FormData()
      files.forEach(file => formData.append('images', file))
      const response = await api.post('/upload-multiple', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: onProgress
      })
      return response.data
    })
  },

  // 图像拼接
  mergeImages: async (leftImage, rightImage, outputPath = '', customName = '') => {
    return withRetry(async () => {
      const response = await api.post('/merge-images', {
        leftImage,
        rightImage,
        outputPath,
        customName,
      })
      return response.data
    })
  },

  // 保存单张图片
  saveImage: async (sourceFilename, newFilename, outputPath = '') => {
    const response = await api.post('/save-image', {
      sourceFilename,
      newFilename,
      outputPath,
    })
    return response.data
  },

  // 保存标签
  saveLabel: async (filename, label, outputPath = '') => {
    const response = await api.post('/save-label', {
      filename,
      label,
      outputPath,
    })
    return response.data
  },

  // 删除文件
  deleteFile: async (filename) => {
    const response = await api.delete(`/delete-file/${filename}`)
    return response.data
  },

  // 获取文件列表
  getFiles: async () => {
    const response = await api.get('/files')
    return response.data
  },

  // 复制和重命名文件
  copyRenameFiles: async (originalFile, targetFile, baseName, outputPath = '') => {
    const response = await api.post('/copy-rename-files', {
      originalFile,
      targetFile,
      baseName,
      outputPath,
    })
    return response.data
  },
}

// 工具函数
export const utils = {
  // 自然排序
  naturalSort: (a, b) => {
    return a.originalname.localeCompare(b.originalname, undefined, { numeric: true })
  },

  // 格式化文件大小
  formatFileSize: (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  },

  // 验证图片文件
  validateImageFile: (file) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
    const maxSize = 10 * 1024 * 1024 // 10MB
    
    if (!allowedTypes.includes(file.type)) {
      throw new Error('只支持 JPEG、PNG、GIF 格式的图片')
    }
    
    if (file.size > maxSize) {
      throw new Error('文件大小不能超过 10MB')
    }
    
    return true
  },

  // 生成时间戳
  getTimestamp: () => {
    return new Date().toLocaleString('zh-CN')
  },
}

export default api
