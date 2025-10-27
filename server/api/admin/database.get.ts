import { getDB } from "~/server/utils/db";
import { getCurrentUser } from "~/server/utils/auth";

// 管理员用户名列表
const ADMIN_USERS = ["jerry", "admin"];

export default defineEventHandler(async (event) => {
  // 验证当前用户是否为管理员
  const user = await getCurrentUser(event);

  if (!user) {
    return { success: false, error: "请先登录" };
  }

  if (!ADMIN_USERS.includes(user.username)) {
    return { success: false, error: "权限不足：仅管理员可访问" };
  }

  try {
    const db = getDB();

    // 获取用户列表（注册信息）
    const users = db
      .prepare(
        `
      SELECT id, username, nickname, avatar, created_at 
      FROM users 
      ORDER BY created_at DESC
    `
      )
      .all();

    // 获取所有消息（聊天内容）
    const messages = db
      .prepare(
        `
      SELECT 
        m.id,
        m.room_id,
        m.sender_type,
        m.sender_name,
        m.avatar,
        m.content,
        m.created_at,
        r.name as room_name
      FROM messages m
      LEFT JOIN rooms r ON m.room_id = r.id
      ORDER BY m.created_at DESC
      LIMIT 1000
    `
      )
      .all();

    // 获取房间列表
    const rooms = db
      .prepare(
        `
      SELECT 
        r.id,
        r.name,
        r.description,
        r.avatar,
        r.creator_id,
        u.username as creator_name,
        r.created_at,
        COUNT(DISTINCT rm.id) as member_count
      FROM rooms r
      LEFT JOIN users u ON r.creator_id = u.id
      LEFT JOIN room_members rm ON r.id = rm.room_id
      GROUP BY r.id
      ORDER BY r.created_at DESC
    `
      )
      .all();

    // 获取统计信息
    const stats = {
      totalUsers: users.length,
      totalMessages: messages.length,
      totalRooms: rooms.length,
      latestUsers: users.slice(0, 10),
      latestMessages: messages.slice(0, 20),
    };

    return {
      success: true,
      data: {
        stats,
        users,
        messages,
        rooms,
      },
    };
  } catch (error) {
    console.error("数据库查询错误:", error);
    return {
      success: false,
      error: error.message,
    };
  }
});
