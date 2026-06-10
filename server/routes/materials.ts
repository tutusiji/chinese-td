/**
 * 物料管理路由
 */
import { FastifyInstance } from 'fastify';
import { sqlite } from '../db';

export function materialRoutes(app: FastifyInstance) {
  // 列表
  app.get('/api/materials', async (_req, reply) => {
    const rows = sqlite.prepare('SELECT * FROM materials ORDER BY category, created_at').all();
    return reply.send(rows.map(normalize));
  });

  // 按分类
  app.get<{ Params: { category: string } }>('/api/materials/category/:category', async (req, reply) => {
    const rows = sqlite.prepare('SELECT * FROM materials WHERE category = ? ORDER BY created_at').all(req.params.category);
    return reply.send(rows.map(normalize));
  });

  // 单个
  app.get<{ Params: { id: string } }>('/api/materials/:id', async (req, reply) => {
    const row = sqlite.prepare('SELECT * FROM materials WHERE id = ?').get(req.params.id);
    if (!row) return reply.status(404).send({ error: 'not found' });
    return reply.send(normalize(row));
  });

  // 更新
  app.put<{ Params: { id: string } }>('/api/materials/:id', async (req, reply) => {
    const body = req.body as any;
    const now = Date.now();
    sqlite.prepare(`
      INSERT INTO materials (id, name, category, level, source, prompt, description, entity_type, image_url, model_url, skeleton_actions, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name=excluded.name, category=excluded.category, level=excluded.level,
        source=excluded.source, prompt=excluded.prompt, description=excluded.description,
        entity_type=excluded.entity_type, image_url=excluded.image_url, model_url=excluded.model_url,
        skeleton_actions=excluded.skeleton_actions, updated_at=excluded.updated_at
    `).run(
      body.id || req.params.id, body.name, body.category, body.level, body.source,
      body.prompt, body.description, body.entityType || body.entity_type,
      body.imageUrl || body.image_url, body.modelUrl || body.model_url,
      JSON.stringify(body.skeletonActions || body.skeleton_actions || []),
      body.createdAt || body.created_at || now, now,
    );
    return reply.send({ success: true });
  });

  // 删除
  app.delete<{ Params: { id: string } }>('/api/materials/:id', async (req, reply) => {
    sqlite.prepare('DELETE FROM materials WHERE id = ?').run(req.params.id);
    return reply.send({ success: true });
  });

  // 重置
  app.post('/api/materials/reset', async (_req, reply) => {
    sqlite.prepare('DELETE FROM materials').run();
    // 重新运行初始化插入
    const { initSchema } = await import('../db');
    initSchema();
    return reply.send({ success: true });
  });
}

/** 转 camelCase 给前端 */
function normalize(row: any) {
  if (!row) return row;
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    level: row.level,
    source: row.source,
    prompt: row.prompt,
    description: row.description,
    entityType: row.entity_type,
    imageUrl: row.image_url,
    modelUrl: row.model_url,
    skeletonActions: row.skeleton_actions ? JSON.parse(row.skeleton_actions) : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
