/**
 * AI批量解析剧情 - 从JSON文件批量生成多个剧本
 * 读取包含多个事件的JSON文件，为每个事件生成独立的剧本
 */
import fs from 'fs'
import path from 'path'

export default defineEventHandler(async (event) => {
  console.log('\n========================================')
  console.log('🎬 AI批量解析API被调用')
  console.log('时间:', new Date().toISOString())
  console.log('========================================\n')
  
  try {
    const body = await readBody(event)
    const { jsonFilePath, jsonData } = body
    
    let newsData
    
    // 支持两种输入方式：文件路径或直接传入JSON数据
    if (jsonFilePath) {
      console.log('📁 读取文件:', jsonFilePath)
      const fullPath = path.resolve(process.cwd(), jsonFilePath)
      
      if (!fs.existsSync(fullPath)) {
        throw new Error(`文件不存在: ${jsonFilePath}`)
      }
      
      const fileContent = fs.readFileSync(fullPath, 'utf-8')
      newsData = JSON.parse(fileContent)
    } else if (jsonData) {
      console.log('📦 使用传入的JSON数据')
      newsData = jsonData
    } else {
      throw createError({
        statusCode: 400,
        message: '请提供jsonFilePath（文件路径）或jsonData（JSON对象）'
      })
    }
    
    // 验证数据格式
    if (!newsData.items || !Array.isArray(newsData.items)) {
      throw new Error('JSON格式错误：缺少items数组')
    }
    
    console.log(`📊 找到 ${newsData.items.length} 个事件`)
    console.log(`生成时间: ${newsData.generatedAt}`)
    console.log(`总数: ${newsData.total}\n`)
    
    const deepseekApiKey = process.env.DEEPSEEK_API_KEY
    
    if (!deepseekApiKey) {
      throw createError({
        statusCode: 500,
        message: 'DeepSeek API密钥未配置'
      })
    }
    
    const results = []
    const errors = []
    
    // 遍历每个事件
    for (let i = 0; i < newsData.items.length; i++) {
      const item = newsData.items[i]
      const { title, summary, rank, query } = item
      
      console.log(`\n🎯 处理事件 ${i + 1}/${newsData.items.length}`)
      console.log(`   排名: #${rank}`)
      console.log(`   标题: ${title}`)
      console.log(`   查询: ${query}`)
      console.log(`   摘要长度: ${summary?.length || 0} 字符`)
      
      try {
        // 构建解析文本
        const text = `【标题】${title}\n\n【详细内容】\n${summary}`
        
        // 构建AI提示
        const prompt = `你是一个专业的剧情创作助手。请分析以下热点新闻事件，将其改编为一个互动剧情，并提取相关角色。

📄 新闻事件：
${text}

🎯 任务要求：
1. 将新闻事件改编为戏剧化的互动剧情
2. 识别事件中的所有重要角色（真实人物），为每个角色创建NPC
3. 剧情要保留事件的核心冲突和戏剧性
4. 角色设定要符合新闻中的人物形象

📋 输出格式（必须严格遵守，只返回JSON）：
{
  "story": {
    "name": "剧情名称（简短有力，体现事件核心）",
    "description": "剧情简介（50字以内）",
    "eventBackground": "详细的事件背景和主要剧情（200-500字，包含时间、地点、人物关系、主要矛盾、事件发展等）",
    "avatar": "相关的emoji表情",
    "dialogueDensity": 2
  },
  "npcs": [
    {
      "name": "角色名字（使用新闻中的真实姓名或角色称呼）",
      "personality": "性格特点（根据新闻中的表现推测）",
      "habits": "行为习惯",
      "skills": "特殊技能或能力",
      "likes": "喜欢的事物",
      "dislikes": "讨厌的事物",
      "age": "年龄范围",
      "occupation": "职业",
      "background": "背景故事（100-200字，结合新闻内容）",
      "goals": "目标或动机（在这个事件中的诉求）",
      "fears": "恐惧或弱点",
      "avatar": "相关的emoji表情"
    }
  ],
  "reasoning": "解析说明：简要说明你是如何将这个新闻事件改编为剧情的，以及角色设定的依据"
}

⚠️ 重要提示：
1. 保持事件的真实性，但要增加戏剧化元素
2. NPC要有明确的立场和动机，能够产生冲突和互动
3. 事件背景要完整，玩家能够理解事件的来龙去脉
4. 至少创建2-5个主要角色
5. 只返回纯JSON，不要任何markdown标记或额外文字`

        console.log(`   📤 调用AI解析...`)
        
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
                content: '你是一个专业的剧情创作助手，擅长将真实事件改编为互动剧情，并提取角色信息。必须只返回纯JSON格式，不要任何markdown标记或额外文字。'
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
        
        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`DeepSeek API调用失败: ${response.status} - ${errorText}`)
        }
        
        const responseText = await response.text()
        const data = JSON.parse(responseText)
        const aiResponse = data.choices[0].message.content
        
        // 解析AI响应
        let result
        try {
          const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            result = JSON.parse(jsonMatch[0])
          } else {
            result = JSON.parse(aiResponse)
          }
        } catch (e: any) {
          throw new Error(`JSON解析失败: ${e.message}`)
        }
        
        // 验证结果
        if (!result.story || !result.npcs) {
          throw new Error('解析结果缺少必要字段（story或npcs）')
        }
        
        console.log(`   ✅ 解析成功`)
        console.log(`      剧情: ${result.story.name}`)
        console.log(`      NPC数量: ${result.npcs.length}`)
        console.log(`      NPC: ${result.npcs.map((npc: any) => npc.name).join(', ')}`)
        
        results.push({
          sourceEvent: {
            title,
            rank,
            query
          },
          story: result.story,
          npcs: result.npcs,
          reasoning: result.reasoning
        })
        
        // 添加延迟，避免API限流
        if (i < newsData.items.length - 1) {
          console.log(`   ⏳ 等待1秒...`)
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
        
      } catch (error: any) {
        console.error(`   ❌ 解析失败: ${error.message}`)
        errors.push({
          event: { title, rank, query },
          error: error.message
        })
      }
    }
    
    console.log('\n========================================')
    console.log('📊 批量解析完成')
    console.log(`   成功: ${results.length}/${newsData.items.length}`)
    console.log(`   失败: ${errors.length}/${newsData.items.length}`)
    console.log('========================================\n')
    
    return {
      success: true,
      summary: {
        total: newsData.items.length,
        succeeded: results.length,
        failed: errors.length
      },
      results,
      errors
    }
    
  } catch (error: any) {
    console.error('\n❌ 批量解析失败')
    console.error('错误类型:', error.constructor?.name)
    console.error('错误消息:', error.message)
    console.error('========================================\n')
    
    return {
      success: false,
      error: error.message || '批量解析失败'
    }
  }
})

