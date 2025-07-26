import { API_CONFIG } from '../constants'

// 健康检查函数
export const checkServerHealth = async () => {
  try {
    // 动态获取健康检查URL
    const hostname = window.location.hostname
    const healthUrl = hostname === 'localhost' || hostname === '127.0.0.1'
      ? 'http://localhost:3004/api/health'
      : `http://${hostname}:3004/api/health`

    const response = await fetch(healthUrl, {
      method: 'GET',
      timeout: 5000
    })
    
    if (response.ok) {
      const data = await response.json()
      return { healthy: true, data }
    } else {
      return { healthy: false, error: `Server returned ${response.status}` }
    }
  } catch (error) {
    return { healthy: false, error: error.message }
  }
}

// 等待服务器启动
export const waitForServer = async (maxAttempts = 30, interval = 1000) => {
  for (let i = 0; i < maxAttempts; i++) {
    const health = await checkServerHealth()
    if (health.healthy) {
      console.log('✅ 服务器连接成功')
      return true
    }
    
    console.log(`⏳ 等待服务器启动... (${i + 1}/${maxAttempts})`)
    await new Promise(resolve => setTimeout(resolve, interval))
  }
  
  console.error('❌ 服务器启动超时')
  return false
}

// 定期健康检查
export const startHealthMonitoring = (interval = 30000) => {
  const monitor = setInterval(async () => {
    const health = await checkServerHealth()
    if (!health.healthy) {
      console.warn('⚠️ 服务器健康检查失败:', health.error)
      // 可以在这里添加重连逻辑或用户提示
    }
  }, interval)
  
  return () => clearInterval(monitor)
}
