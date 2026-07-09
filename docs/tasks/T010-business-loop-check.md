# T010 成员-角色-活动-报名-签到闭环自检

## 任务目标

检查当前项目是否已经形成第一条可运行的业务闭环：成员和角色准备、团长创建活动、成员报名、锁定活动、从报名生成签到、修改出勤状态并查看统计。

## 本次 V0.2 自检记录

执行日期：2026-07-03

本次重点检查微信小程序基础版 V0.1 是否能支撑“八块腹肌工会真实开团流程”。检查结果记录在根目录 `REPORT_FLOW_CHECK_V02.md`。

## 已验证流程

1. 数据库迁移检查。
2. 写入 seed 测试数据。
3. 后端健康检查。
4. 首页活动列表接口。
5. “八块腹肌今晚开团”活动详情接口。
6. mock 成员“小黑娃”报名。
7. 报名后活动详情统计变化。
8. 团长查看报名名单。
9. 团长锁定报名。
10. 团长根据报名生成签到。
11. 修改一个签到记录为 `late`。
12. 查看出勤统计。

## V0.2 修复

- 团长管理页增加“查看签到”入口。
- 团长管理页展示出勤统计。
- 团长管理页可直接修改签到状态为出勤、迟到、缺席、候补。
- 小程序签到服务补充 `GET /events/:id/attendance` 和 `PATCH /attendance/:id` 封装。
- `npm run db:seed` 会清理演示活动已有报名和签到，避免重复演示时必须手动改数据库。
- 小程序 README 补充后端 API 端口和微信开发者工具服务端口的区别。

## 当前接口覆盖

- `GET /health`
- `GET /events`
- `POST /events`
- `GET /events/:id`
- `POST /events/:id/open-signup`
- `POST /events/:id/lock`
- `GET /events/:id/signups`
- `POST /events/:id/signups`
- `GET /events/:id/signup-summary`
- `GET /events/:id/attendance`
- `POST /events/:id/attendance/from-signups`
- `PATCH /attendance/:id`
- `GET /events/:id/attendance-summary`

## 数据模型影响

本次没有新增模型或字段，没有生成新的 migration。

## 测试要求

- 运行 `npm run build`。
- 运行 `npm run test`。
- 小程序至少运行 JS 语法检查和 JSON 配置解析检查。

## 不做什么

- 不开发微信登录。
- 不开发支付。
- 不开发复杂权限。
- 不开发排行榜、掉落统计、气运值、红手榜、黑手榜或海报生成。
