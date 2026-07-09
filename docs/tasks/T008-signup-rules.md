# T008 活动报名规则

## 任务目标

让成员可以用自己的角色报名活动，团长可以查看报名名单和职责缺口。

## 背景说明

报名是“成员—角色—活动—报名—签到”业务闭环的关键节点。当前实现只处理基础报名规则，不做微信身份绑定、审批流或复杂职业配平。

## 涉及文件

- `apps/server/src/routes/events.ts`
- `apps/server/src/routes/signups.ts`
- `apps/server/src/app.ts`
- `apps/server/test/signups.test.ts`
- `apps/server/vitest.config.ts`
- `packages/shared/src/index.ts`
- `prisma/schema.prisma`
- `prisma/migrations/`
- `docs/dev/api-style.md`
- `docs/tasks/T008-signup-rules.md`

## 需要新增或修改的接口

- `GET /events/:eventId/signups`
  - 获取活动报名列表。
  - 包含成员信息。
  - 包含角色信息。
  - 支持按 `status` 筛选。
  - 支持按 `roleType` 筛选。
- `POST /events/:eventId/signups`
  - 成员报名活动。
  - 字段包括：`memberId`、`characterId`、`roleType`、`status`、`note`。
- `PATCH /signups/:id`
  - 修改报名信息。
  - 允许修改：`characterId`、`roleType`、`status`、`note`。
- `DELETE /signups/:id`
  - 取消报名。
  - 设置 `status = cancelled`，不物理删除。
- `GET /events/:eventId/signup-summary`
  - 返回报名统计和职责缺口。

## 数据模型影响

`Signup.status` 改为使用以下小写业务状态：

- `signed`
- `standby`
- `leave`
- `cancelled`

`Signup.roleType` 暴露给 Prisma Client 和 API，数据库列继续映射到已有 `role` 列。

`packages/shared` 中的 `SignupStatus` 与 `SignupRole` 已同步为接口使用的字符串值。

## 报名状态和业务规则

报名状态：

- `signed`：正式报名，占用活动人数。
- `standby`：候补，不占用正式人数。
- `leave`：请假，不占用正式人数。
- `cancelled`：已取消，不物理删除记录。

职责类型：

- `tank`
- `healer`
- `melee`
- `ranged`

规则：

- 只有 `signup_open` 状态的活动允许新增报名。
- `draft`、`locked`、`in_progress`、`finished`、`cancelled` 状态的活动不允许新增报名。
- `memberId` 必须存在且 `active` 为 `true`。
- `characterId` 必须属于该 `memberId`。
- 同一成员同一活动只能有一条有效报名记录。
- 重复有效报名返回 `SIGNUP_ALREADY_EXISTS`。选择明确错误而不是自动更新，是为了避免误操作覆盖原报名；修改报名应使用 `PATCH /signups/:id`。
- 如果 `signed` 人数达到 `maxPlayers`，新增报名自动进入 `standby`。选择自动候补，是为了保留成员参与意愿，方便团长后续补位。

## 验收标准

- 活动开放报名后可以报名。
- 草稿活动不能报名。
- 锁定活动不能报名。
- 不存在或 inactive 的成员不能报名。
- 角色不属于成员时不能报名。
- 同一成员不能重复有效报名。
- 正式报名满员后，新增报名自动进入候补。
- 报名列表支持 `status` 和 `roleType` 筛选。
- 报名统计接口返回人数、职责报名数和职责缺口。
- 取消报名采用软取消。

## 不做什么

- 不做微信身份绑定。
- 不做报名审批流。
- 不做自动补位通知。
- 不做复杂职业配平。
- 不做权限系统。

## 测试要求

- 测试活动开放报名后可以报名。
- 测试 `draft` 活动不能报名。
- 测试 `locked` 活动不能报名。
- 测试不存在的成员不能报名。
- 测试角色不属于该成员时不能报名。
- 测试同一成员不能重复有效报名。
- 测试 `signed` 人数超过 `maxPlayers` 后自动进入 `standby`。
- 测试报名统计接口。
- 测试取消报名。
- 运行 `npm run build` 必须通过。
- 运行 `npm run test` 必须通过。
