import axios from 'axios'

const API_BASE = 'http://localhost:3004/api'

// 创建axios实例
const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000, // 30秒超时
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`)
    return config
  },
  (error) => {
    console.error('API Request Error:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`)
    return response
  },
  (error) => {
    console.error('API Response Error:', error)
    
    // 统一错误处理
    let errorMessage = '网络错误，请稍后重试'
    
    if (error.response) {
      // 服务器返回错误状态码
      errorMessage = error.response.data?.error || `服务器错误 (${error.response.status})`
    } else if (error.request) {
      // 请求发送但没有收到响应
      errorMessage = '无法连接到服务器，请检查网络连接'
    } else {
      // 其他错误
      errorMessage = error.message || '未知错误'
    }
    
    // 可以在这里添加全局错误提示
    console.error('Error Message:', errorMessage)
    
    return Promise.reject(new Error(errorMessage))
  }
)

// API方法
export const apiService = {
  // 上传单个文件
  uploadSingle: async (file) => {
    const formData = new FormData()
    formData.append('image', file)
    const response = await api.post('/upload-single', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  // 上传多个文件
  uploadMultiple: async (files) => {
    const formData = new FormData()
    files.forEach(file => formData.append('images', file))
    const response = await api.post('/upload-multiple', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  // 图像拼接
  mergeImages: async (leftImage, rightImage, outputPath = '', customName = '') => {
    const response = await api.post('/merge-images', {
      leftImage,
      rightImage,
      outputPath,
      customName,
    })
    return response.data
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
