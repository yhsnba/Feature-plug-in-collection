// API配置
const getApiBaseUrl = () => {
  // 如果有环境变量，优先使用
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL
  }

  // 根据当前访问的主机名动态确定API地址
  const hostname = window.location.hostname
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3004/api'
  } else {
    // 使用相同的IP地址但不同端口
    return `http://${hostname}:3004/api`
  }
}

export const API_CONFIG = {
  BASE_URL: getApiBaseUrl(),
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3
}

// 文件配置
export const FILE_CONFIG = {
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  MAX_FILES_PER_UPLOAD: 100
}

// UI配置
export const UI_CONFIG = {
  NOTIFICATION_DURATION: 3000,
  ANIMATION_DURATION: 300,
  DEBOUNCE_DELAY: 500
}

// 工具配置
export const TOOL_CONFIG = {
  FLUX: {
    NAME: 'Flux IC-LoRA 拼接工具',
    ICON: '🖼️',
    DESCRIPTION: '智能图像拼接和标注工具'
  },
  KONTEXT: {
    NAME: 'KontextLora 标注工具',
    ICON: '📷',
    DESCRIPTION: '双图对比标注工具'
  },
  TAG: {
    NAME: '专业标注工具',
    ICON: '🎨',
    DESCRIPTION: '专业服装图像标注工具'
  }
}

// 错误消息
export const ERROR_MESSAGES = {
  NETWORK_ERROR: '网络连接失败，请检查网络设置',
  FILE_TOO_LARGE: '文件大小超过限制',
  INVALID_FILE_TYPE: '不支持的文件类型',
  UPLOAD_FAILED: '文件上传失败',
  SAVE_FAILED: '保存失败',
  LOAD_FAILED: '加载失败',
  INVALID_PATH: '无效的文件路径',
  PERMISSION_DENIED: '权限不足'
}

// 成功消息
export const SUCCESS_MESSAGES = {
  UPLOAD_SUCCESS: '文件上传成功',
  SAVE_SUCCESS: '保存成功',
  DELETE_SUCCESS: '删除成功',
  COPY_SUCCESS: '复制成功',
  EXPORT_SUCCESS: '导出成功'
}

// 默认配置
export const DEFAULT_CONFIG = {
  OUTPUT_PATH: 'E:\\挖藕\\素材\\测试\\cs',
  LABEL_TEMPLATE: '',
  AUTO_SAVE: false,
  SHOW_PREVIEW: true
}
