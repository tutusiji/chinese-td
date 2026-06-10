/**
 * 物料 API — 封装 2D 图像生成 + 腾讯混元 3D 模型生成
 *
 * 所有请求通过 Vite proxy 转发，避免浏览器跨域问题。
 * API Key 在 vite.config.js 的 proxy configure 中注入。
 *
 * 代理路由:
 *   /api/2d/*  → https://www.right.codes/draw/*
 *   /api/3d/*  → https://api.ai3d.cloud.tencent.com/v1/ai3d/*
 */

interface Generate2DResult {
  success: boolean;
  imageBase64?: string;
  error?: string;
}

export class MaterialAPI {
  // ─── 2D 图像生成 ─────────────────────────────────────────

  /**
   * 生成 2D 图像 (Vite proxy → right.codes/draw)
   * 优先 /v1/images/generations，回退 /v1/chat/completions
   */
  static async generate2DImage(
    prompt: string,
    model: string = 'nano-banana-2',
  ): Promise<Generate2DResult> {
    // 方式1: /v1/images/generations (OpenAI 原生)
    let result = await this._imagesGenerations(prompt, model);
    if (result.success) return result;

    // 方式2: /v1/chat/completions (聊天转图)
    return this._chatCompletions(prompt, model);
  }

  private static async _imagesGenerations(prompt: string, model: string): Promise<Generate2DResult> {
    try {
      const r = await fetch('/api/2d/v1/images/generations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, prompt, n: 1, size: '1024x1024', response_format: 'b64_json' }),
      });
      if (!r.ok) {
        const t = await r.text().catch(() => '');
        return { success: false, error: `images HTTP ${r.status}: ${t.slice(0,200)}` };
      }
      const d = await r.json();
      const b64 = d.data?.[0]?.b64_json;
      const url = d.data?.[0]?.url;
      if (b64) return { success: true, imageBase64: `data:image/png;base64,${b64}` };
      if (url) return { success: true, imageBase64: url };
      return { success: false, error: `未提取到图片: ${JSON.stringify(d).slice(0,200)}` };
    } catch (err: any) {
      return { success: false, error: err.message || String(err) };
    }
  }

  private static async _chatCompletions(prompt: string, model: string): Promise<Generate2DResult> {
    try {
      const r = await fetch('/api/2d/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], max_tokens: 4096 }),
      });
      if (!r.ok) {
        const t = await r.text().catch(() => '');
        return { success: false, error: `chat HTTP ${r.status}: ${t.slice(0,200)}` };
      }
      const d = await r.json();
      const content = d.choices?.[0]?.message?.content || '';
      const m = content.match(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/) || content.match(/https?:\/\/[^\s]+\.(png|jpg|jpeg|webp)/i);
      if (m) return { success: true, imageBase64: m[0] };
      return { success: false, error: '响应中未提取到图片' };
    } catch (err: any) {
      return { success: false, error: err.message || String(err) };
    }
  }

  // ─── 3D 模型生成 ────────────────────────────────────────
  //
  // 两个后端可选:
  //   /api/3d   → 腾讯混元直连 (Prompt/JobId 格式)
  //   /api/3dv2 → tokenhub OpenAI 兼容 (prompt/id 格式)

  /** 提交 3D 生成任务 (混元直连) */
  static async submit3DJob(prompt: string): Promise<{ success: boolean; jobId?: string; error?: string }> {
    return this._submit3D('/api/3d/submit', { Prompt: prompt, Model: '3.1' }, 'JobId');
  }

  /** 提交 3D 生成任务 (tokenhub OpenAI兼容) */
  static async submit3DJobV2(prompt: string): Promise<{ success: boolean; jobId?: string; error?: string }> {
    return this._submit3D('/api/3dv2/submit', { model: 'hy-3d-3.0', prompt }, 'id');
  }

  private static async _submit3D(
    url: string, body: Record<string, string>, idField: string,
  ): Promise<{ success: boolean; jobId?: string; error?: string }> {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        return { success: false, error: `提交失败: HTTP ${response.status} ${errText}` };
      }
      const data = await response.json();
      const id = data[idField] || data[idField.toLowerCase()];
      if (id) return { success: true, jobId: String(id) };
      return { success: false, error: `响应缺少 ${idField}: ${JSON.stringify(data)}` };
    } catch (err: any) {
      return { success: false, error: err.message || String(err) };
    }
  }

  /** 查询 3D 生成任务 (混元直连) */
  static async query3DJob(jobId: string): Promise<{
    success: boolean; status?: string; modelUrl?: string; previewUrl?: string; error?: string;
  }> {
    return this._query3D('/api/3d/query', { JobId: jobId }, 'JobId');
  }

  /** 查询 3D 生成任务 (tokenhub OpenAI兼容) */
  static async query3DJobV2(jobId: string): Promise<{
    success: boolean; status?: string; modelUrl?: string; previewUrl?: string; error?: string;
  }> {
    return this._query3D('/api/3dv2/query', { model: 'hy-3d-3.0', id: jobId }, 'id');
  }

  private static async _query3D(
    url: string, body: Record<string, string>, _idField: string,
  ): Promise<{ success: boolean; status?: string; modelUrl?: string; previewUrl?: string; error?: string }> {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        return { success: false, error: `查询失败: HTTP ${response.status} ${errText}` };
      }
      const data = await response.json();

      // 混元直连格式: { Response: { Status, ResultFile3Ds: [{Type, Url, PreviewImageUrl}] } }
      const resp = data.Response || data;
      const status = (resp.Status || data.status || '').toLowerCase();

      // 查找 GLB 文件
      const files = resp.ResultFile3Ds || data.result_file_3ds || [];
      const glbFile = files.find((f: any) => (f.Type || f.type || '').toUpperCase() === 'GLB');
      const objFile = files.find((f: any) => (f.Type || f.type || '').toUpperCase() === 'OBJ');
      const modelUrl = glbFile?.Url || glbFile?.url || objFile?.Url || objFile?.url
        || resp.ModelUrl || data.model_url;
      const previewUrl = glbFile?.PreviewImageUrl || glbFile?.preview_image_url
        || objFile?.PreviewImageUrl || objFile?.preview_image_url || '';

      if (status === 'done' || status === 'completed' || status === 'success') {
        return { success: true, status: 'completed', modelUrl, previewUrl };
      }
      if (status === 'failed' || status === 'error') {
        return { success: true, status: 'failed', error: resp.ErrorMessage || resp.Error || data.error || '未知错误' };
      }
      return { success: true, status: status || 'pending' };
    } catch (err: any) {
      return { success: false, error: err.message || String(err) };
    }
  }

  /**
   * 提交并轮询直到完成，返回模型下载链接和预览图
   */
  static async generate3DModel(
    prompt: string,
    onProgress?: (status: string) => void,
    useV2: boolean = false,
  ): Promise<{ success: boolean; modelUrl?: string; previewUrl?: string; error?: string }> {
    const submit = useV2
      ? await this.submit3DJobV2(prompt)
      : await this.submit3DJob(prompt);
    if (!submit.success || !submit.jobId) {
      return { success: false, error: submit.error || '提交任务失败' };
    }

    onProgress?.('processing');

    const maxAttempts = useV2 ? 60 : 120;
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(r => setTimeout(r, 5000));
      const result = useV2
        ? await this.query3DJobV2(submit.jobId)
        : await this.query3DJob(submit.jobId);
      if (!result.success) return { success: false, error: result.error };
      if (result.status === 'completed') {
        onProgress?.('completed');
        return { success: true, modelUrl: result.modelUrl, previewUrl: result.previewUrl };
      }
      if (result.status === 'failed') {
        return { success: false, error: result.error || '生成失败' };
      }
      onProgress?.(result.status || 'pending');
    }

    return { success: false, error: '生成超时' };
  }

  /**
   * 下载 GLB 模型文件到本地 blob URL
   * 返回可用于 <model-viewer> 或 GLTFLoader 的 URL
   */
  static async downloadModel(modelUrl: string): Promise<{ success: boolean; blobUrl?: string; error?: string }> {
    try {
      const r = await fetch(modelUrl);
      if (!r.ok) return { success: false, error: `下载失败: HTTP ${r.status}` };
      const blob = await r.blob();
      const blobUrl = URL.createObjectURL(blob);
      return { success: true, blobUrl };
    } catch (err: any) {
      return { success: false, error: err.message || String(err) };
    }
  }
}
