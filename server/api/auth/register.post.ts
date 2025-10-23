import { getDB } from '~/server/utils/db'
import { hashPassword, createSession } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { username, password, nickname } = body
  
  if (!username || !password || !nickname) {
    return { success: false, error: '请填写完整信息' }
  }
  
  if (username.length < 3 || password.length < 6) {
    return { success: false, error: '用户名至少3个字符，密码至少6个字符' }
  }
  
  const db = getDB()
  
  // 检查用户名是否已存在
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username)
  if (existing) {
    return { success: false, error: '用户名已被使用' }
  }
  
  // 创建用户
  const hashedPassword = hashPassword(password)
  const result = db.prepare(
    'INSERT INTO users (username, password, nickname) VALUES (?, ?, ?)'
  ).run(username, hashedPassword, nickname)
  
  const userId = result.lastInsertRowid as number
  
  // 创建session
  const sessionId = createSession(userId)
  
  // 设置cookie
  setCookie(event, 'session_id', sessionId, {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60, // 7天
    path: '/',
    sameSite: 'lax'
  })
  
  return {
    success: true,
    user: {
      id: userId,
      username,
      nickname
    }
  }
})

