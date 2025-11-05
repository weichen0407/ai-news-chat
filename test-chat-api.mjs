/**
 * Chat API 本地测试脚本
 * 运行: node test-chat-api.mjs
 */

import Database from 'better-sqlite3';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 导入chat-api函数
const { createStory } = await import('./chat-api/createStory.ts');
const { createNPC, createNPCs, getRoomNPCs } = await import('./chat-api/createNPC.ts');
const { generateRoomId } = await import('./chat-api/utils.ts');

console.log('🚀 开始测试 Chat API...\n');

// 连接到数据库
const dbPath = join(__dirname, 'data', 'app.db');
const db = new Database(dbPath);

console.log('✅ 数据库连接成功:', dbPath);
console.log('');

// ==========================================
// 测试1: 创建剧情
// ==========================================
console.log('📖 测试1: 创建新剧情');
console.log('━'.repeat(50));

const storyResult = createStory(db, {
  name: '测试剧情-公司内斗',
  description: '这是一个测试剧情',
  eventBackground: '某科技公司CEO突然离职，三位副总裁开始争夺CEO位置。技术VP主张产品创新，运营VP强调用户增长，销售VP认为利润才是王道...',
  dialogueDensity: 3,
  avatar: '💼',
  creatorId: 1  // 假设用户ID为1
});

if (storyResult.success) {
  console.log('✅ 剧情创建成功!');
  console.log('   房间ID:', storyResult.roomId);
  console.log('');
} else {
  console.error('❌ 剧情创建失败:', storyResult.error);
  process.exit(1);
}

const testRoomId = storyResult.roomId;

// ==========================================
// 测试2: 单个创建NPC
// ==========================================
console.log('🤖 测试2: 创建单个NPC');
console.log('━'.repeat(50));

const npc1 = createNPC(db, testRoomId, {
  name: '张伟',
  profile: '技术副总裁，35岁，工程师出身，相信技术创新是公司的未来，性格严谨理性',
  avatar: '👨‍💻'
});

if (npc1.success) {
  console.log('✅ NPC创建成功!');
  console.log('   NPC ID:', npc1.npcId);
  console.log('   名称: 张伟');
  console.log('');
} else {
  console.error('❌ NPC创建失败:', npc1.error);
}

// ==========================================
// 测试3: 批量创建NPC
// ==========================================
console.log('🤖 测试3: 批量创建NPC');
console.log('━'.repeat(50));

const npcsData = [
  {
    name: '李娜',
    profile: '运营副总裁，32岁，市场营销专家，擅长用户增长和品牌建设，性格热情外向',
    avatar: '👩‍💼'
  },
  {
    name: '王强',
    profile: '销售副总裁，38岁，销售老将，业绩突出，主张以利润为导向，性格强势果断',
    avatar: '👨‍💼'
  },
  {
    name: '赵秘书',
    profile: 'CEO秘书，28岁，知晓公司很多内幕，表面中立实则暗中观察，性格谨慎神秘',
    avatar: '📝'
  }
];

const npcsResult = createNPCs(db, testRoomId, npcsData);

console.log('✅ 批量创建完成!');
console.log('   成功:', npcsResult.created, '个');
console.log('   失败:', npcsResult.failed, '个');
if (npcsResult.errors.length > 0) {
  console.log('   错误:', npcsResult.errors);
}
console.log('');

// ==========================================
// 测试4: 查询房间的所有NPC
// ==========================================
console.log('📋 测试4: 查询房间的所有NPC');
console.log('━'.repeat(50));

const allNPCs = getRoomNPCs(db, testRoomId);

console.log(`✅ 找到 ${allNPCs.length} 个NPC:`);
allNPCs.forEach((npc, index) => {
  console.log(`   ${index + 1}. ${npc.avatar || '👤'} ${npc.name}`);
  console.log(`      人设: ${npc.profile.substring(0, 40)}...`);
});
console.log('');

// ==========================================
// 测试5: 查询房间信息
// ==========================================
console.log('🏠 测试5: 查询房间信息');
console.log('━'.repeat(50));

const { getStory } = await import('./chat-api/createStory.ts');
const roomInfo = getStory(db, testRoomId);

if (roomInfo) {
  console.log('✅ 房间信息:');
  console.log('   ID:', roomInfo.id);
  console.log('   名称:', roomInfo.name);
  console.log('   描述:', roomInfo.description);
  console.log('   事件背景:', roomInfo.event_background.substring(0, 50) + '...');
  console.log('   对话密度:', roomInfo.dialogue_density);
  console.log('   头像:', roomInfo.avatar);
  console.log('   创建者ID:', roomInfo.creator_id);
  console.log('');
}

// ==========================================
// 测试6: 创建预设剧情
// ==========================================
console.log('📚 测试6: 创建预设剧情');
console.log('━'.repeat(50));

const presetStory = createStory(db, {
  name: '测试预设-三国争霸',
  eventBackground: '东汉末年，天下大乱，曹操、刘备、孙权三足鼎立，争夺天下...',
  presetId: `PRESET_${generateRoomId()}`,
  dialogueDensity: 4,
  avatar: '⚔️'
});

if (presetStory.success) {
  console.log('✅ 预设剧情创建成功!');
  console.log('   房间ID:', presetStory.roomId);
  
  // 添加预设NPC
  const presetNPCs = [
    { name: '曹操', profile: '魏国霸主，挟天子以令诸侯，雄才大略' },
    { name: '刘备', profile: '蜀汉皇叔，仁义之君，三顾茅庐' },
    { name: '孙权', profile: '东吴之主，继承父兄基业' }
  ];
  
  const presetNPCsResult = createNPCs(db, presetStory.roomId, presetNPCs);
  console.log(`   添加了 ${presetNPCsResult.created} 个NPC`);
  console.log('');
}

// ==========================================
// 汇总统计
// ==========================================
console.log('📊 测试汇总');
console.log('━'.repeat(50));

const allRooms = db.prepare('SELECT COUNT(*) as count FROM rooms').get();
const allNPCsCount = db.prepare('SELECT COUNT(*) as count FROM npcs').get();

console.log('✅ 所有测试完成!');
console.log('   数据库中总房间数:', allRooms.count);
console.log('   数据库中总NPC数:', allNPCsCount.count);
console.log('');

console.log('🎉 Chat API 测试成功！');
console.log('');
console.log('💡 提示:');
console.log('   - 测试数据已保存到数据库');
console.log('   - 你可以在 /admin/database 页面查看');
console.log(`   - 测试房间ID: ${testRoomId}`);
console.log('');

// 关闭数据库连接
db.close();

