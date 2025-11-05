/**
 * AI生成地图API
 * 根据自然语言描述生成完整地图
 */
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export default defineEventHandler(async (event) => {
  console.log('\n========================================')
  console.log('🎨 AI地图生成API被调用')
  console.log('时间:', new Date().toISOString())
  console.log('========================================\n')
  
  try {
    const body = await readBody(event)
    const { description, width, height, style, tileSet } = body
    
    console.log('📝 接收到的参数:')
    console.log('- 描述:', description)
    console.log('- 尺寸:', width, 'x', height)
    console.log('- 风格:', style)
    console.log('- Tile数量:', tileSet?.length || 0)
    
    if (!description || !width || !height) {
      console.error('❌ 参数不完整')
      throw createError({
        statusCode: 400,
        message: '请提供完整的参数'
      })
    }
    
    const deepseekApiKey = process.env.DEEPSEEK_API_KEY
    
    console.log('🔑 检查API密钥:')
    console.log('- 是否存在:', !!deepseekApiKey)
    console.log('- 密钥长度:', deepseekApiKey?.length || 0)
    console.log('- 密钥前10位:', deepseekApiKey?.substring(0, 10) || 'undefined')
    
    if (!deepseekApiKey) {
      console.error('❌ DeepSeek API密钥未配置')
      throw createError({
        statusCode: 500,
        message: 'DeepSeek API密钥未配置'
      })
    }
    
    // 构建Tile信息描述
    const tileDescriptions = tileSet?.map((t: any, index: number) => 
      `Tile ${index}: ${t.name}`
    ).join('\n') || '无可用Tile（将使用颜色）'
    
    const prompt = `你是一个专业的游戏地图设计师。请为一个${width}x${height}的像素风格地图创建详细的设计方案。

用户需求：${description}

设计原则：
1. 地图布局要符合真实逻辑和美学原则
2. 相似元素要创建多个变体以增加视觉丰富度（如：草地1/草地2/草地3、花朵1/花朵2/花朵3）
3. 确保地形连贯性（河流要连续、道路要连通、建筑要成群）
4. 使用鲜明的颜色区分不同类型，同类型的变体使用相近色系
5. 考虑地图的层次感（背景层、装饰层、建筑层）

色彩参考：
- 草地系列：浅绿到深绿 (#90EE90, #7CCD7C, #66BB6A)
- 河流/水体：蓝色系列 (#3498DB, #2E86C1, #1976D2)
- 道路/地面：灰褐色系 (#A0826D, #8B7355, #6B5644)
- 建筑/房屋：暖色系 (#D2691E, #CD853F, #DEB887)
- 花朵/植物：粉红、紫色系 (#FFB6C1, #FF69B4, #FF1493, #DDA0DD)
- 树木/森林：深绿系 (#228B22, #2E8B57, #006400)

返回格式（必须严格遵守，只返回JSON）：
{
  "tileTypes": [
    {"id": 1, "name": "草地1", "color": "#90EE90", "category": "ground"},
    {"id": 2, "name": "草地2", "color": "#7CCD7C", "category": "ground"},
    {"id": 3, "name": "河流1", "color": "#3498DB", "category": "water"}
  ],
  "layout": [[1,1,2,3,...], [1,2,3,3,...], ...],
  "reasoning": "详细的设计说明，包括布局逻辑、色彩搭配、变体使用等"
}

关键要求：
- layout必须是完整的${height}行×${width}列二维数组，每个元素都是tileTypes中的id
- 同类型元素的变体要交替使用，避免大片单一色块
- 确保地图有明确的功能分区和视觉焦点
- 只返回纯JSON，不要任何markdown标记或额外文字`
    
    console.log('\n📤 准备调用DeepSeek API')
    console.log('- API地址: https://api.deepseek.com/v1/chat/completions')
    console.log('- 模型: deepseek-chat')
    console.log('- Temperature: 0.7')
    console.log('- Max tokens: 8000')
    console.log('- Prompt长度:', prompt.length, '字符')
    console.log('\n📝 完整Prompt内容：')
    console.log('='.repeat(80))
    console.log(prompt)
    console.log('='.repeat(80))
    
    const requestBody = {
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: '你是游戏地图生成AI。必须只返回纯JSON格式，不要任何markdown标记或额外文字。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 8000
    }
    
    console.log('- 消息数量:', requestBody.messages.length)
    
    const apiStartTime = Date.now()
    
    // 调用DeepSeek API
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${deepseekApiKey}`
      },
      body: JSON.stringify(requestBody)
    })
    
    const apiElapsed = Date.now() - apiStartTime
    console.log(`\n📥 DeepSeek API响应 (耗时: ${apiElapsed}ms)`)
    console.log('- 状态码:', response.status)
    console.log('- 状态文本:', response.statusText)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ DeepSeek API错误:')
      console.error('- 状态码:', response.status)
      console.error('- 错误内容:', errorText)
      throw new Error(`DeepSeek API调用失败: ${response.status}`)
    }
    
    console.log('📦 开始读取响应文本...')
    let responseText
    try {
      responseText = await response.text()
      console.log('✅ 响应文本读取成功，长度:', responseText.length, '字符')
      console.log('前200字符:', responseText.substring(0, 200))
    } catch (textError: any) {
      console.error('❌ 读取响应文本失败:', textError.message)
      throw new Error(`无法读取DeepSeek响应: ${textError.message}`)
    }
    
    console.log('📦 开始解析JSON...')
    let data
    try {
      data = JSON.parse(responseText)
      console.log('✅ JSON解析成功')
    } catch (jsonError: any) {
      console.error('❌ JSON解析失败:', jsonError.message)
      console.error('响应文本前500字符:', responseText.substring(0, 500))
      throw new Error(`无法解析DeepSeek响应为JSON: ${jsonError.message}`)
    }
    
    console.log('✅ DeepSeek API调用成功')
    console.log('- 响应数据类型:', typeof data)
    console.log('- 响应数据keys:', Object.keys(data))
    console.log('- Choices数量:', data.choices?.length || 0)
    
    if (!data.choices || data.choices.length === 0) {
      console.error('❌ 响应中没有choices')
      console.error('完整响应数据:', JSON.stringify(data, null, 2))
      throw new Error('DeepSeek返回数据格式错误：没有choices')
    }
    
    const aiResponse = data.choices[0].message.content
    console.log('- AI响应类型:', typeof aiResponse)
    console.log('- AI响应长度:', aiResponse?.length || 0, '字符')
    
    if (!aiResponse) {
      console.error('❌ AI响应内容为空')
      console.error('Choice对象:', JSON.stringify(data.choices[0], null, 2))
      throw new Error('DeepSeek返回内容为空')
    }
    
    console.log('- AI响应前300字符:')
    console.log(aiResponse.substring(0, 300))
    console.log('- AI响应后200字符:')
    console.log(aiResponse.substring(Math.max(0, aiResponse.length - 200)))
    
    // 解析AI响应
    console.log('\n🔍 开始解析AI响应')
    let result
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        console.log('- 使用正则提取JSON')
        result = JSON.parse(jsonMatch[0])
      } else {
        console.log('- 直接解析整个响应为JSON')
        result = JSON.parse(aiResponse)
      }
      console.log('✅ JSON解析成功')
      console.log('- 结果keys:', Object.keys(result))
    } catch (e) {
      console.error('❌ AI响应解析失败')
      console.error('- 错误:', e)
      console.error('- AI完整响应:\n', aiResponse)
      throw new Error('AI响应格式错误')
    }
    
    // 验证layout尺寸
    console.log('\n📏 验证地图尺寸')
    console.log('- 期望尺寸:', width, 'x', height)
    console.log('- 实际layout行数:', result.layout?.length || 0)
    console.log('- 实际layout列数:', result.layout?.[0]?.length || 0)
    
    if (!result.layout || result.layout.length !== height) {
      console.error('❌ 地图高度不匹配')
      throw new Error(`生成的地图高度不匹配：期望${height}，实际${result.layout?.length || 0}`)
    }
    if (result.layout[0].length !== width) {
      console.error('❌ 地图宽度不匹配')
      throw new Error(`生成的地图宽度不匹配：期望${width}，实际${result.layout[0]?.length || 0}`)
    }
    
    console.log('✅ 地图尺寸验证通过')
    console.log('- Tile类型数量:', result.tileTypes?.length || 0)
    console.log('- Tile类型列表:', result.tileTypes?.map((t: any) => `${t.id}:${t.name}`).join(', '))
    
    // 打印layout的一小部分作为预览
    console.log('- Layout预览(前3行):')
    for (let i = 0; i < Math.min(3, result.layout.length); i++) {
      console.log(`  行${i}:`, result.layout[i].slice(0, Math.min(10, width)).join(','), '...')
    }
    
    const finalResult = {
      success: true,
      layout: result.layout,
      regions: result.regions || [],
      entities: result.entities || [],
      tileTypes: result.tileTypes || [],
      reasoning: result.reasoning || '已生成地图',
      metadata: {
        width,
        height,
        description,
        style,
        timestamp: new Date().toISOString()
      }
    }
    
    // 保存生成的地图到文件
    try {
      const mapsDir = join(process.cwd(), 'public', 'map-creator', 'generated-maps')
      if (!existsSync(mapsDir)) {
        await mkdir(mapsDir, { recursive: true })
        console.log('📁 创建目录:', mapsDir)
      }
      
      const timestamp = Date.now()
      const filename = `map_${width}x${height}_${timestamp}.json`
      const filepath = join(mapsDir, filename)
      
      await writeFile(filepath, JSON.stringify(finalResult, null, 2), 'utf-8')
      console.log('💾 地图已保存到文件:', filename)
      
      finalResult.savedFile = filename
      finalResult.savedPath = `/map-creator/generated-maps/${filename}`
    } catch (saveError: any) {
      console.error('⚠️ 保存文件失败:', saveError.message)
      // 不影响主流程，继续返回结果
    }
    
    console.log('\n✅ AI地图生成完成')
    console.log('========================================\n')
    
    return finalResult
    
  } catch (error: any) {
    console.error('\n❌ AI生成地图失败')
    console.error('错误类型:', error.constructor?.name)
    console.error('错误消息:', error.message)
    console.error('错误堆栈:', error.stack)
    console.log('========================================\n')
    
    return {
      success: false,
      error: error.message || '生成失败'
    }
  }
})

