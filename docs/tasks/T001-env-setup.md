# T001 环境与项目骨架

## 目标

初始化 `wow-guild-tool` monorepo，使项目可以安装依赖、启动后端、构建、测试，并为后续任务提供清晰目录结构。

## 范围

- 根目录 npm workspaces。
- `apps/server` Express 后端基础服务。
- `apps/miniapp` 微信小程序占位目录。
- `packages/shared` 公共类型包。
- `prisma` 数据库目录。
- `.env.example`、`docker-compose.yml`、`README.md`、`CODEX.md`。

## 验收标准

- `npm install` 可以成功。
- `npm run build` 可以成功。
- `npm run test` 可以通过。
- `npm run db:migrate` 可以成功生成 SQLite 数据库。
- `npm run dev` 可以启动后端。
- `GET /health` 返回：

```json
{
  "success": true,
  "data": {
    "status": "ok"
  }
}
```

- README 能让新开发者完成安装、迁移、启动和测试。
- CODEX 能让后续 Codex 明白项目背景、开发规则、目录结构和下一步任务。
