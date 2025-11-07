import { getDB } from "~/server/utils/db";
import { getCurrentUser } from "~/server/utils/auth";
import Database from 'better-sqlite3'
import { join } from 'path'

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
    const appDb = getDB();
    const chatDb = new Database(join(process.cwd(), 'data', 'chat.db'));

    // ===== 获取用户列表 =====
    const users = appDb
      .prepare(
        `
      SELECT 
        u.id, 
        u.username, 
        u.nickname, 
        u.avatar, 
        u.created_at,
        (SELECT COUNT(*) FROM room_members WHERE user_id = u.id) as room_count,
        (SELECT COUNT(*) FROM messages WHERE sender_type = 'user' AND sender_id = u.id) as message_count
      FROM users u
      ORDER BY u.created_at DESC
    `
      )
      .all();

    // ===== 获取房间列表 =====
    const rooms = appDb
      .prepare(
        `
      SELECT 
        r.id,
        r.name,
        r.description,
        r.avatar,
        r.event_background,
        r.creator_id,
        u.username as creator_name,
        u.nickname as creator_nickname,
        r.created_at,
        (SELECT COUNT(*) FROM room_members WHERE room_id = r.id) as member_count,
        (SELECT COUNT(*) FROM npcs WHERE room_id = r.id) as npc_count,
        (SELECT COUNT(*) FROM messages WHERE room_id = r.id) as message_count
      FROM rooms r
      LEFT JOIN users u ON r.creator_id = u.id
      ORDER BY r.created_at DESC
    `
      )
      .all();

    // ===== 获取 NPC 列表 =====
    const npcs = appDb
      .prepare(
        `
      SELECT 
        n.id,
        n.name,
        n.avatar,
        n.profile,
        n.room_id,
        n.created_at,
        r.name as room_name
      FROM npcs n
      LEFT JOIN rooms r ON n.room_id = r.id
      ORDER BY n.created_at DESC
    `
      )
      .all();

    // ===== 获取消息列表（最近1000条）=====
    const messages = appDb
      .prepare(
        `
      SELECT 
        m.id,
        m.room_id,
        m.sender_type,
        m.sender_id,
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

    // ===== 获取朋友圈列表 =====
    let moments = []
    try {
      // 检查 moments 表是否存在
      const tableCheck = chatDb.prepare(`
        SELECT name FROM sqlite_master WHERE type='table' AND name='moments'
      `).get()

      if (tableCheck) {
        moments = chatDb.prepare(`
          SELECT 
            m.id,
            m.room_id,
            m.user_id,
            m.npc_id,
            m.content,
            m.images,
            m.created_at
          FROM moments m
          ORDER BY m.created_at DESC
          LIMIT 500
        `).all()

        // 补充作者信息
        moments = moments.map((moment: any) => {
          let author_name = '未知'
          if (moment.user_id) {
            const user = appDb.prepare('SELECT nickname FROM users WHERE id = ?').get(moment.user_id) as any
            author_name = user?.nickname || '未知用户'
          } else if (moment.npc_id) {
            const npc = appDb.prepare('SELECT name FROM npcs WHERE id = ?').get(moment.npc_id) as any
            author_name = npc?.name || '未知NPC'
          }

          // 获取点赞和评论数
          const like_count = chatDb.prepare('SELECT COUNT(*) as count FROM moment_likes WHERE moment_id = ?').get(moment.id) as any
          const comment_count = chatDb.prepare('SELECT COUNT(*) as count FROM moment_comments WHERE moment_id = ?').get(moment.id) as any

          return {
            ...moment,
            author_name,
            like_count: like_count?.count || 0,
            comment_count: comment_count?.count || 0
          }
        })
      }
    } catch (err) {
      console.error('获取朋友圈数据失败:', err)
    }

    chatDb.close()

    // ===== 统计数据 =====
    const stats = {
      totalUsers: users.length,
      totalRooms: rooms.length,
      totalNpcs: npcs.length,
      totalMessages: appDb.prepare('SELECT COUNT(*) as count FROM messages').get()?.count || 0,
      totalMoments: moments.length,
      totalRoomMembers: appDb.prepare('SELECT COUNT(*) as count FROM room_members').get()?.count || 0,
    }

    return {
      success: true,
      data: {
        stats,
        users,
        rooms,
        npcs,
        messages,
        moments,
      },
    };
  } catch (error) {
    console.error("获取数据库数据失败:", error);
    return {
      success: false,
      error: "获取数据失败：" + error.message,
    };
  }
});

