# T017 团长管理页面

## 任务目标

为团长提供活动管理入口，支持在小程序内查看活动、创建活动、查看报名和签到。

## 背景说明

团长是工会活动的主要管理者。第一版团长页面可以先不接权限系统，用本地开关或预留入口控制，待 T020 权限系统接入。

## 涉及文件

- `apps/miniapp/pages/leader/events/index.*`
- `apps/miniapp/pages/leader/event-form/index.*`
- `apps/miniapp/pages/leader/signups/index.*`
- `apps/miniapp/pages/leader/attendance/index.*`
- `apps/miniapp/utils/api.ts`
- `apps/miniapp/README.md`
- `docs/tasks/T017-leader-admin-pages.md`

## 需要新增或修改的接口

小程序端调用已有或规划接口：

- `POST /events`
- `PATCH /events/:id`
- `GET /events/:id/signups`
- `GET /events/:id/attendance`
- `POST /events/:id/attendance/bulk`

## 数据模型影响

无直接数据模型影响。依赖活动、报名、签到任务中定义的模型。

## 验收标准

- 团长页面可以查看活动列表。
- 可以进入活动创建表单。
- 可以查看报名列表。
- 可以进入签到页面。
- 权限系统未完成前，页面必须标注为开发入口或隐藏在普通导航之外。

## 不做什么

- 不做真实权限控制。
- 不做复杂表单设计器。
- 不做导入截图。
- 不做消息推送。

## 测试要求

- 手动验证页面可以在微信开发者工具中打开。
- API 请求失败时页面显示错误或空状态。
- 表单必填项缺失时不能提交。

## V0.1 实现状态

已先实现一个轻量团长管理入口：`apps/miniapp/pages/leader/index.*`。

当前已接入能力：

- 查看活动列表。
- 创建活动。
- 开放报名。
- 锁定报名。
- 查看活动报名名单。
- 调用 `POST /events/:eventId/attendance/from-signups` 生成签到。

与原规划差异：

- V0.1 未拆分多个团长子页面，先用单页完成可体验闭环。
- 原规划中的 `POST /events/:id/attendance/bulk` 已按实际后端实现调整为 `POST /events/:id/attendance/from-signups`。
- 暂未实现真实权限控制，使用 `LEADER_ID=seed_member_laodongrenmin` 进行本地联调。

后续仍需补充：

- 更完整的活动编辑表单。
- 独立签到列表和签到状态修改入口。
- 接入 T020 权限系统后隐藏或保护团长入口。
