/**
 * 数据库迁移脚本 - v2.0
 * 为npcs表添加游戏化属性字段
 */

import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, 'db', 'stories.db');

console.log('🔄 开始数据库迁移...');
console.log('📂 数据库路径:', dbPath);

const db = new Database(dbPath);

try {
  // 检查当前表结构
  const tableInfo = db.prepare("PRAGMA table_info(npcs)").all();
  const existingColumns = tableInfo.map(col => col.name);
  
  console.log('📋 当前字段:', existingColumns.join(', '));
  
  // 需要添加的新字段
  const newColumns = [
    { name: 'personality', type: 'TEXT' },
    { name: 'habits', type: 'TEXT' },
    { name: 'skills', type: 'TEXT' },
    { name: 'likes', type: 'TEXT' },
    { name: 'dislikes', type: 'TEXT' },
    { name: 'age', type: 'INTEGER' },
    { name: 'occupation', type: 'TEXT' },
    { name: 'background', type: 'TEXT' },
    { name: 'goals', type: 'TEXT' },
    { name: 'fears', type: 'TEXT' }
  ];
  
  let addedCount = 0;
  
  // 添加缺失的字段
  for (const column of newColumns) {
    if (!existingColumns.includes(column.name)) {
      try {
        db.prepare(`ALTER TABLE npcs ADD COLUMN ${column.name} ${column.type}`).run();
        console.log(`✅ 添加字段: ${column.name} (${column.type})`);
        addedCount++;
      } catch (error) {
        console.error(`❌ 添加字段 ${column.name} 失败:`, error.message);
      }
    } else {
      console.log(`⏭️  字段已存在: ${column.name}`);
    }
  }
  
  console.log('');
  console.log('━'.repeat(50));
  console.log(`✅ 迁移完成！添加了 ${addedCount} 个新字段`);
  console.log('━'.repeat(50));
  console.log('');
  
  // 显示更新后的表结构
  const updatedTableInfo = db.prepare("PRAGMA table_info(npcs)").all();
  console.log('📋 更新后的表结构:');
  updatedTableInfo.forEach(col => {
    console.log(`   ${col.name.padEnd(15)} ${col.type.padEnd(10)} ${col.notnull ? 'NOT NULL' : ''}`);
  });
  
  console.log('');
  console.log('🎉 数据库已升级到 v2.0！');
  console.log('💡 现在可以重启应用: npm start');
  
} catch (error) {
  console.error('❌ 迁移失败:', error);
} finally {
  db.close();
}

