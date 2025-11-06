import { getCurrentUser } from '~/server/utils/auth'
import { emergencyStopAll } from '~/server/utils/auto-control'

export default defineEventHandler(async (event) => {
  const user = await getCurrentUser(event)
  if (!user) {
    return { success: false, error: '请先登录' }
  }
  
  try {
    emergencyStopAll()
    
    return {
      success: true,
      message: '已紧急停止所有自动化功能'
    }
  } catch (error) {
    console.error('紧急停止失败:', error)
    return { success: false, error: '操作失败' }
  }
})

