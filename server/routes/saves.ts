/**
 * 游戏存档路由
 */
import { FastifyInstance } from 'fastify';
import { sqlite } from '../db';

export function saveRoutes(app: FastifyInstance) {
  // 列表
  app.get('/api/saves', async (_req, reply) => {
    const rows = sqlite.prepare('SELECT * FROM saves ORDER BY updated_at DESC').all();
    return reply.send(rows.map(normalizeSave));
  });

  // 读取
  app.get<{ Params: { id: string } }>('/api/saves/:id', async (req, reply) => {
    const row = sqlite.prepare('SELECT * FROM saves WHERE id = ?').get(req.params.id);
    if (!row) return reply.status(404).send({ error: 'not found' });
    return reply.send(normalizeSave(row));
  });

  // 保存
  app.put<{ Params: { id: string } }>('/api/saves/:id', async (req, reply) => {
    const b = req.body as any;
    const now = Date.now();
    sqlite.prepare(`
      INSERT INTO saves (id, label, map_id, mode, gold, castle_hp, wave, wave_cd, spawned_count, total_spawned, game_speed, towers, attack_form, supply, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        label=excluded.label, map_id=excluded.map_id, mode=excluded.mode, gold=excluded.gold,
        castle_hp=excluded.castle_hp, wave=excluded.wave, wave_cd=excluded.wave_cd,
        spawned_count=excluded.spawned_count, total_spawned=excluded.total_spawned,
        game_speed=excluded.game_speed, towers=excluded.towers, attack_form=excluded.attack_form,
        supply=excluded.supply, updated_at=excluded.updated_at
    `).run(
      req.params.id, b.label || req.params.id, b.mapId || b.map_id, b.mode,
      b.gold ?? 0, b.castleHp ?? b.castle_hp ?? 20, b.wave ?? 0, b.waveCd ?? b.wave_cd ?? 0,
      b.spawnedCount ?? b.spawned_count ?? 0, b.totalSpawned ?? b.total_spawned ?? 0,
      b.gameSpeed ?? b.game_speed ?? 1, JSON.stringify(b.towers || []),
      JSON.stringify(b.attackFormation || b.attack_form || {}), b.supply ?? 200,
      now, now,
    );
    return reply.send({ success: true });
  });

  // 删除
  app.delete<{ Params: { id: string } }>('/api/saves/:id', async (req, reply) => {
    sqlite.prepare('DELETE FROM saves WHERE id = ?').run(req.params.id);
    return reply.send({ success: true });
  });
}

function normalizeSave(row: any) {
  return {
    id: row.id,
    label: row.label,
    mapId: row.map_id,
    mode: row.mode,
    gold: row.gold,
    castleHp: row.castle_hp,
    wave: row.wave,
    waveCd: row.wave_cd,
    spawnedCount: row.spawned_count,
    totalSpawned: row.total_spawned,
    gameSpeed: row.game_speed,
    towers: JSON.parse(row.towers || '[]'),
    attackFormation: JSON.parse(row.attack_form || '{}'),
    supply: row.supply,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
