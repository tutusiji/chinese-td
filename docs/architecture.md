# 架构设计

## 项目定位

`chinese-td` 是一款中国古代题材塔防原型，包含防守模式、攻城模式、物料管理、2D 图像生成和 3D 模型生成能力。前端负责游戏交互和渲染，服务端负责静态资源托管、SQLite 数据持久化、AI 生成代理和生成任务轮询。

## 总体结构

```text
chinese-td/
  index.html
  src/                    # 前端游戏、渲染、UI、配置
  server/                 # Fastify API、SQLite、AI 代理
  docs/                   # 项目设计与运维文档
  dist/                   # Vite 构建产物，不提交
  moshou.db               # SQLite 初始数据库
```

## 前端架构

前端入口是 `src/main.ts`，由 Vite 构建。核心模块分为四层:

- 游戏状态层: `src/store/GameStore.ts` 保存地图、单位、塔、子弹、波次、资源和模式状态。
- 游戏逻辑层: `src/engine/GameManager.ts` 推进波次、敌人移动、塔攻击、攻城 AI 和胜负判定。
- 渲染层: `src/render/*` 提供 Pixi 等距 2D 渲染和 Three.js 3D 预览/模型渲染。
- UI 层: `src/ui/*` 管理 HUD、关卡选择、物料目录、声音和物料生成交互。

配置数据放在 `src/config/*`，包括地图、关卡、敌人、塔、波次、物料和 UI 图集。类型定义集中在 `src/types/game.ts`。

## 服务端架构

服务端入口是 `server/index.ts`，使用 Fastify。生产环境下服务端托管 `dist`，同时提供 `/api/*` 接口。

主要路由:

- `server/routes/materials.ts`: 物料增删改查。
- `server/routes/jobs.ts`: 3D 生成任务提交、轮询、状态查询和物料回写。
- `server/routes/saves.ts`: 游戏存档。
- `server/routes/proxy.ts`: 2D 图像与 3D 模型生成代理。

`server/db.ts` 使用 `better-sqlite3` 初始化表结构。当前数据库覆盖物料、生成任务、存档、用户和排行榜预留表。

## 数据流

防守/攻城玩法数据流:

```text
用户输入 -> HUDManager -> GameStore -> GameManager -> Renderer -> 画面
```

物料生成数据流:

```text
MaterialManager -> MaterialAPI -> Fastify proxy/jobs -> 外部生成服务
                                     |
                                     v
                                  SQLite
                                     |
                                     v
                              MaterialManager 刷新
```

## 部署架构

当前部署目标是 `huoshan` 服务器 `/opt/chinese-td`，服务监听 `0.0.0.0:7501`，由 pm2 管理。

```text
GitHub main
   |
   v
/opt/chinese-td
   |
   +-- npm ci
   +-- npm run build
   +-- PORT=7501 pm2 start npm --name chinese-td -- start
```

服务器真实密钥存放在 `/opt/chinese-td/.env`，不进入 GitHub。仓库只提交 `.env.example`。

## 安全边界

- 前端永远不保存 API Key。
- 服务端从环境变量读取 `DRAW_API_KEY`、`HUNYUAN_API_KEY`、`TOKENHUB_API_KEY`。
- `.env` 和 `.env.*` 默认被 `.gitignore` 排除，只有 `.env.example` 允许提交。
- 生成任务和物料数据可进入 SQLite；真实密钥、供应商 Secret ID、Secret Key 不进入数据库和文档。
- 若外部 key 泄露，必须立即在供应商控制台轮换，并重写 Git 历史。

## 可演进方向

- 将 SQLite 迁移到 PostgreSQL，以支持多人账户和线上排行榜。
- 将 AI 生成任务改为队列 worker，避免 Web 服务进程承担长轮询。
- 对大图片资源做 CDN 或对象存储分发。
- 将关卡、地图、物料改为后台可编辑内容。
- 引入更细的错误码和审计日志，便于排查生成服务失败。
