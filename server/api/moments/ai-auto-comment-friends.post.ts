/**
 * 好友NPC自动评论玩家的朋友圈
 */
import Database from 'better-sqlite3'
import { join } from 'path'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { moment_id, user_id } = body
    
    if (!moment_id || !user_id) {
      throw new Error('朋友圈ID和用户ID不能为空')
    }
    
    console.log(`🤖 触发好友NPC自动评论: moment=${moment_id}, user=${user_id}`)
    
    // 获取用户的所有好友NPC
    const appDb = new Database(join(process.cwd(), 'data', 'app.db'))
    
    const friendNpcsStmt = appDb.prepare(`
      SELECT DISTINCT n.id, n.name
      FROM npcs n
      INNER JOIN room_members rm ON n.room_id = rm.room_id
      WHERE rm.user_id = ?
    `)
    const friendNpcs = friendNpcsStmt.all(user_id)
    
    appDb.close()
    
    if (friendNpcs.length === 0) {
      console.log('该用户没有好友NPC')
      return { success: true, message: '该用户没有好友NPC' }
    }
    
    console.log(`- 用户有 ${friendNpcs.length} 个好友NPC`)
    
    // 每个NPC有40%的概率评论
    const commentingNPCs = friendNpcs.filter(() => Math.random() > 0.6)
    
    console.log(`- ${commentingNPCs.length} 个NPC将评论`)
    
    // 延迟评论，模拟真实情况
    for (let i = 0; i < commentingNPCs.length; i++) {
      const npc = commentingNPCs[i]
      const delay = Math.random() * 10000 + 2000 // 2-12秒随机延迟
      
      setTimeout(async () => {
        try {
          await $fetch('/api/moments/ai-comment', {
            method: 'POST',
            body: {
              moment_id,
              npc_id: (npc as any).id
            }
          })
          console.log(`✅ ${(npc as any).name} 已评论`)
        } catch (error) {
          console.error(`❌ ${(npc as any).name} 评论失败:`, error)
        }
      }, delay)
    }
    
    return {
      success: true,
      message: `已触发 ${commentingNPCs.length} 个NPC评论`
    }
    
  } catch (error: any) {
    console.error('❌ 自动评论失败:', error.message)
    return {
      success: false,
      error: error.message
    }
  }
})

