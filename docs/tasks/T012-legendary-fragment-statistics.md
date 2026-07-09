# T012 橙装与碎片统计

## 任务目标

在掉落统计基础上增加橙装和碎片记录能力，支持成员维度的橙装进度查看。

## 背景说明

魔兽世界工会活动常需要长期追踪橙装、碎片或特殊材料。第一版只做结构化记录和汇总，不做复杂概率分析。

## 涉及文件

- `apps/server/src/routes/legendary.ts`
- `apps/server/test/legendary.test.ts`
- `packages/shared/src/index.ts`
- `prisma/schema.prisma`
- `docs/tasks/T012-legendary-fragment-statistics.md`

## 需要新增或修改的接口

- 新增 `GET /members/:id/legendary`
- 新增 `POST /members/:id/legendary`
- 新增 `PATCH /legendary-records/:id`
- 新增 `GET /legendary/summary`

## 数据模型影响

建议新增模型 `LegendaryRecord`：

- `id`
- `memberId`
- `characterId`
- `eventId`
- `recordType`
- `itemName`
- `quantity`
- `note`
- `createdAt`
- `updatedAt`

`recordType` 使用字符串保存，例如 `LEGENDARY_ITEM`、`FRAGMENT`。

## 验收标准

- 可以为成员记录橙装或碎片。
- 可以关联活动和角色。
- 可以查看单个成员的橙装进度。
- 可以查看全工会汇总。
- 所有数量字段必须为正整数。

## 不做什么

- 不做游戏数据库接入。
- 不做自动识别截图。
- 不做掉落概率预测。
- 不做排行榜展示，排行榜留到 T014。

## 测试要求

- 测试新增碎片记录成功。
- 测试数量非法失败。
- 测试成员橙装汇总。
- 测试全局汇总。
- 运行 `npm run test` 必须通过。
