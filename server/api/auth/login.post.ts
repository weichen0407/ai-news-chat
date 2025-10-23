import { getDB } from '~/server/utils/db'
import { hashPassword, createSession } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { username, password } = body
  
  if (!username || !password) {
    return { success: false, error: '请填写用户名和密码' }
  }
  
  const db = getDB()
  
  // 查找用户
  const user = db.prepare(
    'SELECT id, username, nickname, avatar, password FROM users WHERE username = ?'
  ).get(username) as any
  
  if (!user) {
    return { success: false, error: '用户名或密码错误' }
  }
  
  // 验证密码
  const hashedPassword = hashPassword(password)
  if (user.password !== hashedPassword) {
    return { success: false, error: '用户名或密码错误' }
  }
  
  // 创建session
  const sessionId = createSession(user.id)
  
  // 设置cookie
  setCookie(event, 'session_id', sessionId, {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
    sameSite: 'lax'
  })
  
  return {
    success: true,
    user: {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      avatar: user.avatar
    }
  }
})

