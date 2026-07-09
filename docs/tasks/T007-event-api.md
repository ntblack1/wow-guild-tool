# T007 活动发起完整 API

## 任务目标

让团长可以创建、修改、查看、取消工会活动，并支持开放报名和锁定报名。

## 背景说明

活动是后续报名、签到、掉落统计、战报和排行榜的核心入口。本任务完成活动管理 API 的第一版闭环，不实现权限系统和复杂活动 UI。

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
  - 支持 `status` 筛选。
  - 支持 `raidName` 筛选。
  - 默认按 `startTime` 倒序排列。选择倒序是因为团长管理时通常优先处理最近创建、即将进行或刚结束的活动。
- `POST /events`
  - 创建活动。
- `GET /events/:id`
  - 获取活动详情，包含团长信息、报名总数和职责报名统计。
- `PATCH /events/:id`
  - 修改活动信息。
  - 已结束活动不允许修改核心信息。
- `POST /events/:id/cancel`
  - 取消活动，状态设置为 `cancelled`。
- `POST /events/:id/open-signup`
  - 开放报名，状态设置为 `signup_open`。
- `POST /events/:id/lock`
  - 锁定报名，状态设置为 `locked`。

## 数据模型影响

`GuildEvent` 增加或完善以下字段：

- `raidName`
- `status`
- `startTime`
- `maxPlayers`
- `tankNeed`
- `healerNeed`
- `meleeNeed`
- `rangedNeed`
- `leaderId`

`Member` 增加：

- `active`

`Signup` 增加：

- `role`

`packages/shared` 增加：

- `GuildEventStatus`
- `SignupRole`

## 活动状态流转规则

建议状态全集：

- `draft`
- `signup_open`
- `locked`
- `in_progress`
- `finished`
- `cancelled`

当前已实现的显式流转：

- `POST /events/:id/open-signup` 设置为 `signup_open`。
- `POST /events/:id/lock` 设置为 `locked`。
- `POST /events/:id/cancel` 设置为 `cancelled`。
- `finished` 状态的活动不允许通过 `PATCH /events/:id` 修改核心信息。

后续 T010 会进一步收紧合法状态跳转。

## 验收标准

- 可以创建活动。
- 创建活动时校验标题、团本名、时间、人数需求和团长。
- 可以按 `status` 和 `raidName` 查询活动列表。
- 活动列表默认按 `startTime` 倒序排列。
- 可以查询活动详情，包含团长信息和报名统计。
- 可以修改未结束活动。
- 已结束活动不允许修改核心信息。
- 可以开放报名、锁定报名和取消活动。
- 所有接口符合统一响应格式。

## 不做什么

- 不做微信登录。
- 不做复杂权限。
- 不做活动海报。
- 不做排行榜。
- 不做活动自动定时流转。
- 不做复杂 UI。

## 测试要求

- 测试创建活动。
- 测试创建活动时职责需求不能超过 `maxPlayers`。
- 测试 `leaderId` 不存在时创建失败。
- 测试活动列表筛选和排序。
- 测试修改活动。
- 测试已结束活动不允许修改核心信息。
- 测试开放报名。
- 测试锁定报名。
- 测试取消活动。
- 测试获取活动详情时包含报名统计。
- 运行 `npm run build` 必须通过。
- 运行 `npm run test` 必须通过。
