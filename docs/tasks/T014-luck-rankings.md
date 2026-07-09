# T014 红手榜和黑手榜

## 任务目标

基于掉落、橙装和气运值数据生成红手榜和黑手榜接口。

## 背景说明

红手榜和黑手榜是工会活动后的趣味统计。第一版以可解释、可复算为核心，不做复杂视觉效果。

## 涉及文件

- `apps/server/src/routes/rankings.ts`
- `apps/server/test/rankings.test.ts`
- `packages/shared/src/index.ts`
- `docs/product/ranking-rules.md`
- `docs/tasks/T014-luck-rankings.md`

## 需要新增或修改的接口

- 新增 `GET /rankings/red-hands`
- 新增 `GET /rankings/black-hands`
- 新增 `GET /events/:id/rankings`

## 数据模型影响

优先不新增模型，直接从 `Loot`、`LuckyScore`、`Attendance` 聚合。若性能不足，后续再新增排行榜快照模型。

## 验收标准

- 可以生成全局红手榜。
- 可以生成全局黑手榜。
- 可以生成单次活动榜单。
- 排名规则有文档说明。
- 相同分数时排序规则稳定。

## 不做什么

- 不做复杂图表。
- 不做历史快照存储。
- 不做成员申诉流程。
- 不做微信分享海报。

## 测试要求

- 测试红手榜排序。
- 测试黑手榜排序。
- 测试活动榜单只统计指定活动。
- 测试无数据时返回空列表。
- 运行 `npm run test` 必须通过。
