export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)
  
  const { 
    characters, 
    event: newsEvent, 
    customPrompt, 
    dialogueCount,
    storyHistory = [],
    selectedBranch = null,
    currentRound = 0
  } = body
  
  if (!characters || !newsEvent) {
    return {
      success: false,
      error: '请提供人物和事件信息'
    }
  }
  
  // 处理固定的三个人物
  const characterList = ['王宝强', '马蓉', '宋喆']
  const wangbaoqiangProfile = characters.wangbaoqiang || '受害者'
  const marongProfile = characters.marong || '出轨方'
  const songzheProfile = characters.songzhe || '第三者'
  
  const isFirstGeneration = currentRound === 0
  
  try {
    // 调用 DeepSeek API
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.deepseekApiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `你是一个专业的互动剧情生成器。你需要生成包含剧情描述和对话的故事内容。

输出格式严格要求：
1. 先输出剧情描述：[剧情]：描述内容（场景、事件、背景等）
2. 再输出对话：【人物名】：对话内容
3. 剧情和对话要交替出现
4. 每次生成1-2段剧情描述 + ${dialogueCount * 3}句左右对话

内容要求：
1. 剧情描述要生动，包含场景、动作、表情、环境、心理活动
2. 严格按照每个人物的人设和目标来塑造对话
3. 对话要有情感冲突和戏剧张力
4. 故事要有逻辑递进，体现事态发展
5. 对话要自然，符合人物性格

${customPrompt ? `\n特殊要求：${customPrompt}\n` : ''}`
          },
          {
            role: 'user',
            content: buildPromptContent(
              newsEvent, 
              wangbaoqiangProfile, 
              marongProfile, 
              songzheProfile, 
              storyHistory, 
              selectedBranch, 
              isFirstGeneration,
              dialogueCount
            )
          }
        ],
        temperature: 0.8,
        max_tokens: 2000
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
    const generatedText = data.choices[0]?.message?.content || ''
    
    // 解析生成的内容（对话+剧情）
    const content = parseContent(generatedText, characterList)
    
    // 更新历史记录
    const updatedHistory = [...storyHistory, ...content]
    const newRound = currentRound + 1
    
    // 每次生成后都创建分支选项
    const branches = await generateBranches(config, newsEvent, updatedHistory, characterList)
    
    return {
      success: true,
      content,
      storyHistory: updatedHistory,
      currentRound: newRound,
      branches
    }
  } catch (error) {
    console.error('Error generating dialogue:', error)
    return {
      success: false,
      error: '生成对话时出错，请重试'
    }
  }
})

function buildPromptContent(
  newsEvent: string,
  wangbaoqiangProfile: string,
  marongProfile: string,
  songzheProfile: string,
  storyHistory: any[],
  selectedBranch: string | null,
  isFirstGeneration: boolean,
  dialogueCount: number
): string {
  let prompt = `事件背景：
${newsEvent}

人物设定：
- 王宝强：${wangbaoqiangProfile}
- 马蓉：${marongProfile}
- 宋喆：${songzheProfile}

`
  
  if (isFirstGeneration) {
    prompt += `请开始生成故事：
1. 先写1-2段剧情描述（使用[剧情]格式）
2. 然后写${dialogueCount * 3}句左右的人物对话（使用【人物名】格式）
3. 剧情和对话要紧密配合，推动故事发展`
  } else {
    // 添加历史摘要
    const historySummary = storyHistory.slice(-15).map(item => {
      if (item.type === 'narration') {
        return `[剧情]：${item.content}`
      } else {
        return `【${item.speaker}】：${item.content}`
      }
    }).join('\n')
    
    prompt += `故事进展（最近内容）：
${historySummary}

`
    
    if (selectedBranch) {
      prompt += `玩家选择了剧情走向：「${selectedBranch}」

请基于这个选择继续生成：
1. 先写1-2段剧情描述（使用[剧情]格式），描述选择后发生的事情
2. 然后写${dialogueCount * 3}句左右的人物对话（使用【人物名】格式）
3. 让剧情和对话自然衔接`
    } else {
      prompt += `请继续生成故事：
1. 先写1-2段剧情描述（使用[剧情]格式）
2. 然后写${dialogueCount * 3}句左右的人物对话（使用【人物名】格式）`
    }
  }
  
  return prompt
}

function parseContent(text: string, characterList: string[]): Array<{ type: string; speaker?: string; content: string }> {
  const lines = text.split('\n').filter(line => line.trim())
  const content: Array<{ type: string; speaker?: string; content: string }> = []
  
  for (const line of lines) {
    // 匹配格式：【人物】：对话 或 [剧情]：描述
    const match = line.match(/^[【\[](.+?)[】\]][：:]\s*(.+)$/)
    if (match) {
      const label = match[1].trim()
      const text = match[2].trim()
      
      if (label === '剧情' || label === '旁白' || label === '描述') {
        // 剧情描述
        content.push({
          type: 'narration',
          content: text
        })
      } else {
        // 对话
        const validSpeaker = characterList.find(c => 
          label.includes(c) || c.includes(label)
        ) || label
        
        content.push({
          type: 'dialogue',
          speaker: validSpeaker,
          content: text
        })
      }
    }
  }
  
  return content
}

async function generateBranches(
  config: any,
  newsEvent: string,
  storyHistory: any[],
  characterList: string[]
): Promise<string[]> {
  try {
    // 获取最近的故事内容
    const recentHistory = storyHistory.slice(-15).map(item => {
      if (item.type === 'narration') {
        return `[剧情]：${item.content}`
      } else {
        return `【${item.speaker}】：${item.content}`
      }
    }).join('\n')
    
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.deepseekApiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `你是剧情分支生成器。根据当前故事进展，生成3个不同的剧情走向选项。

要求：
1. 每个选项描述接下来可能发生的事件或冲突
2. 选项要有明显的差异和戏剧性
3. 每个选项15-25字，简洁有力
4. 每行一个选项，不要编号和标点
5. 选项要符合人物性格和事件逻辑
6. 只输出3个选项，不要其他任何内容`
          },
          {
            role: 'user',
            content: `事件背景：${newsEvent}

故事进展：
${recentHistory}

请生成3个不同的剧情走向选项，让玩家选择接下来的故事发展。`
          }
        ],
        temperature: 0.9,
        max_tokens: 200
      })
    })
    
    if (response.ok) {
      const data = await response.json()
      const branchText = data.choices[0]?.message?.content || ''
      const branches = branchText
        .split('\n')
        .filter((line: string) => line.trim())
        .map((line: string) => line.replace(/^[0-9]+[.、]\s*/, '').trim())
        .filter((line: string) => line.length > 10)
        .slice(0, 3)
      
      return branches.length >= 2 ? branches : []
    }
  } catch (error) {
    console.error('生成分支失败:', error)
  }
  
  return []
}

