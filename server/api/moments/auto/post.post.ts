/**
 * 自动发帖：随机选择NPC发布朋友圈
 */
import Database from 'better-sqlite3'
import { join } from 'path'

export default defineEventHandler(async (event) => {
  try {
    const appDb = new Database(join(process.cwd(), 'data', 'app.db'))
    
    // 获取所有NPC
    const allNpcs = appDb.prepare(`SELECT id FROM npcs`).all()
    appDb.close()
    
    if (allNpcs.length === 0) {
      return { success: true, count: 0, message: '没有可用的NPC' }
    }
    
    // 随机选择1-3个NPC
    const count = Math.min(Math.floor(Math.random() * 3) + 1, allNpcs.length)
    const selectedNpcs = []
    
    for (let i = 0; i < count; i++) {
      const randomIndex = Math.floor(Math.random() * allNpcs.length)
      const npc = allNpcs[randomIndex] as any
      if (!selectedNpcs.includes(npc.id)) {
        selectedNpcs.push(npc.id)
      }
    }
    
    // 为每个选中的NPC生成朋友圈
    const results = []
    for (const npcId of selectedNpcs) {
      try {
        const response = await $fetch('/api/moments/ai-generate', {
          method: 'POST',
          body: { npc_id: npcId }
        })
        results.push(response)
      } catch (error) {
        console.error(`NPC ${npcId} 发布失败:`, error)
      }
    }
    
    const successCount = results.filter(r => r.success).length
    
    return {
      success: true,
      count: successCount,
      total: selectedNpcs.length
    }
  } catch (error: any) {
    console.error('自动发帖失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
})

