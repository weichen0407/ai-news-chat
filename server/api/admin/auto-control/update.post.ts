import { getCurrentUser } from '~/server/utils/auth'
import { saveAutoControlConfig, getAutoControlConfig } from '~/server/utils/auto-control'

export default defineEventHandler(async (event) => {
  const user = await getCurrentUser(event)
  if (!user) {
    return { success: false, error: '请先登录' }
  }
  
  const body = await readBody(event)
  const { config } = body
  
  if (!config) {
    return { success: false, error: '缺少配置数据' }
  }
  
  try {
    // 合并配置
    const currentConfig = getAutoControlConfig()
    const newConfig = { ...currentConfig, ...config }
    
    saveAutoControlConfig(newConfig)
    
    console.log('✅ 更新自动控制配置:', newConfig)
    
    return {
      success: true,
      message: '配置更新成功',
      config: newConfig
    }
  } catch (error) {
    console.error('更新自动控制配置失败:', error)
    return { success: false, error: '更新配置失败' }
  }
})

