# T009 活动签到 API

## 任务目标

让团长在活动开始前或活动进行中记录成员实际出勤情况。

## 背景说明

签到是报名之后、掉落统计和活动战报之前的关键数据。第一版支持从报名名单批量生成签到，也允许未报名但实际到场的成员手动补录。

## 涉及文件

- `apps/server/src/routes/events.ts`
- `apps/server/src/routes/attendance.ts`
- `apps/server/src/app.ts`
- `apps/server/test/attendance.test.ts`
- `packages/shared/src/index.ts`
- `prisma/schema.prisma`
- `prisma/migrations/`
- `docs/dev/api-style.md`
- `docs/tasks/T009-attendance-api.md`

## 需要新增或修改的接口

- `GET /events/:eventId/attendance`
  - 获取活动出勤列表。
  - 包含成员信息。
  - 包含角色信息。
  - 支持按 `status` 筛选。
- `POST /events/:eventId/attendance`
  - 创建或更新一条出勤记录。
  - 字段包括：`memberId`、`characterId`、`status`、`note`。
- `POST /events/:eventId/attendance/from-signups`
  - 根据当前活动报名名单批量生成出勤记录。
- `PATCH /attendance/:id`
  - 修改出勤状态和备注。
- `GET /events/:eventId/attendance-summary`
  - 返回出勤统计。

## 数据模型影响

`Attendance` 继续作为出勤主模型，并补充：

- `characterId`
- `signupId`
- 小写出勤状态默认值 `present`

`Character` 和 `Signup` 增加到 `Attendance` 的关系，便于查询时返回角色信息并追溯报名来源。

`packages/shared` 中 `AttendanceStatus` 使用：

- `present`
- `late`
- `absent`
- `standby`

## 签到与报名的关系

- 签到记录会尽量关联报名记录。
- 从报名名单生成签到时，`signed` 默认生成 `present`。选择 `present` 是因为团长通常在活动开始前或活动进行中批量生成名单，之后再把未到成员改为 `absent` 或 `late`。
- 从报名名单生成签到时，`standby` 默认生成 `standby`。
- `leave` 默认不生成签到。选择不生成是因为请假成员没有实际出勤记录，避免污染出勤统计。
- 未报名但实际到场的成员允许手动新增出勤记录，并建议在 `note` 中注明原因。

## 验收标准

- 可以查询活动出勤列表。
- 出勤列表包含成员信息和角色信息。
- 出勤列表支持按 `status` 筛选。
- 可以手动创建或更新出勤记录。
- 可以从报名名单批量生成出勤记录。
- 同一成员同一活动不会生成重复出勤记录。
- 可以修改出勤状态。
- 可以查询出勤统计。
- 所有接口符合统一响应格式。

## 不做什么

- 不做二维码签到。
- 不做地理位置签到。
- 不做自动识别截图或语音。
- 不做权限系统。
- 不做气运值计算。

## 测试要求

- 测试从报名名单生成签到。
- 测试 `draft` 活动不能生成签到。
- 测试 `locked` 活动可以生成签到。
- 测试修改出勤状态。
- 测试同一成员不能重复生成出勤记录。
- 测试未报名成员可以手动添加出勤。
- 测试出勤统计接口。
- 运行 `npm run build` 必须通过。
- 运行 `npm run test` 必须通过。
