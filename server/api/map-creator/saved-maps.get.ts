/**
 * 获取已保存的地图列表
 */
import { readdir, stat, readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export default defineEventHandler(async () => {
  try {
    const mapsDir = join(process.cwd(), 'public', 'map-creator', 'generated-maps')
    
    if (!existsSync(mapsDir)) {
      return { success: true, maps: [] }
    }
    
    const files = await readdir(mapsDir)
    const jsonFiles = files.filter(f => f.endsWith('.json'))
    
    const maps = await Promise.all(
      jsonFiles.map(async (filename) => {
        const filepath = join(mapsDir, filename)
        const stats = await stat(filepath)
        
        // 读取文件的metadata（不读取完整内容）
        try {
          const content = await readFile(filepath, 'utf-8')
          const data = JSON.parse(content)
          
          return {
            filename,
            path: `/map-creator/generated-maps/${filename}`,
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime,
            metadata: data.metadata || {
              width: data.layout?.[0]?.length || 0,
              height: data.layout?.length || 0,
              description: '未命名地图'
            },
            tileTypesCount: data.tileTypes?.length || 0
          }
        } catch (readError) {
          return {
            filename,
            path: `/map-creator/generated-maps/${filename}`,
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime,
            error: '无法读取文件信息'
          }
        }
      })
    )
    
    // 按创建时间倒序排列
    maps.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())
    
    return {
      success: true,
      maps
    }
    
  } catch (error: any) {
    console.error('获取地图列表失败:', error)
    return {
      success: false,
      error: error.message,
      maps: []
    }
  }
})

