import { getDB } from '~/server/utils/db'
import { getCurrentUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = await getCurrentUser(event)
  if (!user) {
    return { success: false, error: '请先登录' }
  }
  
  const body = await readBody(event)
  const { avatar } = body
  
  if (!avatar) {
    return { success: false, error: '请提供头像数据' }
  }
  
  const db = getDB()
  
  try {
    db.prepare('UPDATE users SET avatar = ? WHERE id = ?')
      .run(avatar, user.id)
    
    return {
      success: true
    }
  } catch (error) {
    console.error('更新头像失败:', error)
    return { success: false, error: '更新头像失败' }
  }
})

