# T015 工会公告

## 任务目标

实现工会公告管理和查询，让小程序可以展示重要通知。

## 背景说明

当前已有 `GuildNotice` 模型，但没有接口。公告是小程序首页和活动页的重要信息入口。

## 涉及文件

- `apps/server/src/routes/notices.ts`
- `apps/server/test/notices.test.ts`
- `prisma/schema.prisma`
- `docs/tasks/T015-guild-notice.md`

## 需要新增或修改的接口

- 新增 `GET /notices`
- 新增 `POST /notices`
- 新增 `GET /notices/:id`
- 新增 `PATCH /notices/:id`
- 新增 `DELETE /notices/:id`

## 数据模型影响

优先复用 `GuildNotice`。建议增加：

- `status String @default("DRAFT")`
- `pinned Boolean @default(false)`

## 验收标准

- 可以创建公告。
- 可以发布公告。
- 可以置顶公告。
- 普通列表默认只返回已发布公告。
- 公告内容不能为空。

## 不做什么

- 不做富文本编辑器。
- 不做图片上传。
- 不做订阅消息推送。
- 不做复杂权限。

## 测试要求

- 测试创建公告成功。
- 测试空标题或空内容失败。
- 测试只查询已发布公告。
- 测试置顶公告排序优先。
- 运行 `npm run test` 必须通过。
