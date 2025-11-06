/**
 * 触发NPC自动发朋友圈
 * 可以定时调用此API让NPC随机发朋友圈
 */
import Database from 'better-sqlite3'
import { join } from 'path'

export default defineEventHandler(async (event) => {
  try {
    console.log('\n🤖 NPC自动发朋友圈任务开始...')
    
    // 获取所有NPC
    const appDb = new Database(join(process.cwd(), 'data', 'app.db'))
    
    const npcsStmt = appDb.prepare(`
      SELECT n.id, n.name, n.room_id
      FROM npcs n
      LIMIT 100
    `)
    const allNpcs = npcsStmt.all()
    
    appDb.close()
    
    if (allNpcs.length === 0) {
      console.log('没有NPC')
      return { success: true, message: '没有NPC' }
    }
    
    console.log(`- 共有 ${allNpcs.length} 个NPC`)
    
    // 随机选择NPC发朋友圈
    // 如果NPC少于20个，选择20-30%；否则选择5-10%
    const percentage = allNpcs.length < 20 ? 0.25 : 0.08
    let postingNPCs = allNpcs.filter(() => Math.random() < percentage)
    
    // 确保至少有2个NPC发朋友圈（如果总数>=2）
    if (postingNPCs.length === 0 && allNpcs.length >= 2) {
      const count = Math.min(2, allNpcs.length)
      postingNPCs = allNpcs.sort(() => Math.random() - 0.5).slice(0, count)
    } else if (postingNPCs.length === 0 && allNpcs.length === 1) {
      postingNPCs = [allNpcs[0]]
    }
    
    console.log(`- 将有 ${postingNPCs.length} 个NPC发朋友圈`)
    
    const results = []
    
    // 让选中的NPC发朋友圈
    for (const npc of postingNPCs) {
      try {
        const response = await $fetch('/api/moments/ai-generate', {
          method: 'POST',
          body: {
            npc_id: (npc as any).id
          }
        })
        
        if ((response as any).success) {
          console.log(`✅ ${(npc as any).name} 发布了朋友圈`)
          results.push({
            npc_id: (npc as any).id,
            npc_name: (npc as any).name,
            success: true
          })
        }
      } catch (error) {
        console.error(`❌ ${(npc as any).name} 发布失败:`, error)
        results.push({
          npc_id: (npc as any).id,
          npc_name: (npc as any).name,
          success: false
        })
      }
      
      // 延迟，避免同时发送太多
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    console.log(`\n✅ NPC自动发朋友圈任务完成`)
    console.log(`- 成功: ${results.filter(r => r.success).length}`)
    console.log(`- 失败: ${results.filter(r => !r.success).length}\n`)
    
    return {
      success: true,
      total: postingNPCs.length,
      results
    }
    
  } catch (error: any) {
    console.error('❌ NPC自动发朋友圈失败:', error.message)
    return {
      success: false,
      error: error.message
    }
  }
})

