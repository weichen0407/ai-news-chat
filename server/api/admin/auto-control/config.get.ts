import { getCurrentUser } from '~/server/utils/auth'
import { getAutoControlConfig, getAutoControlStats } from '~/server/utils/auto-control'

export default defineEventHandler(async (event) => {
  const user = await getCurrentUser(event)
  if (!user) {
    return { success: false, error: '请先登录' }
  }
  
  try {
    const config = getAutoControlConfig()
    const stats = getAutoControlStats()
    
    return {
      success: true,
      config,
      stats
    }
  } catch (error) {
    console.error('获取自动控制配置失败:', error)
    return { success: false, error: '获取配置失败' }
  }
})

