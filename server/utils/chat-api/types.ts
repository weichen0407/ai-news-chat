/**
 * Chat API 类型定义
 */

// NPC角色定义
export interface NPC {
  name: string;        // 角色名称
  avatar?: string;     // 头像（可选，Base64或URL）
  profile: string;     // 角色人设/性格描述
}

// 剧情/房间定义
export interface Story {
  name: string;              // 剧情名称
  description?: string;      // 剧情描述
  eventBackground: string;   // 事件背景
  dialogueDensity?: number;  // 对话密度（2-5）
  avatar?: string;           // 剧情头像/图标
  presetId?: string;         // 预设ID（可选）
  creatorId?: number;        // 创建者ID（可选）
}

// 创建剧情的响应
export interface CreateStoryResponse {
  success: boolean;
  roomId?: string;
  error?: string;
}

// 创建NPC的响应
export interface CreateNPCResponse {
  success: boolean;
  npcId?: number;
  error?: string;
}

