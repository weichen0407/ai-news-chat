/**
 * 自动评论：NPC智能回复最近的朋友圈和评论（包括玩家的）
 * 优化版：评论更长时间范围内的朋友圈
 */
import Database from 'better-sqlite3'
import { join } from 'path'

export default defineEventHandler(async (event) => {
  try {
    const chatDb = new Database(join(process.cwd(), 'data', 'chat.db'))
    const appDb = new Database(join(process.cwd(), 'data', 'app.db'))
    
    console.log('🤖 开始自动评论任务...')
    
    // 获取最近24小时内的朋友圈（评论少于5条的）
    // 改为24小时，让更多朋友圈可以被评论
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    
    const recentMoments = chatDb.prepare(`
      SELECT 
        m.id,
        m.user_id,
        m.npc_id,
        m.content,
        m.created_at,
        (SELECT COUNT(*) FROM moment_comments WHERE moment_id = m.id) as comment_count
      FROM moments m
      WHERE m.created_at > ?
      ORDER BY m.created_at DESC
      LIMIT 50
    `).all(oneDayAgo)
    
    console.log(`📊 找到 ${recentMoments.length} 条最近的朋友圈`)
    
    // 筛选出评论少于5条的朋友圈（提高上限）
    const momentsToComment = recentMoments.filter((m: any) => m.comment_count < 5)
    
    console.log(`💬 其中 ${momentsToComment.length} 条需要评论（评论数<5）`)
    
    if (momentsToComment.length === 0) {
      chatDb.close()
      appDb.close()
      console.log('⚠️ 没有需要评论的朋友圈')
      return { success: true, count: 0, message: '没有需要评论的朋友圈（所有朋友圈评论数≥5）' }
    }
    
    const results = []
    let commentCount = 0
    let processedCount = 0
    
    // 为每个朋友圈随机选择1-2个NPC评论
    // 最多处理10条朋友圈（提高处理量）
    for (const moment of momentsToComment.slice(0, 10)) {
      processedCount++
      const momentData = moment as any
      
      console.log(`\n📝 处理朋友圈 #${momentData.id} (已有${momentData.comment_count}条评论)`)
      console.log(`   内容: ${(momentData.content || '').substring(0, 30)}...`)
      
      // 【关键修改】确定朋友圈所属的房间
      let roomId = momentData.room_id // 先尝试使用朋友圈的room_id
      
      // 如果朋友圈是NPC发的，需要查询NPC所在的房间
      if (momentData.npc_id && !roomId) {
        const npcInfo = appDb.prepare(`SELECT room_id FROM npcs WHERE id = ?`).get(momentData.npc_id) as any
        if (npcInfo) {
          roomId = npcInfo.room_id
        }
      }
      
      // 如果朋友圈是玩家发的，但没有room_id，跳过（全局朋友圈暂不处理）
      if (!roomId) {
        console.log(`   ⚠️ 跳过：无法确定房间ID（可能是全局朋友圈）`)
        continue
      }
      
      console.log(`   🏠 房间: ${roomId}`)
      
      // 【关键修改】只获取同一房间的NPC
      const roomNpcs = appDb.prepare(`
        SELECT id, name, room_id 
        FROM npcs 
        WHERE room_id = ?
      `).all(roomId) as any[]
      
      if (roomNpcs.length === 0) {
        console.log(`   ⚠️ 房间 ${roomId} 没有NPC，跳过`)
        continue
      }
      
      console.log(`   🤖 房间有 ${roomNpcs.length} 个NPC`)
      
      // 如果朋友圈是NPC发的，排除发朋友圈的NPC自己
      let availableNpcs = roomNpcs
      if (momentData.npc_id) {
        availableNpcs = roomNpcs.filter((npc: any) => npc.id !== momentData.npc_id)
        console.log(`   （排除发布者后，剩余 ${availableNpcs.length} 个NPC可以评论）`)
      }
      
      if (availableNpcs.length === 0) {
        console.log(`   ⚠️ 没有可评论的NPC，跳过`)
        continue
      }
      
      const numCommentsToAdd = Math.floor(Math.random() * 2) + 1
      console.log(`   将添加 ${numCommentsToAdd} 条评论`)
      
      for (let i = 0; i < numCommentsToAdd; i++) {
        // 从同房间的NPC中随机选择
        const randomNpc = availableNpcs[Math.floor(Math.random() * availableNpcs.length)] as any
        
        try {
          console.log(`   🤖 ${randomNpc.name} 正在生成评论...`)
          
          const response = await $fetch('/api/moments/ai-comment', {
            method: 'POST',
            body: {
              moment_id: momentData.id,
              npc_id: randomNpc.id
            }
          })
          
          if (response.success) {
            commentCount++
            results.push(response)
            console.log(`   ✅ ${randomNpc.name} 评论成功: ${(response.comment || '').substring(0, 30)}...`)
          } else {
            console.log(`   ❌ ${randomNpc.name} 评论失败: ${response.error}`)
          }
        } catch (error) {
          console.error(`   ❌ NPC ${randomNpc.name} 评论失败:`, error.message)
        }
        
        // 避免过于频繁，添加小延迟
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }
    
    appDb.close()
    chatDb.close()
    
    console.log(`\n✅ 自动评论完成: 处理了 ${processedCount} 条朋友圈，生成了 ${commentCount} 条评论`)
    
    return {
      success: true,
      count: commentCount,
      processed: processedCount,
      message: `成功生成 ${commentCount} 条评论`
    }
  } catch (error: any) {
    console.error('自动评论失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
})

