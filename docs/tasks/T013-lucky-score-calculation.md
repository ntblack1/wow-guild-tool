# T013 气运值计算

## 任务目标

建立气运值记录和计算规则，为成员运气趋势、红手榜和黑手榜提供基础数据。

## 背景说明

当前已有 `LuckyScore` 模型，但没有计算规则。第一版应采用简单透明的规则，便于工会成员理解和人工校正。

## 涉及文件

- `apps/server/src/routes/lucky-score.ts`
- `apps/server/test/lucky-score.test.ts`
- `packages/shared/src/index.ts`
- `prisma/schema.prisma`
- `docs/tasks/T013-lucky-score-calculation.md`

## 需要新增或修改的接口

- 新增 `GET /members/:id/lucky-score`
- 新增 `POST /members/:id/lucky-score`
- 新增 `GET /lucky-score/ranking`
- 新增 `POST /events/:id/lucky-score/recalculate`

## 数据模型影响

优先复用 `LuckyScore`。建议增加：

- `sourceType String @default("MANUAL")`
- `sourceId String?`

用于区分手动记录、掉落记录、签到记录或重算记录。

## 验收标准

- 可以手动为成员增加或扣减气运值。
- 可以按成员查看气运值明细。
- 可以按总分生成排行榜。
- 活动重算接口只影响该活动相关记录。
- 计算规则写入 `docs/product` 或 `docs/dev`。

## 不做什么

- 不做复杂机器学习或概率模型。
- 不做自动惩罚规则。
- 不做不可解释的隐藏分。
- 不做 UI 展示。

## 测试要求

- 测试手动加分成功。
- 测试手动扣分成功。
- 测试成员总分计算。
- 测试排行榜排序。
- 运行 `npm run test` 必须通过。
