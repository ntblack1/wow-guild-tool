# CODEX 项目说明

后续 Codex 开发本项目时必须先阅读本文件。

## 项目背景

`wow-guild-tool` 是魔兽世界工会“八块腹肌”的活动管理工具。长期目标是支持活动发起、成员报名、活动签到、掉落统计、橙装统计、气运值排行榜、红手榜、黑手榜和工会公告。

当前第一阶段只做基础环境和可持续开发骨架。

## 开发规则

- 使用 TypeScript。
- 后端使用 Express，保持模块边界清晰。
- ORM 使用 Prisma，开发数据库使用 SQLite。
- 公共枚举、类型、响应工具优先放在 `packages/shared`。
- SQLite 阶段 Prisma schema 中枚举值使用 `String` 字段保存，TypeScript 枚举放在 `packages/shared` 并由接口校验约束。
- 所有接口返回统一格式：
  - 成功：`{ "success": true, "data": ... }`
  - 失败：`{ "success": false, "error": { "message": "...", "code": "..." } }`
- 不要硬编码敏感信息，环境变量写入 `.env.example`。
- 第一阶段不要实现登录、支付、复杂权限、复杂排行榜或复杂 UI。
- 每完成重要模块，同步更新 `README.md`、`CODEX.md` 或 `docs/tasks/` 中对应文档。

## 目录职责

- `apps/server`：Express 后端服务，包含路由、中间件、配置和服务入口。
- `apps/miniapp`：微信小程序前端预留目录。
- `packages/shared`：公共枚举、类型和轻量工具函数。
- `prisma`：数据库 schema、迁移和本地 SQLite 数据库。
- `docs/product`：产品说明。
- `docs/dev`：开发规范和启动说明。
- `docs/tasks`：后续任务说明和验收标准。

## 当前接口

- `GET /health`
- `GET /events`
- `POST /events`
- `GET /events/:id`
- `GET /events/:id/signups`
- `POST /events/:id/signups`

活动和报名接口目前是雏形，后续需要补充 DTO、校验、业务状态和测试覆盖。

## 下一步任务

按 `docs/tasks/` 中编号推进：

- `T001-env-setup.md`
- `T002-database-schema.md`
- `T003-event-api.md`
- `T004-signup-api.md`
- `T005-miniapp-basic-pages.md`

## 小程序 V0.1 当前状态

`apps/miniapp` 已初始化为原生微信小程序，包含：

- 首页活动列表。
- 活动详情、报名统计和报名入口。
- 报名页。
- 我的页面。
- 团长管理页。
- 调试页。

联调约定：

- 后端默认地址：`http://127.0.0.1:3000`。
- 配置文件：`apps/miniapp/config/index.js`。
- 当前 mock 成员：`seed_member_xiaoheiwa`。
- 当前 mock 团长：`seed_member_laodongrenmin`。
- 测试数据命令：`npm run db:seed`。
