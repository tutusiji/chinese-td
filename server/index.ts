/**
 * 墨守 — Fastify 服务端
 *
 * 提供:
 *  - SQLite 数据库 (物料/任务/存档/用户/排行榜)
 *  - RESTful API
 *  - AI API 代理 (2D/3D)
 *  - 生产环境静态文件服务
 */
import 'dotenv/config';
import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { fileURLToPath } from 'url';
import { initSchema } from './db';
import { materialRoutes } from './routes/materials';
import { jobRoutes } from './routes/jobs';
import { saveRoutes } from './routes/saves';
import { proxyRoutes } from './routes/proxy';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '3001');

async function main() {
  // 初始化数据库
  initSchema();

  const app = Fastify({ logger: false });

  // CORS (开发时 Vite 在不同端口)
  app.addHook('onRequest', async (req, reply) => {
    reply.header('Access-Control-Allow-Origin', '*');
    reply.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return reply.status(200).send();
  });

  // API 路由
  materialRoutes(app);
  jobRoutes(app);
  saveRoutes(app);
  proxyRoutes(app);

  // 健康检查
  app.get('/api/health', async () => ({ ok: true }));

  // 生产环境: 托管 Vite build 产物
  const distPath = path.resolve(__dirname, '..', 'dist');
  try {
    const fs = await import('node:fs');
    if (fs.existsSync(distPath)) {
      await app.register(fastifyStatic, {
        root: distPath,
        index: 'index.html',
      });

      // 单纯为 SPA 回退
      app.get('/*', async (_req, reply) => {
        const indexPath = path.join(distPath, 'index.html');
        if (fs.existsSync(indexPath)) {
          return reply.sendFile('index.html');
        }
        return reply.status(404).send('Not found');
      });
      console.log('[Server] 生产模式，托管:', distPath);
    }
  } catch {
    console.log('[Server] 开发模式 (Vite 托管前端)');
  }

  await app.listen({ port: PORT, host: '0.0.0.0' });
  console.log(`[Server] 墨守服务端运行在 http://localhost:${PORT}`);
}

main().catch(err => {
  console.error('[Server] 启动失败:', err);
  process.exit(1);
});
