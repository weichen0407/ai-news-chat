export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  
  console.log('🧪 测试DeepSeek API调用')
  console.log('🔍 API调试信息:')
  console.log('- API密钥长度:', config.deepseekApiKey?.length || 0)
  console.log('- API密钥前缀:', config.deepseekApiKey?.substring(0, 10) || 'undefined')
  console.log('- API密钥后缀:', config.deepseekApiKey?.substring(config.deepseekApiKey?.length - 10) || 'undefined')
  console.log('- Authorization头:', `Bearer ${config.deepseekApiKey}`)
  
  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.deepseekApiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{"role": "user", "content": "Hello"}],
        max_tokens: 10
      })
    })
    
    console.log('📡 API响应状态:', response.status)
    console.log('📡 API响应头:', Object.fromEntries(response.headers.entries()))
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ API调用成功:', data.choices[0]?.message?.content || '无内容')
      return {
        success: true,
        message: data.choices[0]?.message?.content || '无内容',
        status: response.status
      }
    } else {
      const errorText = await response.text()
      console.log('❌ API调用失败:', response.status, errorText)
      return {
        success: false,
        error: `API调用失败: ${response.status} ${response.statusText}`,
        details: errorText,
        status: response.status
      }
    }
  } catch (error) {
    console.log('💥 API调用异常:', error.message)
    return {
      success: false,
      error: `API调用异常: ${error.message}`,
      type: error.constructor.name
    }
  }
})
