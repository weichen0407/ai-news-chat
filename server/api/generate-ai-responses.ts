export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)
  
  const { characters, eventBackground, chatHistory } = body
  
  if (!characters || !chatHistory || chatHistory.length === 0) {
    return {
      success: false,
      error: '缺少必要信息'
    }
  }
  
  try {
    // 构建聊天历史
    const historyText = chatHistory.map((msg: any) => {
      return `${msg.name}: ${msg.text}`
    }).join('\n')
    
    // 获取最后一条消息
    const lastMessage = chatHistory[chatHistory.length - 1]
    
    const apiKey = process.env.DEEPSEEK_API_KEY || config.deepseekApiKey;
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `你是一个对话生成器。根据聊天历史和角色设定，判断哪些AI角色会回复最新的消息，并生成他们的回复。

角色信息：
- 王宝强：${characters.wangbaoqiang.profile}
- 马蓉：${characters.marong.profile}
- 宋喆：${characters.songzhe.profile}

事件背景：${eventBackground}

规则：
1. 分析最新消息的内容，判断哪1-2个AI角色会回复（不是所有人都会回复）
2. 回复要符合角色人设和当前情境
3. 对话要自然、有冲突感
4. 严格按照以下JSON格式输出，不要有任何其他内容：
[
  {"character": "wangbaoqiang", "message": "回复内容"},
  {"character": "marong", "message": "回复内容"}
]

注意：
- character只能是：wangbaoqiang、marong、songzhe
- 可以只有1个回复，也可以有2个，根据情况决定
- 如果消息不值得回复或针对性不强，可以返回空数组[]`
          },
          {
            role: 'user',
            content: `聊天历史：
${historyText}

最新消息是：${lastMessage.name}说"${lastMessage.text}"

请判断哪些AI角色会回复，并生成回复内容（JSON格式）：`
          }
        ],
        temperature: 0.8,
        max_tokens: 500
      })
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('DeepSeek API Error:', errorText)
      return {
        success: false,
        error: 'AI服务调用失败'
      }
    }
    
    const data = await response.json()
    const responseText = data.choices[0]?.message?.content?.trim() || '[]'
    
    // 解析JSON响应
    let responses = []
    try {
      // 尝试提取JSON
      const jsonMatch = responseText.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const parsedResponses = JSON.parse(jsonMatch[0])
        
        // 转换格式并添加角色名称
        responses = parsedResponses.map((resp: any) => ({
          characterKey: resp.character,
          name: characters[resp.character]?.name || '未知',
          message: resp.message
        }))
      }
    } catch (error) {
      console.error('JSON解析失败:', error, responseText)
    }
    
    return {
      success: true,
      responses
    }
  } catch (error) {
    console.error('生成AI回复失败:', error)
    return {
      success: false,
      error: '生成回复时出错，请重试'
    }
  }
})

