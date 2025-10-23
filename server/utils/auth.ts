import { getDB } from './db'
import { createHash, randomBytes } from 'crypto'

// 简单的密码哈希
export function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex')
}

// 生成随机session ID
export function generateSessionId(): string {
  return randomBytes(32).toString('hex')
}

// 创建session
export function createSession(userId: number): string {
  const db = getDB()
  const sessionId = generateSessionId()
  const expiresAt = Date.now() + (7 * 24 * 60 * 60 * 1000) // 7天后过期
  
  db.prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)')
    .run(sessionId, userId, expiresAt)
  
  return sessionId
}

// 验证session
export function validateSession(sessionId: string): number | null {
  if (!sessionId) return null
  
  const db = getDB()
  const session = db.prepare('SELECT user_id, expires_at FROM sessions WHERE id = ?')
    .get(sessionId) as any
  
  if (!session) return null
  if (session.expires_at < Date.now()) {
    // Session过期，删除
    db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId)
    return null
  }
  
  return session.user_id
}

// 删除session
export function deleteSession(sessionId: string) {
  const db = getDB()
  db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId)
}

// 获取当前用户
export async function getCurrentUser(event: any) {
  const sessionId = getCookie(event, 'session_id')
  if (!sessionId) return null
  
  const userId = validateSession(sessionId)
  if (!userId) return null
  
  const db = getDB()
  const user = db.prepare('SELECT id, username, nickname, avatar FROM users WHERE id = ?')
    .get(userId) as any
  
  return user || null
}

