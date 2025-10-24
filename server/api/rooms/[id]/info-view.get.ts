import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  const roomId = getRouterParam(event, "id");

  if (!roomId) {
    throw createError({
      statusCode: 400,
      statusMessage: "房间ID不能为空",
    });
  }

  try {
    // 获取房间基本信息
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            nickname: true,
            avatar: true,
          },
        },
        npcs: {
          select: {
            id: true,
            name: true,
            avatar: true,
            profile: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                nickname: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    if (!room) {
      throw createError({
        statusCode: 404,
        statusMessage: "房间不存在",
      });
    }

    // 获取当前用户信息
    const currentUser = await getCurrentUser(event);
    const isCreator = currentUser && room.creator_id === currentUser.id;

    // 格式化成员信息
    const members = room.members.map((member) => ({
      id: member.user.id,
      username: member.user.username,
      nickname: member.user.nickname,
      avatar: member.user.avatar,
      role_name: member.role_name,
      role_profile: member.role_profile,
      joined_at: member.created_at,
    }));

    // 格式化NPC信息
    const npcs = room.npcs.map((npc) => ({
      id: npc.id,
      name: npc.name,
      avatar: npc.avatar,
      profile: npc.profile,
    }));

    return {
      success: true,
      room: {
        id: room.id,
        name: room.name,
        description: room.description,
        avatar: room.avatar,
        event_background: room.event_background,
        dialogue_density: room.dialogue_density,
        created_at: room.created_at,
        creator: room.creator,
      },
      npcs,
      members,
      isCreator,
      memberCount: members.length,
      npcCount: npcs.length,
      totalCount: members.length + npcs.length,
    };
  } catch (error) {
    console.error("获取房间信息失败:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "获取房间信息失败",
    });
  } finally {
    await prisma.$disconnect();
  }
});
