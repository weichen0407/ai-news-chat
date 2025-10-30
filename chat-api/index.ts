/**
 * Chat API - 统一导出
 * 
 * 提供创建剧情和NPC的核心功能，可以在任何地方使用
 */

// 导出类型
export type {
  NPC,
  Story,
  CreateStoryResponse,
  CreateNPCResponse
} from './types';

// 导出工具函数
export {
  generateRoomId,
  validateNPC,
  validateStory,
  filterValidNPCs
} from './utils';

// 导出剧情相关API
export {
  createStory,
  storyExists,
  getStory
} from './createStory';

// 导出NPC相关API
export {
  createNPC,
  createNPCs,
  getRoomNPCs,
  deleteNPC,
  updateNPC
} from './createNPC';

