import { getDB } from "~/server/utils/db";

export default defineEventHandler(async (event) => {
  try {
    const db = getDB();
    
    // 测试数据库连接
    const result = db.prepare('SELECT 1 as test').get();
    
    return {
      success: true,
      message: "数据库连接正常",
      test: result
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});
