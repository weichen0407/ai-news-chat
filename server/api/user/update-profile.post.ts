import { getDB } from '~/server/utils/db'
import { getCurrentUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = await getCurrentUser(event)
  if (!user) {
    return { success: false, error: '请先登录' }
  }
  
  const body = await readBody(event)
  const { nickname, avatar, signature } = body
  
  if (!nickname) {
    return { success: false, error: '昵称不能为空' }
  }
  
  const db = getDB()
  
  try {
    db.prepare(
      'UPDATE users SET nickname = ?, avatar = ?, signature = ? WHERE id = ?'
    ).run(nickname, avatar || null, signature || '', user.id)
    
    return {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        nickname,
        avatar,
        signature
      }
    }
  } catch (error) {
    console.error('更新用户资料失败:', error)
    return { success: false, error: '更新失败' }
  }
})

