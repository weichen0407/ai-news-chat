// 初始数据导入脚本
import Database from 'better-sqlite3'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

export function importInitialData(db) {
  console.log('📥 检查是否需要导入初始数据...')
  
  try {
    // 检查数据库是否已有数据
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get()
    const roomCount = db.prepare('SELECT COUNT(*) as count FROM rooms').get()
    
    if (userCount.count > 0 || roomCount.count > 0) {
      console.log('   ℹ️  数据库已有数据，跳过导入')
      return
    }
    
    // 读取初始数据文件
    const dataPath = join(process.cwd(), 'server/data/initial-data.json')
    if (!existsSync(dataPath)) {
      console.log('   ℹ️  未找到初始数据文件，跳过导入')
      return
    }
    
    console.log('   📂 读取初始数据文件...')
    const initialData = JSON.parse(readFileSync(dataPath, 'utf-8'))
    
    console.log('   🔄 开始导入数据...')
    
    // 使用事务确保数据一致性
    const importTransaction = db.transaction(() => {
      // 1. 导入用户
      if (initialData.data.users?.length > 0) {
        const insertUser = db.prepare(`
          INSERT INTO users (id, username, password, nickname, avatar, created_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `)
        
        for (const user of initialData.data.users) {
          insertUser.run(
            user.id,
            user.username,
            user.password,
            user.nickname,
            user.avatar,
            user.created_at
          )
        }
        console.log(`      ✅ 导入了 ${initialData.data.users.length} 个用户`)
      }
      
      // 2. 导入房间
      if (initialData.data.rooms?.length > 0) {
        const insertRoom = db.prepare(`
          INSERT INTO rooms (id, name, description, avatar, created_by, created_at, auto_mode, dialogue_density)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `)
        
        for (const room of initialData.data.rooms) {
          insertRoom.run(
            room.id,
            room.name,
            room.description,
            room.avatar,
            room.created_by,
            room.created_at,
            room.auto_mode || 0,
            room.dialogue_density || 2
          )
        }
        console.log(`      ✅ 导入了 ${initialData.data.rooms.length} 个房间`)
      }
      
      // 3. 导入NPC
      if (initialData.data.npcs?.length > 0) {
        const insertNPC = db.prepare(`
          INSERT INTO npcs (id, name, avatar, profile, persona, room_id, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `)
        
        for (const npc of initialData.data.npcs) {
          insertNPC.run(
            npc.id,
            npc.name,
            npc.avatar,
            npc.profile,
            npc.persona,
            npc.room_id,
            npc.created_at
          )
        }
        console.log(`      ✅ 导入了 ${initialData.data.npcs.length} 个NPC`)
      }
      
      // 4. 导入消息
      if (initialData.data.messages?.length > 0) {
        const insertMessage = db.prepare(`
          INSERT INTO messages (id, room_id, sender_type, sender_id, sender_name, avatar, content, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `)
        
        for (const message of initialData.data.messages) {
          insertMessage.run(
            message.id,
            message.room_id,
            message.sender_type,
            message.sender_id,
            message.sender_name,
            message.avatar,
            message.content,
            message.created_at
          )
        }
        console.log(`      ✅ 导入了 ${initialData.data.messages.length} 条消息`)
      }
      
      // 5. 导入房间成员
      if (initialData.data.room_members?.length > 0) {
        const insertMember = db.prepare(`
          INSERT INTO room_members (room_id, user_id, joined_at)
          VALUES (?, ?, ?)
        `)
        
        for (const member of initialData.data.room_members) {
          insertMember.run(
            member.room_id,
            member.user_id,
            member.joined_at
          )
        }
        console.log(`      ✅ 导入了 ${initialData.data.room_members.length} 条成员关系`)
      }
      
      // 6. 导入朋友圈（如果有）
      if (initialData.data.moments?.length > 0) {
        const insertMoment = db.prepare(`
          INSERT INTO moments (id, user_id, npc_id, author_type, content, images, created_at, like_count, comment_count)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        
        for (const moment of initialData.data.moments) {
          insertMoment.run(
            moment.id,
            moment.user_id,
            moment.npc_id,
            moment.author_type,
            moment.content,
            moment.images,
            moment.created_at,
            moment.like_count || 0,
            moment.comment_count || 0
          )
        }
        console.log(`      ✅ 导入了 ${initialData.data.moments.length} 条朋友圈`)
      }
      
      // 7. 导入点赞（如果有）
      if (initialData.data.moment_likes?.length > 0) {
        const insertLike = db.prepare(`
          INSERT INTO moment_likes (moment_id, user_id, npc_id, liker_type, created_at)
          VALUES (?, ?, ?, ?, ?)
        `)
        
        for (const like of initialData.data.moment_likes) {
          insertLike.run(
            like.moment_id,
            like.user_id,
            like.npc_id,
            like.liker_type,
            like.created_at
          )
        }
        console.log(`      ✅ 导入了 ${initialData.data.moment_likes.length} 条点赞`)
      }
      
      // 8. 导入评论（如果有）
      if (initialData.data.moment_comments?.length > 0) {
        const insertComment = db.prepare(`
          INSERT INTO moment_comments (id, moment_id, user_id, npc_id, commenter_type, content, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `)
        
        for (const comment of initialData.data.moment_comments) {
          insertComment.run(
            comment.id,
            comment.moment_id,
            comment.user_id,
            comment.npc_id,
            comment.commenter_type,
            comment.content,
            comment.created_at
          )
        }
        console.log(`      ✅ 导入了 ${initialData.data.moment_comments.length} 条评论`)
      }
      
      // 9. 导入好友关系（如果有）
      if (initialData.data.friendships?.length > 0) {
        const insertFriendship = db.prepare(`
          INSERT INTO friendships (user_id, friend_user_id, friend_npc_id, friend_type, status, created_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `)
        
        for (const friendship of initialData.data.friendships) {
          insertFriendship.run(
            friendship.user_id,
            friendship.friend_user_id,
            friendship.friend_npc_id,
            friendship.friend_type,
            friendship.status || 'accepted',
            friendship.created_at
          )
        }
        console.log(`      ✅ 导入了 ${initialData.data.friendships.length} 条好友关系`)
      }
    })
    
    importTransaction()
    
    console.log('   ✅ 初始数据导入完成！')
    
  } catch (error) {
    console.error('   ❌ 导入数据失败:', error.message)
    console.error('   继续启动应用...')
  }
}

