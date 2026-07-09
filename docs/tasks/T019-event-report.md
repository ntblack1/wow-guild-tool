# T019 活动战报生成

## 任务目标

生成活动战报数据，用于活动结束后总结签到、报名、掉落、红手和黑手信息。

## 背景说明

活动战报是工会活动复盘和群内分享的基础。第一版先生成结构化 JSON，不生成图片海报。

## 涉及文件

- `apps/server/src/routes/event-reports.ts`
- `apps/server/test/event-reports.test.ts`
- `docs/product/event-report.md`
- `docs/tasks/T019-event-report.md`

## 需要新增或修改的接口

- 新增 `GET /events/:id/report`
- 新增 `POST /events/:id/report/rebuild`

## 数据模型影响

第一版优先不新增模型，实时聚合活动、报名、签到、掉落和排行榜数据。若性能不足，后续再新增 `EventReportSnapshot`。

## 验收标准

- 战报包含活动基础信息。
- 战报包含报名人数、签到人数和缺席人数。
- 战报包含掉落列表和掉落数量。
- 战报包含活动内红手和黑手摘要。
- 活动不存在时返回稳定错误码。

## 不做什么

- 不做图片海报生成。
- 不做自动发微信群。
- 不做外部分享链接。
- 不做复杂模板系统。

## 测试要求

- 测试战报生成成功。
- 测试无掉落活动也能生成战报。
- 测试活动不存在失败。
- 运行 `npm run test` 必须通过。
