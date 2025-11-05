/**
 * AI智能解析剧情和NPC
 * 根据用户输入的文本，自动解析出剧情信息和NPC角色
 */
export default defineEventHandler(async (event) => {
  console.log('\n========================================')
  console.log('🤖 AI智能解析API被调用')
  console.log('时间:', new Date().toISOString())
  console.log('========================================\n')
  
  try {
    const body = await readBody(event)
    const { text } = body
    
    console.log('📝 接收到的文本长度:', text?.length || 0, '字符')
    
    if (!text || text.trim().length === 0) {
      throw createError({
        statusCode: 400,
        message: '请提供要解析的文本'
      })
    }
    
    // 使用DeepSeek AI进行智能解析
    const deepseekApiKey = process.env.DEEPSEEK_API_KEY
    
    if (!deepseekApiKey) {
      throw createError({
        statusCode: 500,
        message: 'DeepSeek API密钥未配置'
      })
    }
    
    // 构建AI提示
    const prompt = `你是一个专业的剧情创作助手。请分析以下文本，提取出剧情信息和NPC角色。

📄 用户输入的文本：
${text}

🎯 任务要求：
1. 分析文本，提取剧情的核心信息
2. 识别文本中的所有重要角色（NPC）
3. 为每个NPC生成详细的属性

📋 输出格式（必须严格遵守，只返回JSON）：
{
  "story": {
    "name": "剧情名称（简短有力）",
    "description": "剧情简介（50字以内）",
    "eventBackground": "详细的事件背景和主要剧情（200-500字）",
    "avatar": "相关的emoji表情",
    "dialogueDensity": 2
  },
  "npcs": [
    {
      "name": "角色名字",
      "personality": "性格特点（如：冷静、理性、果断）",
      "habits": "行为习惯（如：喜欢喝咖啡、经常加班）",
      "skills": "特殊技能或能力",
      "likes": "喜欢的事物",
      "dislikes": "讨厌的事物",
      "age": "年龄范围（如：30-35）",
      "occupation": "职业",
      "background": "背景故事（100-200字）",
      "goals": "目标或动机",
      "fears": "恐惧或弱点",
      "avatar": "相关的emoji表情"
    }
  ],
  "reasoning": "解析说明：简要说明你是如何理解这个剧情的，以及为什么创建这些NPC"
}

⚠️ 重要提示：
1. 如果文本中没有明确提到某些信息，请根据上下文合理推测
2. NPC的属性要详细丰富，有助于AI生成真实的对话
3. 事件背景要完整，包含时间、地点、人物关系、主要矛盾等
4. 每个NPC都应该有明确的动机和目标
5. 只返回纯JSON，不要任何markdown标记或额外文字`

    console.log('\n📤 准备调用DeepSeek API')
    console.log('- Prompt长度:', prompt.length, '字符')
    
    // 调用DeepSeek API
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
            content: '你是一个专业的剧情创作助手，擅长分析文本并提取剧情和角色信息。必须只返回纯JSON格式，不要任何markdown标记或额外文字。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000
      })
    })
    
    console.log('📥 DeepSeek API响应')
    console.log('- 状态码:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ API调用失败:', errorText)
      throw new Error(`DeepSeek API调用失败: ${response.status}`)
    }
    
    const responseText = await response.text()
    console.log('- 响应长度:', responseText.length, '字符')
    
    const data = JSON.parse(responseText)
    const aiResponse = data.choices[0].message.content
    
    console.log('- AI响应长度:', aiResponse.length, '字符')
    console.log('- AI响应前200字符:', aiResponse.substring(0, 200))
    
    // 解析AI响应
    console.log('\n🔍 开始解析AI响应')
    let result
    try {
      // 尝试提取JSON
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0])
      } else {
        result = JSON.parse(aiResponse)
      }
    } catch (e: any) {
      console.error('❌ JSON解析失败:', e.message)
      console.error('AI响应内容:', aiResponse.substring(0, 500))
      throw new Error('AI响应格式错误，无法解析为JSON')
    }
    
    // 验证结果
    if (!result.story || !result.npcs) {
      console.error('❌ 结果格式错误')
      console.error('Result keys:', Object.keys(result))
      throw new Error('解析结果缺少必要字段（story或npcs）')
    }
    
    console.log('\n✅ AI解析成功')
    console.log('- 剧情名称:', result.story.name)
    console.log('- NPC数量:', result.npcs?.length || 0)
    console.log('- NPC列表:', result.npcs?.map((npc: any) => npc.name).join(', '))
    console.log('========================================\n')
    
    return {
      success: true,
      story: result.story,
      npcs: result.npcs,
      reasoning: result.reasoning
    }
    
  } catch (error: any) {
    console.error('\n❌ AI解析失败')
    console.error('错误类型:', error.constructor?.name)
    console.error('错误消息:', error.message)
    console.error('========================================\n')
    
    return {
      success: false,
      error: error.message || '解析失败'
    }
  }
})

