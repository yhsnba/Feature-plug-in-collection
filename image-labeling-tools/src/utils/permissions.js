import { SERVICE_CONFIG } from '../constants'

/**
 * 权限检查工具类
 */
export class PermissionManager {
  /**
   * 检查甲方是否有指定服务权限
   * @param {Object} client - 甲方对象
   * @param {string} service - 服务名称
   * @returns {boolean}
   */
  static hasService(client, service) {
    if (!client || !client.services) {
      return false
    }
    return client.services.includes(service)
  }

  /**
   * 检查甲方是否可以创建指定类型的项目
   * @param {Object} client - 甲方对象
   * @param {string} projectType - 项目类型
   * @returns {boolean}
   */
  static canCreateProjectType(client, projectType) {
    if (!client || !projectType) {
      return false
    }

    const requiredServices = SERVICE_CONFIG.FEATURE_PERMISSIONS.PROJECT_TYPES[projectType]
    if (!requiredServices) {
      return false
    }

    // 检查是否拥有所有必需的服务
    return requiredServices.every(service => this.hasService(client, service))
  }

  /**
   * 检查项目是否可以使用指定功能模块
   * @param {Object} project - 项目对象
   * @param {Object} client - 甲方对象
   * @param {string} module - 功能模块名称
   * @returns {boolean}
   */
  static canUseModule(project, client, module) {
    if (!project || !client || !module) {
      return false
    }

    const requiredServices = SERVICE_CONFIG.FEATURE_PERMISSIONS.MODULES[module]
    if (!requiredServices) {
      return false
    }

    // 检查甲方是否拥有所有必需的服务
    return requiredServices.every(service => this.hasService(client, service))
  }

  /**
   * 获取甲方可用的项目类型列表
   * @param {Object} client - 甲方对象
   * @returns {Array} 可用的项目类型数组
   */
  static getAvailableProjectTypes(client) {
    if (!client) {
      return []
    }

    const availableTypes = []
    const projectTypes = SERVICE_CONFIG.FEATURE_PERMISSIONS.PROJECT_TYPES

    for (const [type, requiredServices] of Object.entries(projectTypes)) {
      if (requiredServices.every(service => this.hasService(client, service))) {
        availableTypes.push(type)
      }
    }

    return availableTypes
  }

  /**
   * 获取项目可用的功能模块列表
   * @param {Object} project - 项目对象
   * @param {Object} client - 甲方对象
   * @returns {Array} 可用的功能模块数组
   */
  static getAvailableModules(project, client) {
    if (!project || !client) {
      return []
    }

    const availableModules = []
    const modules = SERVICE_CONFIG.FEATURE_PERMISSIONS.MODULES

    for (const [module, requiredServices] of Object.entries(modules)) {
      if (requiredServices.every(service => this.hasService(client, service))) {
        availableModules.push(module)
      }
    }

    return availableModules
  }

  /**
   * 获取服务包信息
   * @param {string} packageId - 服务包ID
   * @returns {Object|null} 服务包信息
   */
  static getPackageInfo(packageId) {
    if (!packageId) return null
    return SERVICE_CONFIG.PACKAGES[packageId.toUpperCase()] || null
  }

  /**
   * 根据服务包ID获取服务列表
   * @param {string} packageId - 服务包ID
   * @returns {Array} 服务列表
   */
  static getServicesFromPackage(packageId) {
    const packageInfo = this.getPackageInfo(packageId)
    return packageInfo ? packageInfo.services : []
  }

  /**
   * 检查甲方权限摘要
   * @param {Object} client - 甲方对象
   * @returns {Object} 权限摘要
   */
  static getPermissionSummary(client) {
    if (!client) {
      return {
        hasServices: false,
        availableProjectTypes: [],
        availableModules: [],
        packageInfo: null
      }
    }

    return {
      hasServices: client.services && client.services.length > 0,
      availableProjectTypes: this.getAvailableProjectTypes(client),
      availableModules: Object.keys(SERVICE_CONFIG.FEATURE_PERMISSIONS.MODULES).filter(
        module => this.canUseModule({}, client, module)
      ),
      packageInfo: client.package ? this.getPackageInfo(client.package) : null,
      services: client.services || []
    }
  }

  /**
   * 验证甲方数据完整性
   * @param {Object} client - 甲方对象
   * @returns {Object} 验证结果
   */
  static validateClient(client) {
    const errors = []
    const warnings = []

    if (!client) {
      errors.push('甲方对象不存在')
      return { isValid: false, errors, warnings }
    }

    if (!client.services || !Array.isArray(client.services)) {
      errors.push('甲方服务配置缺失或格式错误')
    } else if (client.services.length === 0) {
      warnings.push('甲方未配置任何服务')
    }

    if (!client.package) {
      warnings.push('甲方未指定服务包')
    } else if (!this.getPackageInfo(client.package)) {
      errors.push('甲方服务包配置无效')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }
}

/**
 * 便捷的权限检查函数
 */
export const checkPermission = {
  hasService: (client, service) => PermissionManager.hasService(client, service),
  canCreateProject: (client, type) => PermissionManager.canCreateProjectType(client, type),
  canUseModule: (project, client, module) => PermissionManager.canUseModule(project, client, module)
}

export default PermissionManager
