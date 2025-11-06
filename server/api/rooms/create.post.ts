import { getDB } from '~/server/utils/db'
import { getCurrentUser } from '~/server/utils/auth'
import { createStory, createNPCs } from '~/server/utils/chat-api'

export default defineEventHandler(async (event) => {
  const user = await getCurrentUser(event)
  if (!user) {
    return { success: false, error: '请先登录' }
  }
  
  const body = await readBody(event)
  const { name, description, eventBackground, npcs, presetId, dialogueDensity, avatar } = body
  
  console.log('📥 收到创建房间请求：')
  console.log('- 房间名称:', name)
  console.log('- 创建者:', user.username)
  console.log('- NPC数组:', npcs ? `${npcs.length}个` : '无')
  if (npcs && npcs.length > 0) {
    console.log('- NPC列表:', npcs.map((n: any) => n.name).join(', '))
  }
  
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
    
    console.log(`✅ 房间创建成功，ID: ${storyResult.roomId}`)
    
    // 添加NPC
    if (npcs && npcs.length > 0) {
      console.log(`🤖 开始创建${npcs.length}个NPC...`)
      const npcResult = createNPCs(db, storyResult.roomId!, npcs)
      console.log(`✅ 创建了${npcResult.created}个NPC，失败${npcResult.failed}个`)
      if (npcResult.errors.length > 0) {
        console.error('❌ NPC创建错误:', npcResult.errors)
      }
    } else {
      console.log('ℹ️ 没有NPC需要创建')
    }
    
    // 自动让创建者加入房间（作为普通成员，稍后可以选择角色）
    try {
      db.prepare(`
        INSERT INTO room_members (room_id, user_id, role_name, role_profile, avatar, joined_at)
        VALUES (?, ?, NULL, NULL, NULL, CURRENT_TIMESTAMP)
      `).run(storyResult.roomId, user.id)
      console.log(`✅ 创建者 ${user.username} 已自动加入房间 ${storyResult.roomId}`)
    } catch (joinError) {
      console.error('❌ 创建者自动加入房间失败:', joinError)
      // 不影响房间创建，继续
    }
    
    return {
      success: true,
      roomId: storyResult.roomId
    }
  } catch (error) {
    console.error('创建房间失败:', error)
    return { success: false, error: '创建房间失败' }
  }
})

