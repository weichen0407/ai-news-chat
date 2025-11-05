/**
 * Story Creator - 独立的剧情和NPC创作工具
 * 完全独立的Express应用
 */

import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { getDB } from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;

// 中间件
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(join(__dirname, 'public')));

// 初始化数据库
const db = getDB();

// ============================================
// 工具函数
// ============================================
function generateId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// ============================================
// API路由 - 剧情管理
// ============================================

// 获取所有剧情
app.get('/api/stories', (req, res) => {
  try {
    const stories = db.prepare(`
      SELECT 
        s.*,
        COUNT(DISTINCT n.id) as npc_count
      FROM stories s
      LEFT JOIN npcs n ON s.id = n.story_id
      GROUP BY s.id
      ORDER BY s.created_at DESC
    `).all();
    
    res.json({ success: true, data: stories });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取单个剧情详情
app.get('/api/stories/:id', (req, res) => {
  try {
    const story = db.prepare('SELECT * FROM stories WHERE id = ?').get(req.params.id);
    
    if (!story) {
      return res.status(404).json({ success: false, error: '剧情不存在' });
    }
    
    const npcs = db.prepare('SELECT * FROM npcs WHERE story_id = ?').all(req.params.id);
    
    res.json({
      success: true,
      data: {
        ...story,
        npcs
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 创建剧情
app.post('/api/stories', (req, res) => {
  try {
    const { name, description, eventBackground, dialogueDensity, avatar } = req.body;
    
    if (!name || !eventBackground) {
      return res.status(400).json({ 
        success: false, 
        error: '请填写剧情名称和事件背景' 
      });
    }
    
    const storyId = generateId();
    
    db.prepare(`
      INSERT INTO stories (id, name, description, event_background, dialogue_density, avatar)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      storyId,
      name,
      description || '',
      eventBackground,
      dialogueDensity || 2,
      avatar || '📖'
    );
    
    res.json({ success: true, storyId });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 更新剧情
app.put('/api/stories/:id', (req, res) => {
  try {
    const { name, description, eventBackground, dialogueDensity, avatar } = req.body;
    
    db.prepare(`
      UPDATE stories 
      SET name = ?, description = ?, event_background = ?, 
          dialogue_density = ?, avatar = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name, description, eventBackground, dialogueDensity, avatar, req.params.id);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 删除剧情
app.delete('/api/stories/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM stories WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// API路由 - NPC管理
// ============================================

// 获取剧情的所有NPC
app.get('/api/stories/:storyId/npcs', (req, res) => {
  try {
    const npcs = db.prepare('SELECT * FROM npcs WHERE story_id = ? ORDER BY id ASC').all(req.params.storyId);
    res.json({ success: true, data: npcs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 创建NPC
app.post('/api/stories/:storyId/npcs', (req, res) => {
  try {
    const { 
      name, avatar, profile, personality, habits, skills, 
      likes, dislikes, age, occupation, background, goals, fears 
    } = req.body;
    
    if (!name || !profile) {
      return res.status(400).json({ 
        success: false, 
        error: '请填写NPC名称和基本人设' 
      });
    }
    
    const result = db.prepare(`
      INSERT INTO npcs (
        story_id, name, avatar, profile, personality, habits, skills,
        likes, dislikes, age, occupation, background, goals, fears
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.params.storyId, name, avatar || null, profile,
      personality || null, habits || null, skills || null,
      likes || null, dislikes || null, age || null,
      occupation || null, background || null, goals || null, fears || null
    );
    
    res.json({ success: true, npcId: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 更新NPC
app.put('/api/npcs/:id', (req, res) => {
  try {
    const { 
      name, avatar, profile, personality, habits, skills,
      likes, dislikes, age, occupation, background, goals, fears
    } = req.body;
    
    db.prepare(`
      UPDATE npcs 
      SET name = ?, avatar = ?, profile = ?, personality = ?, habits = ?, 
          skills = ?, likes = ?, dislikes = ?, age = ?, occupation = ?,
          background = ?, goals = ?, fears = ?
      WHERE id = ?
    `).run(
      name, avatar, profile, personality, habits, skills,
      likes, dislikes, age, occupation, background, goals, fears,
      req.params.id
    );
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 删除NPC
app.delete('/api/npcs/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM npcs WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// API路由 - 导出/导入
// ============================================

// 导出剧情（包含NPC角色）
app.get('/api/stories/:id/export', (req, res) => {
  try {
    const story = db.prepare('SELECT * FROM stories WHERE id = ?').get(req.params.id);
    if (!story) {
      return res.status(404).json({ success: false, error: '剧情不存在' });
    }
    
    const npcs = db.prepare('SELECT * FROM npcs WHERE story_id = ?').all(req.params.id);
    
    const exportData = {
      version: '2.0',
      story,
      npcs,
      exportedAt: new Date().toISOString()
    };
    
    res.json({ success: true, data: exportData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 统计信息
app.get('/api/stats', (req, res) => {
  try {
    const stats = {
      totalStories: db.prepare('SELECT COUNT(*) as count FROM stories').get().count,
      totalNPCs: db.prepare('SELECT COUNT(*) as count FROM npcs').get().count
    };
    
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// 启动服务器
// ============================================
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log('');
  console.log('📂 数据库路径:', join(__dirname, 'db/stories.db'));
  console.log('🎭 Story Creator - 剧情和NPC创作工具');
  console.log('━'.repeat(50));
  console.log(`🚀 服务器运行在: http://${HOST}:${PORT}`);
  console.log(`📖 访问界面: http://localhost:${PORT}`);
  console.log(`🔧 API文档: http://localhost:${PORT}/api/stories`);
  console.log('━'.repeat(50));
  console.log('');
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n👋 关闭服务器...');
  db.close();
  process.exit(0);
});

