/**
 * 初始化全部11个预设剧情（每个5个角色，共55个角色）
 */
import { getDB } from '~/server/utils/db'

// 读取预设剧情数据
import presetDramas from '~/server/data/preset-dramas.json'

function generateId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export default defineEventHandler(async (event) => {
  try {
    const db = getDB()
    
    // 检查是否已经初始化
    const existingCount = db.prepare('SELECT COUNT(*) as count FROM stories').get().count
    
    if (existingCount > 0) {
      return { 
        success: true, 
        message: '预设剧情已存在，无需重复初始化',
        totalStories: existingCount
      }
    }
    
    let totalStories = 0
    let totalNPCs = 0
    
    // 插入所有预设剧情和NPC
    for (const drama of presetDramas) {
      const storyId = generateId()
      
      db.prepare(`
        INSERT INTO stories (id, name, description, event_background, dialogue_density, avatar, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).run(
        storyId,
        drama.name,
        drama.description,
        drama.event_background,
        3,
        drama.avatar
      )
      
      totalStories++
      
      for (const npc of drama.npcs) {
        db.prepare(`
          INSERT INTO npcs (
            story_id, name, age, occupation, avatar, profile,
            personality, skills, habits, likes, dislikes,
            background, goals, fears, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `).run(
          storyId,
          npc.name,
          npc.age || null,
          npc.occupation || null,
          npc.avatar || null,
          npc.profile || null,
          npc.personality || null,
          npc.skills || null,
          npc.habits || null,
          npc.likes || null,
          npc.dislikes || null,
          npc.background || null,
          npc.goals || null,
          npc.fears || null
        )
        
        totalNPCs++
      }
    }
    
    return {
      success: true,
      message: `成功加载 ${totalStories} 个剧情和 ${totalNPCs} 个角色`,
      totalStories,
      totalNPCs
    }
    
  } catch (error: any) {
    console.error('初始化失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
})

