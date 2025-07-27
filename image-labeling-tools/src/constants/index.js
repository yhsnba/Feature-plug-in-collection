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

// 项目管理配置
export const PROJECT_CONFIG = {
  STATUS: {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    COMPLETED: 'completed',
    ARCHIVED: 'archived'
  },
  TYPES: {
    FLUX: 'flux',
    KONTEXT: 'kontext',
    TAG: 'tag',
    CUSTOM: 'custom'
  },
  PRIORITIES: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    URGENT: 'urgent'
  }
}

// 甲方管理配置
export const CLIENT_CONFIG = {
  STATUS: {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    POTENTIAL: 'potential'
  },
  TYPES: {
    ENTERPRISE: 'enterprise',
    STARTUP: 'startup',
    INDIVIDUAL: 'individual',
    GOVERNMENT: 'government'
  },
  INDUSTRIES: {
    ECOMMERCE: 'ecommerce',
    AI_ML: 'ai_ml',
    HEALTHCARE: 'healthcare',
    EDUCATION: 'education',
    FINANCE: 'finance',
    MANUFACTURING: 'manufacturing',
    OTHER: 'other'
  }
}

// 部署配置
export const DEPLOYMENT_CONFIG = {
  ENVIRONMENTS: {
    DEVELOPMENT: 'development',
    STAGING: 'staging',
    PRODUCTION: 'production'
  },
  PLATFORMS: {
    DOCKER: 'docker',
    VERCEL: 'vercel',
    NETLIFY: 'netlify',
    AWS: 'aws',
    CUSTOM: 'custom'
  },
  STATUS: {
    PENDING: 'pending',
    DEPLOYING: 'deploying',
    SUCCESS: 'success',
    FAILED: 'failed'
  }
}

// 任务管理配置
export const TASK_CONFIG = {
  STATUS: {
    TODO: 'todo',
    IN_PROGRESS: 'in_progress',
    IN_REVIEW: 'in_review',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
  },
  PRIORITIES: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    URGENT: 'urgent'
  },
  TYPES: {
    FEATURE: 'feature',
    BUG: 'bug',
    IMPROVEMENT: 'improvement',
    RESEARCH: 'research',
    DOCUMENTATION: 'documentation'
  },
  LABELS: {
    FRONTEND: 'frontend',
    BACKEND: 'backend',
    DESIGN: 'design',
    TESTING: 'testing',
    DEPLOYMENT: 'deployment'
  }
}

// 时间跟踪配置
export const TIME_TRACKING_CONFIG = {
  UNITS: {
    HOURS: 'hours',
    DAYS: 'days',
    WEEKS: 'weeks'
  },
  SESSION_STATUS: {
    ACTIVE: 'active',
    PAUSED: 'paused',
    STOPPED: 'stopped'
  }
}

// 服务权限配置
export const SERVICE_CONFIG = {
  // 可用服务类型
  SERVICES: {
    FLUX: 'flux',
    KONTEXT: 'kontext',
    TAG: 'tag',
    TASK_MANAGEMENT: 'task_management',
    TIME_TRACKING: 'time_tracking',
    PROGRESS_ANALYSIS: 'progress_analysis',
    DEPLOYMENT: 'deployment'
  },

  // 服务包配置
  PACKAGES: {
    BASIC: {
      id: 'basic',
      name: '基础版',
      services: ['kontext'],
      description: '仅包含Kontext标注工具'
    },
    STANDARD: {
      id: 'standard',
      name: '标准版',
      services: ['flux', 'kontext', 'task_management'],
      description: '包含Flux和Kontext工具，以及任务管理'
    },
    PROFESSIONAL: {
      id: 'professional',
      name: '专业版',
      services: ['flux', 'kontext', 'tag', 'task_management', 'time_tracking'],
      description: '包含所有标注工具和项目管理功能'
    },
    ENTERPRISE: {
      id: 'enterprise',
      name: '企业版',
      services: ['flux', 'kontext', 'tag', 'task_management', 'time_tracking', 'progress_analysis', 'deployment'],
      description: '包含所有功能'
    }
  },

  // 功能权限映射
  FEATURE_PERMISSIONS: {
    // 项目类型权限
    PROJECT_TYPES: {
      flux: ['flux'],
      kontext: ['kontext'],
      tag: ['tag'],
      custom: ['flux', 'kontext', 'tag'] // 自定义需要所有工具权限
    },

    // 功能模块权限
    MODULES: {
      task_manager: ['task_management'],
      time_tracker: ['time_tracking'],
      progress_analysis: ['progress_analysis'],
      deployment_manager: ['deployment']
    }
  }
}
