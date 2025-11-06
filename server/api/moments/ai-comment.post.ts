/**
 * AI生成NPC评论
 */
import { addComment, getMomentDetail } from '~/server/utils/db-moments'
import Database from 'better-sqlite3'
import { join } from 'path'

export default defineEventHandler(async (event) => {
  console.log('\n========================================')
  console.log('🤖 AI生成评论被调用')
  console.log('时间:', new Date().toISOString())
  console.log('========================================\n')
  
  try {
    const body = await readBody(event)
    const { moment_id, npc_id, reply_to_user_id, reply_to_npc_id, emotion, customPrompt } = body
    
    if (!moment_id || !npc_id) {
      throw new Error('朋友圈ID和NPC ID不能为空')
    }
    
    // 获取朋友圈详情
    const moment = getMomentDetail(moment_id)
    
    if (!moment) {
      throw new Error('朋友圈不存在')
    }
    
    // 获取评论NPC信息（从app.db）
    const appDb = new Database(join(process.cwd(), 'data', 'app.db'))
    
    const npc = appDb.prepare(`
      SELECT * FROM npcs WHERE id = ?
    `).get(npc_id)
    
    if (!npc) {
      appDb.close()
      throw new Error('NPC不存在')
    }
    
    // 获取回复对象的信息
    let replyToName = ''
    if (reply_to_user_id) {
      const user = appDb.prepare(`SELECT nickname, username FROM users WHERE id = ?`).get(reply_to_user_id) as any
      replyToName = user?.nickname || user?.username || '某人'
    } else if (reply_to_npc_id) {
      const targetNpc = appDb.prepare(`SELECT name FROM npcs WHERE id = ?`).get(reply_to_npc_id) as any
      replyToName = targetNpc?.name || '某人'
    }
    
    appDb.close()
    
    // 构建已有评论的上下文
    const existingComments = (moment as any).comments
      .slice(0, 5) // 只取最近5条
      .map((c: any) => {
        const name = c.user_name || c.user_nickname || c.npc_name
        return `${name}: ${c.content}`
      })
      .join('\n')
    
    // 使用DeepSeek AI生成评论
    const deepseekApiKey = process.env.DEEPSEEK_API_KEY
    
    if (!deepseekApiKey) {
      throw new Error('DeepSeek API密钥未配置')
    }
    
    const authorName = (moment as any).user_name || (moment as any).user_nickname || (moment as any).npc_name
    
    let prompt: string
    const selectedEmotion = emotion || 'neutral'
    
    // 如果有自定义Prompt，直接使用
    if (customPrompt) {
      prompt = customPrompt
      console.log('📝 使用自定义评论Prompt')
    } else {
      // 情感倾向映射
      const emotionGuides: any = {
        neutral: '保持客观中立的态度',
        positive: '表达支持和赞同',
        negative: '表达反对和批评',
        happy: '展现开心和兴奋的情绪',
        sad: '表达悲伤或同情',
        angry: '表达愤怒或强烈不满',
        surprised: '表达惊讶或意外',
        sarcastic: '使用讽刺或调侃的语气'
      }
      
      prompt = `你是${(npc as any).name}。

🎭 你的性格特点：${(npc as any).personality}
📝 行为习惯：${(npc as any).habits}

你看到了${authorName}发布的朋友圈：
"${(moment as any).content}"

${existingComments ? `\n已有评论：\n${existingComments}\n` : ''}

${replyToName ? `你要回复${replyToName}。` : '你要对这条朋友圈进行评论。'}

😊 情感倾向：${emotionGuides[selectedEmotion] || '保持自然'}

请根据你的性格和情感倾向，发表评论。

要求：
1. 10-50字
2. 符合你的人设、性格和情感倾向
3. 根据情感倾向调整语气
4. ${replyToName ? '要针对' + replyToName + '的内容进行回复' : '要针对朋友圈内容评论'}
5. 自然真实，像真实的评论

只返回评论内容，不要任何额外文字。`
    }

    console.log('📤 调用DeepSeek API生成评论')
    console.log('- NPC:', (npc as any).name)
    console.log('- 朋友圈ID:', moment_id)
    console.log('- 回复:', replyToName || '直接评论')
    console.log('- 情感倾向:', selectedEmotion)
    console.log('- 使用自定义Prompt:', !!customPrompt)
    console.log('\n📝 完整Prompt:')
    console.log('─'.repeat(60))
    console.log(prompt)
    console.log('─'.repeat(60) + '\n')
    
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${deepseekApiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: '你是一个角色扮演专家，需要根据角色的性格生成真实自然的评论。只返回评论内容，不要任何解释。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 100
      })
    })
    
    if (!response.ok) {
      throw new Error(`DeepSeek API调用失败: ${response.status}`)
    }
    
    const data = await response.json()
    const content = data.choices[0].message.content.trim()
    
    console.log('✅ AI生成成功')
    console.log('- 内容:', content)
    
    // 添加评论
    const commentId = addComment({
      moment_id,
      npc_id,
      reply_to_user_id,
      reply_to_npc_id,
      content
    })
    
    console.log('📝 评论已创建, ID:', commentId)
    console.log('========================================\n')
    
    return {
      success: true,
      commentId,
      content,
      prompt, // 返回prompt用于前端显示
      emotion: selectedEmotion
    }
    
  } catch (error: any) {
    console.error('❌ AI生成评论失败:', error.message)
    console.error('========================================\n')
    return {
      success: false,
      error: error.message
    }
  }
})

