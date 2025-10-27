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

    // 获取房间列表（包含群主信息和成员列表）
    const rooms = db
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
        COUNT(DISTINCT rm.id) as member_count
      FROM rooms r
      LEFT JOIN users u ON r.creator_id = u.id
      LEFT JOIN room_members rm ON r.id = rm.room_id
      GROUP BY r.id
      ORDER BY r.created_at DESC
    `
      )
      .all();

    // 获取每个房间的详细成员列表
    const roomMembersList = db
      .prepare(
        `
      SELECT 
        rm.room_id,
        rm.user_id,
        rm.role_name,
        rm.role_profile,
        rm.joined_at,
        u.username,
        u.nickname,
        u.avatar as user_avatar
      FROM room_members rm
      LEFT JOIN users u ON rm.user_id = u.id
      ORDER BY rm.joined_at ASC
    `
      )
      .all();

    // 获取每个房间的NPC列表
    const npcsList = db
      .prepare(
        `
      SELECT 
        id,
        room_id,
        name,
        avatar,
        profile
      FROM npcs
      ORDER BY created_at ASC
    `
      )
      .all();

    // 按房间组织消息
    const messagesByRoom = {};
    messages.forEach((msg) => {
      if (!messagesByRoom[msg.room_id]) {
        messagesByRoom[msg.room_id] = [];
      }
      messagesByRoom[msg.room_id].push(msg);
    });

    // 按房间组织成员
    const membersByRoom = {};
    roomMembersList.forEach((member) => {
      if (!membersByRoom[member.room_id]) {
        membersByRoom[member.room_id] = [];
      }
      membersByRoom[member.room_id].push(member);
    });

    // 按房间组织NPC
    const npcsByRoom = {};
    npcsList.forEach((npc) => {
      if (!npcsByRoom[npc.room_id]) {
        npcsByRoom[npc.room_id] = [];
      }
      npcsByRoom[npc.room_id].push(npc);
    });

    // 为每个房间添加详细信息
    const roomsWithDetails = rooms.map((room) => {
      const members = membersByRoom[room.id] || [];
      const npcs = npcsByRoom[room.id] || [];
      const roomMessages = messagesByRoom[room.id] || [];

      // 分离AI消息和真人玩家消息
      const playerMessages = roomMessages.filter(
        (msg) => msg.sender_type === "user"
      );
      const aiMessages = roomMessages.filter(
        (msg) => msg.sender_type === "npc"
      );

      return {
        ...room,
        members: members.map((m) => ({
          user_id: m.user_id,
          username: m.username,
          nickname: m.nickname,
          avatar: m.user_avatar,
          role_name: m.role_name,
          role_profile: m.role_profile,
          joined_at: m.joined_at,
        })),
        npcs: npcs.map((n) => ({
          id: n.id,
          name: n.name,
          avatar: n.avatar,
          profile: n.profile,
        })),
        message_count: roomMessages.length,
        player_message_count: playerMessages.length,
        ai_message_count: aiMessages.length,
        latest_messages: roomMessages.slice(-10), // 最近10条消息
      };
    });

    // 获取统计信息
    const stats = {
      totalUsers: users.length,
      totalMessages: messages.length,
      totalRooms: rooms.length,
      latestUsers: users.slice(0, 10),
    };

    return {
      success: true,
      data: {
        stats,
        users,
        rooms: roomsWithDetails,
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
