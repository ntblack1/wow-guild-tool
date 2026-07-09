# AGENTS.md

本文件是 `wow-guild-tool` 项目的长期开发规则。后续 Codex 或其他自动化开发代理在修改本项目之前，必须先阅读并遵守本文件。

## 1. 项目目标

`wow-guild-tool` 是服务于魔兽世界工会“八块腹肌”的活动管理工具。

长期目标是支持：

- 活动发起
- 成员报名
- 活动签到
- 活动后掉落统计
- 橙装统计
- 气运值排行榜
- 红手榜
- 黑手榜
- 工会公告

工会特色功能可以预留字段，但不要过早实现复杂逻辑。

## 2. 当前阶段目标

项目基础环境已经完成。当前阶段重点开发“成员—角色—活动—报名—签到”的第一条业务闭环。

优先顺序：

1. 成员与角色管理 API
2. 活动发起完整 API
3. 活动报名规则
4. 活动签到
5. 活动状态流转

当前阶段不要开发微信登录、支付、复杂权限、排行榜、活动海报或复杂 UI。

## 3. 目录结构说明

```text
apps/
  miniapp/       微信小程序前端目录
  server/        Express 后端服务
packages/
  shared/        公共类型、枚举、工具函数
prisma/          Prisma schema 和迁移文件
docs/
  product/       产品说明
  dev/           开发规范与启动说明
  tasks/         可逐个交给 Codex 执行的任务文档
scripts/         项目脚本
```

关键约定：

- 后端业务接口放在 `apps/server/src/routes/`。
- 后端中间件放在 `apps/server/src/middleware/`。
- Prisma Client 相关封装放在 `apps/server/src/lib/`。
- 公共枚举、公共类型和轻量工具函数优先放在 `packages/shared/src/`。
- 数据模型统一维护在 `prisma/schema.prisma`。
- 后续开发任务统一记录在 `docs/tasks/`。

## 4. 常用命令

安装依赖：

```bash
npm install
```

启动开发服务：

```bash
npm run dev
```

构建：

```bash
npm run build
```

测试：

```bash
npm run test
```

Prisma migrate：

```bash
npm run db:migrate
```

Prisma studio：

```bash
npm run db:studio
```

## 5. 代码规范

- 使用 TypeScript。
- 保持模块边界清晰，优先沿用现有 Express 路由、中间件和 lib 结构。
- 代码要清晰、可维护，避免为未来可能性增加复杂抽象。
- 不要引入重型依赖；新增依赖前必须确认标准库或现有依赖无法满足。
- 不要硬编码敏感信息，环境变量必须写入 `.env.example`。
- 业务命名必须贴合工会场景，例如 `GuildEvent`、`Signup`、`Attendance`、`Loot`、`LuckyScore`。
- 公共枚举和公共类型尽量放在 `packages/shared`。
- SQLite 阶段 Prisma schema 中枚举值使用 `String` 字段保存，TypeScript 枚举放在 `packages/shared` 并由接口校验约束。

## 6. API 返回格式规范

所有接口必须使用统一返回格式。

成功：

```json
{
  "success": true,
  "data": {}
}
```

失败：

```json
{
  "success": false,
  "error": {
    "message": "错误说明",
    "code": "ERROR_CODE"
  }
}
```

规则：

- 成功响应使用 `success: true`。
- 失败响应使用 `success: false`。
- 错误必须包含稳定的 `code`。
- 不要直接向前端暴露数据库异常或堆栈信息。
- 新增接口后必须更新对应文档。

## 7. 数据库模型修改规则

- 所有数据模型修改必须从 `prisma/schema.prisma` 开始。
- 每次修改 Prisma schema 后，必须生成 migration。
- migration 必须随代码一起保留在 `prisma/migrations/`。
- 修改模型后必须检查相关接口、测试和文档是否需要同步更新。
- 不要在当前阶段为未实现功能建立过度复杂的表结构。
- 可以为工会特色功能预留少量必要字段，但不要提前实现复杂排行榜、复杂权限或海报逻辑。

## 8. 文档更新规则

- 每次新增接口后，必须更新对应任务文档或开发文档。
- 每次改变启动方式、环境变量或命令后，必须更新 `README.md`。
- 每次改变长期开发约定后，必须更新 `AGENTS.md`。
- 每次完成一个重要任务后，必须更新 `docs/tasks/` 中对应任务的状态或验收说明。
- 产品规则、排行榜规则、气运值规则等业务说明应写入 `docs/product/` 或 `docs/dev/`。

## 9. 测试要求

- 每次修改业务逻辑后，必须补充或更新测试。
- 每次新增接口后，必须补充成功和失败场景测试。
- 不要跳过测试。
- 完成开发后至少运行：

```bash
npm run test
```

涉及 TypeScript 或构建配置时，还必须运行：

```bash
npm run build
```

涉及 Prisma schema 时，还必须运行：

```bash
npm run db:migrate
```

## 10. 不允许做的事情

- 不要在没有任务要求时开发复杂 UI。
- 不要在当前阶段开发微信登录。
- 不要在当前阶段开发支付。
- 不要在当前阶段开发复杂权限。
- 不要在当前阶段开发排行榜。
- 不要在当前阶段开发活动海报。
- 不要引入重型依赖。
- 不要跳过测试。
- 不要硬编码敏感信息。
- 不要把临时数据库、缓存、日志或构建产物提交为业务文件。
- 不要在未更新文档的情况下新增接口。
- 不要在未生成 migration 的情况下修改 Prisma schema。

## 11. 小程序 V0.1 补充规则

- `apps/miniapp` 当前是原生微信小程序项目，不要无任务要求时切换为 Taro、uni-app 或其它重型框架。
- 小程序 API 调用统一放在 `apps/miniapp/services/` 和 `apps/miniapp/utils/request.js`。
- 小程序后端地址和 mock 成员配置统一放在 `apps/miniapp/config/index.js`。
- 当前 mock 成员为 `CURRENT_MEMBER_ID=seed_member_xiaoheiwa`，团长为 `LEADER_ID=seed_member_laodongrenmin`。
- 本地联调测试数据通过 `npm run db:seed` 写入。
- 修改小程序页面后，至少检查相关 `.json` 和 `.js` 文件语法，并确认不破坏 `npm run build` 与 `npm run test`。
