import { FILE_CONFIG, ERROR_MESSAGES } from '../constants'

// 文件验证工具
export const validateFile = (file) => {
  const errors = []
  
  if (!file) {
    errors.push('请选择文件')
    return { isValid: false, errors }
  }
  
  if (file.size > FILE_CONFIG.MAX_FILE_SIZE) {
    errors.push(ERROR_MESSAGES.FILE_TOO_LARGE)
  }
  
  if (!FILE_CONFIG.ALLOWED_IMAGE_TYPES.includes(file.type)) {
    errors.push(ERROR_MESSAGES.INVALID_FILE_TYPE)
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// 批量文件验证
export const validateFiles = (files) => {
  const fileArray = Array.from(files)
  const results = fileArray.map(validateFile)
  const allValid = results.every(result => result.isValid)
  const allErrors = results.flatMap(result => result.errors)
  
  if (fileArray.length > FILE_CONFIG.MAX_FILES_PER_UPLOAD) {
    allErrors.push(`最多只能上传 ${FILE_CONFIG.MAX_FILES_PER_UPLOAD} 个文件`)
  }
  
  return {
    isValid: allValid && fileArray.length <= FILE_CONFIG.MAX_FILES_PER_UPLOAD,
    errors: [...new Set(allErrors)] // 去重
  }
}

// 格式化文件大小
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 防抖函数
export const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// 节流函数
export const throttle = (func, limit) => {
  let inThrottle
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// 生成唯一ID
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// 深拷贝
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj.getTime())
  if (obj instanceof Array) return obj.map(item => deepClone(item))
  if (typeof obj === 'object') {
    const clonedObj = {}
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key])
      }
    }
    return clonedObj
  }
}

// 路径处理
export const normalizePath = (path) => {
  if (!path) return ''
  return path.replace(/\\/g, '/').replace(/\/+/g, '/')
}

// 获取文件扩展名
export const getFileExtension = (filename) => {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2)
}

// 获取文件名（不含扩展名）
export const getFileNameWithoutExtension = (filename) => {
  return filename.replace(/\.[^/.]+$/, '')
}

// 错误处理
export const handleError = (error, context = '') => {
  console.error(`Error in ${context}:`, error)
  
  if (error.response) {
    // API错误
    return error.response.data?.message || ERROR_MESSAGES.NETWORK_ERROR
  } else if (error.request) {
    // 网络错误
    return ERROR_MESSAGES.NETWORK_ERROR
  } else {
    // 其他错误
    return error.message || '未知错误'
  }
}

// 重试机制
export const retry = async (fn, attempts = 3, delay = 1000) => {
  try {
    return await fn()
  } catch (error) {
    if (attempts <= 1) {
      throw error
    }
    await new Promise(resolve => setTimeout(resolve, delay))
    return retry(fn, attempts - 1, delay * 2)
  }
}

// 本地存储工具
export const storage = {
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch {
      return defaultValue
    }
  },
  
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch {
      return false
    }
  },
  
  remove: (key) => {
    try {
      localStorage.removeItem(key)
      return true
    } catch {
      return false
    }
  },
  
  clear: () => {
    try {
      localStorage.clear()
      return true
    } catch {
      return false
    }
  }
}
