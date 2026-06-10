/**
 * AI API 代理路由 — 2D 图像生成 + 3D 模型生成
 * 所有 API Key 服务端持有，前端不感知
 */
import { FastifyInstance } from 'fastify';

function getRequiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`服务端缺少环境变量 ${name}`);
  }
  return value;
}

export function proxyRoutes(app: FastifyInstance) {
  // 2D 图像生成 — images/generations
  app.post('/api/proxy/2d/images', async (req, reply) => {
    const { prompt, model = 'nano-banana-2' } = req.body as any;
    if (!prompt) return reply.status(400).send({ error: '缺少 prompt' });

    try {
      const drawKey = getRequiredEnv('DRAW_API_KEY');
      const r = await fetch('https://www.right.codes/draw/v1/images/generations', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${drawKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, prompt, n: 1, size: '1024x1024', response_format: 'b64_json' }),
      });
      const data = await r.json() as any;
      return reply.send(data);
    } catch (err: any) {
      const status = err.message?.includes('环境变量') ? 503 : 500;
      return reply.status(status).send({ error: err.message });
    }
  });

  // 2D 回退 — chat/completions
  app.post('/api/proxy/2d/chat', async (req, reply) => {
    const { prompt, model = 'nano-banana-2' } = req.body as any;
    if (!prompt) return reply.status(400).send({ error: '缺少 prompt' });

    try {
      const drawKey = getRequiredEnv('DRAW_API_KEY');
      const r = await fetch('https://www.right.codes/draw/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${drawKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], max_tokens: 4096 }),
      });
      const data = await r.json() as any;
      return reply.send(data);
    } catch (err: any) {
      const status = err.message?.includes('环境变量') ? 503 : 500;
      return reply.status(status).send({ error: err.message });
    }
  });

  // 3D 生成 — 混元直连
  app.post('/api/proxy/3d/submit', async (req, reply) => {
    const { prompt } = req.body as any;
    if (!prompt) return reply.status(400).send({ error: '缺少 prompt' });

    try {
      const hunyuanKey = getRequiredEnv('HUNYUAN_API_KEY');
      const r = await fetch('https://api.ai3d.cloud.tencent.com/v1/ai3d/submit', {
        method: 'POST',
        headers: { 'Authorization': hunyuanKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ Prompt: prompt, Model: '3.1' }),
      });
      const data = await r.json() as any;
      return reply.send(data);
    } catch (err: any) {
      const status = err.message?.includes('环境变量') ? 503 : 500;
      return reply.status(status).send({ error: err.message });
    }
  });

  app.post('/api/proxy/3d/query', async (req, reply) => {
    const { jobId } = req.body as any;
    if (!jobId) return reply.status(400).send({ error: '缺少 jobId' });

    try {
      const hunyuanKey = getRequiredEnv('HUNYUAN_API_KEY');
      const r = await fetch('https://api.ai3d.cloud.tencent.com/v1/ai3d/query', {
        method: 'POST',
        headers: { 'Authorization': hunyuanKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ JobId: jobId }),
      });
      const data = await r.json() as any;
      return reply.send(data);
    } catch (err: any) {
      const status = err.message?.includes('环境变量') ? 503 : 500;
      return reply.status(status).send({ error: err.message });
    }
  });
}
