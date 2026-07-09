# T007 活动发起完整 API

本文件保留用于兼容早期任务规划。当前 T007 的详细执行说明见 `docs/tasks/T007-event-api.md`。

## 任务目标

让团长可以创建、修改、查看、取消工会活动，并支持开放报名和锁定报名。

## 背景说明

当前活动管理 API 已从雏形扩展为第一版完整接口。活动状态流转、接口列表、模型影响、验收标准和测试要求以 `T007-event-api.md` 为准。

## 涉及文件

- `apps/server/src/routes/events.ts`
- `apps/server/test/events.test.ts`
- `packages/shared/src/index.ts`
- `prisma/schema.prisma`
- `prisma/migrations/`
- `docs/dev/api-style.md`
- `docs/tasks/T007-event-api.md`

## 需要新增或修改的接口

- `GET /events`
- `POST /events`
- `GET /events/:id`
- `PATCH /events/:id`
- `POST /events/:id/cancel`
- `POST /events/:id/open-signup`
- `POST /events/:id/lock`

## 数据模型影响

详见 `docs/tasks/T007-event-api.md`。

## 验收标准

详见 `docs/tasks/T007-event-api.md`。

## 不做什么

- 不做微信登录。
- 不做复杂权限。
- 不做排行榜。
- 不做活动海报。
- 不做复杂 UI。

## 测试要求

- 运行 `npm run build` 必须通过。
- 运行 `npm run test` 必须通过。
