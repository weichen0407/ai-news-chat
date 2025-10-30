/**
 * Chat API 工具函数
 */

/**
 * 生成唯一的房间ID（6位大写字母+数字）
 */
export function generateRoomId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

/**
 * 验证NPC数据
 */
export function validateNPC(npc: any): boolean {
  return !!(npc && npc.name && npc.profile);
}

/**
 * 验证剧情数据
 */
export function validateStory(story: any): boolean {
  return !!(story && story.name && story.eventBackground);
}

/**
 * 过滤有效的NPC列表
 */
export function filterValidNPCs(npcs: any[]): any[] {
  if (!Array.isArray(npcs)) {
    return [];
  }
  return npcs.filter(validateNPC);
}

