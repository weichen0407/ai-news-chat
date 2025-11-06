/**
 * 时间格式化工具 - 北京时间（东八区 UTC+8）
 */

/**
 * 获取北京时间
 */
export function getBeijingTime(date?: Date | string | number): Date {
  let d: Date
  
  if (date) {
    if (typeof date === 'string') {
      // SQLite 返回的时间格式: "YYYY-MM-DD HH:MM:SS"
      // 需要明确告诉 JavaScript 这是 UTC 时间
      if (date.includes(' ') && !date.includes('T') && !date.includes('Z')) {
        // 格式化为 ISO 8601 格式并标记为 UTC
        d = new Date(date.replace(' ', 'T') + 'Z')
      } else {
        d = new Date(date)
      }
    } else {
      d = new Date(date)
    }
  } else {
    d = new Date()
  }
  
  // 直接将 UTC 时间加上 8 小时得到北京时间
  const beijingTime = new Date(d.getTime() + 8 * 60 * 60 * 1000)
  
  return beijingTime
}

/**
 * 格式化为相对时间（中文）
 * 如：刚刚、3分钟前、2小时前、昨天、3天前
 */
export function formatRelativeTime(date: Date | string | number): string {
  // 获取当前北京时间
  const now = new Date(Date.now() + 8 * 60 * 60 * 1000)
  
  // 处理目标时间
  let targetUtc: Date
  if (typeof date === 'string') {
    // SQLite 格式: "YYYY-MM-DD HH:MM:SS" (UTC)
    if (date.includes(' ') && !date.includes('T') && !date.includes('Z')) {
      targetUtc = new Date(date.replace(' ', 'T') + 'Z')
    } else {
      targetUtc = new Date(date)
    }
  } else {
    targetUtc = new Date(date)
  }
  
  // 转换为北京时间
  const target = new Date(targetUtc.getTime() + 8 * 60 * 60 * 1000)
  
  const diff = now.getTime() - target.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (seconds < 0) {
    return '刚刚' // 未来的时间也显示为"刚刚"
  } else if (seconds < 60) {
    return '刚刚'
  } else if (minutes < 60) {
    return `${minutes}分钟前`
  } else if (hours < 24) {
    return `${hours}小时前`
  } else if (days === 1) {
    return '昨天'
  } else if (days < 7) {
    return `${days}天前`
  } else {
    // 超过7天，显示日期
    const year = target.getFullYear()
    const month = String(target.getMonth() + 1).padStart(2, '0')
    const day = String(target.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
}

/**
 * 格式化为完整日期时间（北京时间）
 * 如：2024-01-15 14:30:25
 */
export function formatBeijingDateTime(date: Date | string | number): string {
  const d = getBeijingTime(date)
  
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hour = String(d.getHours()).padStart(2, '0')
  const minute = String(d.getMinutes()).padStart(2, '0')
  const second = String(d.getSeconds()).padStart(2, '0')
  
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`
}

/**
 * 格式化为日期（北京时间）
 * 如：2024-01-15
 */
export function formatBeijingDate(date: Date | string | number): string {
  const d = getBeijingTime(date)
  
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  
  return `${year}-${month}-${day}`
}

/**
 * 格式化为时间（北京时间）
 * 如：14:30
 */
export function formatBeijingTime(date: Date | string | number): string {
  const d = getBeijingTime(date)
  
  const hour = String(d.getHours()).padStart(2, '0')
  const minute = String(d.getMinutes()).padStart(2, '0')
  
  return `${hour}:${minute}`
}

/**
 * 格式化为中文日期时间
 * 如：2024年1月15日 14:30
 */
export function formatChineseDateTime(date: Date | string | number): string {
  const d = getBeijingTime(date)
  
  const year = d.getFullYear()
  const month = d.getMonth() + 1
  const day = d.getDate()
  const hour = String(d.getHours()).padStart(2, '0')
  const minute = String(d.getMinutes()).padStart(2, '0')
  
  return `${year}年${month}月${day}日 ${hour}:${minute}`
}

/**
 * 获取当前北京时间字符串
 */
export function getNowBeijingTime(): string {
  return formatBeijingDateTime(new Date())
}

/**
 * 判断是否为今天（北京时间）
 */
export function isToday(date: Date | string | number): boolean {
  const now = getBeijingTime()
  const target = getBeijingTime(date)
  
  return now.getFullYear() === target.getFullYear() &&
         now.getMonth() === target.getMonth() &&
         now.getDate() === target.getDate()
}

/**
 * 判断是否为昨天（北京时间）
 */
export function isYesterday(date: Date | string | number): boolean {
  const now = getBeijingTime()
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const target = getBeijingTime(date)
  
  return yesterday.getFullYear() === target.getFullYear() &&
         yesterday.getMonth() === target.getMonth() &&
         yesterday.getDate() === target.getDate()
}

/**
 * 智能格式化时间（根据时间远近自动选择格式）
 */
export function smartFormatTime(date: Date | string | number): string {
  const target = getBeijingTime(date)
  
  if (isToday(target)) {
    return formatBeijingTime(target)
  } else if (isYesterday(target)) {
    return `昨天 ${formatBeijingTime(target)}`
  } else {
    const now = getBeijingTime()
    const diff = now.getTime() - target.getTime()
    const days = Math.floor(diff / (24 * 60 * 60 * 1000))
    
    if (days < 7) {
      return `${days}天前`
    } else if (target.getFullYear() === now.getFullYear()) {
      // 同一年，只显示月日
      return `${target.getMonth() + 1}月${target.getDate()}日`
    } else {
      // 不同年，显示完整日期
      return formatBeijingDate(target)
    }
  }
}

