import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 3000,
    open: true,
    proxy: {
      // 所有 /api/* 请求转发到 Fastify 服务端 (3001)
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
});
