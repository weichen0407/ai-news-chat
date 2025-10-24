import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  try {
    console.log("开始简单初始化...");

    // 创建admin用户
    const adminUser = await prisma.user.upsert({
      where: { username: "jerry" },
      update: {},
      create: {
        username: "jerry",
        nickname: "Jerry",
        password: "123123",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
        is_admin: true,
      },
    });

    console.log("Admin用户创建成功:", adminUser.username);

    // 创建第一个测试房间
    const room = await prisma.room.upsert({
      where: { id: "DRAMA1" },
      update: {},
      create: {
        id: "DRAMA1",
        name: "王宝强离婚风波",
        description: "2016年娱乐圈最轰动的离婚事件",
        avatar: "💔",
        event_background: "2016年8月14日凌晨，王宝强在微博发布离婚声明...",
        dialogue_density: 3,
        creator_id: adminUser.id,
      },
    });

    console.log("房间创建成功:", room.name);

    // 让jerry用户加入这个房间
    await prisma.roomMember.upsert({
      where: {
        room_id_user_id: {
          room_id: room.id,
          user_id: adminUser.id,
        },
      },
      update: {},
      create: {
        room_id: room.id,
        user_id: adminUser.id,
        role_name: "群主",
        role_profile: "房间创建者和管理员",
      },
    });

    console.log("Jerry已加入房间");

    return {
      success: true,
      message: "简单初始化成功",
      user: adminUser.username,
      room: room.name,
    };
  } catch (error) {
    console.error("简单初始化失败:", error);
    return {
      success: false,
      error: error.message,
    };
  } finally {
    await prisma.$disconnect();
  }
});
