/**
 * 创建剧情（房间）的核心API
 */

import type { Story, CreateStoryResponse } from './types';
import { generateRoomId, validateStory } from './utils';
import type Database from 'better-sqlite3';

/**
 * 创建剧情/房间
 * @param db - 数据库实例
 * @param story - 剧情数据
 * @returns 创建结果
 */
export function createStory(db: Database.Database, story: Story): CreateStoryResponse {
  try {
    // 验证数据
    if (!validateStory(story)) {
      return {
        success: false,
        error: '请填写房间名称和事件背景'
      };
    }

    // 生成房间ID
    const roomId = generateRoomId();

    // 设置默认值
    const {
      name,
      description = '',
      eventBackground,
      dialogueDensity = 2,
      avatar = '聊',
      presetId = null,
      creatorId
    } = story;

    // 如果是预设房间且没有指定创建者，使用jerry
    let finalCreatorId = creatorId;
    if (presetId && !creatorId) {
      const jerryUser = db.prepare('SELECT id FROM users WHERE username = ?').get('jerry') as any;
      if (jerryUser) {
        finalCreatorId = jerryUser.id;
      }
    }

    // 插入房间数据
    db.prepare(
      'INSERT INTO rooms (id, name, description, event_background, dialogue_density, avatar, preset_id, creator_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(
      roomId,
      name,
      description,
      eventBackground,
      dialogueDensity,
      avatar,
      presetId,
      finalCreatorId
    );

    return {
      success: true,
      roomId
    };
  } catch (error) {
    console.error('创建剧情失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '创建剧情失败'
    };
  }
}

/**
 * 检查房间是否存在
 */
export function storyExists(db: Database.Database, roomId: string): boolean {
  const room = db.prepare('SELECT id FROM rooms WHERE id = ?').get(roomId);
  return !!room;
}

/**
 * 获取房间信息
 */
export function getStory(db: Database.Database, roomId: string): any {
  return db.prepare(
    'SELECT * FROM rooms WHERE id = ?'
  ).get(roomId);
}

