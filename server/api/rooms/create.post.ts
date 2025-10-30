import { getDB } from '~/server/utils/db'
import { getCurrentUser } from '~/server/utils/auth'
import { createStory, createNPCs } from '~/chat-api'

export default defineEventHandler(async (event) => {
  const user = await getCurrentUser(event)
  if (!user) {
    return { success: false, error: '请先登录' }
  }
  
  const body = await readBody(event)
  const { name, description, eventBackground, npcs, presetId, dialogueDensity, avatar } = body
  
  if (!name || !eventBackground) {
    return { success: false, error: '请填写房间名称和事件背景' }
  }
  
  const db = getDB()
  
  try {
    // 使用chat-api创建剧情
    const storyResult = createStory(db, {
      name,
      description,
      eventBackground,
      dialogueDensity,
      avatar,
      presetId,
      creatorId: user.id
    })
    
    if (!storyResult.success) {
      return storyResult
    }
    
    // 添加NPC
    if (npcs && npcs.length > 0) {
      const npcResult = createNPCs(db, storyResult.roomId!, npcs)
      console.log(`创建了${npcResult.created}个NPC，失败${npcResult.failed}个`)
    }
    
    // 注意：创建者需要在第一次进入时选择人设，所以这里不自动加入
    
    return {
      success: true,
      roomId: storyResult.roomId
    }
  } catch (error) {
    console.error('创建房间失败:', error)
    return { success: false, error: '创建房间失败' }
  }
})

