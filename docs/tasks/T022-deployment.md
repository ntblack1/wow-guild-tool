# T022 部署上线

## 任务目标

整理并实现第一版部署上线流程，使后端服务、数据库迁移和小程序联调有明确发布路径。

## 背景说明

当前项目使用 SQLite 作为开发数据库，并提供 Docker Compose 占位。上线前需要明确运行环境、环境变量、数据库策略、健康检查和小程序 API 地址配置方式。

## 涉及文件

- `docker-compose.yml`
- `.env.example`
- `README.md`
- `docs/dev/miniapp-backend-testing.md`
- `docs/tasks/T022-deployment.md`
- `apps/server/src/config/env.ts`
- `apps/server/src/routes/health.ts`
- `scripts/check-backend-ready.mjs`
- `scripts/check-miniapp-release.mjs`
- `scripts/lib/miniapp-release-validator.mjs`
- `scripts/server-test.mjs`
- `scripts/seed.mjs`

## 接口影响

不新增业务接口。

部署验收依赖：

- `GET /health`

当前 `/health` 会返回服务状态和数据库状态：

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "database": "ok"
  }
}
```

## 数据模型影响

不修改业务数据模型，不新增 Prisma migration。

## 验收标准

- README 说明本地、真机和体验版/线上测试的后端地址要求。
- `npm run check:backend` 可以检查后端和 seed 数据是否可用于小程序联调。
- 后端测试不污染本地演示数据库。
- 部署后 `GET /health` 返回正常。
- 小程序端可以通过调试页配置 API base URL。
- 小程序体验版/正式版发布前，`npm run check:miniapp-release` 能检查 HTTPS API 域名配置。

## 不做什么

- 不做 Kubernetes。
- 不做复杂 CI/CD。
- 不做云厂商绑定。
- 不做生产级监控平台。
- 不在当前阶段实现微信登录。

## 测试要求

- 本地运行 `npm run build`。
- 本地运行 `npm run test`。
- 本地运行 `npm run db:migrate`。
- 本地运行 `npm run db:seed`。
- 后端运行时执行 `npm run check:backend`。
- 上传体验版前执行 `npm run check:miniapp-release`。

## 2026-07-06 后端联调与上线测试准备记录

本次已完成以下上线测试准备：

- `/health` 现在会同时检查服务状态和数据库状态，返回 `status: "ok"` 与 `database: "ok"`。
- 新增 `npm run check:backend`，用于一键检查 `/health`、活动列表、成员列表和默认成员角色是否可用。
- 后端测试已改为使用独立 `prisma/test.db`，避免运行测试污染本地演示数据库。
- `npm run db:seed` 已修复中文演示数据，并会清理已知自动化测试夹具。
- 新增 `docs/dev/miniapp-backend-testing.md`，说明开发者工具、本地真机、体验版/线上测试的后端地址要求。
- `README.md` 已重写为正常中文，并加入小程序后端联调快速检查说明。

## 2026-07-07 小程序体验版发布检查记录

本次补充小程序体验版发布前检查：

- 小程序 API 地址按微信环境拆分为 `develop`、`trial`、`release`。
- 开发版允许使用当前开发机局域网地址。
- 体验版和正式版不再读取本地 storage 覆盖的 API 地址，避免把本地调试地址带入发布包。
- 体验版和正式版 API 地址为空时，请求层会返回稳定错误码 `API_BASE_URL_NOT_CONFIGURED`。
- 新增 `npm run check:miniapp-release`，用于检查 `trial` 和 `release` 是否为公网 HTTPS 地址，并拒绝 localhost、局域网 IP 和占位域名。

当前待补充项：

- 部署公网 HTTPS 后端。
- 在微信公众平台配置 request 合法域名。
- 将 `apps/miniapp/config/index.js` 中 `MINIAPP_API_BASE_URLS.trial` 和 `MINIAPP_API_BASE_URLS.release` 改为真实 HTTPS API 域名。
