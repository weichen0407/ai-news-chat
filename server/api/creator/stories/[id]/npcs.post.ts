/**
 * 为剧情创建NPC
 */
import { getDB } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  try {
    const storyId = getRouterParam(event, 'id')
    
    if (!storyId) {
      throw createError({
        statusCode: 400,
        message: '缺少剧情ID'
      })
    }
    
    const body = await readBody(event)
    const { 
      name, 
      avatar, 
      age, 
      occupation, 
      profile,
      personality,
      skills,
      habits,
      likes,
      dislikes,
      background,
      goals,
      fears
    } = body
    
    if (!name) {
      throw createError({
        statusCode: 400,
        message: '请填写角色名称'
      })
    }
    
    const db = getDB()
    
    // 验证剧情是否存在
    const story = db.prepare('SELECT * FROM stories WHERE id = ?').get(storyId)
    
    if (!story) {
      throw createError({
        statusCode: 404,
        message: '剧情不存在'
      })
    }
    
    // 插入NPC
    const result = db.prepare(`
      INSERT INTO story_npcs (
        story_id, name, avatar, age, occupation, profile,
        personality, skills, habits, likes, dislikes,
        background, goals, fears, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(
      storyId,
      name,
      avatar || null,
      age ? parseInt(age) : null,
      occupation || null,
      profile || null,
      personality || null,
      skills || null,
      habits || null,
      likes || null,
      dislikes || null,
      background || null,
      goals || null,
      fears || null
    )
    
    return { 
      success: true, 
      npcId: result.lastInsertRowid,
      message: '角色创建成功'
    }
  } catch (error: any) {
    console.error('创建NPC失败:', error)
    return { 
      success: false, 
      error: error.message 
    }
  }
})

