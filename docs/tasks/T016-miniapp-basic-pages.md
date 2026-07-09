# T016 微信小程序基础页面

## 任务目标

创建原生微信小程序基础骨架和第一批页面，使项目可以被微信开发者工具打开并进行后端联调。

## 背景说明

`apps/miniapp` 当前是占位目录。本机已检测到微信开发者工具，下一步可以使用原生小程序结构降低依赖重量。

## 涉及文件

- `apps/miniapp/project.config.json`
- `apps/miniapp/app.json`
- `apps/miniapp/app.ts`
- `apps/miniapp/app.wxss`
- `apps/miniapp/pages/events/index.*`
- `apps/miniapp/pages/event-detail/index.*`
- `apps/miniapp/pages/notices/index.*`
- `apps/miniapp/utils/api.ts`
- `apps/miniapp/README.md`
- `docs/tasks/T016-miniapp-basic-pages.md`

## 需要新增或修改的接口

后端接口不新增。小程序端需要调用：

- `GET /health`
- `GET /events`
- `GET /events/:id`
- `GET /notices`

若 `GET /notices` 尚未实现，页面应保留空状态，不阻塞小程序打开。

## 数据模型影响

无直接数据模型影响。

## 验收标准

- 微信开发者工具可以打开 `apps/miniapp`。
- 小程序包含活动列表、活动详情、公告列表占位页。
- API 封装统一处理 `{ success, data, error }`。
- 页面不依赖登录。
- README 写明本地联调后端地址配置方式。

## 不做什么

- 不做微信登录。
- 不做复杂 UI。
- 不做活动海报。
- 不做支付或订阅消息。

## 测试要求

- 至少运行 TypeScript 或静态检查命令，若暂未配置需在 README 说明。
- 手动用微信开发者工具打开项目。
- 后端启动时，活动列表页能请求接口或显示空状态。

## V0.1 实现状态

已完成原生微信小程序基础结构，未引入额外前端框架。

已实现页面：

- `pages/index/index`：活动列表页。
- `pages/event-detail/index`：活动详情页，包含报名统计和报名名单入口。
- `pages/signup/index`：报名页，使用 `CURRENT_MEMBER_ID` 选择角色和职责报名。
- `pages/my/index`：我的页面，展示成员、角色和报名记录。
- `pages/leader/index`：团长管理页，支持创建活动、开放报名、锁定报名、查看报名、生成签到。
- `pages/debug/index`：调试页，显示 API 配置并测试健康检查。

当前后端联调依赖：

- `GET /health`
- `GET /events`
- `POST /events`
- `GET /events/:id`
- `POST /events/:id/open-signup`
- `POST /events/:id/lock`
- `GET /events/:id/signups`
- `POST /events/:id/signups`
- `GET /events/:id/signup-summary`
- `POST /events/:id/attendance/from-signups`
- `GET /members/:id`
- `GET /members/:id/characters`
- `GET /members/:id/signups`

验收记录：

- 小程序 JS 语法检查通过。
- 小程序 JSON 配置解析通过。
- 后端 `npm run build` 通过。
- 后端 `npm run test` 通过。
## 2026-07-03 UI 与配图优化记录

已按用户确认的 B 路线完成核心页面视觉优化：

- 首页 `pages/index/index` 调整为“八块腹肌活动大厅”，使用工会大厅配图、副本活动卡、状态徽章和报名进度条。
- 活动详情页 `pages/event-detail/index` 调整为副本战报式布局，展示副本图、报名进度、职业需求、报名统计和名单。
- 报名页 `pages/signup/index` 调整为“选择出战角色”主题表单，保留原有报名逻辑。
- 我的角色页 `pages/my/index` 调整为角色名册，展示 Q 版角色头像、职责标签、装等和主号状态。
- 新增 `apps/miniapp/assets/images/` 项目内静态配图，包含原创高幻想工会大厅、副本图和 Q 版职业角色。
- 新增 `apps/miniapp/utils/theme.js`，用于前端展示字段映射，不改变后端接口或数据模型。

本次不涉及微信登录、支付、复杂权限、排行榜、活动海报、后端接口或 Prisma schema。
