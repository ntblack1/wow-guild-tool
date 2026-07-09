# T010 活动状态流转

本文件保留用于兼容早期任务规划。当前用户指定的 T010 已调整为“成员—角色—活动—报名—签到闭环自检”，详细内容见 `docs/tasks/T010-business-loop-check.md`。

## 任务目标

后续仍需要单独收紧活动状态流转规则，使活动从草稿、报名中、锁定、进行中、已结束、已取消之间有明确合法跳转。

## 背景说明

当前已实现的状态操作包括：

- `POST /events/:id/open-signup`
- `POST /events/:id/lock`
- `POST /events/:id/cancel`

本轮 T010 只做闭环自检，不新增状态流转接口。

## 涉及文件

- `docs/tasks/T010-business-loop-check.md`
- `apps/server/src/routes/events.ts`
- `packages/shared/src/index.ts`

## 需要新增或修改的接口

本轮不新增状态流转接口。

## 数据模型影响

无。

## 验收标准

- 闭环自检通过。
- 后续如继续开发状态流转，应另开任务收紧合法跳转。

## 不做什么

- 不做定时自动流转。
- 不做审批流。
- 不做复杂回滚流程。
- 不做权限系统。

## 测试要求

- 本轮以 `business-loop.test.ts` 验证现有状态操作可支撑第一条业务闭环。
