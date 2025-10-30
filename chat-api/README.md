# Chat API

提供创建剧情和NPC的核心功能，可以在任何地方独立使用。

## 目录结构

```
chat-api/
├── index.ts          # 统一导出（主入口）
├── types.ts          # TypeScript类型定义
├── utils.ts          # 工具函数
├── createStory.ts    # 创建剧情API
├── createNPC.ts      # 创建NPC API
└── README.md         # 说明文档
```

## 快速开始

### 1. 导入API

```typescript
import { 
  createStory, 
  createNPC, 
  createNPCs 
} from '~/chat-api';
```

### 2. 创建剧情

```typescript
import { getDB } from '~/server/utils/db';
import { createStory } from '~/chat-api';

const db = getDB();

const result = createStory(db, {
  name: '公司内斗',
  description: '一场办公室权力游戏',
  eventBackground: '某互联网公司即将上市，三位高管开始争夺CEO位置...',
  dialogueDensity: 3,
  avatar: '🏢',
  creatorId: userId
});

if (result.success) {
  console.log('房间ID:', result.roomId);
}
```

### 3. 创建NPC

#### 单个NPC

```typescript
import { createNPC } from '~/chat-api';

const result = createNPC(db, roomId, {
  name: '李明',
  avatar: 'https://example.com/avatar.jpg',
  profile: '技术总监，性格沉稳，擅长产品和研发'
});
```

#### 批量创建NPC

```typescript
import { createNPCs } from '~/chat-api';

const npcs = [
  {
    name: '张华',
    profile: '运营总监，善于沟通协调'
  },
  {
    name: '王芳',
    profile: '销售总监，业绩出色'
  }
];

const result = createNPCs(db, roomId, npcs);
console.log(`成功创建${result.created}个NPC`);
```

## API文档

### 剧情相关

#### `createStory(db, story)`

创建新剧情/房间。

**参数：**
- `db`: 数据库实例
- `story`: 剧情对象
  - `name` (必需): 剧情名称
  - `eventBackground` (必需): 事件背景
  - `description` (可选): 剧情描述
  - `dialogueDensity` (可选): 对话密度，默认2
  - `avatar` (可选): 剧情图标，默认'聊'
  - `presetId` (可选): 预设ID
  - `creatorId` (可选): 创建者ID

**返回：**
```typescript
{
  success: boolean,
  roomId?: string,
  error?: string
}
```

#### `storyExists(db, roomId)`

检查房间是否存在。

#### `getStory(db, roomId)`

获取房间详细信息。

### NPC相关

#### `createNPC(db, roomId, npc)`

创建单个NPC。

**参数：**
- `db`: 数据库实例
- `roomId`: 房间ID
- `npc`: NPC对象
  - `name` (必需): 角色名称
  - `profile` (必需): 角色人设
  - `avatar` (可选): 头像URL或Base64

**返回：**
```typescript
{
  success: boolean,
  npcId?: number,
  error?: string
}
```

#### `createNPCs(db, roomId, npcs)`

批量创建NPC。

**返回：**
```typescript
{
  success: boolean,
  created: number,
  failed: number,
  errors: string[]
}
```

#### `getRoomNPCs(db, roomId)`

获取房间的所有NPC。

#### `deleteNPC(db, npcId)`

删除指定NPC。

#### `updateNPC(db, npcId, updates)`

更新NPC信息。

**参数：**
- `updates`: 部分NPC字段
  ```typescript
  {
    name?: string,
    avatar?: string,
    profile?: string
  }
  ```

### 工具函数

#### `generateRoomId()`

生成6位随机房间ID。

#### `validateNPC(npc)`

验证NPC数据是否完整。

#### `validateStory(story)`

验证剧情数据是否完整。

#### `filterValidNPCs(npcs)`

过滤出有效的NPC列表。

## 使用示例

### 在Nuxt API中使用

```typescript
// server/api/my-custom-create.post.ts
import { getDB } from '~/server/utils/db';
import { createStory, createNPCs } from '~/chat-api';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const db = getDB();
  
  // 创建剧情
  const storyResult = createStory(db, {
    name: body.name,
    eventBackground: body.background,
    creatorId: body.userId
  });
  
  if (!storyResult.success) {
    return { error: storyResult.error };
  }
  
  // 创建NPC
  const npcResult = createNPCs(db, storyResult.roomId!, body.npcs);
  
  return {
    roomId: storyResult.roomId,
    npcsCreated: npcResult.created
  };
});
```

### 在其他Node.js脚本中使用

```typescript
// scripts/seed-data.ts
import { getDB } from '../server/utils/db';
import { createStory, createNPCs } from '../chat-api';

const db = getDB();

// 批量创建预设剧情
const presets = [
  {
    name: '职场风云',
    eventBackground: '某公司权力斗争...',
    npcs: [
      { name: 'CEO', profile: '雷厉风行的领导者' },
      { name: 'CTO', profile: '技术天才但不善交际' }
    ]
  },
  // ... more presets
];

for (const preset of presets) {
  const story = createStory(db, {
    name: preset.name,
    eventBackground: preset.eventBackground,
    presetId: `PRESET_${Date.now()}`
  });
  
  if (story.success) {
    createNPCs(db, story.roomId!, preset.npcs);
  }
}
```

## 注意事项

1. **数据库依赖**：所有函数都需要传入数据库实例
2. **事务处理**：如果需要事务，请在调用前后手动处理
3. **错误处理**：所有函数都会捕获错误并返回友好的错误信息
4. **类型安全**：完整的TypeScript类型定义，享受IDE智能提示

## 扩展性

这个API设计为独立模块，可以轻松：
- 在其他项目中复用
- 添加新的功能（如AI对话生成）
- 与其他数据库适配器集成
- 发布为npm包

## License

MIT

