# API 规范

所有接口返回统一结构。

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

第一阶段只提供接口雏形，复杂校验、权限和业务流转留到后续任务。

## 活动管理 API

活动管理接口用于团长创建、修改、查看和取消工会活动。

### 活动状态

当前活动状态使用字符串保存：

- `draft`：草稿，活动刚创建，尚未开放报名。
- `signup_open`：已开放报名。
- `locked`：报名已锁定。
- `in_progress`：活动进行中，预留给后续签到和战报流程。
- `finished`：活动已结束，核心活动信息不允许修改。
- `cancelled`：活动已取消。

当前已实现的状态操作：

- `POST /events/:id/open-signup`：设置为 `signup_open`
- `POST /events/:id/lock`：设置为 `locked`
- `POST /events/:id/cancel`：设置为 `cancelled`

### 接口列表

- `GET /events`
  - 查询活动列表。
  - 支持 `status` 筛选。
  - 支持 `raidName` 模糊筛选。
  - 默认按 `startTime` 倒序排列。团长管理活动时，最近或即将处理的活动通常更重要，因此优先显示较新的活动。
- `POST /events`
  - 创建活动。
  - 必填字段：`title`、`raidName`、`startTime`、`maxPlayers`、`tankNeed`、`healerNeed`、`meleeNeed`、`rangedNeed`、`leaderId`。
- `GET /events/:id`
  - 查询活动详情。
  - 返回团长信息。
  - 返回报名总人数和职责统计。
- `PATCH /events/:id`
  - 修改活动信息。
  - `finished` 状态的活动不允许修改核心信息。
- `POST /events/:id/cancel`
  - 取消活动。
- `POST /events/:id/open-signup`
  - 开放报名。
- `POST /events/:id/lock`
  - 锁定报名。

### 创建活动校验规则

- `title` 不能为空。
- `raidName` 不能为空。
- `startTime` 必须是有效时间。
- `maxPlayers` 必须大于 0。
- `tankNeed`、`healerNeed`、`meleeNeed`、`rangedNeed` 不能小于 0。
- `tankNeed + healerNeed + meleeNeed + rangedNeed` 不能大于 `maxPlayers`。
- `leaderId` 必须对应一个存在且 `active` 为 `true` 的成员。

## 活动报名 API

报名接口用于成员使用自己的角色报名活动，团长查看报名名单和职责缺口。

### 报名状态

当前报名状态使用字符串保存：

- `signed`：正式报名，占用活动人数。
- `standby`：候补，不占用正式人数。
- `leave`：请假，不占用正式人数。
- `cancelled`：已取消，不物理删除记录。

### 职责类型

`roleType` 只能是：

- `tank`
- `healer`
- `melee`
- `ranged`

### 接口列表

- `GET /events/:eventId/signups`
  - 查询活动报名列表。
  - 返回成员信息和角色信息。
  - 支持 `status` 筛选。
  - 支持 `roleType` 筛选。
- `POST /events/:eventId/signups`
  - 成员报名活动。
  - 字段：`memberId`、`characterId`、`roleType`、`status`、`note`。
- `PATCH /signups/:id`
  - 修改报名信息。
  - 可修改：`characterId`、`roleType`、`status`、`note`。
- `DELETE /signups/:id`
  - 取消报名。
  - 采用软取消，设置 `status = cancelled`。
- `GET /events/:eventId/signup-summary`
  - 查询报名统计和职责缺口。

### 报名规则

- 只有 `signup_open` 状态的活动允许新增报名。
- `draft`、`locked`、`in_progress`、`finished`、`cancelled` 状态的活动不允许新增报名。
- `memberId` 必须对应存在且 `active` 为 `true` 的成员。
- `characterId` 必须属于该 `memberId`。
- 同一成员同一活动只能有一条有效报名记录。
- 如果成员已经有有效报名，再次报名返回 `SIGNUP_ALREADY_EXISTS`。选择明确错误而不是自动更新，是为了避免成员误操作覆盖原报名；修改报名应走 `PATCH /signups/:id`。
- 如果 `signed` 人数已达到 `maxPlayers`，新增报名自动进入 `standby`。选择自动候补，是为了保留成员参与意愿，方便团长后续补位。
- `signed` 人数不允许通过新增报名超过 `maxPlayers`。

## 活动签到 API

签到接口用于团长在活动开始前或活动进行中记录成员实际出勤情况。

### 出勤状态

当前出勤状态使用字符串保存：

- `present`：已出勤。
- `late`：迟到。
- `absent`：缺席。
- `standby`：候补到场或候补记录。

### 签到与报名的关系

- 签到记录会尽量关联报名记录。
- 从报名名单生成签到时，`signed` 报名默认生成 `present`。选择 `present` 是因为批量生成通常发生在活动开始前或活动进行中，团长可以随后把未到成员改为 `absent` 或 `late`。
- 从报名名单生成签到时，`standby` 报名默认生成 `standby`。
- `leave` 报名默认不生成签到。选择不生成是因为请假成员没有实际出勤记录，避免把请假混入出勤名单。
- 未报名但实际到场的成员允许手动新增出勤记录，建议在 `note` 中注明原因。

### 接口列表

- `GET /events/:eventId/attendance`
  - 查询活动出勤列表。
  - 返回成员信息和角色信息。
  - 支持 `status` 筛选。
- `POST /events/:eventId/attendance`
  - 创建或更新一条出勤记录。
  - 字段：`memberId`、`characterId`、`status`、`note`。
- `POST /events/:eventId/attendance/from-signups`
  - 根据当前活动报名名单批量生成出勤记录。
  - 对同一成员重复生成不会创建重复记录。
- `PATCH /attendance/:id`
  - 修改出勤状态和备注。
- `GET /events/:eventId/attendance-summary`
  - 查询出勤统计。

### 签到规则

- 只有 `locked` 或 `in_progress` 状态的活动允许创建或生成签到。
- `finished` 和 `cancelled` 状态不允许新增或修改签到。
- `memberId` 必须对应存在且 `active` 为 `true` 的成员。
- `characterId` 必须属于该 `memberId`。
- 同一成员同一活动只能有一条出勤记录。
- 手动新增出勤记录会尝试关联该成员在当前活动的报名记录；没有报名时 `signupId` 为 `null`。

## 成员与角色联调 API

这些接口服务于小程序 V0.1 的“我的页面”和报名页，当前只提供基础查询能力，不实现登录、权限或成员后台管理。

### 接口列表

- `GET /members/:id`
  - 查询成员详情。
  - 返回成员基础信息和角色列表。
- `GET /members/:id/characters`
  - 查询成员角色列表。
  - 报名页用于选择报名角色。
- `GET /members/:id/signups`
  - 查询成员报名记录。
  - 返回报名对应的活动和角色信息。

### 当前约定

- 小程序 V0.1 使用 `apps/miniapp/config/index.js` 中的 `CURRENT_MEMBER_ID` 模拟当前用户。
- 当前不做微信登录，不做复杂权限，不做成员资料编辑。
- 后续接入微信登录后，需要把 mock 成员替换为登录态解析出的成员。
