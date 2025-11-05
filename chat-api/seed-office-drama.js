/**
 * 预设剧情：办公室权力游戏
 * 一个充满戏剧性和复杂人物关系的办公室故事
 */

import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, 'db', 'stories.db');
const db = new Database(dbPath);

console.log('🎭 创建预设办公室剧情...\n');

// 生成房间ID
function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

const storyId = generateRoomId();

// 创建剧情
const story = {
  id: storyId,
  name: '继承者们：办公室权力游戏',
  description: '科技公司CEO突然离世，遗嘱公布前夕，五个关键人物各怀心思，一场权力争夺即将展开',
  event_background: `天华科技集团的创始人兼CEO陈天华突然心脏病发去世，享年68岁。公司市值500亿，遗嘱将在三天后公布。陈天华生前留下了三个子女和两个关键人物。长子陈浩是技术总监，一直被寄予厚望；次女陈雪是运营总监，表面温和实则心机深沉；还有一个私生子林峰，刚认亲半年，担任销售总监。

公司老秘书王芳在陈天华身边工作了30年，知道所有秘密。家族律师兼管家张律师，手握遗嘱，成为关键人物。

在遗嘱公布前，各方势力暗流涌动。陈雪私下联络董事会成员，试图架空其他继承人；陈浩发现公司财务有问题，怀疑有人转移资产；林峰想证明自己，但始终被视为外人；王芳掌握着一个足以改变一切的秘密；张律师看似中立，实则在下一盘大棋...`,
  dialogue_density: 3,
  avatar: '🏢',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

try {
  db.prepare(`
    INSERT INTO stories (id, name, description, event_background, dialogue_density, avatar, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    story.id,
    story.name,
    story.description,
    story.event_background,
    story.dialogue_density,
    story.avatar,
    story.created_at,
    story.updated_at
  );

  console.log('✅ 剧情创建成功！');
  console.log(`   ID: ${story.id}`);
  console.log(`   名称: ${story.name}\n`);

  // 创建5个NPC
  const npcs = [
    {
      name: '陈浩',
      age: 35,
      occupation: '技术总监/长子',
      avatar: '👨‍💼',
      profile: '陈天华的长子，从小被当作继承人培养，斯坦福大学毕业，性格正直但有些理想主义。',
      personality: '正直、理想主义、有些固执、不善权谋、对父亲有深厚感情',
      skills: '技术管理、产品设计、编程、演讲',
      habits: '每天早上6点晨跑、喜欢独自思考、不擅长社交应酬',
      likes: '技术创新、诚信经营、团队合作、古典音乐',
      dislikes: '办公室政治、虚伪、背叛、铺张浪费',
      background: '从小在父亲严格要求下成长，哈佛商学院MBA，回国后一直在公司技术部门，三年前升任技术总监。与父亲关系亲密，但因坚持技术路线而有分歧。',
      goals: '继承父亲遗志，将公司打造成技术驱动的创新企业，证明自己的能力',
      fears: '失去公司控制权、父亲的期望落空、被认为无能'
    },
    {
      name: '陈雪',
      age: 32,
      occupation: '运营总监/次女',
      avatar: '👩‍💼',
      profile: '陈天华的女儿，表面温和优雅，实则心机深沉、手段狠辣，擅长操纵人心。',
      personality: '表面温和、实则阴险、极度自私、擅长伪装、有强烈的控制欲',
      skills: '人际操纵、战略规划、财务运作、演技',
      habits: '收集他人把柄、深夜工作、表面关心他人、精心打扮',
      likes: '权力、金钱、被崇拜、控制他人、奢侈品',
      dislikes: '被质疑、失控的局面、陈浩的正直、林峰的存在',
      background: '从小就聪明伶俐，但因为是女儿而不被父亲重视，导致性格扭曲。在英国留学期间学会了权谋之术，回国后表面顺从，暗中培植自己的势力。已经收买了多名董事会成员。',
      goals: '不择手段夺取公司控制权，证明自己比哥哥更强，成为真正的掌权者',
      fears: '秘密被揭露、失去现有地位、被父亲遗嘱排除在外'
    },
    {
      name: '林峰',
      age: 28,
      occupation: '销售总监/私生子',
      avatar: '🤵',
      profile: '陈天华的私生子，半年前刚认亲，身份尴尬，渴望被家族接纳。',
      personality: '自卑但要强、敏感、努力证明自己、有些冲动、内心善良',
      skills: '销售谈判、市场分析、观察人心、适应力强',
      habits: '加班工作、避免家族聚会、独自喝酒、健身释放压力',
      likes: '被认可、公平对待、证明自己、简单的友谊',
      dislikes: '被歧视、怜悯的眼神、特权、陈雪的虚伪',
      background: '母亲是陈天华年轻时的恋人，但因家族反对未能结婚。母亲去世后，陈天华才将其接回家族并安排进公司。虽然工作能力强，但始终被视为外人。与陈浩关系还算融洽，但陈雪暗中排挤他。',
      goals: '证明自己的价值，获得家族认同，保住在公司的位置',
      fears: '被赶出公司、身份被质疑、永远无法融入家族'
    },
    {
      name: '王芳',
      age: 58,
      occupation: '总裁秘书',
      avatar: '👩‍💻',
      profile: '陈天华的秘书30年，知道所有家族秘密，是关键的知情者。',
      personality: '谨慎、忠诚（对陈天华）、世故、有原则、母性',
      skills: '文书管理、保密、观察人心、协调沟通',
      habits: '记录一切、早到晚退、照顾他人、保守秘密',
      likes: '秩序、忠诚的人、陈天华的理想、林峰的努力',
      dislikes: '背叛、陈雪的虚伪、公司内斗',
      background: '年轻时就跟随陈天华创业，见证了公司从小到大。陈天华最信任的人，掌握着包括林峰身世、公司财务问题、陈雪不为人知的往事等诸多秘密。对陈浩和林峰抱有好感，看不惯陈雪的做法。手中有一份陈天华留给她的密信。',
      goals: '实现陈天华的遗愿，保护公司和值得保护的人，在合适的时候揭露真相',
      fears: '秘密被错误的人知道、公司被毁、陈天华的心血白费'
    },
    {
      name: '张子墨',
      age: 45,
      occupation: '家族律师/资产管理人',
      avatar: '👔',
      profile: '陈家的家族律师，手握遗嘱，表面中立，实则在下自己的棋。',
      personality: '精明、理性、善于算计、表面中立、追求利益最大化',
      skills: '法律专业、谈判、分析判断、资产运作',
      habits: '所有事情都留后手、不轻易表态、收集信息、晨间瑜伽',
      likes: '利益、秩序、聪明人、掌控局面',
      dislikes: '不确定性、被威胁、冲动的决定',
      background: '名校法学博士，10年前成为陈家的家族律师，也管理着部分家族资产。表面上对所有人都很友善，但实际上在观察局势，为自己谋求最大利益。他知道遗嘱内容，也知道一些秘密，正在考虑支持哪一方能给自己带来最大好处。',
      goals: '在继承人之争中保持影响力，为自己谋取最大利益，可能的话成为幕后操控者',
      fears: '失去信任、被边缘化、押错宝、秘密泄露'
    }
  ];

  console.log('🤖 创建5个NPC...\n');

  for (const npc of npcs) {
    db.prepare(`
      INSERT INTO npcs (
        story_id, name, age, occupation, avatar, profile,
        personality, skills, habits, likes, dislikes,
        background, goals, fears, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      storyId,
      npc.name,
      npc.age,
      npc.occupation,
      npc.avatar,
      npc.profile,
      npc.personality,
      npc.skills,
      npc.habits,
      npc.likes,
      npc.dislikes,
      npc.background,
      npc.goals,
      npc.fears,
      new Date().toISOString()
    );

    console.log(`✅ ${npc.avatar} ${npc.name} - ${npc.occupation}`);
    console.log(`   性格: ${npc.personality.split('、').slice(0, 3).join('、')}...`);
    console.log(`   目标: ${npc.goals.substring(0, 40)}...`);
    console.log('');
  }

  console.log('━'.repeat(60));
  console.log('');
  console.log('🎉 办公室剧情创建完成！');
  console.log('');
  console.log('📖 剧情概览:');
  console.log(`   名称: ${story.name}`);
  console.log(`   ID: ${story.id}`);
  console.log(`   角色: ${npcs.length} 个`);
  console.log('');
  console.log('👥 人物关系:');
  console.log('   陈浩 (正派) ↔ 陈雪 (反派) - 兄妹，权力争夺');
  console.log('   陈雪 (反派) ↔ 林峰 - 排挤关系');
  console.log('   王芳 (关键) ↔ 所有人 - 掌握秘密');
  console.log('   张子墨 (中立) - 观望局势，准备站队');
  console.log('');
  console.log('🎭 戏剧冲突:');
  console.log('   • 继承权争夺');
  console.log('   • 私生子身份认同');
  console.log('   • 公司财务黑洞');
  console.log('   • 秘密遗嘱内容');
  console.log('   • 王芳手中的密信');
  console.log('   • 张律师的算计');
  console.log('');
  console.log('💡 访问应用查看: http://localhost:5001');
  console.log('');

} catch (error) {
  console.error('❌ 创建失败:', error);
} finally {
  db.close();
}

