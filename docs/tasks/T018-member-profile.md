# T018 成员个人主页

## 任务目标

实现成员个人主页，展示成员角色、报名记录、签到记录、掉落记录、橙装进度和气运值摘要。

## 背景说明

个人主页是成员查看自己参与记录和工会数据的入口。第一版可以通过成员 ID 访问，不接微信登录。

## 涉及文件

- `apps/server/src/routes/members.ts`
- `apps/server/test/member-profile.test.ts`
- `apps/miniapp/pages/member-profile/index.*`
- `apps/miniapp/utils/api.ts`
- `docs/tasks/T018-member-profile.md`

## 需要新增或修改的接口

- 新增 `GET /members/:id/profile`
- 小程序新增个人主页接口调用

## 数据模型影响

优先不新增模型，从已有 `Member`、`Character`、`Signup`、`Attendance`、`Loot`、`LuckyScore` 和橙装记录聚合。

## 验收标准

- 成员主页返回成员基础信息。
- 返回角色列表。
- 返回最近报名和签到记录。
- 返回掉落数量和气运值摘要。
- 小程序页面能展示空状态。

## 不做什么

- 不做微信登录绑定。
- 不做隐私设置。
- 不做复杂图表。
- 不做跨服角色自动查询。

## 测试要求

- 测试成员主页接口成功。
- 测试成员不存在返回 `MEMBER_NOT_FOUND`。
- 测试无活动记录时返回空数组和零值摘要。
- 运行 `npm run test` 必须通过。

## V0.1 实现状态

已实现基础“我的页面”：`apps/miniapp/pages/my/index.*`。

当前已接入能力：

- `GET /members/:id`：展示成员昵称、工会名、角色。
- `GET /members/:id/signups`：展示当前成员报名记录。
- 使用 `CURRENT_MEMBER_ID=seed_member_xiaoheiwa` 模拟当前登录成员。

与原规划差异：

- 暂未新增 `GET /members/:id/profile` 聚合接口，V0.1 先复用基础成员接口和报名记录接口，降低后端改动。
- 暂未展示签到记录、掉落、橙装、气运值，这些依赖后续任务完整实现。

后续仍需补充：

- 设计并实现真正的个人主页聚合接口。
- 接入微信登录后，用登录态替换 mock 成员 ID。
- 增加签到记录、掉落记录、气运值摘要。
