/**
 * AI生成NPC朋友圈内容
 */
import { createMoment, getRoomNPCs } from '~/server/utils/db-moments'
import Database from 'better-sqlite3'
import { join } from 'path'

export default defineEventHandler(async (event) => {
  console.log('\n========================================')
  console.log('🤖 AI生成朋友圈被调用')
  console.log('时间:', new Date().toISOString())
  console.log('========================================\n')
  
  try {
    const body = await readBody(event)
    const { npc_id, customPrompt, momentType } = body
    
    if (!npc_id) {
      throw new Error('NPC ID不能为空')
    }
    
    // 获取NPC信息
    const db = new Database(join(process.cwd(), 'data', 'app.db'))
    
    const npc = db.prepare(`
      SELECT n.*, r.event_background, r.name as room_name
      FROM npcs n
      LEFT JOIN rooms r ON n.room_id = r.id
      WHERE n.id = ?
    `).get(npc_id)
    
    if (!npc) {
      throw new Error('NPC不存在')
    }
    
    db.close()
    
    // 使用DeepSeek AI生成朋友圈内容
    const deepseekApiKey = process.env.DEEPSEEK_API_KEY
    
    if (!deepseekApiKey) {
      throw new Error('DeepSeek API密钥未配置')
    }
    
    let prompt: string
    let selectedMomentType: string
    
    // 如果有自定义Prompt，直接使用
    if (customPrompt) {
      prompt = customPrompt
      selectedMomentType = momentType || '自定义'
      console.log('📝 使用自定义Prompt')
    } else {
      // 随机选择朋友圈类型，增加多样性
      const momentTypes = [
        { type: '日常生活', prompt: '分享你今天的日常生活、见闻或感受' },
        { type: '情感表达', prompt: '表达你当前的情绪或心情' },
        { type: '观点态度', prompt: '针对当前事件发表你的看法和态度' },
        { type: '回忆思考', prompt: '回忆过去或思考未来' },
        { type: '互动吐槽', prompt: '对某事进行吐槽或幽默评论' },
        { type: '自我展示', prompt: '展示你的成就、兴趣或正在做的事' }
      ]
      
      const randomType = momentTypes[Math.floor(Math.random() * momentTypes.length)]
      selectedMomentType = randomType.type
      
      prompt = `【角色扮演 - 朋友圈生成】

你是：${(npc as any).name}

🎭 性格：${(npc as any).personality || '未设置'}
📝 习惯：${(npc as any).habits || '未设置'}
❤️ 喜好：${(npc as any).likes || '未设置'}
💢 厌恶：${(npc as any).dislikes || '未设置'}
🎯 目标：${(npc as any).goals || '未设置'}
😨 恐惧：${(npc as any).fears || '未设置'}
📚 背景：${(npc as any).background || '未设置'}

🌍 当前剧情环境：
${(npc as any).event_background || (npc as any).room_name || '日常生活'}

📱 本次朋友圈类型：${randomType.type}
${randomType.prompt}

⚠️ 重要要求：
1. 必须完全符合你的性格、习惯和当前剧情
2. 内容要独特且有个性，避免套路化
3. 20-80字，自然真实，像真人发的
4. 可以用emoji，但不要过度
5. 根据你的情绪状态（开心/难过/愤怒/平静等）调整语气
6. 绝对不要提到"作为XX"、"我觉得"等死板用语
7. 可以是：一句话、感叹、提问、描述场景、调侃等任何形式

只返回朋友圈内容文本，不要引号、不要解释。`
    }

    console.log('📤 调用DeepSeek API生成朋友圈')
    console.log('- NPC:', (npc as any).name)
    console.log('- 房间:', (npc as any).room_name || (npc as any).room_id)
    console.log('- 朋友圈类型:', selectedMomentType)
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
            content: '你是一个角色扮演专家，需要根据角色的性格和背景生成真实自然的朋友圈内容。只返回朋友圈内容，不要任何解释。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 200
      })
    })
    
    if (!response.ok) {
      throw new Error(`DeepSeek API调用失败: ${response.status}`)
    }
    
    const data = await response.json()
    const content = data.choices[0].message.content.trim()
    
    console.log('✅ AI生成成功')
    console.log('- 内容:', content)
    
    // 创建朋友圈
    const momentId = createMoment({
      npc_id,
      content
    })
    
    console.log('📝 朋友圈已创建, ID:', momentId)
    console.log('========================================\n')
    
    return {
      success: true,
      momentId,
      content,
      prompt, // 返回prompt用于前端显示
      momentType: selectedMomentType,
      npcInfo: {
        name: (npc as any).name,
        personality: (npc as any).personality,
        habits: (npc as any).habits,
        background: (npc as any).background
      }
    }
    
  } catch (error: any) {
    console.error('❌ AI生成朋友圈失败:', error.message)
    console.error('========================================\n')
    return {
      success: false,
      error: error.message
    }
  }
})

