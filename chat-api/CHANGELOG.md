# 📝 更新日志

## v2.0.0 - 游戏化角色系统 (2025-10-31)

### 🎮 重大更新

#### 移除功能
- ❌ 移除Prompt模板功能
- ❌ 简化为专注于角色创作的工具

#### 新增功能
- ✨ **游戏化角色属性系统**
  - 🎭 性格特点 (Personality)
  - 🏃 习惯 (Habits)
  - ⚔️ 技能 (Skills)
  - 💚 喜好 (Likes)
  - 💔 厌恶 (Dislikes)
  - 📅 年龄 (Age)
  - 💼 职业 (Occupation)
  - 📖 背景故事 (Background)
  - 🎯 目标/动机 (Goals)
  - 😨 恐惧 (Fears)

### 🔄 数据库变更

#### NPCs表新增字段
```sql
- personality TEXT    -- 性格特点
- habits TEXT         -- 习惯
- skills TEXT         -- 技能
- likes TEXT          -- 喜好
- dislikes TEXT       -- 厌恶
- age INTEGER         -- 年龄
- occupation TEXT     -- 职业
- background TEXT     -- 背景故事
- goals TEXT          -- 目标/动机
- fears TEXT          -- 恐惧
```

### 🎨 界面改进

#### NPC卡片显示
- 显示年龄和职业标签
- 展示性格、技能等属性
- 更好的视觉层次
- 属性标签带emoji图标

#### 创建表单
- 更详细的角色创建表单
- 分组布局（基础信息横排显示）
- 所有扩展属性均为可选
- 表单提示更友好

### 📊 统计更新
- 移除Prompt计数
- 简化为剧情和角色统计
- "NPC" 改为 "角色"

### 🔧 API变更

#### 移除的API
```
DELETE /api/stories/:id/prompts
DELETE /api/prompts/:id
POST   /api/stories/:id/prompts
PUT    /api/prompts/:id
GET    /api/stories/:id/prompts
```

#### 更新的API
```
POST /api/stories/:id/npcs
  - 新增多个可选字段支持

PUT /api/npcs/:id
  - 支持更新所有新字段

GET /api/stats
  - 移除totalPrompts
  - 保留totalStories和totalNPCs
```

#### 导出格式
```json
{
  "version": "2.0",  // 版本号更新
  "story": { ... },
  "npcs": [
    {
      "id": 1,
      "name": "艾莉娅",
      "age": 25,
      "occupation": "剑士",
      "personality": "勇敢、善良",
      "skills": "剑术、火焰魔法",
      "likes": "冒险、美食",
      "dislikes": "欺骗、黑暗",
      "background": "...",
      "goals": "...",
      "fears": "..."
    }
  ]
}
```

### 💡 使用建议

#### 创建游戏角色
1. 填写基础信息（名称、年龄、职业）
2. 添加核心人设
3. 选择性添加性格、技能等
4. 根据需要填写背景和目标

#### 属性使用技巧
- **必填项**: 名称、基本人设
- **推荐填写**: 性格、技能、喜好
- **可选填写**: 习惯、背景、目标、恐惧
- **组合使用**: 通过多个属性塑造立体角色

### 🎯 适用场景

- 🎮 **游戏开发** - RPG角色设计
- 📖 **小说创作** - 角色档案管理
- 🎭 **剧本创作** - 人物设定
- 🤖 **AI对话** - 角色扮演系统
- 🎨 **同人创作** - 角色二次创作

### 📚 示例角色

```javascript
{
  name: "艾莉娅·暮光",
  age: 25,
  occupation: "精灵游侠",
  avatar: "🏹",
  profile: "一位来自古老精灵王国的游侠，擅长弓箭和自然魔法",
  personality: "勇敢、善良但有些固执，对朋友极其忠诚",
  skills: "神箭手、自然魔法、追踪、隐匿",
  habits: "每天清晨在森林中冥想，喜欢收集各种草药",
  likes: "大自然、动物、星空、精灵音乐",
  dislikes: "破坏森林的行为、欺骗、黑暗魔法",
  background: "出生于月光森林，父母在兽人入侵时牺牲，被德鲁伊长老抚养长大",
  goals: "保护森林不受侵害，找到父母当年牺牲的真相",
  fears: "再次失去亲人，森林被彻底摧毁"
}
```

### ⚠️ 注意事项

#### 数据迁移
- 旧版本创建的NPC不受影响
- 新字段为NULL（可选）
- 建议手动补充新属性

#### 导出文件兼容性
- 新版本导出文件version为"2.0"
- 包含新的角色属性
- 旧版本可能无法识别新字段

### 🔮 未来计划

- [ ] 属性预设模板（战士、法师、盗贼等）
- [ ] 角色关系图谱
- [ ] 批量导入角色
- [ ] 角色属性可视化
- [ ] AI辅助生成角色属性

---

## v1.0.0 - 初始版本 (2025-10-30)

### 基础功能
- ✅ 剧情管理
- ✅ NPC管理
- ✅ Prompt模板管理
- ✅ 导出功能
- ✅ SQLite数据库
- ✅ Express API
- ✅ 前端界面

---

**当前版本**: v2.0.0  
**访问地址**: http://localhost:5001

