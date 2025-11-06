import Database from 'better-sqlite3'
import { join } from 'path'

/**
 * 数据库迁移：确保npcs表包含所有必需的列
 */
export function migrateNPCsTable() {
  const dbPath = join(process.cwd(), 'data', 'app.db')
  const db = new Database(dbPath)
  
  try {
    console.log('🔄 检查npcs表结构...')
    
    // 获取现有列
    const columns = db.prepare('PRAGMA table_info(npcs)').all() as any[]
    const columnNames = columns.map(col => col.name)
    
    console.log('当前列:', columnNames)
    
    // 需要的列
    const requiredColumns = [
      { name: 'persona', type: 'TEXT' },
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
    ]
    
    let addedCount = 0
    
    // 添加缺失的列
    for (const col of requiredColumns) {
      if (!columnNames.includes(col.name)) {
        console.log(`➕ 添加列: ${col.name} (${col.type})`)
        db.prepare(`ALTER TABLE npcs ADD COLUMN ${col.name} ${col.type}`).run()
        addedCount++
      }
    }
    
    if (addedCount > 0) {
      console.log(`✅ 成功添加 ${addedCount} 个列`)
    } else {
      console.log('✅ 所有必需列已存在')
    }
    
    db.close()
    return true
  } catch (error) {
    console.error('❌ 迁移失败:', error)
    db.close()
    return false
  }
}

// 如果直接运行此文件
if (require.main === module) {
  migrateNPCsTable()
}

