# T021 数据导出

## 任务目标

提供基础数据导出能力，方便团长备份活动、报名、签到、掉落和排行榜数据。

## 背景说明

工会数据需要可迁移和可备份。第一版优先支持 CSV 或 JSON 导出，不做复杂报表平台。

## 涉及文件

- `apps/server/src/routes/export.ts`
- `apps/server/test/export.test.ts`
- `docs/dev/data-export.md`
- `docs/tasks/T021-data-export.md`

## 需要新增或修改的接口

- 新增 `GET /export/events`
- 新增 `GET /export/members`
- 新增 `GET /export/loot`
- 新增 `GET /events/:id/export`

支持 `format=json` 和 `format=csv`，默认 JSON。

## 数据模型影响

无直接数据模型影响。导出从现有模型读取。

## 验收标准

- 可以导出成员数据。
- 可以导出活动数据。
- 可以导出指定活动的报名、签到和掉落。
- CSV 输出包含稳定表头。
- JSON 输出符合统一响应格式。

## 不做什么

- 不做 Excel 样式美化。
- 不做自动定时备份。
- 不做云存储上传。
- 不做大数据分页优化，除非测试暴露明显问题。

## 测试要求

- 测试 JSON 导出成功。
- 测试 CSV 导出成功。
- 测试指定活动不存在失败。
- 测试 CSV 表头稳定。
- 运行 `npm run test` 必须通过。
