/**
 * Map Creator - 地图编辑器
 * 支持TMJ格式导出和AI自动分层
 */

const mapApp = {
  // 地图数据
  mapWidth: 64,
  mapHeight: 64,
  tileSize: 16, // 每个瓦片的像素大小
  grid: [],
  
  // 画布
  canvas: null,
  ctx: null,
  zoom: 1,
  
  // 绘制状态
  drawMode: 'rect', // single, rect, fill, brush, eraser, select
  currentTileType: null,
  isDrawing: false,
  startPos: null,
  brushSize: 1, // 画笔大小
  
  // 撤销/重做历史
  history: [],
  historyIndex: -1,
  maxHistory: 50,
  
  // 悬停状态
  hoveredRegion: null,
  currentEditingRegion: null, // 当前正在编辑的区域
  
  // 模式状态
  currentMode: 'create', // 'create', 'select', 或 'tile'
  hoveredColorTiles: [], // 选择模式下悬停的同色瓦片
  hoveredColorBounds: null, // 选择模式下悬停区域的边界
  
  // Tile模式状态
  tileSet: [], // 上传的tile图片 { id, name, image, dataURL }
  currentTile: null, // 当前选中的tile
  
  // 颜色-Tile映射
  colorTileMapping: {}, // { tileTypeId: tileId }
  
  // 瓦片类型
  tileTypes: [
    { id: 1, name: '草地', color: '#90EE90', category: 'ground' },
    { id: 2, name: '围墙', color: '#FF6B6B', category: 'building' },
    { id: 3, name: '建筑', color: '#4ECDC4', category: 'building' },
    { id: 4, name: '河流', color: '#3498DB', category: 'water' },
    { id: 5, name: '房屋内部', color: '#FFE66D', category: 'indoor' },
    { id: 6, name: '大门', color: '#FF9F1C', category: 'building' },
    { id: 7, name: '道路', color: '#B8B8B8', category: 'ground' }
  ],
  
  // 定义的区域
  regions: [],
  selectedRegion: null,
  
  // 初始化
  init() {
    this.canvas = document.getElementById('mapCanvas');
    this.ctx = this.canvas.getContext('2d');
    
    // 设置默认瓦片类型
    this.currentTileType = this.tileTypes[0];
    
    // 渲染瓦片类型选择器
    this.renderTileTypes();
    
    // 创建初始网格
    this.createGrid();
    
    // 绑定事件
    this.bindEvents();
    
    console.log('🗺️ Map Creator initialized');
  },
  
  // 创建网格
  createGrid() {
    const width = parseInt(document.getElementById('mapWidth').value) || 64;
    const height = parseInt(document.getElementById('mapHeight').value) || 64;
    
    this.mapWidth = width;
    this.mapHeight = height;
    
    // 初始化网格数据（全部为草地）
    this.grid = Array(height).fill(null).map(() => 
      Array(width).fill(null).map(() => ({ tileId: 1, tileRef: null }))
    );
    
    // 清空区域和历史
    this.regions = [];
    this.renderRegionsList();
    this.clearHistory();
    this.saveHistory();
    
    // 设置画布大小
    this.canvas.width = this.mapWidth * this.tileSize;
    this.canvas.height = this.mapHeight * this.tileSize;
    
    // 更新信息显示
    document.getElementById('gridInfo').textContent = `${width} × ${height}`;
    
    // 重绘
    this.render();
    
    console.log(`Grid created: ${width} × ${height}`);
  },
  
  // 保存历史记录
  saveHistory() {
    // 删除当前位置之后的历史
    this.history = this.history.slice(0, this.historyIndex + 1);
    
    // 深拷贝当前网格状态
    const gridCopy = JSON.parse(JSON.stringify(this.grid));
    this.history.push(gridCopy);
    
    // 限制历史记录数量
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    } else {
      this.historyIndex++;
    }
    
    // 更新撤销/重做按钮状态
    this.updateHistoryButtons();
  },
  
  // 清空历史
  clearHistory() {
    this.history = [];
    this.historyIndex = -1;
    this.updateHistoryButtons();
  },
  
  // 撤销
  undo() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.grid = JSON.parse(JSON.stringify(this.history[this.historyIndex]));
      this.render();
      this.updateHistoryButtons();
      console.log('Undo');
    }
  },
  
  // 重做
  redo() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.grid = JSON.parse(JSON.stringify(this.history[this.historyIndex]));
      this.render();
      this.updateHistoryButtons();
      console.log('Redo');
    }
  },
  
  // 更新历史按钮状态
  updateHistoryButtons() {
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');
    
    if (undoBtn) {
      undoBtn.disabled = this.historyIndex <= 0;
    }
    if (redoBtn) {
      redoBtn.disabled = this.historyIndex >= this.history.length - 1;
    }
  },
  
  // 设置画笔大小
  setBrushSize(size) {
    this.brushSize = parseInt(size) || 1;
    document.getElementById('brushSizeDisplay').textContent = size;
  },
  
  // 渲染瓦片类型选择器
  renderTileTypes() {
    const container = document.getElementById('tileTypes');
    container.innerHTML = this.tileTypes.map(type => `
      <div class="tile-type ${type.id === this.currentTileType.id ? 'active' : ''}" 
           onclick="mapApp.selectTileType(${type.id})">
        <div class="tile-color" style="background: ${type.color}"></div>
        <div class="tile-name">${type.name}</div>
      </div>
    `).join('');
  },
  
  // 选择瓦片类型
  selectTileType(id) {
    this.currentTileType = this.tileTypes.find(t => t.id === id);
    this.renderTileTypes();
  },
  
  // 设置绘制模式
  setDrawMode(mode) {
    this.drawMode = mode;
  },
  
  // 绑定事件
  bindEvents() {
    this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
    this.canvas.addEventListener('mouseleave', (e) => this.onMouseUp(e));
    
    // 键盘快捷键
    document.addEventListener('keydown', (e) => {
      // Ctrl+Z / Cmd+Z 撤销
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        this.undo();
      }
      // Ctrl+Y / Cmd+Y / Ctrl+Shift+Z 重做
      else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        this.redo();
      }
      // 数字键快速切换绘制模式（仅在创造模式下）
      else if (e.key >= '1' && e.key <= '5' && this.currentMode === 'create') {
        const modes = ['brush', 'eraser', 'single', 'rect', 'fill'];
        const index = parseInt(e.key) - 1;
        if (index < modes.length) {
          this.setDrawMode(modes[index]);
          document.getElementById('drawMode').value = modes[index];
        }
      }
      // [ 和 ] 调整画笔大小
      else if (e.key === '[') {
        e.preventDefault();
        const newSize = Math.max(1, this.brushSize - 1);
        this.setBrushSize(newSize);
        document.getElementById('brushSize').value = newSize;
      }
      else if (e.key === ']') {
        e.preventDefault();
        const newSize = Math.min(10, this.brushSize + 1);
        this.setBrushSize(newSize);
        document.getElementById('brushSize').value = newSize;
      }
    });
  },
  
  // 获取鼠标在网格中的坐标
  getGridPos(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / this.tileSize);
    const y = Math.floor((e.clientY - rect.top) / this.tileSize);
    return { x, y };
  },
  
  // 在指定位置绘制瓦片
  drawTileAt(x, y) {
    if (x < 0 || x >= this.mapWidth || y < 0 || y >= this.mapHeight) return;
    
    if (this.currentMode === 'tile' && this.currentTile) {
      // Tile模式：设置tile引用
      this.grid[y][x].tileRef = this.currentTile.id;
    } else if (this.currentMode === 'create' && this.currentTileType) {
      // 创造模式：设置tile类型
      this.grid[y][x].tileId = this.currentTileType.id;
      this.grid[y][x].tileRef = null; // 清除tile引用
    }
  },
  
  // 鼠标按下
  onMouseDown(e) {
    const pos = this.getGridPos(e);
    
    if (pos.x < 0 || pos.x >= this.mapWidth || pos.y < 0 || pos.y >= this.mapHeight) {
      return;
    }
    
    // 选择模式：点击选择区域
    if (this.currentMode === 'select') {
      this.selectColorRegion();
      return;
    }
    
    // Tile模式：需要先选择一个Tile
    if (this.currentMode === 'tile') {
      if (!this.currentTile) {
        alert('请先选择一个Tile');
        return;
      }
    }
    
    // 创造模式或Tile模式：绘制
    this.isDrawing = true;
    this.startPos = pos;
    
    if (this.drawMode === 'single') {
      this.drawTileAt(pos.x, pos.y);
      this.render();
    } else if (this.drawMode === 'brush') {
      this.drawBrush(pos.x, pos.y);
    } else if (this.drawMode === 'eraser') {
      this.erase(pos.x, pos.y);
    }
  },
  
  // 鼠标移动
  onMouseMove(e) {
    const pos = this.getGridPos(e);
    
    // 更新鼠标位置显示
    document.getElementById('mousePos').textContent = `${pos.x}, ${pos.y}`;
    
    // 选择模式：自动识别同色区域
    if (this.currentMode === 'select') {
      this.identifySameColorRegion(pos.x, pos.y);
      this.render();
      return; // 选择模式下不执行任何创造模式的逻辑
    }
    
    // === 以下是创造模式的逻辑 ===
    
    // 创造模式：检测悬停的区域
    const hoveredRegion = this.getRegionAt(pos.x, pos.y);
    if (hoveredRegion !== this.hoveredRegion) {
      this.hoveredRegion = hoveredRegion;
      this.render();
      
      // 更新光标样式
      if (hoveredRegion) {
        this.canvas.style.cursor = 'pointer';
        // 显示提示信息
        this.showRegionTooltip(hoveredRegion, e);
      } else {
        this.canvas.style.cursor = 'crosshair';
        this.hideRegionTooltip();
      }
    }
    
    if (!this.isDrawing) {
      // 显示画笔/橡皮擦预览
      if (this.drawMode === 'brush' || this.drawMode === 'eraser') {
        this.render();
        this.drawBrushPreview(pos.x, pos.y);
      }
      return;
    }
    
    if (this.drawMode === 'single') {
      if (pos.x >= 0 && pos.x < this.mapWidth && pos.y >= 0 && pos.y < this.mapHeight) {
        this.drawTileAt(pos.x, pos.y);
        this.render();
      }
    } else if (this.drawMode === 'rect') {
      this.render();
      // 绘制选择矩形预览
      this.drawSelectionRect(this.startPos, pos);
    } else if (this.drawMode === 'brush') {
      this.drawBrush(pos.x, pos.y);
    } else if (this.drawMode === 'eraser') {
      this.erase(pos.x, pos.y);
    }
  },
  
  // 鼠标释放
  onMouseUp(e) {
    // 选择模式不需要处理鼠标释放
    if (this.currentMode === 'select') {
      return;
    }
    
    if (!this.isDrawing) return;
    
    const pos = this.getGridPos(e);
    
    if (this.drawMode === 'rect' && this.startPos) {
      // 计算矩形区域
      const x1 = Math.min(this.startPos.x, pos.x);
      const y1 = Math.min(this.startPos.y, pos.y);
      const x2 = Math.max(this.startPos.x, pos.x);
      const y2 = Math.max(this.startPos.y, pos.y);
      
      // 填充矩形
      for (let y = y1; y <= y2 && y < this.mapHeight; y++) {
        for (let x = x1; x <= x2 && x < this.mapWidth; x++) {
          this.drawTileAt(x, y);
        }
      }
      
      // 不再自动显示区域面板，用户可以切换到选择模式来定义区域
      // this.showRegionPanel({ x1, y1, x2, y2 });
      
      this.render();
      this.saveHistory();
    } else if (this.drawMode === 'fill') {
      const targetId = this.grid[pos.y][pos.x].tileId;
      const targetRef = this.grid[pos.y][pos.x].tileRef;
      this.floodFill(pos.x, pos.y, targetId, targetRef);
      this.render();
      this.saveHistory();
    } else if (this.drawMode === 'brush' || this.drawMode === 'eraser') {
      // 画笔和橡皮擦在释放时保存历史
      this.saveHistory();
    } else if (this.drawMode === 'single') {
      this.saveHistory();
    }
    
    this.isDrawing = false;
    this.startPos = null;
  },
  
  // 画笔绘制
  drawBrush(centerX, centerY) {
    const halfSize = Math.floor(this.brushSize / 2);
    
    for (let dy = -halfSize; dy <= halfSize; dy++) {
      for (let dx = -halfSize; dx <= halfSize; dx++) {
        const x = centerX + dx;
        const y = centerY + dy;
        
        // 圆形画笔（可选）
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > halfSize + 0.5) continue;
        
        this.drawTileAt(x, y);
      }
    }
    
    this.render();
  },
  
  // 橡皮擦
  erase(centerX, centerY) {
    const halfSize = Math.floor(this.brushSize / 2);
    
    for (let dy = -halfSize; dy <= halfSize; dy++) {
      for (let dx = -halfSize; dx <= halfSize; dx++) {
        const x = centerX + dx;
        const y = centerY + dy;
        
        // 圆形橡皮擦
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > halfSize + 0.5) continue;
        
        if (x >= 0 && x < this.mapWidth && y >= 0 && y < this.mapHeight) {
          this.grid[y][x].tileId = 1; // 恢复为草地
        }
      }
    }
    
    this.render();
  },
  
  // 画笔预览
  drawBrushPreview(centerX, centerY) {
    if (centerX < 0 || centerX >= this.mapWidth || centerY < 0 || centerY >= this.mapHeight) {
      return;
    }
    
    const halfSize = Math.floor(this.brushSize / 2);
    
    this.ctx.strokeStyle = this.drawMode === 'eraser' ? '#ff3b30' : '#007aff';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([3, 3]);
    
    // 绘制圆形预览
    this.ctx.beginPath();
    this.ctx.arc(
      (centerX + 0.5) * this.tileSize,
      (centerY + 0.5) * this.tileSize,
      (halfSize + 0.5) * this.tileSize,
      0,
      Math.PI * 2
    );
    this.ctx.stroke();
    
    this.ctx.setLineDash([]);
  },
  
  // 绘制选择矩形
  drawSelectionRect(start, end) {
    const x = Math.min(start.x, end.x) * this.tileSize;
    const y = Math.min(start.y, end.y) * this.tileSize;
    const w = (Math.abs(end.x - start.x) + 1) * this.tileSize;
    const h = (Math.abs(end.y - start.y) + 1) * this.tileSize;
    
    // 半透明填充
    this.ctx.fillStyle = 'rgba(0, 122, 255, 0.1)';
    this.ctx.fillRect(x, y, w, h);
    
    // 虚线边框
    this.ctx.strokeStyle = '#007aff';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([5, 5]);
    this.ctx.strokeRect(x, y, w, h);
    this.ctx.setLineDash([]);
    
    // 显示选择区域的信息
    const gridX1 = Math.min(start.x, end.x);
    const gridY1 = Math.min(start.y, end.y);
    const gridX2 = Math.max(start.x, end.x);
    const gridY2 = Math.max(start.y, end.y);
    const width = gridX2 - gridX1 + 1;
    const height = gridY2 - gridY1 + 1;
    
    this.ctx.font = 'bold 14px -apple-system, sans-serif';
    this.ctx.textBaseline = 'top';
    
    const infoText = `${width} × ${height}`;
    const coordText = `(${gridX1},${gridY1}) → (${gridX2},${gridY2})`;
    
    const textX = x + 6;
    const textY = y + 6;
    
    // 背景
    const textMetrics = this.ctx.measureText(infoText);
    const coordMetrics = this.ctx.measureText(coordText);
    const maxWidth = Math.max(textMetrics.width, coordMetrics.width);
    
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    this.ctx.fillRect(textX - 4, textY - 4, maxWidth + 8, 40);
    
    // 文字
    this.ctx.fillStyle = '#007aff';
    this.ctx.fillText(infoText, textX, textY);
    
    this.ctx.font = '11px -apple-system, sans-serif';
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillText(coordText, textX, textY + 18);
  },
  
  // 填充算法
  floodFill(x, y, targetId, targetRef) {
    if (x < 0 || x >= this.mapWidth || y < 0 || y >= this.mapHeight) return;
    
    const cell = this.grid[y][x];
    // 检查是否匹配目标（考虑tileId和tileRef）
    const isTarget = (cell.tileId === targetId && cell.tileRef === targetRef);
    if (!isTarget) return;
    
    // 应用当前的绘制内容
    this.drawTileAt(x, y);
    
    // 递归填充
    this.floodFill(x + 1, y, targetId, targetRef);
    this.floodFill(x - 1, y, targetId, targetRef);
    this.floodFill(x, y + 1, targetId, targetRef);
    this.floodFill(x, y - 1, targetId, targetRef);
  },
  
  // 渲染地图
  render() {
    // 清空画布
    this.ctx.fillStyle = '#fafafa';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // 绘制网格
    for (let y = 0; y < this.mapHeight; y++) {
      for (let x = 0; x < this.mapWidth; x++) {
        const tile = this.grid[y][x];
        
        // 优先绘制Tile图片（如果有）
        if (tile.tileRef && this.tileSet.find(t => t.id === tile.tileRef)) {
          const tileObj = this.tileSet.find(t => t.id === tile.tileRef);
          this.ctx.drawImage(
            tileObj.image, 
            x * this.tileSize, 
            y * this.tileSize, 
            this.tileSize, 
            this.tileSize
          );
        } else {
          // 否则绘制颜色
          const tileType = this.tileTypes.find(t => t.id === tile.tileId);
          if (tileType) {
            this.ctx.fillStyle = tileType.color;
            this.ctx.fillRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
          }
        }
      }
    }
    
    // 绘制网格线
    this.ctx.strokeStyle = '#d1d1d6';
    this.ctx.lineWidth = 0.5;
    
    for (let x = 0; x <= this.mapWidth; x++) {
      this.ctx.beginPath();
      this.ctx.moveTo(x * this.tileSize, 0);
      this.ctx.lineTo(x * this.tileSize, this.canvas.height);
      this.ctx.stroke();
    }
    
    for (let y = 0; y <= this.mapHeight; y++) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y * this.tileSize);
      this.ctx.lineTo(this.canvas.width, y * this.tileSize);
      this.ctx.stroke();
    }
    
    // 绘制选择模式的悬停区域（在区域之前绘制）
    if (this.currentMode === 'select' && this.hoveredColorTiles.length > 0) {
      // 绘制半透明填充
      this.hoveredColorTiles.forEach(tile => {
        this.ctx.fillStyle = 'rgba(7, 193, 96, 0.3)';
        this.ctx.fillRect(tile.x * this.tileSize, tile.y * this.tileSize, this.tileSize, this.tileSize);
      });
      
      // 绘制边框
      if (this.hoveredColorBounds) {
        const x = this.hoveredColorBounds.x1 * this.tileSize;
        const y = this.hoveredColorBounds.y1 * this.tileSize;
        const w = (this.hoveredColorBounds.x2 - this.hoveredColorBounds.x1 + 1) * this.tileSize;
        const h = (this.hoveredColorBounds.y2 - this.hoveredColorBounds.y1 + 1) * this.tileSize;
        
        this.ctx.strokeStyle = '#07c160';
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([8, 8]);
        this.ctx.strokeRect(x, y, w, h);
        this.ctx.setLineDash([]);
        
        // 显示信息
        this.ctx.font = 'bold 14px -apple-system, sans-serif';
        this.ctx.fillStyle = '#07c160';
        this.ctx.textBaseline = 'top';
        
        const infoText = `点击选择 (${this.hoveredColorTiles.length} 瓦片)`;
        const textMetrics = this.ctx.measureText(infoText);
        
        // 白色背景
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        this.ctx.fillRect(x + 6, y + 6, textMetrics.width + 12, 24);
        
        // 绿色文字
        this.ctx.fillStyle = '#07c160';
        this.ctx.fillText(infoText, x + 12, y + 10);
      }
    }
    
    // 绘制区域（带半透明填充和边框）
    this.regions.forEach((region, index) => {
      const isHovered = this.hoveredRegion === region;
      const rgb = this.hexToRgb(region.color);
      const opacity = isHovered ? 0.35 : 0.15;
      
      // 如果区域有具体的瓦片列表，只绘制这些瓦片
      if (region.tiles && region.tiles.length > 0) {
        // 绘制每个瓦片的半透明填充
        this.ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
        region.tiles.forEach(tile => {
          this.ctx.fillRect(tile.x * this.tileSize, tile.y * this.tileSize, this.tileSize, this.tileSize);
        });
        
        // 绘制边框（围绕所有瓦片的轮廓）
        this.ctx.strokeStyle = region.color;
        this.ctx.lineWidth = isHovered ? 3 : 2;
        region.tiles.forEach(tile => {
          this.ctx.strokeRect(tile.x * this.tileSize, tile.y * this.tileSize, this.tileSize, this.tileSize);
        });
      } else {
        // 旧方式：绘制整个矩形区域
        const x = region.x1 * this.tileSize;
        const y = region.y1 * this.tileSize;
        const w = (region.x2 - region.x1 + 1) * this.tileSize;
        const h = (region.y2 - region.y1 + 1) * this.tileSize;
        
        // 半透明填充
        this.ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
        this.ctx.fillRect(x, y, w, h);
        
        // 边框
        this.ctx.strokeStyle = region.color;
        this.ctx.lineWidth = isHovered ? 4 : 3;
        this.ctx.strokeRect(x, y, w, h);
      }
      
      // 绘制区域名称标签（在矩形边界的左上角）
      const x = region.x1 * this.tileSize;
      const y = region.y1 * this.tileSize;
      
      this.ctx.font = isHovered ? 'bold 14px -apple-system, sans-serif' : 'bold 12px -apple-system, sans-serif';
      this.ctx.fillStyle = region.color;
      this.ctx.textBaseline = 'top';
      
      const labelX = x + 4;
      const labelY = y + 2;
      const labelText = region.name;
      
      // 背景
      const textMetrics = this.ctx.measureText(labelText);
      this.ctx.fillStyle = isHovered ? 'rgba(255, 255, 255, 1)' : 'rgba(255, 255, 255, 0.9)';
      this.ctx.fillRect(labelX - 2, labelY - 2, textMetrics.width + 4, isHovered ? 18 : 16);
      
      // 文字
      this.ctx.fillStyle = region.color;
      this.ctx.fillText(labelText, labelX, labelY);
      
      // 显示坐标（小号）
      this.ctx.font = '10px -apple-system, sans-serif';
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      const coordText = region.tiles 
        ? `${region.tiles.length} 瓦片` 
        : `(${region.x1},${region.y1})-(${region.x2},${region.y2})`;
      this.ctx.fillText(coordText, labelX, labelY + (isHovered ? 16 : 14));
      
      // 悬停时显示角标
      if (isHovered) {
        const w = (region.x2 - region.x1 + 1) * this.tileSize;
        const h = (region.y2 - region.y1 + 1) * this.tileSize;
        this.ctx.fillStyle = region.color;
        this.ctx.beginPath();
        this.ctx.arc(x + w - 8, y + 8, 6, 0, Math.PI * 2);
        this.ctx.fill();
      }
    });
  },
  
  // 获取指定坐标的区域
  getRegionAt(x, y) {
    // 从后往前找（后添加的区域优先）
    for (let i = this.regions.length - 1; i >= 0; i--) {
      const region = this.regions[i];
      
      // 如果区域有具体的瓦片列表，检查是否在任一瓦片上
      if (region.tiles && region.tiles.length > 0) {
        const isInTiles = region.tiles.some(tile => tile.x === x && tile.y === y);
        if (isInTiles) {
          return region;
        }
      } else {
        // 旧方式：检查矩形边界
        if (x >= region.x1 && x <= region.x2 && y >= region.y1 && y <= region.y2) {
          return region;
        }
      }
    }
    return null;
  },
  
  // 显示区域提示
  showRegionTooltip(region, event) {
    let tooltip = document.getElementById('regionTooltip');
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.id = 'regionTooltip';
      tooltip.style.cssText = `
        position: fixed;
        background: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 10px 12px;
        border-radius: 8px;
        font-size: 12px;
        pointer-events: auto;
        z-index: 9999;
        max-width: 280px;
        line-height: 1.5;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      `;
      document.body.appendChild(tooltip);
    }
    
    const props = Object.entries(region.properties || {})
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');
    
    tooltip.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 6px; font-size: 13px;">${region.name}</div>
      ${region.description ? `<div style="margin-bottom: 6px; opacity: 0.9;">${region.description}</div>` : ''}
      <div style="font-size: 10px; opacity: 0.7; margin-bottom: 8px;">
        区域: (${region.x1},${region.y1}) → (${region.x2},${region.y2})
      </div>
      ${props ? `<div style="font-size: 10px; margin-bottom: 8px; opacity: 0.8;">${props}</div>` : ''}
      <button onclick="mapApp.selectRegionForEdit(${JSON.stringify(region).replace(/"/g, '&quot;')}); event.stopPropagation();" 
              style="
                width: 100%;
                padding: 6px 12px;
                background: #07c160;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                font-weight: bold;
              ">
        ✏️ 编辑此区域
      </button>
    `;
    
    tooltip.style.left = (event.clientX + 15) + 'px';
    tooltip.style.top = (event.clientY + 15) + 'px';
    tooltip.style.display = 'block';
  },
  
  // 隐藏区域提示
  hideRegionTooltip() {
    const tooltip = document.getElementById('regionTooltip');
    if (tooltip) {
      tooltip.style.display = 'none';
    }
  },
  
  // 十六进制颜色转RGB
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  },
  
  // 显示区域定义面板
  showRegionPanel(bounds) {
    this.selectedRegion = {
      ...bounds,
      name: '',
      description: '',
      properties: { accessible: true, energy: 0 },
      color: this.currentTileType.color
    };
    
    document.getElementById('selectedRegion').style.display = 'block';
    document.getElementById('regionName').value = '';
    document.getElementById('regionDescription').value = '';
    
    this.renderRegionProperties();
  },
  
  // 渲染区域属性
  renderRegionProperties() {
    const container = document.getElementById('regionProperties');
    const props = this.selectedRegion?.properties || {};
    
    container.innerHTML = Object.entries(props).map(([key, value]) => `
      <div class="property-item">
        <input type="text" value="${key}" onchange="mapApp.updatePropertyKey('${key}', this.value)" placeholder="属性名">
        <input type="text" value="${value}" onchange="mapApp.updatePropertyValue('${key}', this.value)" placeholder="值">
        <button onclick="mapApp.removeProperty('${key}')">×</button>
      </div>
    `).join('');
  },
  
  // 添加自定义属性
  addCustomProperty() {
    if (!this.selectedRegion) return;
    
    const key = prompt('属性名（例如：accessible, energy）:');
    if (!key) return;
    
    const value = prompt('属性值:');
    this.selectedRegion.properties[key] = value || '';
    
    this.renderRegionProperties();
  },
  
  // 更新属性键
  updatePropertyKey(oldKey, newKey) {
    if (!this.selectedRegion || !newKey) return;
    
    const value = this.selectedRegion.properties[oldKey];
    delete this.selectedRegion.properties[oldKey];
    this.selectedRegion.properties[newKey] = value;
    
    this.renderRegionProperties();
  },
  
  // 更新属性值
  updatePropertyValue(key, value) {
    if (!this.selectedRegion) return;
    
    // 尝试解析为数字或布尔值
    if (value === 'true') value = true;
    else if (value === 'false') value = false;
    else if (!isNaN(value) && value !== '') value = parseFloat(value);
    
    this.selectedRegion.properties[key] = value;
  },
  
  // 删除属性
  removeProperty(key) {
    if (!this.selectedRegion) return;
    delete this.selectedRegion.properties[key];
    this.renderRegionProperties();
  },
  
  // 保存区域
  saveRegion() {
    if (!this.selectedRegion) return;
    
    const name = document.getElementById('regionName').value;
    const description = document.getElementById('regionDescription').value;
    
    if (!name) {
      alert('请输入区域名称');
      return;
    }
    
    this.selectedRegion.name = name;
    this.selectedRegion.description = description;
    
    this.regions.push({ ...this.selectedRegion });
    
    // 隐藏面板
    document.getElementById('selectedRegion').style.display = 'none';
    this.selectedRegion = null;
    
    // 更新区域列表
    this.renderRegionsList();
    this.render();
    
    console.log('Region saved:', name);
  },
  
  // 渲染区域列表
  renderRegionsList() {
    const container = document.getElementById('regionsList');
    const countElement = document.getElementById('regionsCount');
    
    if (countElement) {
      countElement.textContent = this.regions.length;
    }
    
    if (this.regions.length === 0) {
      container.innerHTML = '<div class="empty-hint">暂无定义的区域</div>';
      return;
    }
    
    container.innerHTML = this.regions.map((region, index) => `
      <div class="region-item" 
           style="border-left-color: ${region.color};" 
           onclick="mapApp.selectRegionFromList(${index})"
           title="点击编辑此区域">
        <div class="region-item-name">${region.name}</div>
        <div class="region-item-bounds">(${region.x1}, ${region.y1}) → (${region.x2}, ${region.y2})</div>
        ${region.description ? `<div style="font-size: 0.85rem; color: #888; margin-top: 0.25rem;">${region.description}</div>` : ''}
      </div>
    `).join('');
  },
  
  // 从列表中选择区域
  selectRegionFromList(index) {
    if (index >= 0 && index < this.regions.length) {
      this.selectRegionForEdit(this.regions[index]);
    }
  },
  
  // 添加瓦片类型模态框
  showAddTileTypeModal() {
    const modalHtml = `
      <div class="modal" onclick="if(event.target === this) mapApp.closeModal()">
        <div class="modal-content">
          <div class="modal-header">
            <h2>添加瓦片类型</h2>
          </div>
          <form id="addTileTypeForm" onsubmit="mapApp.addTileType(event)">
            <div class="form-group">
              <label>名称</label>
              <input type="text" name="name" required placeholder="例如：森林">
            </div>
            <div class="form-group">
              <label>颜色</label>
              <input type="color" name="color" value="#4ECDC4" required>
            </div>
            <div class="form-group">
              <label>分类</label>
              <select name="category">
                <option value="ground">地面层</option>
                <option value="building">建筑层</option>
                <option value="water">水域层</option>
                <option value="indoor">室内层</option>
              </select>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" onclick="mapApp.closeModal()">取消</button>
              <button type="submit" class="btn btn-primary">添加</button>
            </div>
          </form>
        </div>
      </div>
    `;
    
    document.getElementById('modalContainer').innerHTML = modalHtml;
  },
  
  // 添加瓦片类型
  addTileType(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const newType = {
      id: this.tileTypes.length + 1,
      name: formData.get('name'),
      color: formData.get('color'),
      category: formData.get('category')
    };
    
    this.tileTypes.push(newType);
    this.renderTileTypes();
    this.closeModal();
    
    console.log('Tile type added:', newType);
  },
  
  // 关闭模态框
  closeModal() {
    document.getElementById('modalContainer').innerHTML = '';
  },
  
  // 新建地图
  newMap() {
    if (this.regions.length > 0) {
      if (!confirm('确定要新建地图吗？当前地图将被清空。')) {
        return;
      }
    }
    
    this.createGrid();
  },
  
  // 导出Raw Map (TMJ格式)
  exportRawMap() {
    const worldDesc = document.getElementById('worldDescription').value;
    
    if (!worldDesc) {
      if (!confirm('未填写世界描述，这将影响AI分层效果。确定继续导出吗？')) {
        return;
      }
    }
    
    const tmj = {
      compressionlevel: -1,
      height: this.mapHeight,
      width: this.mapWidth,
      infinite: false,
      layers: [
        {
          data: this.grid.flat().map(tile => tile.tileId),
          height: this.mapHeight,
          width: this.mapWidth,
          id: 1,
          name: "Main Layer",
          opacity: 1,
          type: "tilelayer",
          visible: true,
          x: 0,
          y: 0
        }
      ],
      nextlayerid: 2,
      nextobjectid: 1,
      orientation: "orthogonal",
      renderorder: "right-down",
      tiledversion: "1.10.2",
      tileheight: this.tileSize,
      tilewidth: this.tileSize,
      tilesets: [
        {
          firstgid: 1,
          source: "tileset.tsj",
          tiles: this.tileTypes.map(type => ({
            id: type.id - 1,
            type: type.name,
            properties: [
              { name: "category", type: "string", value: type.category },
              { name: "color", type: "string", value: type.color }
            ]
          }))
        }
      ],
      type: "map",
      version: "1.10",
      properties: [
        { name: "worldDescription", type: "string", value: worldDesc },
        { name: "regions", type: "string", value: JSON.stringify(this.regions) }
      ]
    };
    
    this.downloadJSON(tmj, `map_${Date.now()}.tmj`);
    console.log('✅ Raw map exported (TMJ format)');
  },
  
  // AI自动分层
  async aiLayering() {
    const worldDesc = document.getElementById('worldDescription').value;
    
    if (!worldDesc) {
      alert('请先填写世界描述，以便AI理解地图结构');
      return;
    }
    
    // 构建提示信息
    let confirmMsg = 'AI将根据世界描述对整个地图进行分层。';
    if (this.regions.length > 0) {
      confirmMsg = `AI将根据世界描述和 ${this.regions.length} 个已定义区域对整个地图进行分层。`;
    } else {
      confirmMsg += '\n\n提示：你可以先定义区域来辅助AI更好地理解地图结构，但这不是必需的。';
    }
    confirmMsg += '\n\n这可能需要几秒钟，确定继续吗？';
    
    const confirmed = confirm(confirmMsg);
    if (!confirmed) return;
    
    try {
      // 调用AI API进行分层
      const response = await fetch('/api/map-creator/ai-layering', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          worldDescription: worldDesc,
          mapWidth: this.width,
          mapHeight: this.height,
          grid: this.grid,
          regions: this.regions || [], // 区域可选
          tileTypes: this.tileTypes
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        this.displayLayeredMaps(result.layers);
        alert(`✅ AI分层完成！生成了 ${result.layers.length} 个图层`);
      } else {
        alert('AI分层失败: ' + result.error);
      }
    } catch (error) {
      console.error('AI layering error:', error);
      alert('AI分层失败，请重试');
    }
  },
  
  // 显示分层地图
  displayLayeredMaps(layers) {
    const container = document.getElementById('layersPreview');
    
    container.innerHTML = layers.map((layer, index) => `
      <div class="layer-item">
        <div class="layer-name">${layer.name}</div>
        <button class="layer-download" onclick="mapApp.downloadLayer(${index})">下载</button>
      </div>
    `).join('');
    
    // 保存图层数据
    this.layeredMaps = layers;
  },
  
  // 下载图层
  downloadLayer(index) {
    const layer = this.layeredMaps[index];
    this.downloadJSON(layer.data, `${layer.name}.tmj`);
  },
  
  // 下载JSON文件
  downloadJSON(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  },
  
  // ========== 区域选择和编辑功能 ==========
  
  // 选择区域进行编辑
  selectRegionForEdit(region) {
    this.hideRegionTooltip();
    this.currentEditingRegion = region;
    
    // 填充右侧面板
    document.getElementById('regionDetailName').value = region.name || '';
    document.getElementById('regionDetailDescription').value = region.description || '';
    
    // 显示边界信息（精确瓦片 vs 矩形）
    const boundsText = region.tiles 
      ? `${region.tiles.length} 个瓦片`
      : `(${region.x1},${region.y1}) → (${region.x2},${region.y2})`;
    document.getElementById('regionDetailBounds').textContent = boundsText;
    
    document.getElementById('regionDetailColor').value = region.color || '#FF6B6B';
    
    // 填充属性列表
    this.renderRegionProperties(region.properties || {});
    
    // 显示面板
    document.getElementById('regionDetailPanel').style.display = 'block';
    
    console.log('编辑区域:', region);
  },
  
  // 渲染区域属性列表
  renderRegionProperties(properties) {
    const container = document.getElementById('regionPropertiesList');
    container.innerHTML = '';
    
    Object.entries(properties).forEach(([key, value]) => {
      const item = document.createElement('div');
      item.className = 'property-item';
      item.innerHTML = `
        <input type="text" value="${key}" placeholder="属性名" onchange="mapApp.updatePropertyKey(this, '${key}')" />
        <input type="text" value="${value}" placeholder="属性值" data-key="${key}" onchange="mapApp.updatePropertyValue(this)" />
        <button onclick="mapApp.removeProperty('${key}')" title="删除">×</button>
      `;
      container.appendChild(item);
    });
  },
  
  // 添加新属性
  addRegionProperty() {
    if (!this.currentEditingRegion) {
      alert('请先选择一个区域');
      return;
    }
    
    const key = prompt('属性名称（例如：accessible, type, energy）:');
    if (!key) return;
    
    const value = prompt('属性值:');
    if (value === null) return;
    
    if (!this.currentEditingRegion.properties) {
      this.currentEditingRegion.properties = {};
    }
    this.currentEditingRegion.properties[key] = value;
    
    this.renderRegionProperties(this.currentEditingRegion.properties);
  },
  
  // 更新属性键
  updatePropertyKey(input, oldKey) {
    const newKey = input.value.trim();
    if (!newKey || newKey === oldKey) return;
    
    if (this.currentEditingRegion && this.currentEditingRegion.properties) {
      const oldValue = this.currentEditingRegion.properties[oldKey];
      delete this.currentEditingRegion.properties[oldKey];
      this.currentEditingRegion.properties[newKey] = oldValue;
      
      // 更新对应值输入框的data-key
      const valueInput = input.nextElementSibling;
      if (valueInput) {
        valueInput.dataset.key = newKey;
      }
    }
  },
  
  // 更新属性值
  updatePropertyValue(input) {
    const key = input.dataset.key;
    const value = input.value.trim();
    
    if (this.currentEditingRegion && this.currentEditingRegion.properties && key) {
      this.currentEditingRegion.properties[key] = value;
    }
  },
  
  // 删除属性
  removeProperty(key) {
    if (this.currentEditingRegion && this.currentEditingRegion.properties) {
      delete this.currentEditingRegion.properties[key];
      this.renderRegionProperties(this.currentEditingRegion.properties);
    }
  },
  
  // 自动框选同色区域
  autoSelectSameColor() {
    if (!this.currentEditingRegion) {
      alert('请先选择一个区域');
      return;
    }
    
    // 获取当前区域中心点或第一个瓦片的瓦片ID
    let centerX, centerY;
    if (this.currentEditingRegion.tiles && this.currentEditingRegion.tiles.length > 0) {
      // 使用第一个瓦片作为起点
      centerX = this.currentEditingRegion.tiles[0].x;
      centerY = this.currentEditingRegion.tiles[0].y;
    } else {
      // 使用矩形中心
      centerX = Math.floor((this.currentEditingRegion.x1 + this.currentEditingRegion.x2) / 2);
      centerY = Math.floor((this.currentEditingRegion.y1 + this.currentEditingRegion.y2) / 2);
    }
    
    const targetTileId = this.grid[centerY][centerX].tileId;
    
    // 使用洪填充算法找到所有相邻同色瓦片
    const visited = Array(this.mapHeight).fill(null).map(() => Array(this.mapWidth).fill(false));
    const tiles = [];
    
    const flood = (x, y) => {
      if (x < 0 || x >= this.mapWidth || y < 0 || y >= this.mapHeight) return;
      if (visited[y][x]) return;
      if (this.grid[y][x].tileId !== targetTileId) return;
      
      visited[y][x] = true;
      tiles.push({ x, y });
      
      flood(x + 1, y);
      flood(x - 1, y);
      flood(x, y + 1);
      flood(x, y - 1);
    };
    
    flood(centerX, centerY);
    
    // 更新区域的瓦片列表和边界
    if (tiles.length > 0) {
      const xs = tiles.map(t => t.x);
      const ys = tiles.map(t => t.y);
      const x1 = Math.min(...xs);
      const y1 = Math.min(...ys);
      const x2 = Math.max(...xs);
      const y2 = Math.max(...ys);
      
      // 更新当前编辑的区域
      this.currentEditingRegion.tiles = tiles;
      this.currentEditingRegion.x1 = x1;
      this.currentEditingRegion.y1 = y1;
      this.currentEditingRegion.x2 = x2;
      this.currentEditingRegion.y2 = y2;
      this.currentEditingRegion.description = `包含 ${tiles.length} 个瓦片的区域`;
      if (this.currentEditingRegion.properties) {
        this.currentEditingRegion.properties.tileCount = tiles.length;
      }
      
      // 更新显示
      document.getElementById('regionDetailBounds').textContent = `${tiles.length} 个瓦片`;
      document.getElementById('regionDetailDescription').value = this.currentEditingRegion.description;
      
      console.log(`自动扩展: 找到${tiles.length}个同色瓦片, 边界: (${x1},${y1}) → (${x2},${y2})`);
      
      // 重新渲染
      this.render();
    } else {
      alert('未找到相邻的同色瓦片');
    }
  },
  
  // 保存区域详情
  saveRegionDetail() {
    if (!this.currentEditingRegion) return;
    
    const name = document.getElementById('regionDetailName').value.trim();
    if (!name) {
      alert('请输入区域名称');
      return;
    }
    
    const description = document.getElementById('regionDetailDescription').value.trim();
    const color = document.getElementById('regionDetailColor').value;
    
    // 更新区域信息
    this.currentEditingRegion.name = name;
    this.currentEditingRegion.description = description;
    this.currentEditingRegion.color = color;
    
    // 重新渲染
    this.render();
    this.renderRegionsList();
    
    alert('区域已保存！');
    console.log('保存区域:', this.currentEditingRegion);
  },
  
  // 删除当前区域
  deleteCurrentRegion() {
    if (!this.currentEditingRegion) return;
    
    if (!confirm(`确定要删除区域"${this.currentEditingRegion.name}"吗？`)) {
      return;
    }
    
    const index = this.regions.indexOf(this.currentEditingRegion);
    if (index > -1) {
      this.regions.splice(index, 1);
      this.closeRegionDetail();
      this.render();
      this.renderRegionsList();
      console.log('删除区域:', this.currentEditingRegion.name);
    }
  },
  
  // 关闭区域详情面板
  closeRegionDetail() {
    document.getElementById('regionDetailPanel').style.display = 'none';
    this.currentEditingRegion = null;
    this.render();
  },
  
  // ========== 模式切换功能 ==========
  
  // 切换模式
  switchMode(mode) {
    this.currentMode = mode;
    
    // 更新按钮状态
    document.getElementById('createModeBtn').classList.toggle('active', mode === 'create');
    document.getElementById('selectModeBtn').classList.toggle('active', mode === 'select');
    document.getElementById('tileModeBtn').classList.toggle('active', mode === 'tile');
    
    // 切换面板
    document.getElementById('createModePanel').style.display = mode === 'create' ? 'block' : 'none';
    document.getElementById('selectModePanel').style.display = mode === 'select' ? 'block' : 'none';
    document.getElementById('tileModePanel').style.display = mode === 'tile' ? 'block' : 'none';
    
    // 清除状态
    if (mode === 'create' || mode === 'tile') {
      this.hoveredColorTiles = [];
      this.hoveredColorBounds = null;
      this.canvas.style.cursor = 'crosshair';
    } else if (mode === 'select') {
      this.canvas.style.cursor = 'pointer';
    }
    
    this.render();
    const modeNames = { create: '创造', select: '选择', tile: 'Tile' };
    console.log(`切换到${modeNames[mode]}模式`);
  },
  
  // 在选择模式下识别同色区域
  identifySameColorRegion(x, y) {
    if (x < 0 || x >= this.mapWidth || y < 0 || y >= this.mapHeight) {
      this.hoveredColorTiles = [];
      this.hoveredColorBounds = null;
      return;
    }
    
    const targetTileId = this.grid[y][x].tileId;
    const visited = Array(this.mapHeight).fill(null).map(() => Array(this.mapWidth).fill(false));
    const tiles = [];
    
    // 洪填充算法
    const flood = (px, py) => {
      if (px < 0 || px >= this.mapWidth || py < 0 || py >= this.mapHeight) return;
      if (visited[py][px]) return;
      if (this.grid[py][px].tileId !== targetTileId) return;
      
      visited[py][px] = true;
      tiles.push({ x: px, y: py });
      
      flood(px + 1, py);
      flood(px - 1, py);
      flood(px, py + 1);
      flood(px, py - 1);
    };
    
    flood(x, y);
    
    this.hoveredColorTiles = tiles;
    
    // 计算边界
    if (tiles.length > 0) {
      const xs = tiles.map(t => t.x);
      const ys = tiles.map(t => t.y);
      this.hoveredColorBounds = {
        x1: Math.min(...xs),
        y1: Math.min(...ys),
        x2: Math.max(...xs),
        y2: Math.max(...ys)
      };
      
      // 更新左侧信息面板
      const tileType = this.tileTypes.find(t => t.id === targetTileId);
      document.getElementById('hoverInfo').textContent = tileType ? tileType.name : '未知';
      document.getElementById('hoveredTilesCount').textContent = tiles.length;
      document.getElementById('hoveredBounds').textContent = 
        `(${this.hoveredColorBounds.x1},${this.hoveredColorBounds.y1}) → (${this.hoveredColorBounds.x2},${this.hoveredColorBounds.y2})`;
    } else {
      this.hoveredColorBounds = null;
      document.getElementById('hoverInfo').textContent = '-';
      document.getElementById('hoveredTilesCount').textContent = '0';
      document.getElementById('hoveredBounds').textContent = '-';
    }
  },
  
  // 在选择模式下点击创建区域
  selectColorRegion() {
    if (!this.hoveredColorBounds || this.hoveredColorTiles.length === 0) {
      alert('请先将鼠标悬停到要选择的区域');
      return;
    }
    
    // 获取瓦片类型信息
    const centerX = Math.floor((this.hoveredColorBounds.x1 + this.hoveredColorBounds.x2) / 2);
    const centerY = Math.floor((this.hoveredColorBounds.y1 + this.hoveredColorBounds.y2) / 2);
    const targetTileId = this.grid[centerY][centerX].tileId;
    const tileType = this.tileTypes.find(t => t.id === targetTileId);
    
    // 生成随机颜色
    const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
    
    // 创建新区域 - 保存实际的瓦片列表，而不是矩形
    const newRegion = {
      x1: this.hoveredColorBounds.x1,
      y1: this.hoveredColorBounds.y1,
      x2: this.hoveredColorBounds.x2,
      y2: this.hoveredColorBounds.y2,
      tiles: [...this.hoveredColorTiles], // 保存实际的瓦片坐标列表
      name: `${tileType ? tileType.name : '区域'}_${Date.now().toString().slice(-4)}`,
      description: `包含 ${this.hoveredColorTiles.length} 个瓦片的区域`,
      color: randomColor,
      properties: {
        tileType: tileType ? tileType.name : 'unknown',
        tileCount: this.hoveredColorTiles.length
      }
    };
    
    this.regions.push(newRegion);
    
    // 清除悬停状态，防止重复选择
    this.hoveredColorTiles = [];
    this.hoveredColorBounds = null;
    
    // 清除左侧面板的信息
    document.getElementById('hoverInfo').textContent = '-';
    document.getElementById('hoveredTilesCount').textContent = '0';
    document.getElementById('hoveredBounds').textContent = '-';
    
    this.selectRegionForEdit(newRegion);
    this.renderRegionsList();
    this.render(); // 重新渲染以清除高亮
    
    console.log('创建新区域（精确瓦片）:', newRegion);
  },
  
  // ========== Tile模式功能 ==========
  
  // 上传Tile Set
  uploadTileSet(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) {
        console.warn(`跳过非图片文件: ${file.name}`);
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // 检查是否需要切割（图片尺寸大于单个tile尺寸）
          const tileWidth = parseInt(document.getElementById('tileWidth')?.value || 16);
          const tileHeight = parseInt(document.getElementById('tileHeight')?.value || 16);
          
          if (img.width > tileWidth * 2 || img.height > tileHeight * 2) {
            // 可能是一个tile set，询问是否切割
            if (confirm(`检测到图片尺寸 ${img.width}x${img.height}\n是否按 ${tileWidth}x${tileHeight} 自动切割？`)) {
              this.cutTileSet(img, file.name, e.target.result, tileWidth, tileHeight);
            } else {
              // 作为单个tile添加
              this.addSingleTile(img, file.name, e.target.result);
            }
          } else {
            // 作为单个tile添加
            this.addSingleTile(img, file.name, e.target.result);
          }
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
    
    // 清空input以允许重复上传同一文件
    event.target.value = '';
  },
  
  // 添加单个Tile
  addSingleTile(img, name, dataURL) {
    const tile = {
      id: `tile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: name,
      image: img,
      dataURL: dataURL,
      width: img.width,
      height: img.height
    };
    
    this.tileSet.push(tile);
    this.renderTileSet();
    console.log(`添加Tile: ${name} (${img.width}x${img.height})`);
  },
  
  // 切割Tile Set
  cutTileSet(sourceImg, sourceName, sourceDataURL, tileWidth, tileHeight) {
    const cols = Math.floor(sourceImg.width / tileWidth);
    const rows = Math.floor(sourceImg.height / tileHeight);
    
    console.log(`切割 ${sourceName}: ${cols}列 × ${rows}行 = ${cols * rows}个Tile`);
    
    const canvas = document.createElement('canvas');
    canvas.width = tileWidth;
    canvas.height = tileHeight;
    const ctx = canvas.getContext('2d');
    
    let count = 0;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        // 清空画布
        ctx.clearRect(0, 0, tileWidth, tileHeight);
        
        // 绘制当前tile
        ctx.drawImage(
          sourceImg,
          col * tileWidth,
          row * tileHeight,
          tileWidth,
          tileHeight,
          0,
          0,
          tileWidth,
          tileHeight
        );
        
        // 转换为新图片
        const tileDataURL = canvas.toDataURL('image/png');
        const tileImg = new Image();
        tileImg.src = tileDataURL;
        
        const tile = {
          id: `tile_${Date.now()}_${count}_${Math.random().toString(36).substr(2, 9)}`,
          name: `${sourceName.replace(/\.\w+$/, '')}_${row}_${col}.png`,
          image: tileImg,
          dataURL: tileDataURL,
          width: tileWidth,
          height: tileHeight,
          sourceSet: sourceName,
          position: { row, col }
        };
        
        this.tileSet.push(tile);
        count++;
      }
    }
    
    this.renderTileSet();
    alert(`成功切割出 ${count} 个Tile！`);
  },
  
  // 显示Tile Set切割模态框
  showTileSetCutterModal() {
    const modalHtml = `
      <div class="modal" onclick="if(event.target === this) mapApp.closeModal()">
        <div class="modal-content" style="max-width: 800px;">
          <div class="modal-header">
            <h3>✂️ Tile Set 切割工具</h3>
            <button class="modal-close" onclick="mapApp.closeModal()">×</button>
          </div>
          
          <div class="modal-body">
            <p style="color: #666; margin-bottom: 1rem;">
              上传包含多个tile的图片（Sprite Sheet），自动切割成单独的tile。
            </p>
            
            <div class="form-group">
              <label>上传Tile Set图片</label>
              <input type="file" id="manualTileSetUpload" accept="image/png,image/jpg,image/jpeg">
            </div>
            
            <div class="form-group">
              <label>单个Tile尺寸</label>
              <div class="size-inputs">
                <input type="number" id="cutTileWidth" value="16" min="8" max="128">
                <span>×</span>
                <input type="number" id="cutTileHeight" value="16" min="8" max="128">
              </div>
            </div>
            
            <div id="cutPreview" style="margin-top: 1rem; max-height: 400px; overflow: auto; border: 1px solid #ddd; border-radius: 4px;"></div>
          </div>
          
          <div class="modal-footer">
            <button onclick="mapApp.closeModal()" class="btn btn-secondary">取消</button>
            <button onclick="mapApp.executeTileSetCut()" class="btn btn-primary">切割并添加</button>
          </div>
        </div>
      </div>
    `;
    
    document.getElementById('modalContainer').innerHTML = modalHtml;
    
    // 绑定预览
    document.getElementById('manualTileSetUpload').addEventListener('change', (e) => {
      this.previewTileSetCut(e);
    });
  },
  
  // 预览切割效果
  previewTileSetCut(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const tileWidth = parseInt(document.getElementById('cutTileWidth').value);
        const tileHeight = parseInt(document.getElementById('cutTileHeight').value);
        const cols = Math.floor(img.width / tileWidth);
        const rows = Math.floor(img.height / tileHeight);
        
        const preview = document.getElementById('cutPreview');
        preview.innerHTML = `
          <div style="padding: 1rem;">
            <p><strong>图片尺寸:</strong> ${img.width} × ${img.height}</p>
            <p><strong>切割结果:</strong> ${cols}列 × ${rows}行 = <strong>${cols * rows}个Tile</strong></p>
            <canvas id="cutPreviewCanvas" width="${img.width}" height="${img.height}" style="max-width: 100%; border: 1px solid #ccc;"></canvas>
          </div>
        `;
        
        // 绘制预览
        const canvas = document.getElementById('cutPreviewCanvas');
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        // 绘制切割网格
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= cols; i++) {
          ctx.beginPath();
          ctx.moveTo(i * tileWidth, 0);
          ctx.lineTo(i * tileWidth, img.height);
          ctx.stroke();
        }
        for (let i = 0; i <= rows; i++) {
          ctx.beginPath();
          ctx.moveTo(0, i * tileHeight);
          ctx.lineTo(img.width, i * tileHeight);
          ctx.stroke();
        }
        
        // 保存到临时变量
        this.tempCutImage = img;
        this.tempCutFileName = file.name;
        this.tempCutDataURL = e.target.result;
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  },
  
  // 执行切割
  executeTileSetCut() {
    if (!this.tempCutImage) {
      alert('请先上传图片');
      return;
    }
    
    const tileWidth = parseInt(document.getElementById('cutTileWidth').value);
    const tileHeight = parseInt(document.getElementById('cutTileHeight').value);
    
    this.cutTileSet(this.tempCutImage, this.tempCutFileName, this.tempCutDataURL, tileWidth, tileHeight);
    
    this.closeModal();
    this.tempCutImage = null;
    this.tempCutFileName = null;
    this.tempCutDataURL = null;
  },
  
  // 渲染Tile Set列表
  renderTileSet() {
    const container = document.getElementById('tileSetList');
    
    if (this.tileSet.length === 0) {
      container.innerHTML = '<div class="empty-hint">暂无上传的Tile</div>';
      return;
    }
    
    container.innerHTML = this.tileSet.map(tile => `
      <div class="tile-item ${this.currentTile && this.currentTile.id === tile.id ? 'active' : ''}" 
           onclick="mapApp.selectTile('${tile.id}')"
           title="${tile.name} (${tile.width}x${tile.height})">
        <img src="${tile.dataURL}" alt="${tile.name}">
        <button class="tile-item-remove" onclick="event.stopPropagation(); mapApp.removeTile('${tile.id}')">×</button>
      </div>
    `).join('');
  },
  
  // 选择Tile
  selectTile(tileId) {
    this.currentTile = this.tileSet.find(t => t.id === tileId);
    this.renderTileSet();
    console.log('选择Tile:', this.currentTile.name);
  },
  
  // 删除Tile
  removeTile(tileId) {
    if (!confirm('确定要删除这个Tile吗？')) return;
    
    this.tileSet = this.tileSet.filter(t => t.id !== tileId);
    if (this.currentTile && this.currentTile.id === tileId) {
      this.currentTile = this.tileSet[0] || null;
    }
    this.renderTileSet();
  },
  
  // 显示AI填充模态框
  showAIFillModal() {
    const modalHtml = `
      <div class="modal" onclick="if(event.target === this) mapApp.closeModal()">
        <div class="modal-content" style="max-width: 600px;">
          <div class="modal-header">
            <h3>✨ AI自动填充Tile</h3>
            <button class="modal-close" onclick="mapApp.closeModal()">×</button>
          </div>
          
          <div class="modal-body">
            <p style="color: #666; margin-bottom: 1rem;">
              AI将根据当前地图的颜色布局和区域定义，自动选择合适的Tile进行填充。
            </p>
            
            <div class="form-group">
              <label>填充说明</label>
              <textarea id="aiFillDescription" rows="4" 
                        placeholder="例如：这是一个地牢场景，灰色代表石墙，黄色代表地板，蓝色代表水池..."></textarea>
            </div>
            
            <div class="form-group">
              <label>
                <input type="checkbox" id="aiFillKeepBoundaries" checked> 
                保持区域边界
              </label>
            </div>
            
            <div class="form-group">
              <label>Tile匹配策略</label>
              <select id="aiFillStrategy">
                <option value="semantic">语义匹配（根据描述）</option>
                <option value="color">颜色相似度</option>
                <option value="mixed">混合策略</option>
              </select>
            </div>
          </div>
          
          <div class="modal-footer">
            <button onclick="mapApp.closeModal()" class="btn btn-secondary">取消</button>
            <button onclick="mapApp.executeAIFill()" class="btn btn-primary">开始填充</button>
          </div>
        </div>
      </div>
    `;
    
    document.getElementById('modalContainer').innerHTML = modalHtml;
  },
  
  // 显示AI生成地图模态框
  showAIGenerateModal() {
    const modalHtml = `
      <div class="modal" onclick="if(event.target === this) mapApp.closeModal()">
        <div class="modal-content" style="max-width: 600px;">
          <div class="modal-header">
            <h3>🎨 AI生成地图</h3>
            <button class="modal-close" onclick="mapApp.closeModal()">×</button>
          </div>
          
          <div class="modal-body">
            <p style="color: #666; margin-bottom: 1rem;">
              使用自然语言描述，AI将自动生成地图布局并使用您上传的Tile素材。
            </p>
            
            <div class="form-group">
              <label>地图描述</label>
              <textarea id="aiMapDescription" rows="6" 
                        placeholder="例如：有一条横亘东西的河流，河流上游住着A，房子很大，旁边种满了花朵。下游住着B和C，他们的房子比较小..."></textarea>
            </div>
            
            <div class="form-group">
              <label>地图尺寸</label>
              <div class="size-inputs">
                <input type="number" id="aiMapWidth" value="64" min="16" max="128">
                <span>×</span>
                <input type="number" id="aiMapHeight" value="64" min="16" max="128">
              </div>
            </div>
            
            <div class="form-group">
              <label>风格偏好</label>
              <select id="aiMapStyle">
                <option value="realistic">写实风格</option>
                <option value="abstract">抽象风格</option>
                <option value="dungeon">地牢风格</option>
                <option value="nature">自然风格</option>
              </select>
            </div>
          </div>
          
          <div class="modal-footer">
            <button onclick="mapApp.closeModal()" class="btn btn-secondary">取消</button>
            <button onclick="mapApp.executeAIGenerate()" class="btn btn-success">生成地图</button>
          </div>
        </div>
      </div>
    `;
    
    document.getElementById('modalContainer').innerHTML = modalHtml;
  },
  
  // 执行AI填充
  async executeAIFill() {
    const description = document.getElementById('aiFillDescription').value.trim();
    const keepBoundaries = document.getElementById('aiFillKeepBoundaries').checked;
    const strategy = document.getElementById('aiFillStrategy').value;
    
    if (!description) {
      alert('请输入填充说明');
      return;
    }
    
    if (this.tileSet.length === 0) {
      alert('请先上传Tile素材');
      return;
    }
    
    this.closeModal();
    
    // 显示加载提示
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'aiLoading';
    loadingDiv.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 10000; text-align: center;';
    loadingDiv.innerHTML = '<p style="margin: 0; font-size: 1.1rem;">🤖 AI正在分析地图...</p><p style="margin: 0.5rem 0 0 0; color: #666; font-size: 0.9rem;">这可能需要几秒钟</p>';
    document.body.appendChild(loadingDiv);
    
    try {
      // 准备Tile数据（不包含image对象，只发送基本信息）
      const tileSetData = this.tileSet.map(t => ({
        name: t.name,
        width: t.width,
        height: t.height
      }));
      
      // 调用API
      const response = await fetch('/api/map-creator/ai-fill', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          description,
          strategy,
          grid: this.grid,
          tileSet: tileSetData,
          regions: this.regions,
          tileTypes: this.tileTypes
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        // 应用映射
        for (let y = 0; y < this.mapHeight; y++) {
          for (let x = 0; x < this.mapWidth; x++) {
            const cell = this.grid[y][x];
            const tileTypeId = cell.tileId.toString();
            
            if (result.mapping[tileTypeId] !== undefined) {
              const tileIndex = result.mapping[tileTypeId];
              const tile = this.tileSet[tileIndex];
              if (tile) {
                cell.tileRef = tile.id;
              }
            }
          }
        }
        
        this.render();
        this.saveHistory();
        
        // 显示结果
        alert(`✅ AI填充完成！\n\n${result.reasoning}\n\n建议：\n${result.suggestions.join('\n')}`);
      } else {
        alert(`❌ AI填充失败：${result.error}`);
      }
      
    } catch (error) {
      console.error('AI填充错误:', error);
      alert(`❌ AI填充失败：${error.message}`);
    } finally {
      const loading = document.getElementById('aiLoading');
      if (loading) loading.remove();
    }
  },
  
  // 显示加载地图模态框
  async showLoadMapModal() {
    const modal = this.createModal('loadMapModal', '📂 加载已保存的地图');
    modal.innerHTML = `
      <div class="modal-content">
        <div id="savedMapsList" class="saved-maps-list">
          <div class="loading-hint">🔄 加载中...</div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    
    // 加载地图列表
    try {
      const response = await fetch('/api/map-creator/saved-maps');
      const result = await response.json();
      
      const listContainer = document.getElementById('savedMapsList');
      
      if (result.success && result.maps && result.maps.length > 0) {
        listContainer.innerHTML = result.maps.map(map => `
          <div class="saved-map-item" onclick="mapApp.loadSavedMap('${map.path}')">
            <div class="map-info">
              <div class="map-title">${map.metadata?.description || map.filename}</div>
              <div class="map-meta">
                尺寸: ${map.metadata?.width || '?'}×${map.metadata?.height || '?'} | 
                Tile类型: ${map.tileTypesCount} | 
                ${new Date(map.created).toLocaleString('zh-CN')}
              </div>
            </div>
            <div class="map-actions">
              <button class="btn-icon" title="加载此地图">📂</button>
            </div>
          </div>
        `).join('');
      } else {
        listContainer.innerHTML = '<div class="empty-hint">暂无已保存的地图</div>';
      }
    } catch (error) {
      console.error('加载地图列表失败:', error);
      const listContainer = document.getElementById('savedMapsList');
      listContainer.innerHTML = '<div class="error-hint">❌ 加载失败，请稍后重试</div>';
    }
  },
  
  // 加载已保存的地图
  async loadSavedMap(path) {
    try {
      console.log('📂 加载地图:', path);
      const response = await fetch(path);
      const data = await response.json();
      
      if (!data.success) {
        alert('❌ 地图文件格式错误');
        return;
      }
      
      // 关闭模态框
      const modal = document.getElementById('loadMapModal');
      if (modal) modal.remove();
      
      // 应用地图数据
      const width = data.metadata?.width || data.layout[0]?.length || this.width;
      const height = data.metadata?.height || data.layout?.length || this.height;
      
      // 调整地图尺寸
      this.resizeMap(width, height);
      
      // 合并TileTypes
      if (data.tileTypes && data.tileTypes.length > 0) {
        data.tileTypes.forEach(newType => {
          const exists = this.tileTypes.find(t => t.id === newType.id);
          if (!exists) {
            this.tileTypes.push(newType);
          }
        });
        this.renderTileTypesPanel();
      }
      
      // 应用layout
      if (data.layout && Array.isArray(data.layout)) {
        for (let y = 0; y < height && y < data.layout.length; y++) {
          for (let x = 0; x < width && x < data.layout[y].length; x++) {
            const tileId = data.layout[y][x];
            this.grid[y][x].tileId = tileId;
            this.grid[y][x].tileRef = null; // 使用颜色
          }
        }
      }
      
      // 清除历史并保存新状态
      this.clearHistory();
      this.saveHistory();
      
      // 渲染
      this.render();
      
      const desc = data.metadata?.description || '地图';
      alert(`✅ 地图加载成功！\n\n${desc}\n\n尺寸: ${width}×${height}\nTile类型: ${data.tileTypes?.length || 0}`);
      
      console.log('✅ 地图加载完成');
    } catch (error) {
      console.error('❌ 加载地图失败:', error);
      alert(`❌ 加载地图失败：${error.message}`);
    }
  },
  
  // 执行AI生成
  async executeAIGenerate() {
    const description = document.getElementById('aiMapDescription').value.trim();
    const width = parseInt(document.getElementById('aiMapWidth').value);
    const height = parseInt(document.getElementById('aiMapHeight').value);
    const style = document.getElementById('aiMapStyle').value;
    
    console.log('========== AI地图生成开始 ==========');
    console.log('用户描述:', description);
    console.log('地图尺寸:', width, 'x', height);
    console.log('风格:', style);
    
    if (!description) {
      alert('请输入地图描述');
      return;
    }
    
    // Tile素材不是必需的，可以使用颜色生成
    const hasTiles = this.tileSet.length > 0;
    console.log('是否有Tile素材:', hasTiles, '数量:', this.tileSet.length);
    
    this.closeModal();
    
    // 显示加载提示
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'aiLoading';
    loadingDiv.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 10000; text-align: center; min-width: 300px;';
    loadingDiv.innerHTML = '<p style="margin: 0; font-size: 1.1rem;">🎨 AI正在生成地图...</p><p style="margin: 0.5rem 0 0 0; color: #666; font-size: 0.9rem;">这可能需要10-30秒</p>';
    document.body.appendChild(loadingDiv);
    
    try {
      // 准备Tile数据
      const tileSetData = this.tileSet.map(t => ({
        name: t.name,
        width: t.width,
        height: t.height
      }));
      
      const requestBody = {
        description,
        width,
        height,
        style,
        tileSet: hasTiles ? tileSetData : null
      };
      
      console.log('📤 发送API请求到 /api/map-creator/ai-generate');
      console.log('请求体:', JSON.stringify(requestBody, null, 2));
      const startTime = Date.now();
      
      // 调用API
      const response = await fetch('/api/map-creator/ai-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      const elapsed = Date.now() - startTime;
      console.log(`📥 收到API响应 (耗时: ${elapsed}ms)`);
      console.log('响应状态:', response.status, response.statusText);
      
      const result = await response.json();
      console.log('📊 API返回结果:', result);
      
      if (result.success) {
        console.log('✅ AI生成成功，开始应用到地图');
        
        // 重新初始化地图
        this.mapWidth = width;
        this.mapHeight = height;
        console.log('- 地图尺寸已更新:', width, 'x', height);
        
        // 如果AI返回了新的tileTypes，合并到现有的
        if (result.tileTypes && result.tileTypes.length > 0) {
          console.log('- 合并TileTypes:', result.tileTypes.length, '个');
          const existingIds = this.tileTypes.map(t => t.id);
          let addedCount = 0;
          result.tileTypes.forEach(newType => {
            if (!existingIds.includes(newType.id)) {
              this.tileTypes.push(newType);
              addedCount++;
            }
          });
          console.log('- 新增TileTypes:', addedCount, '个');
          this.renderTileTypes();
        }
        
        console.log('- 应用地图布局...');
        console.log('- Layout数据结构:', Array.isArray(result.layout), '行数:', result.layout?.length);
        
        if (!result.layout || !Array.isArray(result.layout)) {
          throw new Error('Layout数据格式错误');
        }
        
        // 应用生成的布局（总是使用颜色，不直接用Tile）
        this.grid = Array(height).fill(null).map((_, y) => 
          Array(width).fill(null).map((_, x) => {
            const value = result.layout[y][x];
            // value是tileTypeId，使用颜色模板
            return {
              tileId: value || 1,
              tileRef: null
            };
          })
        );
        console.log('- 布局应用完成');
        console.log('- Grid前3行预览:');
        for (let i = 0; i < Math.min(3, height); i++) {
          console.log(`  行${i}:`, this.grid[i].slice(0, 10).map(c => c.tileId).join(','), '...');
        }
        
        // 应用生成的区域
        if (result.regions && result.regions.length > 0) {
          console.log('- 应用区域定义:', result.regions.length, '个');
          this.regions = result.regions;
          this.renderRegionsList();
        }
        
        // 重新设置画布
        this.canvas.width = this.mapWidth * this.tileSize;
        this.canvas.height = this.mapHeight * this.tileSize;
        console.log('- 画布已重设');
        
        // 清除历史并保存新状态
        this.clearHistory();
        this.saveHistory();
        console.log('- 历史已保存');
        
        // 渲染
        this.render();
        console.log('- 地图已渲染');
        
        // 更新信息显示（如果元素存在）
        const mapInfoEl = document.getElementById('mapInfo');
        if (mapInfoEl) {
          mapInfoEl.textContent = `${width} × ${height}`;
        }
        
        // 显示结果
        const entityInfo = result.entities?.length > 0 
          ? `\n\n实体位置：\n${result.entities.map(e => `• ${e.name} (${e.x}, ${e.y}): ${e.description}`).join('\n')}`
          : '';
        
        const tileTypeCount = result.tileTypes?.length || 0;
        
        console.log('========== AI地图生成成功 ==========');
        console.log('- TileTypes数量:', tileTypeCount);
        console.log('- 区域数量:', result.regions?.length || 0);
        console.log('- 实体数量:', result.entities?.length || 0);
        
        alert(`✅ AI地图生成完成！\n\n${result.reasoning}${entityInfo}\n\n🎨 生成了 ${tileTypeCount} 种颜色类型\n（包含变体，如花1、花2、花3等）\n\n💡 下一步：\n1. 上传Tile素材\n2. 点击"颜色-Tile映射"为每种颜色指定Tile\n3. 一键应用映射，生成完整地图！`);
      } else {
        console.error('❌ AI生成失败:', result.error);
        alert(`❌ AI生成失败：${result.error}`);
      }
      
    } catch (error) {
      console.error('❌ AI生成异常:');
      console.error('- 错误类型:', error.constructor?.name);
      console.error('- 错误消息:', error.message);
      console.error('- 错误堆栈:', error.stack);
      alert(`❌ AI生成失败：${error.message}`);
    } finally {
      const loading = document.getElementById('aiLoading');
      if (loading) loading.remove();
      console.log('========== AI地图生成流程结束 ==========\n');
    }
  },
  
  // ========== 颜色-Tile映射功能 ==========
  
  // 显示Tile映射面板
  showTileMappingPanel() {
    // 隐藏其他面板
    document.getElementById('regionDetailPanel').style.display = 'none';
    
    // 显示映射面板
    document.getElementById('tileMappingPanel').style.display = 'block';
    
    // 渲染映射列表
    this.renderColorMappingList();
  },
  
  // 关闭Tile映射面板
  closeTileMappingPanel() {
    document.getElementById('tileMappingPanel').style.display = 'none';
  },
  
  // 渲染颜色映射列表
  renderColorMappingList() {
    const container = document.getElementById('colorMappingList');
    
    // 统计每种颜色的使用次数
    const colorStats = {};
    for (let y = 0; y < this.mapHeight; y++) {
      for (let x = 0; x < this.mapWidth; x++) {
        const tileId = this.grid[y][x].tileId;
        colorStats[tileId] = (colorStats[tileId] || 0) + 1;
      }
    }
    
    // 生成列表HTML
    const items = this.tileTypes
      .filter(type => colorStats[type.id] > 0)
      .map(type => {
        const count = colorStats[type.id];
        const percentage = ((count / (this.mapWidth * this.mapHeight)) * 100).toFixed(1);
        const mappedTile = this.colorTileMapping[type.id];
        const tile = mappedTile ? this.tileSet.find(t => t.id === mappedTile) : null;
        
        return `
          <div class="color-mapping-item">
            <div class="color-preview" style="background-color: ${type.color}"></div>
            <div class="color-info">
              <p class="color-name">${type.name}</p>
              <p class="color-stats">${count} 格 (${percentage}%)</p>
            </div>
            <div class="tile-selector ${tile ? 'has-tile' : ''}" 
                 onclick="mapApp.selectTileForColor(${type.id})"
                 title="点击选择Tile">
              ${tile ? `
                <img src="${tile.dataURL}" alt="${tile.name}">
                <button class="tile-selector-remove" 
                        onclick="event.stopPropagation(); mapApp.removeTileMapping(${type.id})">×</button>
              ` : `
                <span class="tile-selector-placeholder">+</span>
              `}
            </div>
          </div>
        `;
      }).join('');
    
    if (items) {
      container.innerHTML = items;
    } else {
      container.innerHTML = '<p style="text-align: center; color: #999; padding: 2rem;">地图中没有使用任何颜色</p>';
    }
  },
  
  // 为颜色选择Tile
  selectTileForColor(tileTypeId) {
    if (this.tileSet.length === 0) {
      alert('请先上传Tile素材');
      return;
    }
    
    // 显示Tile选择器
    const modalHtml = `
      <div class="modal" onclick="if(event.target === this) mapApp.closeModal()">
        <div class="modal-content" style="max-width: 600px;">
          <div class="modal-header">
            <h3>选择Tile</h3>
            <button class="modal-close" onclick="mapApp.closeModal()">×</button>
          </div>
          
          <div class="modal-body">
            <p style="color: #666; margin-bottom: 1rem;">
              为 <strong style="color: ${this.tileTypes.find(t => t.id === tileTypeId).color}">${this.tileTypes.find(t => t.id === tileTypeId).name}</strong> 选择对应的Tile
            </p>
            
            <div class="tile-set-list" style="max-height: 400px;">
              ${this.tileSet.map(tile => `
                <div class="tile-item" 
                     onclick="mapApp.setTileMapping(${tileTypeId}, '${tile.id}')"
                     title="${tile.name}">
                  <img src="${tile.dataURL}" alt="${tile.name}">
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.getElementById('modalContainer').innerHTML = modalHtml;
  },
  
  // 设置映射
  setTileMapping(tileTypeId, tileId) {
    this.colorTileMapping[tileTypeId] = tileId;
    this.closeModal();
    this.renderColorMappingList();
    console.log('设置映射:', tileTypeId, '->', tileId);
  },
  
  // 移除映射
  removeTileMapping(tileTypeId) {
    delete this.colorTileMapping[tileTypeId];
    this.renderColorMappingList();
    console.log('移除映射:', tileTypeId);
  },
  
  // 应用Tile映射到地图
  applyTileMapping() {
    const mappingCount = Object.keys(this.colorTileMapping).length;
    
    if (mappingCount === 0) {
      alert('请先设置颜色-Tile映射');
      return;
    }
    
    if (!confirm(`确定要应用映射到整个地图吗？\n已设置 ${mappingCount} 个映射`)) {
      return;
    }
    
    let appliedCount = 0;
    
    // 遍历地图，应用映射
    for (let y = 0; y < this.mapHeight; y++) {
      for (let x = 0; x < this.mapWidth; x++) {
        const cell = this.grid[y][x];
        const tileId = this.colorTileMapping[cell.tileId];
        
        if (tileId) {
          cell.tileRef = tileId;
          appliedCount++;
        }
      }
    }
    
    this.render();
    this.saveHistory();
    
    alert(`✅ 映射应用完成！\n替换了 ${appliedCount} 个格子`);
    console.log('应用映射完成:', appliedCount, '个格子');
  },
  
  // 清除所有映射
  clearTileMapping() {
    if (Object.keys(this.colorTileMapping).length === 0) {
      alert('当前没有设置任何映射');
      return;
    }
    
    if (!confirm('确定要清除所有映射吗？')) {
      return;
    }
    
    this.colorTileMapping = {};
    this.renderColorMappingList();
    alert('已清除所有映射');
  }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  mapApp.init();
});

