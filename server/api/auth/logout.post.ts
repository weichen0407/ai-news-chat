import { deleteSession } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const sessionId = getCookie(event, 'session_id')
  
  if (sessionId) {
    deleteSession(sessionId)
  }
  
  // 删除cookie
  deleteCookie(event, 'session_id')
  
  return { success: true }
})

