/**
 * Story Creator - 前端应用逻辑
 */

const API_BASE = '/api';

const app = {
  currentStoryId: null,
  
  // 初始化
  async init() {
    await this.loadStats();
    await this.loadStories();
  },
  
  // 加载统计信息
  async loadStats() {
    try {
      const res = await fetch(`${API_BASE}/stats`);
      const data = await res.json();
      if (data.success) {
        document.getElementById('totalStories').textContent = data.data.totalStories;
        document.getElementById('totalNPCs').textContent = data.data.totalNPCs;
      }
    } catch (error) {
      console.error('加载统计失败:', error);
    }
  },
  
  // 加载剧情列表
  async loadStories() {
    try {
      const res = await fetch(`${API_BASE}/stories`);
      const data = await res.json();
      
      if (data.success) {
        const listEl = document.getElementById('storyList');
        
        if (data.data.length === 0) {
          listEl.innerHTML = '<div style="text-align:center;padding:2rem;color:#9ca3af;">暂无剧情</div>';
          return;
        }
        
        listEl.innerHTML = data.data.map(story => `
          <div class="story-item ${story.id === this.currentStoryId ? 'active' : ''}" 
               onclick="app.selectStory('${story.id}')">
            <div class="story-item-header">
              <span class="story-item-avatar">${story.avatar || '📖'}</span>
              <span class="story-item-name">${this.escapeHtml(story.name)}</span>
            </div>
            <div class="story-item-meta">
              <span>🎮 ${story.npc_count} 个角色</span>
            </div>
          </div>
        `).join('');
      }
    } catch (error) {
      console.error('加载剧情列表失败:', error);
    }
  },
  
  // 选择剧情
  async selectStory(storyId) {
    this.currentStoryId = storyId;
    await this.loadStoryDetail(storyId);
    await this.loadStories(); // 刷新列表以更新active状态
  },
  
  // 加载剧情详情
  async loadStoryDetail(storyId) {
    try {
      const res = await fetch(`${API_BASE}/stories/${storyId}`);
      const data = await res.json();
      
      if (data.success) {
        const story = data.data;
        
        // 显示详情，隐藏空状态
        document.getElementById('emptyState').style.display = 'none';
        document.getElementById('storyDetail').style.display = 'block';
        
        // 填充剧情信息
        document.getElementById('detailAvatar').textContent = story.avatar || '📖';
        document.getElementById('detailName').textContent = story.name;
        document.getElementById('detailBackground').textContent = story.event_background;
        document.getElementById('detailDescription').textContent = story.description || '无描述';
        
        // 加载NPC
        document.getElementById('npcCount').textContent = story.npcs.length;
        const npcListEl = document.getElementById('npcList');
        
        if (story.npcs.length === 0) {
          npcListEl.innerHTML = '<div style="grid-column: 1/-1;text-align:center;padding:2rem;color:#9ca3af;">暂无NPC，点击上方按钮添加</div>';
        } else {
          npcListEl.innerHTML = story.npcs.map(npc => `
            <div class="npc-card">
              <div class="npc-actions">
                <button class="btn btn-icon btn-secondary" onclick="app.editNPC(${npc.id})" title="编辑">✏️</button>
                <button class="btn btn-icon btn-danger" onclick="app.deleteNPC(${npc.id})" title="删除">🗑️</button>
              </div>
              <div class="npc-card-header">
                <span class="npc-avatar">${npc.avatar || '🎮'}</span>
                <div class="npc-info">
                  <div class="npc-name">${this.escapeHtml(npc.name)}</div>
                  ${npc.age ? `<div class="npc-age">${npc.age}岁</div>` : ''}
                  ${npc.occupation ? `<div class="npc-occupation">${this.escapeHtml(npc.occupation)}</div>` : ''}
                </div>
              </div>
              <div class="npc-profile">${this.escapeHtml(npc.profile)}</div>
              ${npc.personality ? `<div class="npc-attr"><span class="attr-label">🎭 性格:</span> ${this.escapeHtml(npc.personality)}</div>` : ''}
              ${npc.skills ? `<div class="npc-attr"><span class="attr-label">⚔️ 技能:</span> ${this.escapeHtml(npc.skills)}</div>` : ''}
              ${npc.likes ? `<div class="npc-attr"><span class="attr-label">💚 喜好:</span> ${this.escapeHtml(npc.likes)}</div>` : ''}
              ${npc.dislikes ? `<div class="npc-attr"><span class="attr-label">💔 厌恶:</span> ${this.escapeHtml(npc.dislikes)}</div>` : ''}
            </div>
          `).join('');
        }
      }
    } catch (error) {
      console.error('加载剧情详情失败:', error);
      alert('加载剧情详情失败');
    }
  },
  
  // 显示创建剧情模态框
  showCreateStoryModal() {
    const modalHtml = `
      <div class="modal-overlay" onclick="if(event.target===this) app.closeModal()">
        <div class="modal">
          <div class="modal-header">
            <h2>📖 创建新剧情</h2>
          </div>
          <div class="modal-body">
            <form id="createStoryForm" onsubmit="app.createStory(event)">
              <div class="form-group">
                <label>剧情名称 *</label>
                <input type="text" name="name" required placeholder="例如：办公室风云">
              </div>
              
              <div class="form-group">
                <label>描述</label>
                <textarea name="description" placeholder="简单描述这个剧情..."></textarea>
              </div>
              
              <div class="form-group">
                <label>事件背景 *</label>
                <textarea name="eventBackground" required rows="5" placeholder="详细描述故事背景和主要事件..."></textarea>
                <div class="form-hint">这将作为AI对话的基础背景</div>
              </div>
              
              <div class="form-group">
                <label>对话密度</label>
                <input type="number" name="dialogueDensity" min="1" max="10" value="2" placeholder="2">
                <div class="form-hint">每轮对话中角色回复的条数（1-10）</div>
              </div>
              
              <div class="form-group">
                <label>图标</label>
                <input type="text" name="avatar" value="📖" placeholder="📖">
                <div class="form-hint">一个emoji表情</div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="app.closeModal()">取消</button>
            <button type="submit" form="createStoryForm" class="btn btn-primary">创建</button>
          </div>
        </div>
      </div>
    `;
    document.getElementById('modalContainer').innerHTML = modalHtml;
  },
  
  // 创建剧情
  async createStory(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);
    
    try {
      const res = await fetch(`${API_BASE}/stories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      const result = await res.json();
      
      if (result.success) {
        this.closeModal();
        await this.loadStats();
        await this.loadStories();
        await this.selectStory(result.storyId);
      } else {
        alert('创建失败: ' + result.error);
      }
    } catch (error) {
      console.error('创建剧情失败:', error);
      alert('创建失败，请重试');
    }
  },
  
  // 编辑剧情
  async editStory() {
    if (!this.currentStoryId) return;
    
    try {
      const res = await fetch(`${API_BASE}/stories/${this.currentStoryId}`);
      const data = await res.json();
      const story = data.data;
      
      const modalHtml = `
        <div class="modal-overlay" onclick="if(event.target===this) app.closeModal()">
          <div class="modal">
            <div class="modal-header">
              <h2>✏️ 编辑剧情</h2>
            </div>
            <div class="modal-body">
              <form id="editStoryForm" onsubmit="app.updateStory(event)">
                <div class="form-group">
                  <label>剧情名称 *</label>
                  <input type="text" name="name" required value="${this.escapeHtml(story.name)}">
                </div>
                
                <div class="form-group">
                  <label>描述</label>
                  <textarea name="description">${this.escapeHtml(story.description || '')}</textarea>
                </div>
                
                <div class="form-group">
                  <label>事件背景 *</label>
                  <textarea name="eventBackground" required rows="5">${this.escapeHtml(story.event_background)}</textarea>
                </div>
                
                <div class="form-group">
                  <label>对话密度</label>
                  <input type="number" name="dialogueDensity" min="1" max="10" value="${story.dialogue_density}">
                </div>
                
                <div class="form-group">
                  <label>图标</label>
                  <input type="text" name="avatar" value="${story.avatar || '📖'}">
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" onclick="app.closeModal()">取消</button>
              <button type="submit" form="editStoryForm" class="btn btn-primary">保存</button>
            </div>
          </div>
        </div>
      `;
      document.getElementById('modalContainer').innerHTML = modalHtml;
    } catch (error) {
      console.error('加载剧情失败:', error);
    }
  },
  
  // 更新剧情
  async updateStory(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);
    
    try {
      const res = await fetch(`${API_BASE}/stories/${this.currentStoryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      const result = await res.json();
      
      if (result.success) {
        this.closeModal();
        await this.loadStories();
        await this.selectStory(this.currentStoryId);
      } else {
        alert('更新失败: ' + result.error);
      }
    } catch (error) {
      console.error('更新剧情失败:', error);
      alert('更新失败，请重试');
    }
  },
  
  // 删除剧情
  async deleteStory() {
    if (!this.currentStoryId) return;
    
    if (!confirm('确定要删除这个剧情吗？这将同时删除所有关联的角色，此操作不可恢复！')) {
      return;
    }
    
    try {
      const res = await fetch(`${API_BASE}/stories/${this.currentStoryId}`, {
        method: 'DELETE'
      });
      
      const result = await res.json();
      
      if (result.success) {
        this.currentStoryId = null;
        document.getElementById('emptyState').style.display = 'block';
        document.getElementById('storyDetail').style.display = 'none';
        await this.loadStats();
        await this.loadStories();
      } else {
        alert('删除失败: ' + result.error);
      }
    } catch (error) {
      console.error('删除剧情失败:', error);
      alert('删除失败，请重试');
    }
  },
  
  // 导出剧情
  async exportStory() {
    if (!this.currentStoryId) return;
    
    try {
      const res = await fetch(`${API_BASE}/stories/${this.currentStoryId}/export`);
      const data = await res.json();
      
      if (data.success) {
        const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `story_${this.currentStoryId}_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('导出失败:', error);
      alert('导出失败，请重试');
    }
  },
  
  // 显示创建NPC模态框
  showCreateNPCModal() {
    if (!this.currentStoryId) return;
    
    const modalHtml = `
      <div class="modal-overlay" onclick="if(event.target===this) app.closeModal()">
        <div class="modal">
          <div class="modal-header">
            <h2>🎮 创建游戏角色</h2>
          </div>
          <div class="modal-body">
            <form id="createNPCForm" onsubmit="app.createNPC(event)">
              <div class="form-group">
                <label>角色名称 *</label>
                <input type="text" name="name" required placeholder="例如：艾莉娅">
              </div>
              
              <div class="form-row">
                <div class="form-group">
                  <label>头像</label>
                  <input type="text" name="avatar" placeholder="🎮" maxlength="2">
                </div>
                <div class="form-group">
                  <label>年龄</label>
                  <input type="number" name="age" placeholder="25" min="1" max="999">
                </div>
                <div class="form-group">
                  <label>职业</label>
                  <input type="text" name="occupation" placeholder="剑士/法师/商人">
                </div>
              </div>
              
              <div class="form-group">
                <label>基本人设 *</label>
                <textarea name="profile" required rows="3" placeholder="简要描述这个角色..."></textarea>
                <div class="form-hint">角色的基本介绍</div>
              </div>
              
              <div class="form-group">
                <label>性格特点</label>
                <textarea name="personality" rows="2" placeholder="勇敢、善良、固执..."></textarea>
                <div class="form-hint">可选：角色的性格特征</div>
              </div>
              
              <div class="form-group">
                <label>技能</label>
                <input type="text" name="skills" placeholder="剑术、火焰魔法、谈判...">
                <div class="form-hint">可选：角色拥有的技能</div>
              </div>
              
              <div class="form-group">
                <label>习惯</label>
                <input type="text" name="habits" placeholder="早起训练、喜欢喝茶...">
                <div class="form-hint">可选：角色的日常习惯</div>
              </div>
              
              <div class="form-group">
                <label>喜好</label>
                <input type="text" name="likes" placeholder="冒险、美食、音乐...">
                <div class="form-hint">可选：角色喜欢的东西</div>
              </div>
              
              <div class="form-group">
                <label>厌恶</label>
                <input type="text" name="dislikes" placeholder="欺骗、黑暗、蜘蛛...">
                <div class="form-hint">可选：角色讨厌的东西</div>
              </div>
              
              <div class="form-group">
                <label>背景故事</label>
                <textarea name="background" rows="3" placeholder="角色的过去经历..."></textarea>
                <div class="form-hint">可选：角色的成长背景</div>
              </div>
              
              <div class="form-group">
                <label>目标/动机</label>
                <textarea name="goals" rows="2" placeholder="寻找失踪的家人、成为最强战士..."></textarea>
                <div class="form-hint">可选：角色的追求目标</div>
              </div>
              
              <div class="form-group">
                <label>恐惧</label>
                <input type="text" name="fears" placeholder="失去亲人、被背叛...">
                <div class="form-hint">可选：角色害怕的事物</div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="app.closeModal()">取消</button>
            <button type="submit" form="createNPCForm" class="btn btn-primary">创建角色</button>
          </div>
        </div>
      </div>
    `;
    document.getElementById('modalContainer').innerHTML = modalHtml;
  },
  
  // 创建NPC
  async createNPC(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);
    
    try {
      const res = await fetch(`${API_BASE}/stories/${this.currentStoryId}/npcs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      const result = await res.json();
      
      if (result.success) {
        this.closeModal();
        await this.loadStats();
        await this.selectStory(this.currentStoryId);
      } else {
        alert('添加失败: ' + result.error);
      }
    } catch (error) {
      console.error('添加NPC失败:', error);
      alert('添加失败，请重试');
    }
  },
  
  // 编辑NPC
  async editNPC(npcId) {
    // TODO: 实现编辑功能
    alert('编辑功能开发中...');
  },
  
  // 删除NPC
  async deleteNPC(npcId) {
    if (!confirm('确定要删除这个NPC吗？')) return;
    
    try {
      const res = await fetch(`${API_BASE}/npcs/${npcId}`, {
        method: 'DELETE'
      });
      
      const result = await res.json();
      
      if (result.success) {
        await this.loadStats();
        await this.selectStory(this.currentStoryId);
      } else {
        alert('删除失败: ' + result.error);
      }
    } catch (error) {
      console.error('删除NPC失败:', error);
      alert('删除失败，请重试');
    }
  },
  
  // 关闭模态框
  closeModal() {
    document.getElementById('modalContainer').innerHTML = '';
  },
  
  // HTML转义
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};

// 页面加载后初始化
document.addEventListener('DOMContentLoaded', () => {
  app.init();
});

