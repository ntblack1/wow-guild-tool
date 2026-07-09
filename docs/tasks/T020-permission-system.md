# T020 权限系统

## 任务目标

建立最小权限系统，区分普通成员、团长和管理员，为管理接口提供基础保护。

## 背景说明

前面任务可以先不做真实权限。进入管理页面、活动创建、签到、掉落录入和公告发布前，需要统一权限规则。

## 涉及文件

- `apps/server/src/middleware/auth.ts`
- `apps/server/src/routes/members.ts`
- `apps/server/test/auth.test.ts`
- `packages/shared/src/index.ts`
- `prisma/schema.prisma`
- `docs/dev/auth.md`
- `docs/tasks/T020-permission-system.md`

## 需要新增或修改的接口

- 新增 `POST /auth/dev-login`
- 新增 `GET /auth/me`
- 修改管理类接口，增加权限检查

第一版使用开发登录或静态 token，微信登录另开任务。

## 数据模型影响

建议为 `Member` 增加：

- `role String @default("MEMBER")`

shared 中增加 `MemberRole`：

- `MEMBER`
- `RAID_LEADER`
- `ADMIN`

## 验收标准

- 普通成员不能创建活动。
- 团长可以创建活动和签到。
- 管理员可以管理公告和成员角色。
- 未登录请求管理接口返回 `UNAUTHORIZED`。
- 权限不足返回 `FORBIDDEN`。

## 不做什么

- 不做微信 OAuth。
- 不做复杂 RBAC 表结构。
- 不做支付权限。
- 不做多工会租户。

## 测试要求

- 测试未登录失败。
- 测试普通成员访问管理接口失败。
- 测试团长访问活动管理成功。
- 测试管理员访问公告管理成功。
- 运行 `npm run test` 必须通过。
