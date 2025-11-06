import { getCurrentUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  try {
    const user = await getCurrentUser(event)
    
    if (!user) {
      return { 
        success: false, 
        user: null 
      }
    }
    
    return {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        avatar: user.avatar
      }
    }
  } catch (error) {
    console.error('获取session失败:', error)
    return { 
      success: false, 
      user: null,
      error: '获取session失败'
    }
  }
})

