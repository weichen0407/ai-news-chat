/**
 * AI自动分层API
 * 根据世界描述和区域定义，自动将地图分层
 */
export default defineEventHandler(async (event) => {
  console.log('\n========================================')
  console.log('🎨 AI地图分层API被调用')
  console.log('时间:', new Date().toISOString())
  console.log('========================================\n')
  
  try {
    const body = await readBody(event)
    const { worldDescription, mapWidth, mapHeight, grid, regions, tileTypes } = body
    
    console.log('📝 接收到的参数:')
    console.log('- 地图尺寸:', mapWidth, 'x', mapHeight)
    console.log('- 瓦片类型数量:', tileTypes?.length || 0)
    console.log('- 区域数量:', regions?.length || 0)
    console.log('- 世界描述长度:', worldDescription?.length || 0, '字符')
    
    if (!worldDescription) {
      throw createError({
        statusCode: 400,
        message: '请提供世界描述'
      })
    }
    
    // 使用DeepSeek AI进行智能分层
    const deepseekApiKey = process.env.DEEPSEEK_API_KEY
    
    if (!deepseekApiKey) {
      throw createError({
        statusCode: 500,
        message: 'DeepSeek API密钥未配置'
      })
    }
    
    // 构建AI提示
    const hasRegions = regions && regions.length > 0
    const regionsDesc = hasRegions 
      ? `\n定义的区域信息：\n${regions.map(r => `- ${r.name} (${r.x1},${r.y1})→(${r.x2},${r.y2}): ${r.description || '无描述'}`).join('\n')}\n`
      : '\n（未定义具体区域，请根据整体描述进行分层）\n'
    
    const prompt = `你是一个专业的游戏地图设计专家。我需要对一个${mapWidth}x${mapHeight}的完整瓦片地图进行分层设计。

🌍 世界描述：
${worldDescription}
${regionsDesc}
🎨 可用的瓦片类型（共${tileTypes.length}种）：
${tileTypes.map(t => `- ID:${t.id} ${t.name} (分类:${t.category || '未分类'}) 颜色:${t.color}`).join('\n')}

📋 任务要求：
1. 这是一个**完整的地图**，需要对整个地图进行分层，不是针对某个局部区域
2. 根据世界描述和瓦片类型的分类（category），设计合理的图层结构
3. 常见的图层类型：
   - Ground (地面层): ground类的瓦片 - 草地、道路、地板
   - Water (水域层): water类的瓦片 - 河流、湖泊、海洋
   - Building (建筑层): building类的瓦片 - 墙壁、房屋
   - Decoration (装饰层): decoration类的瓦片 - 花朵、树木、装饰物
   - Overlay (覆盖层): overlay类的瓦片 - 特殊效果

🎯 输出要求：
返回标准JSON格式（不要markdown标记）：
{
  "layers": [
    {
      "name": "Ground",
      "description": "地面基础层，包含所有地面元素",
      "tileCategories": ["ground"],
      "zIndex": 0
    },
    {
      "name": "Water",
      "description": "水域层",
      "tileCategories": ["water"],
      "zIndex": 1
    }
  ],
  "reasoning": "详细说明分层的依据和逻辑"
}

注意：
- tileCategories必须对应上面提供的瓦片类型的category字段
- zIndex从0开始递增，数字越大越在上层
- 如果某些瓦片没有category，可以根据名称和颜色判断归类
- 只返回纯JSON，不要任何额外文字或markdown标记`
    
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
            content: '你是一个专业的游戏地图设计师，擅长瓦片地图的分层设计。你需要对完整的地图进行分层，而不是局部区域。必须只返回纯JSON格式，不要任何markdown标记或额外文字。'
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
      throw new Error(`DeepSeek API调用失败: ${response.status}`)
    }
    
    const data = await response.json()
    const aiResponse = data.choices[0].message.content
    
    // 解析AI响应
    let layeringSuggestion
    try {
      // 尝试提取JSON
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        layeringSuggestion = JSON.parse(jsonMatch[0])
      } else {
        layeringSuggestion = JSON.parse(aiResponse)
      }
    } catch (e) {
      console.error('AI响应解析失败:', aiResponse)
      throw new Error('AI响应格式错误')
    }
    
    console.log('\n✅ AI分层建议解析成功')
    console.log('- 建议的图层数量:', layeringSuggestion.layers?.length || 0)
    console.log('- 图层列表:')
    layeringSuggestion.layers?.forEach((layer: any, index: number) => {
      console.log(`  ${index + 1}. ${layer.name} (zIndex: ${layer.zIndex})`)
      console.log(`     分类: [${layer.tileCategories?.join(', ')}]`)
      console.log(`     描述: ${layer.description}`)
    })
    
    // 根据AI建议生成分层地图
    console.log('\n🔨 开始生成分层地图数据...')
    const layers = generateLayeredMaps(
      grid,
      layeringSuggestion.layers,
      tileTypes,
      mapWidth,
      mapHeight,
      regions
    )
    
    console.log('✅ 分层地图生成完成')
    console.log('========================================\n')
    
    return {
      success: true,
      layers,
      reasoning: layeringSuggestion.reasoning
    }
    
  } catch (error: any) {
    console.error('AI分层失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
})

// 生成分层地图数据
function generateLayeredMaps(
  grid: any[][],
  layerSpecs: any[],
  tileTypes: any[],
  mapWidth: number,
  mapHeight: number,
  regions: any[]
) {
  const layers = []
  
  for (const spec of layerSpecs) {
    // 创建新的图层数据
    const layerData = []
    
    for (let y = 0; y < mapHeight; y++) {
      for (let x = 0; x < mapWidth; x++) {
        const tile = grid[y][x]
        const tileType = tileTypes.find((t: any) => t.id === tile.tileId)
        
        // 判断这个瓦片是否属于当前图层
        let belongsToThisLayer = false
        if (tileType && spec.tileCategories && spec.tileCategories.length > 0) {
          // 如果瓦片有category，直接匹配
          if (tileType.category) {
            belongsToThisLayer = spec.tileCategories.includes(tileType.category)
          } else {
            // 如果瓦片没有category，尝试根据名称匹配
            const tileName = (tileType.name || '').toLowerCase()
            belongsToThisLayer = spec.tileCategories.some((cat: string) => 
              tileName.includes(cat) || cat.includes(tileName)
            )
          }
        }
        
        if (belongsToThisLayer) {
          layerData.push(tile.tileId)
        } else {
          layerData.push(0) // 空瓦片
        }
      }
    }
    
    // 创建TMJ格式的图层
    const tmjLayer = {
      compressionlevel: -1,
      height: mapHeight,
      width: mapWidth,
      infinite: false,
      layers: [
        {
          data: layerData,
          height: mapHeight,
          width: mapWidth,
          id: 1,
          name: spec.name,
          opacity: 1,
          type: "tilelayer",
          visible: true,
          x: 0,
          y: 0,
          properties: [
            { name: "description", type: "string", value: spec.description },
            { name: "zIndex", type: "int", value: spec.zIndex }
          ]
        }
      ],
      nextlayerid: 2,
      nextobjectid: 1,
      orientation: "orthogonal",
      renderorder: "right-down",
      tiledversion: "1.10.2",
      tileheight: 16,
      tilewidth: 16,
      type: "map",
      version: "1.10"
    }
    
    layers.push({
      name: spec.name,
      data: tmjLayer
    })
  }
  
  return layers
}

