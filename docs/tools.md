## 2D 图像生成

项目通过服务端代理调用 2D 图像生成接口，前端不保存、传输或展示 API Key。

- 环境变量: `DRAW_API_KEY`
- 服务端代理: `/api/proxy/2d/images`、`/api/proxy/2d/chat`
- 外部文档: https://docs.right.codes/docs/rc_extension/draw

可选模型:

- `gpt-image-2-vip`: 官方直连图像模型，支持 1K、2K、4K。
- `gpt-image-2`: 特价图像模型，支持 1K。
- `nano-banana`: Gemini 2.5 Flash Image 封装。
- `nano-banana-2`: 第二代图像模型，支持 1K、2K、4K。
- `nano-banana-pro`: 第二代图像模型专业版，支持 1K、2K、4K。

## 3D 模型生成

项目支持两个 3D 生成后端，统一由服务端读取环境变量后代理请求。

- 混元直连接口环境变量: `HUNYUAN_API_KEY`
- TokenHub 兼容接口环境变量: `TOKENHUB_API_KEY`
- 混元 OpenAI 兼容接口文档: https://cloud.tencent.com/document/product/1804/126189
- 混元 3D base URL: `https://api.ai3d.cloud.tencent.com`

混元直连接口:

```bash
curl --location 'https://api.ai3d.cloud.tencent.com/v1/ai3d/submit' \
  --header 'Authorization: <HUNYUAN_API_KEY>' \
  --header 'Content-Type: application/json' \
  --data '{"Prompt":"中国古代投石车","Model":"3.1"}'
```

```bash
curl --location 'https://api.ai3d.cloud.tencent.com/v1/ai3d/query' \
  --header 'Authorization: <HUNYUAN_API_KEY>' \
  --header 'Content-Type: application/json' \
  --data '{"JobId":"<JOB_ID>"}'
```

TokenHub 兼容接口:

```bash
curl --location 'https://tokenhub.tencentmaas.com/v1/api/3d/submit' \
  --header 'Authorization: Bearer <TOKENHUB_API_KEY>' \
  --header 'Content-Type: application/json' \
  --data '{"model":"hy-3d-3.0","prompt":"中国古代投石车"}'
```

```bash
curl --location 'https://tokenhub.tencentmaas.com/v1/api/3d/query' \
  --header 'Authorization: Bearer <TOKENHUB_API_KEY>' \
  --header 'Content-Type: application/json' \
  --data '{"model":"hy-3d-3.0","id":"<JOB_ID>"}'
```

## 密钥管理规则

- 真实 key 只能保存在本地 `.env`、服务器 `/opt/chinese-td/.env` 或受控密钥管理服务中。
- GitHub 只提交 `.env.example` 和占位符，不能提交真实 key、Secret ID、Secret Key、Token。
- 服务端启动时通过 `dotenv` 加载 `.env`；缺少必要 key 时，相关生成接口返回配置错误。
- 如果 key 曾经进入提交历史，必须重写提交历史后再推送，并立即轮换泄露的 key。
