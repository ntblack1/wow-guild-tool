# T009 活动签到

本文件保留用于兼容早期任务规划。当前 T009 的详细执行说明见 `docs/tasks/T009-attendance-api.md`。

## 任务目标

让团长在活动开始前或活动进行中记录成员实际出勤情况。

## 背景说明

签到应围绕活动进行，优先从报名名单批量生成，同时允许未报名但实际到场的成员手动补录。

## 涉及文件

- `apps/server/src/routes/events.ts`
- `apps/server/src/routes/attendance.ts`
- `apps/server/test/attendance.test.ts`
- `packages/shared/src/index.ts`
- `prisma/schema.prisma`
- `docs/tasks/T009-attendance-api.md`

## 需要新增或修改的接口

- `GET /events/:eventId/attendance`
- `POST /events/:eventId/attendance`
- `POST /events/:eventId/attendance/from-signups`
- `PATCH /attendance/:id`
- `GET /events/:eventId/attendance-summary`

## 数据模型影响

详见 `docs/tasks/T009-attendance-api.md`。

## 验收标准

详见 `docs/tasks/T009-attendance-api.md`。

## 不做什么

- 不做二维码签到。
- 不做地理位置签到。
- 不做自动识别语音或截图。
- 不做权限校验。

## 测试要求

- 运行 `npm run build` 必须通过。
- 运行 `npm run test` 必须通过。
