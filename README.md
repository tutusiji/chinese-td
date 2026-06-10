# Chinese TD

中国古代题材塔防游戏原型，包含防守模式、攻城模式、物料管理、2D 图像生成和 3D 模型生成代理。

## 功能概览

- 多地图塔防玩法: 雁门、剑门、山海等地图配置。
- 双模式: 防守模式和攻城模式。
- 防御塔: 箭塔、炮台、冰塔，以及扩展投石车、火箭塔物料。
- 敌人: 刀兵、枪兵、骑兵、炮兵、大力士、巫师、攻城车、投石车。
- 渲染: Pixi 等距 2D 场景和 Three.js 3D 模型预览。
- 物料系统: SQLite 存储物料、生成任务和存档。
- AI 生成: 服务端代理 2D 图像生成、混元 3D 和 TokenHub 3D。
- 生产部署: Fastify 托管 Vite 构建产物，pm2 管理进程。

## 技术栈

- 前端: Vite、TypeScript、Pixi.js、Three.js
- 服务端: Fastify、better-sqlite3、dotenv
- 数据库: SQLite
- 部署: Node.js、npm、pm2

## 本地开发

安装依赖:

```bash
npm install
```

创建本地环境变量:

```bash
cp .env.example .env
```

按需填写 `.env`:

```bash
PORT=3001
DRAW_API_KEY=replace-with-draw-api-key
HUNYUAN_API_KEY=replace-with-hunyuan-api-key
TOKENHUB_API_KEY=replace-with-tokenhub-api-key
```

启动前后端开发服务:

```bash
npm run dev:all
```

默认地址:

- Vite 前端: `http://localhost:3000`
- Fastify API: `http://localhost:3001`

## 生产构建

```bash
npm run build
npm start
```

生产模式下 Fastify 会托管 `dist` 目录，并继续提供 `/api/*` 接口。

## 环境变量

| 变量 | 必填 | 说明 |
| --- | --- | --- |
| `PORT` | 否 | 服务端监听端口，默认 `3001` |
| `DRAW_API_KEY` | 使用 2D 生成时必填 | 2D 图像生成服务 key |
| `HUNYUAN_API_KEY` | 使用混元 3D 时必填 | 腾讯混元 3D 直连接口 key |
| `TOKENHUB_API_KEY` | 使用 TokenHub 3D 时必填 | TokenHub 兼容接口 key |

真实 key 只能保存到本地 `.env`、服务器 `/opt/chinese-td/.env` 或密钥管理服务。不要提交真实 key 到 GitHub。

## 部署到 huoshan

目标:

- 服务器: `huoshan`
- 目录: `/opt/chinese-td`
- 端口: `7501`
- 进程名: `chinese-td`

部署命令:

```bash
ssh huoshan
cd /opt/chinese-td
git fetch origin main
git reset --hard origin/main
npm ci
npm run build
pm2 delete chinese-td || true
PORT=7501 pm2 start npm --name chinese-td -- start
pm2 save
```

检查:

```bash
pm2 status chinese-td
curl http://127.0.0.1:7501/api/health
```

## 文档

- [架构设计](docs/architecture.md)
- [开发版本计划](docs/version-plan.md)
- [物料设计](docs/material-design.md)
- [生成工具与密钥管理](docs/tools.md)

## Git 安全规则

- `.env`、`.env.*`、SQLite WAL/SHM 文件和构建产物不提交。
- `.env.example` 可以提交，但只能包含占位符。
- 代码中不能写入真实 API Key、Secret ID、Secret Key 或 Token。
- 如果 GitHub push protection 拦截提交，先清理敏感内容并重写提交，再重新推送。
