// 数据导出脚本 - 导出需要迁移的数据
import Database from 'better-sqlite3'
import { writeFileSync } from 'fs'
import { join } from 'path'

console.log('📦 开始导出数据...\n')

try {
  const db = new Database('./data/app.db', { readonly: true })
  
  const exportData = {
    version: '1.0',
    exportTime: new Date().toISOString(),
    data: {}
  }
  
  // 1. 导出所有用户
  console.log('👥 导出用户数据...')
  const users = db.prepare('SELECT * FROM users').all()
  exportData.data.users = users
  console.log(`   ✅ 导出了 ${users.length} 个用户`)
  
  // 2. 导出所有房间
  console.log('🏠 导出房间数据...')
  const rooms = db.prepare('SELECT * FROM rooms').all()
  exportData.data.rooms = rooms
  console.log(`   ✅ 导出了 ${rooms.length} 个房间`)
  
  // 3. 导出所有NPC
  console.log('🤖 导出NPC数据...')
  const npcs = db.prepare('SELECT * FROM npcs').all()
  exportData.data.npcs = npcs
  console.log(`   ✅ 导出了 ${npcs.length} 个NPC`)
  
  // 4. 导出每个房间最后10条消息
  console.log('💬 导出聊天记录（每个房间最后10条）...')
  const messages = []
  for (const room of rooms) {
    const roomMessages = db.prepare(`
      SELECT * FROM messages 
      WHERE room_id = ? 
      ORDER BY created_at DESC 
      LIMIT 10
    `).all(room.id)
    messages.push(...roomMessages)
  }
  exportData.data.messages = messages
  console.log(`   ✅ 导出了 ${messages.length} 条消息`)
  
  // 5. 导出房间成员关系
  console.log('👫 导出房间成员关系...')
  const roomMembers = db.prepare('SELECT * FROM room_members').all()
  exportData.data.room_members = roomMembers
  console.log(`   ✅ 导出了 ${roomMembers.length} 条成员关系`)
  
  // 6. 检查并导出朋友圈数据（如果表存在）
  const tableExists = (tableName) => {
    const result = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name=?"
    ).get(tableName)
    return !!result
  }
  
  if (tableExists('moments')) {
    console.log('📱 导出朋友圈数据...')
    const moments = db.prepare(`
      SELECT * FROM moments 
      ORDER BY created_at DESC 
      LIMIT 100
    `).all()
    exportData.data.moments = moments
    console.log(`   ✅ 导出了 ${moments.length} 条朋友圈`)
    
    if (tableExists('moment_likes')) {
      const likes = db.prepare('SELECT * FROM moment_likes').all()
      exportData.data.moment_likes = likes
      console.log(`   ✅ 导出了 ${likes.length} 条点赞`)
    }
    
    if (tableExists('moment_comments')) {
      const comments = db.prepare(`
        SELECT * FROM moment_comments 
        ORDER BY created_at DESC 
        LIMIT 200
      `).all()
      exportData.data.moment_comments = comments
      console.log(`   ✅ 导出了 ${comments.length} 条评论`)
    }
  }
  
  // 7. 导出好友关系（如果表存在）
  if (tableExists('friendships')) {
    console.log('👬 导出好友关系...')
    const friendships = db.prepare('SELECT * FROM friendships').all()
    exportData.data.friendships = friendships
    console.log(`   ✅ 导出了 ${friendships.length} 条好友关系`)
  }
  
  db.close()
  
  // 保存为JSON文件
  const outputPath = './server/data/initial-data.json'
  writeFileSync(outputPath, JSON.stringify(exportData, null, 2), 'utf-8')
  
  console.log('\n✅ 数据导出完成！')
  console.log(`📁 输出文件: ${outputPath}`)
  console.log('\n📊 导出统计:')
  console.log(`   - 用户: ${users.length}`)
  console.log(`   - 房间: ${rooms.length}`)
  console.log(`   - NPC: ${npcs.length}`)
  console.log(`   - 消息: ${messages.length}`)
  console.log(`   - 房间成员: ${roomMembers.length}`)
  if (exportData.data.moments) {
    console.log(`   - 朋友圈: ${exportData.data.moments.length}`)
  }
  if (exportData.data.friendships) {
    console.log(`   - 好友关系: ${exportData.data.friendships.length}`)
  }
  
  console.log('\n🎉 可以部署了！这个文件会被包含在Git仓库中。')
  
} catch (error) {
  console.error('❌ 导出失败:', error.message)
  process.exit(1)
}

