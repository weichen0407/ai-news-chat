import { getDB } from '~/server/utils/db'
import { getCurrentUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = await getCurrentUser(event)
  if (!user) {
    return { success: false, error: '请先登录' }
  }
  
  const body = await readBody(event)
  const {
    id,
    name,
    avatar,
    persona,
    profile,
    personality,
    habits,
    skills,
    likes,
    dislikes,
    age,
    occupation,
    background,
    goals,
    fears
  } = body
  
  if (!id) {
    return { success: false, error: '缺少NPC ID' }
  }
  
  if (!name) {
    return { success: false, error: '请输入NPC名称' }
  }
  
  const db = getDB()
  
  try {
    // 检查NPC是否存在
    const npc = db.prepare('SELECT id FROM npcs WHERE id = ?').get(id)
    if (!npc) {
      return { success: false, error: 'NPC不存在' }
    }
    
    // 更新NPC信息
    db.prepare(`
      UPDATE npcs SET
        name = ?,
        avatar = ?,
        persona = ?,
        profile = ?,
        personality = ?,
        habits = ?,
        skills = ?,
        likes = ?,
        dislikes = ?,
        age = ?,
        occupation = ?,
        background = ?,
        goals = ?,
        fears = ?
      WHERE id = ?
    `).run(
      name,
      avatar || null,
      persona || null,
      profile || null,
      personality || null,
      habits || null,
      skills || null,
      likes || null,
      dislikes || null,
      age || null,
      occupation || null,
      background || null,
      goals || null,
      fears || null,
      id
    )
    
    console.log(`✅ NPC更新成功: ${name} (ID: ${id})`)
    
    // 如果更新了avatar，记录格式
    if (avatar) {
      let avatarType = 'unknown'
      if (avatar.startsWith('data:image/webp')) avatarType = 'WebP (base64)'
      else if (avatar.startsWith('data:image/png')) avatarType = 'PNG (base64)'
      else if (avatar.startsWith('data:image/jpeg')) avatarType = 'JPEG (base64)'
      else if (avatar.startsWith('data:image/gif')) avatarType = 'GIF (base64)'
      else if (avatar.startsWith('http')) avatarType = 'HTTP URL'
      else avatarType = 'Emoji/Text'
      
      console.log(`   头像格式: ${avatarType}`)
    }
    
    return {
      success: true,
      message: 'NPC信息已更新'
    }
  } catch (error: any) {
    console.error('更新NPC失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
})

