/**
 * 初始化朋友圈数据表
 */
import { initMomentsTables } from '~/server/utils/db-moments'

export default defineEventHandler(async () => {
  try {
    initMomentsTables()
    return { success: true, message: '朋友圈数据表初始化成功' }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

