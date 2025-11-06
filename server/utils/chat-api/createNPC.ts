/**
 * 创建NPC的核心API
 */

import type { NPC, CreateNPCResponse } from './types';
import { validateNPC, filterValidNPCs } from './utils';
import type Database from 'better-sqlite3';

/**
 * 创建单个NPC
 * @param db - 数据库实例
 * @param roomId - 房间ID
 * @param npc - NPC数据
 * @returns 创建结果
 */
export function createNPC(
  db: Database.Database,
  roomId: string,
  npc: NPC
): CreateNPCResponse {
  try {
    // 验证NPC数据
    if (!validateNPC(npc)) {
      return {
        success: false,
        error: 'NPC数据不完整：需要名称和人设'
      };
    }

    // 验证房间是否存在
    const room = db.prepare('SELECT id FROM rooms WHERE id = ?').get(roomId);
    if (!room) {
      return {
        success: false,
        error: '房间不存在'
      };
    }

    // 插入NPC（包括所有游戏化属性）
    const result = db.prepare(`
      INSERT INTO npcs (
        room_id, name, avatar, profile, persona,
        personality, habits, skills, likes, dislikes,
        age, occupation, background, goals, fears
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      roomId,
      npc.name,
      npc.avatar || null,
      npc.profile || npc.personality || null,  // profile 作为后备
      npc.personality || null,  // persona 使用 personality
      npc.personality || null,
      npc.habits || null,
      npc.skills || null,
      npc.likes || null,
      npc.dislikes || null,
      npc.age || null,
      npc.occupation || null,
      npc.background || null,
      npc.goals || null,
      npc.fears || null
    );

    console.log(`✅ 创建NPC成功: ${npc.name} (ID: ${result.lastInsertRowid})`)

    return {
      success: true,
      npcId: result.lastInsertRowid as number
    };
  } catch (error) {
    console.error('创建NPC失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '创建NPC失败'
    };
  }
}

/**
 * 批量创建NPC
 * @param db - 数据库实例
 * @param roomId - 房间ID
 * @param npcs - NPC数组
 * @returns 创建结果统计
 */
export function createNPCs(
  db: Database.Database,
  roomId: string,
  npcs: NPC[]
): { success: boolean; created: number; failed: number; errors: string[] } {
  const validNPCs = filterValidNPCs(npcs);
  
  if (validNPCs.length === 0) {
    return {
      success: false,
      created: 0,
      failed: 0,
      errors: ['没有有效的NPC数据']
    };
  }

  const errors: string[] = [];
  let created = 0;
  let failed = 0;

  for (const npc of validNPCs) {
    const result = createNPC(db, roomId, npc);
    if (result.success) {
      created++;
    } else {
      failed++;
      errors.push(`${npc.name}: ${result.error}`);
    }
  }

  return {
    success: created > 0,
    created,
    failed,
    errors
  };
}

/**
 * 获取房间的所有NPC
 */
export function getRoomNPCs(db: Database.Database, roomId: string): any[] {
  return db.prepare(
    'SELECT * FROM npcs WHERE room_id = ? ORDER BY id ASC'
  ).all(roomId);
}

/**
 * 删除NPC
 */
export function deleteNPC(db: Database.Database, npcId: number): boolean {
  try {
    db.prepare('DELETE FROM npcs WHERE id = ?').run(npcId);
    return true;
  } catch (error) {
    console.error('删除NPC失败:', error);
    return false;
  }
}

/**
 * 更新NPC信息
 */
export function updateNPC(
  db: Database.Database,
  npcId: number,
  updates: Partial<NPC>
): boolean {
  try {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.avatar !== undefined) {
      fields.push('avatar = ?');
      values.push(updates.avatar);
    }
    if (updates.profile !== undefined) {
      fields.push('profile = ?');
      values.push(updates.profile);
    }

    if (fields.length === 0) {
      return false;
    }

    values.push(npcId);
    const sql = `UPDATE npcs SET ${fields.join(', ')} WHERE id = ?`;
    
    db.prepare(sql).run(...values);
    return true;
  } catch (error) {
    console.error('更新NPC失败:', error);
    return false;
  }
}

