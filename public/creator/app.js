/**
 * Story Creator - 前端应用逻辑
 */

const API_BASE = '/api/creator';

const app = {
  currentStoryId: null,
  parsedNPCs: null, // 用于缓存AI解析出的NPC数据
  
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
        
        // 如果没有剧情，显示初始化按钮
        const initBtn = document.getElementById('initPresetsBtn');
        if (data.data.totalStories === 0 && initBtn) {
          initBtn.style.display = 'inline-block';
        } else if (initBtn) {
          initBtn.style.display = 'none';
        }
      }
    } catch (error) {
      console.error('加载统计失败:', error);
    }
  },
  
  // 初始化预设剧情
  async initPresets() {
    if (!confirm('确定要加载预设剧情吗？这将添加示例剧情和角色到数据库。')) {
      return;
    }
    
    try {
      const btn = document.getElementById('initPresetsBtn');
      if (btn) {
        btn.disabled = true;
        btn.textContent = '加载中...';
      }
      
      const res = await fetch(`${API_BASE}/init-all-dramas`, {
        method: 'POST'
      });
      const data = await res.json();
      
      if (data.success) {
        alert(`成功加载 ${data.totalStories} 个剧情和 ${data.totalNPCs} 个角色！`);
        await this.loadStats();
        await this.loadStories();
      } else {
        alert('加载失败: ' + data.error);
      }
    } catch (error) {
      console.error('初始化预设失败:', error);
      alert('初始化失败，请重试');
    } finally {
      const btn = document.getElementById('initPresetsBtn');
      if (btn) {
        btn.disabled = false;
        btn.textContent = '📦 加载预设剧情';
      }
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
        <div class="modal modal-large">
          <div class="modal-header">
            <h2>📖 创建新剧情</h2>
          </div>
          <div class="modal-body">
            <!-- AI解析选项卡 -->
            <div class="ai-parse-tabs">
              <button type="button" class="tab-btn active" onclick="app.switchParseTab('single')">
                📝 单个解析
              </button>
              <button type="button" class="tab-btn" onclick="app.switchParseTab('batch')">
                📁 批量解析
              </button>
            </div>

            <!-- 单个解析区域 -->
            <div id="singleParseTab" class="ai-parse-section">
              <div class="ai-parse-header">
                <h3>🤖 AI智能解析</h3>
                <button type="button" class="btn btn-sm btn-secondary" onclick="app.toggleAIParseHelp()">❓ 使用说明</button>
              </div>
              <div id="aiParseHelp" class="ai-parse-help" style="display:none;">
                <p><strong>💡 使用提示：</strong></p>
                <ul>
                  <li>输入任何剧情相关的文本，AI会自动提取剧情信息和角色</li>
                  <li>可以是小说片段、剧本、新闻、历史事件等任何内容</li>
                  <li>文本越详细，AI生成的结果越准确</li>
                  <li>示例：复制一段《权力的游戏》剧情，AI会自动识别出角色和背景</li>
                </ul>
              </div>
              <div class="form-group">
                <label>输入剧情文本 *</label>
                <textarea id="aiParseText" rows="6" placeholder="在这里粘贴或输入剧情相关的文本...&#10;&#10;示例：&#10;王宝强和马蓉在2009年结婚，婚后育有一儿一女。2016年8月，王宝强发现妻子马蓉与其经纪人宋喆存在不正当关系，且在婚内出轨并转移、隐匿夫妻共同财产..."></textarea>
              </div>
              <div class="ai-parse-actions">
                <button type="button" class="btn btn-primary" onclick="app.aiParseStory()">
                  ✨ AI智能解析
                </button>
                <button type="button" class="btn btn-secondary" onclick="app.clearAIParse()">
                  🗑️ 清空
                </button>
              </div>
              <div id="aiParseStatus" class="ai-parse-status"></div>
            </div>

            <!-- 批量解析区域 -->
            <div id="batchParseTab" class="ai-parse-section" style="display: none;">
              <div class="ai-parse-header">
                <h3>🎬 批量解析新闻事件</h3>
              </div>
              <div class="ai-parse-help" style="display: block;">
                <p><strong>💡 功能说明：</strong></p>
                <ul>
                  <li>从 JSON 文件批量导入多个新闻事件</li>
                  <li>AI 自动为每个事件生成独立的剧本和角色</li>
                  <li>支持实时进度显示和结果预览</li>
                </ul>
              </div>
              <div class="form-group">
                <label>JSON文件 *</label>
                
                <!-- 拖拽上传区域 -->
                <div 
                  id="batchDropZone" 
                  class="batch-drop-zone"
                  ondrop="app.handleBatchDrop(event)" 
                  ondragover="app.handleBatchDragOver(event)" 
                  ondragleave="app.handleBatchDragLeave(event)"
                  style="border: 3px dashed #667eea; border-radius: 12px; padding: 30px; text-align: center; background: #f8f9ff; cursor: pointer; margin-bottom: 15px;"
                >
                  <div style="pointer-events: none;">
                    <span style="font-size: 36px;">📄</span>
                    <p style="font-size: 14px; font-weight: 600; margin: 10px 0;">拖拽 JSON 文件到这里</p>
                    <p style="font-size: 12px; color: #666;">或者</p>
                    <label for="batchFileInput" style="display: inline-block; padding: 8px 16px; background: #667eea; color: white; border-radius: 6px; margin-top: 10px; cursor: pointer; pointer-events: auto;">
                      📂 选择文件
                    </label>
                    <input 
                      type="file" 
                      id="batchFileInput" 
                      accept=".json"
                      style="display: none;"
                      onchange="app.handleBatchFileSelect(event)"
                    />
                  </div>
                  <div id="batchFileName" style="margin-top: 15px; padding: 10px; background: white; border-radius: 8px; font-size: 14px; display: none;"></div>
                </div>

                <p style="text-align: center; margin: 15px 0; color: #666; font-weight: 600;">—— 或输入文件路径 ——</p>
                
                <input 
                  type="text" 
                  id="batchJsonFile" 
                  placeholder="例如: 20251111_10.json (相对于网站根目录)"
                  style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;"
                />
                <small style="color: #666; font-size: 0.9em;">文件应包含 items 数组，每个item有title和summary字段</small>
              </div>
              <div class="ai-parse-actions">
                <button type="button" class="btn btn-primary" onclick="app.startBatchParse()" id="batchParseBtn">
                  🚀 开始批量解析
                </button>
                <button type="button" class="btn btn-secondary" onclick="app.exportBatchResults()" id="batchExportBtn" style="display: none;">
                  📥 导出结果
                </button>
                <button type="button" class="btn btn-secondary" onclick="app.clearBatchParse()">
                  🗑️ 清空结果
                </button>
              </div>
              <div id="batchProgress"></div>
              <div id="batchStats"></div>
              <div id="batchStatus" class="ai-parse-status"></div>
              <div id="batchResults"></div>
            </div>

            <div class="form-divider">
              <span>或手动填写</span>
            </div>

            <form id="createStoryForm" onsubmit="app.createStory(event)">
              <div class="form-group">
                <label>剧情名称 *</label>
                <input type="text" name="name" id="storyName" required placeholder="例如：办公室风云">
              </div>
              
              <div class="form-group">
                <label>描述</label>
                <textarea name="description" id="storyDescription" placeholder="简单描述这个剧情..."></textarea>
              </div>
              
              <div class="form-group">
                <label>事件背景 *</label>
                <textarea name="eventBackground" id="storyEventBackground" required rows="5" placeholder="详细描述故事背景和主要事件..."></textarea>
                <div class="form-hint">这将作为AI对话的基础背景</div>
              </div>
              
              <div class="form-group">
                <label>对话密度</label>
                <input type="number" name="dialogueDensity" id="storyDialogueDensity" min="1" max="10" value="2" placeholder="2">
                <div class="form-hint">每轮对话中角色回复的条数（1-10）</div>
              </div>
              
              <div class="form-group">
                <label>图标</label>
                <input type="text" name="avatar" id="storyAvatar" value="📖" placeholder="📖">
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
  
  // 切换AI解析帮助信息
  toggleAIParseHelp() {
    const helpEl = document.getElementById('aiParseHelp');
    if (helpEl) {
      helpEl.style.display = helpEl.style.display === 'none' ? 'block' : 'none';
    }
  },

  // 清空AI解析
  clearAIParse() {
    const textEl = document.getElementById('aiParseText');
    const statusEl = document.getElementById('aiParseStatus');
    if (textEl) textEl.value = '';
    if (statusEl) statusEl.innerHTML = '';
    this.parsedNPCs = null; // 清除缓存的NPC数据
  },

  // 切换解析选项卡
  switchParseTab(tabName) {
    // 更新按钮状态
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // 切换内容
    document.getElementById('singleParseTab').style.display = tabName === 'single' ? 'block' : 'none';
    document.getElementById('batchParseTab').style.display = tabName === 'batch' ? 'block' : 'none';
  },

  // 批量解析结果缓存
  batchResults: [],
  batchErrors: [],
  isProcessing: false,
  uploadedBatchData: null, // 存储上传的JSON数据

  // 处理拖拽事件
  handleBatchDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    document.getElementById('batchDropZone').style.background = '#e8eaff';
    document.getElementById('batchDropZone').style.transform = 'scale(1.02)';
  },

  handleBatchDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    document.getElementById('batchDropZone').style.background = '#f8f9ff';
    document.getElementById('batchDropZone').style.transform = 'scale(1)';
  },

  handleBatchDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    const dropZone = document.getElementById('batchDropZone');
    dropZone.style.background = '#f8f9ff';
    dropZone.style.transform = 'scale(1)';

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type === 'application/json' || file.name.endsWith('.json')) {
        this.readBatchJsonFile(file);
      } else {
        alert('请上传 JSON 文件！');
      }
    }
  },

  // 处理文件选择
  handleBatchFileSelect(e) {
    const files = e.target.files;
    if (files.length > 0) {
      this.readBatchJsonFile(files[0]);
    }
  },

  // 读取JSON文件
  readBatchJsonFile(file) {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target.result);
        this.uploadedBatchData = jsonData;
        
        // 显示文件名
        const fileNameEl = document.getElementById('batchFileName');
        fileNameEl.innerHTML = `✅ <strong>已选择文件：</strong>${file.name} (${(file.size / 1024).toFixed(2)} KB)`;
        fileNameEl.style.display = 'block';
        
        // 清空路径输入框
        document.getElementById('batchJsonFile').value = '';
        
        console.log('文件读取成功:', jsonData);
      } catch (error) {
        alert('JSON 文件格式错误：' + error.message);
        this.uploadedBatchData = null;
      }
    };
    
    reader.onerror = () => {
      alert('文件读取失败！');
      this.uploadedBatchData = null;
    };
    
    reader.readAsText(file);
  },

  // 开始批量解析
  async startBatchParse() {
    if (this.isProcessing) return;

    const jsonFile = document.getElementById('batchJsonFile').value.trim();
    const statusEl = document.getElementById('batchStatus');
    const progressEl = document.getElementById('batchProgress');
    const statsEl = document.getElementById('batchStats');
    const resultsEl = document.getElementById('batchResults');
    const parseBtn = document.getElementById('batchParseBtn');

    // 检查是否有上传的文件或路径
    if (!this.uploadedBatchData && !jsonFile) {
      statusEl.innerHTML = '<div class="status-error">❌ 请上传JSON文件或输入文件路径</div>';
      return;
    }

    this.isProcessing = true;
    parseBtn.disabled = true;
    this.batchResults = [];
    this.batchErrors = [];
    resultsEl.innerHTML = '';
    statsEl.innerHTML = '';
    
    statusEl.innerHTML = '<div class="status-loading">🔄 正在读取JSON文件...</div>';

    try {
      let jsonData;
      
      // 优先使用上传的文件
      if (this.uploadedBatchData) {
        console.log('使用上传的文件数据');
        jsonData = this.uploadedBatchData;
      } else {
        // 否则从路径读取
        console.log('从路径读取文件:', jsonFile);
        const jsonResponse = await fetch(`/${jsonFile}`);
        if (!jsonResponse.ok) {
          throw new Error(`无法读取文件: ${jsonFile}`);
        }
        jsonData = await jsonResponse.json();
      }
      
      if (!jsonData.items || !Array.isArray(jsonData.items)) {
        throw new Error('JSON格式错误：缺少items数组');
      }

      const totalItems = jsonData.items.length;
      
      // 显示初始统计
      this.updateBatchStats(totalItems, 0, 0);
      
      statusEl.innerHTML = `<div class="status-loading">🔄 开始批量解析... (共 ${totalItems} 个事件)</div>`;

      // 初始化进度条
      progressEl.innerHTML = `
        <div style="width: 100%; background: #e0e0e0; border-radius: 4px; overflow: hidden; margin: 10px 0;">
          <div id="batchProgressBar" style="height: 8px; background: linear-gradient(90deg, #667eea 0%, #764ba2 100%); width: 0%; transition: width 0.3s;"></div>
        </div>
        <p style="text-align: center; font-size: 14px; color: #666;">
          正在处理: <span id="batchCurrentProgress">0</span>/${totalItems}
        </p>
      `;

      // 逐个处理事件
      for (let i = 0; i < jsonData.items.length; i++) {
        const item = jsonData.items[i];
        const currentNum = i + 1;
        
        // 更新状态
        statusEl.innerHTML = `
          <div class="status-loading">
            🔄 正在解析事件 ${currentNum}/${totalItems}: ${item.title}
          </div>
        `;
        
        // 更新进度条
        const progress = (currentNum / totalItems * 100).toFixed(1);
        const progressBar = document.getElementById('batchProgressBar');
        const progressText = document.getElementById('batchCurrentProgress');
        if (progressBar) progressBar.style.width = progress + '%';
        if (progressText) progressText.textContent = currentNum;

        try {
          // 调用单个事件解析API
          const text = `【标题】${item.title}\n\n【详细内容】\n${item.summary}`;
          
          const response = await fetch('/api/creator/ai-parse', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
          });

          const result = await response.json();

          if (result.success) {
            this.batchResults.push({
              sourceEvent: {
                title: item.title,
                rank: item.rank,
                query: item.query
              },
              story: result.story,
              npcs: result.npcs,
              reasoning: result.reasoning
            });
            
            // 实时显示成功的结果
            this.appendBatchResult(this.batchResults[this.batchResults.length - 1], this.batchResults.length);
            
          } else {
            this.batchErrors.push({
              event: {
                title: item.title,
                rank: item.rank,
                query: item.query
              },
              error: result.error || '解析失败'
            });
          }

        } catch (error) {
          console.error(`解析事件 ${item.title} 失败:`, error);
          this.batchErrors.push({
            event: {
              title: item.title,
              rank: item.rank,
              query: item.query
            },
            error: error.message
          });
        }

        // 更新统计
        this.updateBatchStats(totalItems, this.batchResults.length, this.batchErrors.length);

        // 添加延迟，避免API限流
        if (i < jsonData.items.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // 完成
      statusEl.innerHTML = `
        <div class="status-success">
          ✅ 批量解析完成！成功: ${this.batchResults.length} | 失败: ${this.batchErrors.length}
        </div>
      `;

      // 显示导出按钮
      if (this.batchResults.length > 0) {
        const exportBtn = document.getElementById('batchExportBtn');
        if (exportBtn) exportBtn.style.display = 'inline-block';
      }

      // 显示失败的结果
      if (this.batchErrors.length > 0) {
        let errorsHtml = '<div style="margin-top: 20px; padding: 15px; background: #ffebee; border-radius: 4px;"><h4 style="color: #c62828;">❌ 解析失败的事件</h4>';
        this.batchErrors.forEach((error) => {
          errorsHtml += `<p style="margin: 5px 0;"><strong>${error.event.title}</strong>: ${error.error}</p>`;
        });
        errorsHtml += '</div>';
        resultsEl.innerHTML += errorsHtml;
      }

    } catch (error) {
      console.error('批量解析失败:', error);
      statusEl.innerHTML = `<div class="status-error">❌ 批量解析失败: ${error.message}</div>`;
    } finally {
      this.isProcessing = false;
      parseBtn.disabled = false;
    }
  },

  // 更新批量解析统计
  updateBatchStats(total, succeeded, failed) {
    const statsEl = document.getElementById('batchStats');
    statsEl.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 15px 0;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px; border-radius: 8px; text-align: center;">
          <div style="font-size: 24px; font-weight: bold;">${total}</div>
          <div style="font-size: 14px; opacity: 0.9;">总事件数</div>
        </div>
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px; border-radius: 8px; text-align: center;">
          <div style="font-size: 24px; font-weight: bold;">${succeeded}</div>
          <div style="font-size: 14px; opacity: 0.9;">解析成功</div>
        </div>
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px; border-radius: 8px; text-align: center;">
          <div style="font-size: 24px; font-weight: bold;">${failed}</div>
          <div style="font-size: 14px; opacity: 0.9;">解析失败</div>
        </div>
      </div>
    `;
  },

  // 添加批量解析结果
  appendBatchResult(item, index) {
    const resultsEl = document.getElementById('batchResults');
    
    // 如果是第一个结果，添加标题
    if (index === 1) {
      resultsEl.innerHTML = '<h4 style="margin: 20px 0 10px 0;">✨ 生成的剧本预览</h4>';
    }
    
    const resultHtml = `
      <div style="background: #f9f9f9; border: 2px solid #e0e0e0; border-radius: 8px; padding: 15px; margin-bottom: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 2px solid #e0e0e0;">
          <div style="font-size: 16px; font-weight: bold;">${index}. ${item.story.name}</div>
          <span style="padding: 4px 12px; background: #e8f5e9; color: #388e3c; border-radius: 12px; font-size: 12px;">✅ 成功</span>
        </div>
        <p style="margin: 5px 0; color: #666;"><strong>原始事件:</strong> ${item.sourceEvent.title}</p>
        <p style="margin: 5px 0; color: #666;"><strong>剧情简介:</strong> ${item.story.description}</p>
        <p style="margin: 5px 0; color: #666;"><strong>角色:</strong> ${item.npcs.map(npc => npc.name).join('、')} (${item.npcs.length}个)</p>
      </div>
    `;
    
    resultsEl.innerHTML += resultHtml;
  },

  // 清空批量解析结果
  clearBatchParse() {
    document.getElementById('batchResults').innerHTML = '';
    document.getElementById('batchStatus').innerHTML = '';
    document.getElementById('batchProgress').innerHTML = '';
    document.getElementById('batchStats').innerHTML = '';
    const fileInput = document.getElementById('batchJsonFile');
    if (fileInput) fileInput.value = '';
    const fileNameEl = document.getElementById('batchFileName');
    if (fileNameEl) {
      fileNameEl.style.display = 'none';
      fileNameEl.innerHTML = '';
    }
    const fileInputEl = document.getElementById('batchFileInput');
    if (fileInputEl) fileInputEl.value = '';
    const exportBtn = document.getElementById('batchExportBtn');
    if (exportBtn) exportBtn.style.display = 'none';
    this.uploadedBatchData = null;
    this.batchResults = [];
    this.batchErrors = [];
  },

  // 导出批量解析结果
  exportBatchResults() {
    if (this.batchResults.length === 0) {
      alert('没有可导出的结果');
      return;
    }

    const format = prompt('选择导出格式：\n1. JSON\n2. 文本\n3. Markdown\n\n请输入数字 (1-3):', '1');
    
    if (!format) return;

    switch(format) {
      case '1':
        this.exportBatchAsJSON();
        break;
      case '2':
        this.exportBatchAsText();
        break;
      case '3':
        this.exportBatchAsMarkdown();
        break;
      default:
        alert('无效的选择');
    }
  },

  // 导出为 JSON
  exportBatchAsJSON() {
    const exportData = {
      exportTime: new Date().toISOString(),
      summary: {
        total: this.batchResults.length + this.batchErrors.length,
        succeeded: this.batchResults.length,
        failed: this.batchErrors.length
      },
      results: this.batchResults,
      errors: this.batchErrors
    };

    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `batch-parse-results-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    alert('✅ JSON 文件已导出！');
  },

  // 导出为文本
  exportBatchAsText() {
    let text = '='.repeat(60) + '\n';
    text += 'AI 批量剧本生成结果\n';
    text += '='.repeat(60) + '\n\n';
    text += `导出时间: ${new Date().toLocaleString('zh-CN')}\n`;
    text += `总事件数: ${this.batchResults.length + this.batchErrors.length}\n`;
    text += `成功: ${this.batchResults.length} | 失败: ${this.batchErrors.length}\n\n`;

    this.batchResults.forEach((item, index) => {
      text += '='.repeat(60) + '\n';
      text += `${index + 1}. ${item.story.name}\n`;
      text += '='.repeat(60) + '\n\n';
      
      text += '【原始事件】\n';
      text += `标题: ${item.sourceEvent.title}\n`;
      text += `排名: #${item.sourceEvent.rank}\n`;
      text += `查询: ${item.sourceEvent.query}\n\n`;
      
      text += '【剧情简介】\n';
      text += `${item.story.description}\n\n`;
      
      text += '【事件背景】\n';
      text += `${item.story.eventBackground}\n\n`;
      
      text += `【角色列表】(${item.npcs.length}个)\n`;
      item.npcs.forEach((npc, i) => {
        text += `${i + 1}. ${npc.avatar || '👤'} ${npc.name} - ${npc.occupation || '角色'}\n`;
        text += `   性格: ${npc.personality}\n`;
        if (npc.background) text += `   背景: ${npc.background}\n`;
        if (npc.goals) text += `   目标: ${npc.goals}\n`;
        text += '\n';
      });
      
      text += '【解析说明】\n';
      text += `${item.reasoning}\n\n`;
    });

    if (this.batchErrors.length > 0) {
      text += '='.repeat(60) + '\n';
      text += '失败的事件\n';
      text += '='.repeat(60) + '\n\n';
      this.batchErrors.forEach((error, index) => {
        text += `${index + 1}. ${error.event.title}\n`;
        text += `   错误: ${error.error}\n\n`;
      });
    }

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `batch-parse-results-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    alert('✅ 文本文件已导出！');
  },

  // 导出为 Markdown
  exportBatchAsMarkdown() {
    let md = '# AI 批量剧本生成结果\n\n';
    md += `**导出时间:** ${new Date().toLocaleString('zh-CN')}\n\n`;
    md += `**统计信息:**\n`;
    md += `- 总事件数: ${this.batchResults.length + this.batchErrors.length}\n`;
    md += `- 成功: ${this.batchResults.length}\n`;
    md += `- 失败: ${this.batchErrors.length}\n\n`;
    md += '---\n\n';

    this.batchResults.forEach((item, index) => {
      md += `## ${index + 1}. ${item.story.name}\n\n`;
      
      md += '### 📰 原始事件\n\n';
      md += `- **标题:** ${item.sourceEvent.title}\n`;
      md += `- **排名:** #${item.sourceEvent.rank}\n`;
      md += `- **查询:** ${item.sourceEvent.query}\n\n`;
      
      md += '### 📖 剧情简介\n\n';
      md += `${item.story.description}\n\n`;
      
      md += '### 🎭 事件背景\n\n';
      md += `${item.story.eventBackground}\n\n`;
      
      md += `### 👥 角色列表 (${item.npcs.length}个)\n\n`;
      item.npcs.forEach((npc, i) => {
        md += `#### ${i + 1}. ${npc.avatar || '👤'} ${npc.name}\n\n`;
        md += `- **职业:** ${npc.occupation || '未知'}\n`;
        md += `- **性格:** ${npc.personality}\n`;
        if (npc.background) md += `- **背景:** ${npc.background}\n`;
        if (npc.goals) md += `- **目标:** ${npc.goals}\n`;
        if (npc.skills) md += `- **技能:** ${npc.skills}\n`;
        md += '\n';
      });
      
      md += '### 💭 解析说明\n\n';
      md += `${item.reasoning}\n\n`;
      md += '---\n\n';
    });

    if (this.batchErrors.length > 0) {
      md += '## ❌ 失败的事件\n\n';
      this.batchErrors.forEach((error, index) => {
        md += `${index + 1}. **${error.event.title}**\n`;
        md += `   - 错误: ${error.error}\n\n`;
      });
    }

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `batch-parse-results-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    
    alert('✅ Markdown 文件已导出！');
  },

  // AI智能解析剧情
  async aiParseStory() {
    const textEl = document.getElementById('aiParseText');
    const statusEl = document.getElementById('aiParseStatus');
    
    if (!textEl || !statusEl) return;
    
    const text = textEl.value.trim();
    
    if (!text) {
      statusEl.innerHTML = '<div class="status-error">❌ 请输入要解析的文本</div>';
      return;
    }
    
    statusEl.innerHTML = '<div class="status-loading">🔄 AI正在解析中，请稍候...</div>';
    
    try {
      const response = await fetch('/api/creator/ai-parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      
      const result = await response.json();
      
      if (result.success) {
        // 填充剧情信息
        document.getElementById('storyName').value = result.story.name || '';
        document.getElementById('storyDescription').value = result.story.description || '';
        document.getElementById('storyEventBackground').value = result.story.eventBackground || '';
        document.getElementById('storyDialogueDensity').value = result.story.dialogueDensity || 2;
        document.getElementById('storyAvatar').value = result.story.avatar || '📖';
        
        // 缓存NPC数据，待剧情创建后使用
        this.parsedNPCs = result.npcs;
        
        statusEl.innerHTML = `
          <div class="status-success">
            ✅ 解析成功！
            <div class="parse-result">
              <strong>剧情：</strong>${result.story.name}<br>
              <strong>识别到${result.npcs.length}个角色：</strong>${result.npcs.map(npc => npc.name).join('、')}<br>
              <small>${result.reasoning}</small>
            </div>
            <div class="form-hint">✨ 表单已自动填充，角色将在创建剧情后自动添加</div>
          </div>
        `;
      } else {
        statusEl.innerHTML = `<div class="status-error">❌ 解析失败：${result.error}</div>`;
      }
    } catch (error) {
      console.error('AI解析失败:', error);
      statusEl.innerHTML = '<div class="status-error">❌ 解析失败，请检查网络连接或稍后重试</div>';
    }
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
        const storyId = result.storyId;
        
        // 如果有解析出的NPC，自动创建它们
        if (this.parsedNPCs && this.parsedNPCs.length > 0) {
          const statusEl = document.getElementById('aiParseStatus');
          if (statusEl) {
            statusEl.innerHTML = '<div class="status-loading">🔄 正在创建角色...</div>';
          }
          
          // 批量创建NPC
          for (const npc of this.parsedNPCs) {
            try {
              await fetch(`${API_BASE}/stories/${storyId}/npcs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(npc)
              });
            } catch (npcError) {
              console.error('创建NPC失败:', npc.name, npcError);
            }
          }
          
          this.parsedNPCs = null; // 清除缓存
        }
        
        this.closeModal();
        await this.loadStats();
        await this.loadStories();
        await this.selectStory(storyId);
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

