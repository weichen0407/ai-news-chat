/**
 * 数据库初始化和管理
 * 独立的SQLite数据库，不依赖主项目
 */

import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let db = null;

export function getDB() {
  if (!db) {
    // 确保db目录存在
    const dbDir = join(__dirname, 'db');
    if (!existsSync(dbDir)) {
      mkdirSync(dbDir, { recursive: true });
    }
    
    const dbPath = join(dbDir, 'stories.db');
    console.log('📂 数据库路径:', dbPath);
    
    db = new Database(dbPath);
    initDB();
  }
  return db;
}

function initDB() {
  console.log('🔧 初始化数据库...');
  
  // 剧情表
  db.exec(`
    CREATE TABLE IF NOT EXISTS stories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      event_background TEXT NOT NULL,
      dialogue_density INTEGER DEFAULT 2,
      avatar TEXT DEFAULT '📖',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // NPC表 - 游戏角色化设计
  db.exec(`
    CREATE TABLE IF NOT EXISTS npcs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      story_id TEXT NOT NULL,
      name TEXT NOT NULL,
      avatar TEXT,
      profile TEXT NOT NULL,
      personality TEXT,
      habits TEXT,
      skills TEXT,
      likes TEXT,
      dislikes TEXT,
      age INTEGER,
      occupation TEXT,
      background TEXT,
      goals TEXT,
      fears TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE
    )
  `);
  
  // 标签表
  db.exec(`
    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      color TEXT DEFAULT '#667eea'
    )
  `);
  
  // 剧情-标签关联表
  db.exec(`
    CREATE TABLE IF NOT EXISTS story_tags (
      story_id TEXT NOT NULL,
      tag_id INTEGER NOT NULL,
      PRIMARY KEY (story_id, tag_id),
      FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    )
  `);
  
  console.log('✅ 数据库初始化完成');
}

export function closeDB() {
  if (db) {
    db.close();
    db = null;
  }
}

