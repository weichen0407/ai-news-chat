/**
 * Chat API 使用示例
 * 
 * 展示如何在不同场景中使用chat-api
 */

import { getDB } from '~/server/utils/db';
import {
  createStory,
  createNPC,
  createNPCs,
  getRoomNPCs,
  updateNPC,
  deleteNPC,
  generateRoomId
} from '~/chat-api';

// ============================================
// 示例1: 创建一个完整的剧情 + NPC
// ============================================
export function example1_CreateCompleteStory() {
  const db = getDB();
  
  // 1. 创建剧情
  const storyResult = createStory(db, {
    name: '家族企业争产',
    description: '豪门家族的遗产之争',
    eventBackground: '某集团董事长突然去世，三个子女为了继承权展开明争暗斗...',
    dialogueDensity: 3,
    avatar: '🏰',
    creatorId: 1  // 假设用户ID为1
  });
  
  if (!storyResult.success) {
    console.error('创建剧情失败:', storyResult.error);
    return null;
  }
  
  const roomId = storyResult.roomId!;
  console.log('✅ 剧情创建成功，房间ID:', roomId);
  
  // 2. 批量创建NPC
  const npcs = [
    {
      name: '李天豪',
      profile: '长子，稳重内敛，在公司担任总裁，希望维护家族稳定',
      avatar: 'https://example.com/avatar1.jpg'
    },
    {
      name: '李雪娇',
      profile: '次女，精明强势，擅长投资理财，认为自己最有能力接管公司',
      avatar: 'https://example.com/avatar2.jpg'
    },
    {
      name: '李小明',
      profile: '幼子，年轻冲动，喜欢挥霍，表面上不关心家产实则暗中布局',
      avatar: 'https://example.com/avatar3.jpg'
    }
  ];
  
  const npcResult = createNPCs(db, roomId, npcs);
  console.log(`✅ 创建了${npcResult.created}个NPC`);
  if (npcResult.failed > 0) {
    console.warn(`⚠️  ${npcResult.failed}个NPC创建失败:`, npcResult.errors);
  }
  
  return roomId;
}

// ============================================
// 示例2: 创建预设剧情（用于系统初始化）
// ============================================
export function example2_CreatePresetStories() {
  const db = getDB();
  
  const presets = [
    {
      name: '三国演义',
      eventBackground: '东汉末年，群雄割据，曹操、刘备、孙权三足鼎立...',
      npcs: [
        { name: '曹操', profile: '魏国霸主，雄才大略，挟天子以令诸侯' },
        { name: '刘备', profile: '蜀汉皇叔，仁义之君，三顾茅庐请诸葛' },
        { name: '孙权', profile: '东吴之主，继承父兄基业，善用能臣' }
      ]
    },
    {
      name: '职场甄嬛传',
      eventBackground: '现代公司办公室，新来的实习生卷入高管权力斗争...',
      npcs: [
        { name: '总裁', profile: '公司创始人，表面公正实则偏心' },
        { name: '副总', profile: '野心勃勃的二把手，想要架空总裁' },
        { name: '实习生', profile: '聪明机敏的新人，被卷入权力漩涡' }
      ]
    }
  ];
  
  const createdRoomIds: string[] = [];
  
  for (const preset of presets) {
    const result = createStory(db, {
      name: preset.name,
      eventBackground: preset.eventBackground,
      presetId: `PRESET_${generateRoomId()}`,  // 生成预设ID
      dialogueDensity: 3,
      avatar: '📖'
    });
    
    if (result.success) {
      createNPCs(db, result.roomId!, preset.npcs);
      createdRoomIds.push(result.roomId!);
      console.log(`✅ 预设剧情创建成功: ${preset.name}`);
    }
  }
  
  return createdRoomIds;
}

// ============================================
// 示例3: 动态管理NPC
// ============================================
export function example3_ManageNPCs(roomId: string) {
  const db = getDB();
  
  // 1. 获取现有NPC
  const existingNPCs = getRoomNPCs(db, roomId);
  console.log(`当前房间有${existingNPCs.length}个NPC`);
  
  // 2. 添加新NPC
  const newNPCResult = createNPC(db, roomId, {
    name: '神秘访客',
    profile: '突然出现的陌生人，似乎知道很多秘密',
    avatar: '❓'
  });
  
  if (newNPCResult.success) {
    console.log('✅ 新NPC添加成功，ID:', newNPCResult.npcId);
    
    // 3. 更新NPC信息
    const updated = updateNPC(db, newNPCResult.npcId!, {
      profile: '神秘访客，原来是失散多年的四子！'
    });
    
    if (updated) {
      console.log('✅ NPC信息已更新');
    }
  }
  
  // 4. 删除某个NPC（假设ID为1）
  // const deleted = deleteNPC(db, 1);
  // console.log(deleted ? '✅ NPC已删除' : '❌ 删除失败');
}

// ============================================
// 示例4: 在Nuxt API路由中使用
// ============================================
/*
// server/api/custom/create-drama.post.ts

import { getDB } from '~/server/utils/db';
import { getCurrentUser } from '~/server/utils/auth';
import { createStory, createNPCs } from '~/chat-api';

export default defineEventHandler(async (event) => {
  const user = await getCurrentUser(event);
  if (!user) {
    return { success: false, error: '请先登录' };
  }
  
  const body = await readBody(event);
  const db = getDB();
  
  // 使用chat-api快速创建
  const story = createStory(db, {
    name: body.name,
    eventBackground: body.background,
    creatorId: user.id
  });
  
  if (story.success && body.npcs) {
    createNPCs(db, story.roomId!, body.npcs);
  }
  
  return story;
});
*/

// ============================================
// 示例5: 批量导入剧情数据
// ============================================
export function example5_BulkImport(dataFile: any[]) {
  const db = getDB();
  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[]
  };
  
  for (const item of dataFile) {
    try {
      const story = createStory(db, {
        name: item.title,
        eventBackground: item.plot,
        dialogueDensity: item.density || 2,
        avatar: item.icon || '📚'
      });
      
      if (story.success) {
        if (item.characters && item.characters.length > 0) {
          createNPCs(db, story.roomId!, item.characters);
        }
        results.success++;
      } else {
        results.failed++;
        results.errors.push(`${item.title}: ${story.error}`);
      }
    } catch (error) {
      results.failed++;
      results.errors.push(`${item.title}: ${error}`);
    }
  }
  
  console.log(`批量导入完成: 成功${results.success}个, 失败${results.failed}个`);
  return results;
}

// ============================================
// 如何运行这些示例
// ============================================
/*
1. 在Nuxt开发环境中:
   - 可以在server/api中调用这些函数
   - 可以在pages中通过$fetch调用

2. 在Node.js脚本中:
   - node --loader tsx chat-api/example.ts
   - 或者创建一个seed脚本

3. 在测试中:
   - 可以导入这些函数进行单元测试
*/

