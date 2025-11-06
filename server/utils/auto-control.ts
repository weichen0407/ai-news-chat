// 智能控制系统 - 管理自动对话和朋友圈生成
import { getDB } from './db'

interface AutoControlConfig {
  // Token控制
  dailyTokenLimit: number // 每日token限制
  tokenUsedToday: number // 今日已使用
  lastResetDate: string // 上次重置日期
  
  // 时间控制
  allowedHours: { start: number; end: number } // 允许运行的时间段
  
  // 在线检测
  requireOnlineUsers: boolean // 是否需要有在线用户才生成
  
  // 全局开关
  globalAutoEnabled: boolean // 全局自动化开关
}

// 默认配置
const DEFAULT_CONFIG: AutoControlConfig = {
  dailyTokenLimit: 100000, // 10万token/天
  tokenUsedToday: 0,
  lastResetDate: new Date().toISOString().split('T')[0],
  allowedHours: { start: 0, end: 24 }, // 全天
  requireOnlineUsers: false, // 不需要在线用户（暂未实现在线检测）
  globalAutoEnabled: true, // 全局开启
}

// 获取配置
export function getAutoControlConfig(): AutoControlConfig {
  const db = getDB()
  
  try {
    // 确保配置表存在
    db.exec(`
      CREATE TABLE IF NOT EXISTS auto_control_config (
        id INTEGER PRIMARY KEY,
        config TEXT NOT NULL
      )
    `)
    
    const row = db.prepare('SELECT config FROM auto_control_config WHERE id = 1').get() as any
    
    if (!row) {
      // 初始化配置
      db.prepare('INSERT INTO auto_control_config (id, config) VALUES (1, ?)').run(
        JSON.stringify(DEFAULT_CONFIG)
      )
      return DEFAULT_CONFIG
    }
    
    const config = JSON.parse(row.config)
    
    // 检查是否需要重置每日token
    const today = new Date().toISOString().split('T')[0]
    if (config.lastResetDate !== today) {
      config.tokenUsedToday = 0
      config.lastResetDate = today
      saveAutoControlConfig(config)
    }
    
    return config
  } catch (error) {
    console.error('获取自动控制配置失败:', error)
    return DEFAULT_CONFIG
  }
}

// 保存配置
export function saveAutoControlConfig(config: AutoControlConfig) {
  const db = getDB()
  
  try {
    db.prepare('UPDATE auto_control_config SET config = ? WHERE id = 1').run(
      JSON.stringify(config)
    )
  } catch (error) {
    console.error('保存自动控制配置失败:', error)
  }
}

// 检查是否允许生成
export function canGenerate(): { allowed: boolean; reason?: string } {
  const config = getAutoControlConfig()
  
  // 1. 检查全局开关
  if (!config.globalAutoEnabled) {
    return { allowed: false, reason: '全局自动化已关闭' }
  }
  
  // 2. 检查token限制
  if (config.tokenUsedToday >= config.dailyTokenLimit) {
    return { allowed: false, reason: `今日token额度已用完 (${config.tokenUsedToday}/${config.dailyTokenLimit})` }
  }
  
  // 3. 检查时间范围
  const currentHour = new Date().getHours()
  if (currentHour < config.allowedHours.start || currentHour >= config.allowedHours.end) {
    return { allowed: false, reason: `当前时间不在允许范围内 (${config.allowedHours.start}:00-${config.allowedHours.end}:00)` }
  }
  
  // 4. 检查是否需要在线用户（暂时跳过，因为在线检测未实现）
  // if (config.requireOnlineUsers) {
  //   const onlineCount = getOnlineUsersCount()
  //   if (onlineCount === 0) {
  //     return { allowed: false, reason: '当前无在线用户' }
  //   }
  // }
  
  return { allowed: true }
}

// 记录token使用
export function recordTokenUsage(tokens: number) {
  const config = getAutoControlConfig()
  config.tokenUsedToday += tokens
  saveAutoControlConfig(config)
  
  console.log(`📊 Token使用记录: +${tokens}, 今日总计: ${config.tokenUsedToday}/${config.dailyTokenLimit}`)
}

// 获取在线用户数（简化版，可以后续改进）
function getOnlineUsersCount(): number {
  // 这里可以实现更复杂的在线检测逻辑
  // 暂时返回0，表示需要手动控制
  return 0
}

// 估算token使用量
export function estimateTokens(text: string): number {
  // 简单估算：中文约1.5 tokens/字，英文约0.25 tokens/字
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length
  const englishWords = (text.match(/[a-zA-Z]+/g) || []).length
  return Math.ceil(chineseChars * 1.5 + englishWords * 0.25)
}

// 获取统计信息
export function getAutoControlStats() {
  const config = getAutoControlConfig()
  const db = getDB()
  
  // 统计今日生成次数
  const today = new Date().toISOString().split('T')[0]
  
  let messageCount = 0
  let momentCount = 0
  
  try {
    const result = db.prepare(`
      SELECT COUNT(*) as count 
      FROM messages 
      WHERE sender_type = 'npc' 
      AND date(created_at) = ?
    `).get(today) as any
    messageCount = result?.count || 0
  } catch (error) {
    console.error('统计消息数量失败:', error)
  }
  
  try {
    // 检查表是否存在
    const tableExists = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='moments'
    `).get() as any
    
    if (tableExists) {
      const result = db.prepare(`
        SELECT COUNT(*) as count 
        FROM moments 
        WHERE npc_id IS NOT NULL 
        AND date(created_at) = ?
      `).get(today) as any
      momentCount = result?.count || 0
    }
  } catch (error) {
    console.error('统计朋友圈数量失败:', error)
  }
  
  return {
    tokenUsed: config.tokenUsedToday,
    tokenLimit: config.dailyTokenLimit,
    tokenRemaining: Math.max(0, config.dailyTokenLimit - config.tokenUsedToday),
    tokenUsagePercent: Math.min(100, (config.tokenUsedToday / config.dailyTokenLimit) * 100),
    messagesGenerated: messageCount,
    momentsGenerated: momentCount,
    globalEnabled: config.globalAutoEnabled,
    allowedHours: config.allowedHours,
    requireOnlineUsers: config.requireOnlineUsers,
  }
}

// 紧急停止所有自动化
export function emergencyStopAll() {
  const config = getAutoControlConfig()
  config.globalAutoEnabled = false
  saveAutoControlConfig(config)
  
  // 同时关闭所有房间的自动模式
  const db = getDB()
  db.prepare('UPDATE rooms SET auto_mode = 0').run()
  
  console.log('🚨 紧急停止所有自动化')
}

