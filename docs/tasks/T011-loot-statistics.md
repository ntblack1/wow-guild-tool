# T011 掉落统计

## 任务目标

实现活动掉落记录和基础统计，支持活动后查看装备分配情况。

## 背景说明

当前已有 `Loot` 模型，但缺少录入、查询和统计接口。掉落统计是后续红手榜、黑手榜、橙装统计和活动战报的基础。

## 涉及文件

- `apps/server/src/routes/events.ts`
- `apps/server/src/routes/loot.ts`
- `apps/server/test/loot.test.ts`
- `packages/shared/src/index.ts`
- `prisma/schema.prisma`
- `docs/tasks/T011-loot-statistics.md`

## 需要新增或修改的接口

- 新增 `GET /events/:id/loot`
- 新增 `POST /events/:id/loot`
- 新增 `PATCH /loot/:id`
- 新增 `DELETE /loot/:id`
- 新增 `GET /members/:id/loot`

## 数据模型影响

优先复用 `Loot`。如需记录来源，可增加：

- `sourceBoss String?`
- `itemLevel Int?`

## 验收标准

- 可以为活动录入掉落。
- 掉落可以关联成员和角色，也允许暂不分配。
- 可以按活动查询掉落列表。
- 可以按成员查询获得记录。
- 删除掉落应优先采用硬删除或软删除中的一种，并写入文档。

## 不做什么

- 不做装备数据库爬取。
- 不做物品图标自动匹配。
- 不做复杂分配规则。
- 不做拍卖或金币统计。

## 测试要求

- 测试录入掉落成功。
- 测试活动不存在时录入失败。
- 测试成员或角色不存在时录入失败。
- 测试活动掉落列表。
- 运行 `npm run test` 必须通过。
