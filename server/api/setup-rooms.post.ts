import { getDB } from "~/server/utils/db";

export default defineEventHandler(async (event) => {
  try {
    console.log("开始设置预设房间...");

    const db = getDB();

    // 创建admin用户
    const insertUser = db.prepare(`
      INSERT OR IGNORE INTO users (username, nickname, password, avatar, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    insertUser.run('jerry', 'Jerry', '123123', 
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
      new Date().toISOString()
    );

    console.log("Admin用户创建成功");

    // 获取admin用户ID
    const getUser = db.prepare('SELECT id FROM users WHERE username = ?');
    const user = getUser.get('jerry');

    if (!user) {
      throw new Error('无法创建admin用户');
    }

    // 创建预设房间
    const insertRoom = db.prepare(`
      INSERT OR IGNORE INTO rooms (id, name, description, avatar, event_background, dialogue_density, creator_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertNpc = db.prepare(`
      INSERT OR IGNORE INTO npcs (room_id, name, avatar, profile, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    const insertMember = db.prepare(`
      INSERT OR IGNORE INTO room_members (room_id, user_id, role_name, role_profile, joined_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    const now = new Date().toISOString();

    // 王宝强离婚风波
    insertRoom.run('DRAMA1', '王宝强离婚风波', '2016年娱乐圈最轰动的离婚事件', '💔', 
      `2016年8月14日凌晨，王宝强在微博发布离婚声明，指控妻子马蓉与经纪人宋喆存在婚外不正当两性关系，严重伤害了婚姻、破坏了家庭。这一声明瞬间引爆网络，成为当年最轰动的娱乐事件。`, 3, user.id, now);
    
    insertNpc.run('DRAMA1', '王宝强', 
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
      '憨厚老实，说话直爽，对家庭忠诚，但被背叛后非常愤怒和痛苦。', now);
    
    insertNpc.run('DRAMA1', '马蓉', 
      'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
      '外表清纯，内心复杂，善于伪装。被指控出轨后极力否认。', now);
    
    insertMember.run('DRAMA1', user.id, '群主', '房间创建者和管理员', now);

    console.log("预设房间设置完成！");

    return {
      success: true,
      message: "预设房间设置成功",
      rooms: ['王宝强离婚风波']
    };
  } catch (error) {
    console.error("设置预设房间失败:", error);
    return {
      success: false,
      error: error.message
    };
  }
});
