/**
 * 3D 生成任务路由
 */
import { FastifyInstance } from 'fastify';
import { sqlite } from '../db';

// API Keys (从环境变量读取)
const HUNYUAN_KEY = process.env.HUNYUAN_API_KEY || 'sk-iGhtF2OWBhhDG4YM5HoJRMzude75JQFjOWHkJlvErvpaGFH9';
const TOKENHUB_KEY = process.env.TOKENHUB_API_KEY || 'sk-F9AGW2A4HtiOSRE8jZONxXeBtKP7fv1lpnuKfs84dXDYJlNW';

let pollingTimer: ReturnType<typeof setInterval> | null = null;

export function jobRoutes(app: FastifyInstance) {
  // 提交 3D 生成任务
  app.post('/api/jobs/submit', async (req, reply) => {
    const { materialId, prompt, backend = 'hunyuan' } = req.body as any;
    if (!materialId || !prompt) return reply.status(400).send({ error: '缺少 materialId 或 prompt' });

    try {
      const jobId = backend === 'tokenhub'
        ? await submitTokenhub(prompt)
        : await submitHunyuan(prompt);

      if (!jobId) return reply.status(500).send({ error: '提交失败' });

      const now = Date.now();
      sqlite.prepare(`INSERT INTO jobs (job_id, material_id, prompt, status, backend, created_at, updated_at)
        VALUES (?, ?, ?, 'pending', ?, ?, ?)`).run(jobId, materialId, prompt, backend, now, now);

      startPolling();
      return reply.send({ success: true, jobId });
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });

  // 查询任务状态
  app.get<{ Params: { jobId: string } }>('/api/jobs/:jobId', async (req, reply) => {
    const row = sqlite.prepare('SELECT * FROM jobs WHERE job_id = ?').get(req.params.jobId);
    if (!row) return reply.status(404).send({ error: 'not found' });
    return reply.send(normalizeJob(row));
  });

  // 活跃任务
  app.get('/api/jobs/active', async (_req, reply) => {
    const rows = sqlite.prepare("SELECT * FROM jobs WHERE status IN ('pending','processing')").all();
    return reply.send(rows.map(normalizeJob));
  });

  // 某物料的已完成任务
  app.get<{ Querystring: { materialId: string } }>('/api/jobs/completed', async (req, reply) => {
    const row = sqlite.prepare(
      'SELECT * FROM jobs WHERE material_id = ? AND status = ? ORDER BY updated_at DESC LIMIT 1'
    ).get(req.query.materialId, 'completed');
    return reply.send(row ? normalizeJob(row) : null);
  });
}

// ── 内部 ─────────────────────────────────────────────────

async function submitHunyuan(prompt: string): Promise<string | null> {
  const r = await fetch('https://api.ai3d.cloud.tencent.com/v1/ai3d/submit', {
    method: 'POST',
    headers: { 'Authorization': HUNYUAN_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ Prompt: prompt, Model: '3.1' }),
  });
  if (!r.ok) return null;
  const data = await r.json() as any;
  return data?.Response?.JobId || null;
}

async function submitTokenhub(prompt: string): Promise<string | null> {
  const r = await fetch('https://tokenhub.tencentmaas.com/v1/api/3d/submit', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${TOKENHUB_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'hy-3d-3.0', prompt }),
  });
  if (!r.ok) return null;
  const data = await r.json() as any;
  return data?.id || null;
}

function startPolling() {
  if (pollingTimer) return;
  pollingTimer = setInterval(async () => {
    const rows: any[] = sqlite.prepare("SELECT * FROM jobs WHERE status IN ('pending','processing')").all();
    if (rows.length === 0) { clearInterval(pollingTimer!); pollingTimer = null; return; }

    for (const job of rows) {
      try {
        const url = job.backend === 'tokenhub'
          ? { q: 'https://tokenhub.tencentmaas.com/v1/api/3d/query', b: { model: 'hy-3d-3.0', id: job.job_id }, key: `Bearer ${TOKENHUB_KEY}` }
          : { q: 'https://api.ai3d.cloud.tencent.com/v1/ai3d/query', b: { JobId: job.job_id }, key: HUNYUAN_KEY };

        const r = await fetch(url.q, {
          method: 'POST',
          headers: { 'Authorization': url.key, 'Content-Type': 'application/json' },
          body: JSON.stringify(url.b),
        });
        if (!r.ok) continue;
        const data = await r.json() as any;

        const status = (data?.Response?.Status || data?.status || '').toLowerCase();
        if (status === 'done' || status === 'completed' || status === 'success') {
          const files = data?.Response?.ResultFile3Ds || data?.result_file_3ds || [];
          const glb = files.find((f: any) => (f.Type || f.type || '').toUpperCase() === 'GLB');
          const modelUrl = glb?.Url || glb?.url || data?.ModelUrl || data?.model_url;
          const previewUrl = glb?.PreviewImageUrl || glb?.preview_image_url;

          // 更新物料
          sqlite.prepare(`UPDATE materials SET model_url = ?, image_url = ?, source = 'ai-3d', updated_at = ? WHERE id = ?`)
            .run(modelUrl || '', previewUrl || '', Date.now(), job.material_id);

          sqlite.prepare(`UPDATE jobs SET status = 'completed', updated_at = ? WHERE job_id = ?`)
            .run(Date.now(), job.job_id);
        } else if (status === 'failed' || status === 'error') {
          sqlite.prepare(`UPDATE jobs SET status = 'failed', error = ?, updated_at = ? WHERE job_id = ?`)
            .run(data?.Response?.ErrorMessage || data?.error || '未知错误', Date.now(), job.job_id);
        }
      } catch {}
    }
  }, 8000);
}

// 服务启动时恢复轮询
startPolling();

function normalizeJob(row: any) {
  return {
    jobId: row.job_id,
    materialId: row.material_id,
    prompt: row.prompt,
    status: row.status,
    backend: row.backend,
    error: row.error,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
