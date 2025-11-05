/**
 * AI自动填充Tile API
 * 根据颜色地图和描述，智能选择Tile进行填充
 */
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { description, grid, tileSet, regions, tileTypes, strategy } = body
    
    if (!description || !grid || !tileSet) {
      throw createError({
        statusCode: 400,
        message: '请提供完整的参数'
      })
    }
    
    const deepseekApiKey = process.env.DEEPSEEK_API_KEY
    
    if (!deepseekApiKey) {
      throw createError({
        statusCode: 500,
        message: 'DeepSeek API密钥未配置'
      })
    }
    
    // 构建Tile信息描述
    const tileDescriptions = tileSet.map((t: any, index: number) => 
      `Tile ${index}: ${t.name} (${t.width}x${t.height})`
    ).join('\n')
    
    // 构建颜色类型描述
    const colorDescriptions = tileTypes.map((t: any) => 
      `- ${t.name} (${t.category}): ${t.color}`
    ).join('\n')
    
    // 构建区域描述
    const regionDescriptions = regions?.map((r: any) => 
      `- ${r.name}: ${r.description || '无描述'}`
    ).join('\n') || '无定义区域'
    
    const prompt = `你是一个游戏地图设计专家。现在需要你帮助将一个用颜色绘制的地图，替换成真实的Tile素材。

用户描述：
${description}

当前颜色类型：
${colorDescriptions}

已定义的区域：
${regionDescriptions}

可用的Tile素材（${tileSet.length}个）：
${tileDescriptions}

匹配策略：${strategy === 'semantic' ? '语义匹配' : strategy === 'color' ? '颜色相似度' : '混合策略'}

请分析每种颜色类型应该匹配哪个Tile。返回JSON格式：
{
  "mapping": {
    "1": 0,  // tileTypeId: tileIndex
    "2": 5,
    "3": 12
  },
  "reasoning": "匹配理由",
  "suggestions": [
    "建议1：某些区域可以使用特定tile增强效果",
    "建议2：..."
  ]
}

注意：
1. Tile索引从0开始，对应上面列表中的Tile
2. 根据语义和用户描述进行智能匹配
3. 考虑地形类型（草地、墙壁、水等）
4. 提供合理的匹配理由

只返回JSON，不要其他文字。`
    
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
            content: '你是一个专业的游戏地图设计师，擅长Tile匹配和地图美化。总是返回标准的JSON格式。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('DeepSeek API错误:', response.status, errorText)
      throw new Error(`DeepSeek API调用失败: ${response.status}`)
    }
    
    const data = await response.json()
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
    } catch (e) {
      console.error('AI响应解析失败:', aiResponse)
      throw new Error('AI响应格式错误')
    }
    
    return {
      success: true,
      mapping: result.mapping,
      reasoning: result.reasoning,
      suggestions: result.suggestions || []
    }
    
  } catch (error: any) {
    console.error('AI填充失败:', error)
    return {
      success: false,
      error: error.message || '处理失败'
    }
  }
})

