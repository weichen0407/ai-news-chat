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
    
    // 获取所有NPC
    const allNpcs = appDb.prepare(`SELECT id, name, room_id FROM npcs`).all()
    
    console.log(`🤖 系统共有 ${allNpcs.length} 个NPC`)
    
    if (allNpcs.length === 0) {
      appDb.close()
      chatDb.close()
      console.log('⚠️ 系统没有NPC')
      return { success: true, count: 0, message: '系统没有NPC可以评论' }
    }
    
    appDb.close()
    chatDb.close()
    
    const results = []
    let commentCount = 0
    let processedCount = 0
    
    // 为每个朋友圈随机选择1-2个NPC评论
    // 最多处理10条朋友圈（提高处理量）
    for (const moment of momentsToComment.slice(0, 10)) {
      processedCount++
      const numCommentsToAdd = Math.floor(Math.random() * 2) + 1
      
      console.log(`\n📝 处理朋友圈 #${(moment as any).id} (已有${(moment as any).comment_count}条评论)`)
      console.log(`   内容: ${((moment as any).content || '').substring(0, 30)}...`)
      console.log(`   将添加 ${numCommentsToAdd} 条评论`)
      
      for (let i = 0; i < numCommentsToAdd; i++) {
        const randomNpc = allNpcs[Math.floor(Math.random() * allNpcs.length)] as any
        
        try {
          console.log(`   🤖 ${randomNpc.name} 正在生成评论...`)
          
          const response = await $fetch('/api/moments/ai-comment', {
            method: 'POST',
            body: {
              moment_id: (moment as any).id,
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

