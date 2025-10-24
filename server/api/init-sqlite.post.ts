import Database from 'better-sqlite3';
import { join } from 'path';

export default defineEventHandler(async (event) => {
  try {
    console.log("开始初始化SQLite数据库...");

    // 创建数据库连接
    const dbPath = join(process.cwd(), 'data', 'app.db');
    const db = new Database(dbPath);

    // 创建用户表
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        nickname TEXT NOT NULL,
        password TEXT NOT NULL,
        avatar TEXT,
        is_admin BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 创建房间表
    db.exec(`
      CREATE TABLE IF NOT EXISTS rooms (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        avatar TEXT,
        event_background TEXT,
        dialogue_density INTEGER DEFAULT 3,
        creator_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (creator_id) REFERENCES users (id)
      )
    `);

    // 创建NPC表
    db.exec(`
      CREATE TABLE IF NOT EXISTS npcs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        room_id TEXT NOT NULL,
        name TEXT NOT NULL,
        avatar TEXT,
        profile TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (room_id) REFERENCES rooms (id),
        UNIQUE(room_id, name)
      )
    `);

    // 创建房间成员表
    db.exec(`
      CREATE TABLE IF NOT EXISTS room_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        room_id TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        role_name TEXT,
        role_profile TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (room_id) REFERENCES rooms (id),
        FOREIGN KEY (user_id) REFERENCES users (id),
        UNIQUE(room_id, user_id)
      )
    `);

    // 创建消息表
    db.exec(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        room_id TEXT NOT NULL,
        sender_type TEXT NOT NULL,
        sender_id INTEGER,
        sender_name TEXT,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (room_id) REFERENCES rooms (id)
      )
    `);

    // 创建admin用户
    const insertUser = db.prepare(`
      INSERT OR IGNORE INTO users (username, nickname, password, avatar, is_admin)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const adminUser = insertUser.run('jerry', 'Jerry', '123123', 
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face', 
      true
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
      INSERT OR IGNORE INTO rooms (id, name, description, avatar, event_background, dialogue_density, creator_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const insertNpc = db.prepare(`
      INSERT OR IGNORE INTO npcs (room_id, name, avatar, profile)
      VALUES (?, ?, ?, ?)
    `);

    const insertMember = db.prepare(`
      INSERT OR IGNORE INTO room_members (room_id, user_id, role_name, role_profile)
      VALUES (?, ?, ?, ?)
    `);

    // 王宝强离婚风波
    insertRoom.run('DRAMA1', '王宝强离婚风波', '2016年娱乐圈最轰动的离婚事件', '💔', 
      '2016年8月14日凌晨，王宝强在微博发布离婚声明...', 3, user.id);
    
    insertNpc.run('DRAMA1', '王宝强', 
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
      '憨厚老实，说话直爽，对家庭忠诚，但被背叛后非常愤怒和痛苦。说话带有河北口音，经常用"俺"这个词。');
    
    insertNpc.run('DRAMA1', '马蓉', 
      'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
      '外表清纯，内心复杂，善于伪装。被指控出轨后极力否认，声称是王宝强家暴。说话温柔但带有心机。');
    
    insertMember.run('DRAMA1', user.id, '群主', '房间创建者和管理员');

    // 特朗普vs拜登大选
    insertRoom.run('DRAMA2', '特朗普vs拜登大选', '2020年美国大选激烈对决', '🗳️', 
      '2020年美国大选是历史上最激烈和争议的总统选举之一...', 4, user.id);
    
    insertNpc.run('DRAMA2', '特朗普', 
      'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=100&h=100&fit=crop&crop=face',
      '说话夸张，喜欢用"最棒的"、"难以置信"等词汇。经常攻击对手，声称选举舞弊。说话风格直接，有时粗鲁。');
    
    insertNpc.run('DRAMA2', '拜登', 
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=100&h=100&fit=crop&crop=face',
      '说话温和，强调团结和治愈。经常提到"美国灵魂"和"民主价值"。说话有时会停顿或重复。');
    
    insertMember.run('DRAMA2', user.id, '群主', '房间创建者和管理员');

    // 甄嬛传后宫争宠
    insertRoom.run('DRAMA3', '甄嬛传后宫争宠', '清朝后宫妃嫔争宠大戏', '👑', 
      '雍正年间，后宫佳丽三千，争宠不断...', 3, user.id);
    
    insertNpc.run('DRAMA3', '甄嬛', 
      'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
      '初入宫时天真烂漫，说话温柔。后来变得聪明机智，说话带有深意，善于用诗词表达情感。');
    
    insertNpc.run('DRAMA3', '华妃', 
      'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
      '嚣张跋扈，说话直接，经常威胁别人。喜欢炫耀自己的地位和宠爱。');
    
    insertMember.run('DRAMA3', user.id, '群主', '房间创建者和管理员');

    // 复仇者联盟内战
    insertRoom.run('DRAMA4', '复仇者联盟内战', '超级英雄因理念分歧而分裂', '⚔️', 
      '《美国队长3：内战》事件。由于超级英雄的行动造成了大量平民伤亡...', 4, user.id);
    
    insertNpc.run('DRAMA4', '钢铁侠', 
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
      '说话幽默，经常开玩笑，但内心有责任感。认为超级英雄需要被监管，避免再次造成伤害。');
    
    insertNpc.run('DRAMA4', '美国队长', 
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
      '说话正直，坚持原则。认为政府监管会限制超级英雄的自由，无法及时拯救世界。');
    
    insertMember.run('DRAMA4', user.id, '群主', '房间创建者和管理员');

    // 甄嬛传现代版
    insertRoom.run('DRAMA5', '甄嬛传现代版', '现代职场版甄嬛传', '💼', 
      '某知名互联网公司内部，CEO突然宣布退休...', 3, user.id);
    
    insertNpc.run('DRAMA5', '甄嬛', 
      'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
      '初入公司时天真，说话直接。后来变得聪明，说话带有策略性，善于用数据说话。');
    
    insertNpc.run('DRAMA5', '华妃', 
      'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
      '性格强势，说话咄咄逼人。经常炫耀自己的业绩，喜欢威胁竞争对手。');
    
    insertMember.run('DRAMA5', user.id, '群主', '房间创建者和管理员');

    db.close();

    console.log("数据库初始化完成！");

    return {
      success: true,
      message: "数据库初始化成功",
      rooms: ['王宝强离婚风波', '特朗普vs拜登大选', '甄嬛传后宫争宠', '复仇者联盟内战', '甄嬛传现代版']
    };
  } catch (error) {
    console.error("数据库初始化失败:", error);
    return {
      success: false,
      error: error.message
    };
  }
});
