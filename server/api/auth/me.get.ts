import { getCurrentUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = await getCurrentUser(event)
  
  if (!user) {
    return { success: false, error: '未登录' }
  }
  
  return {
    success: true,
    user
  }
})

