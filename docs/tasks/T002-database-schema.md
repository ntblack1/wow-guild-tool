# T002 数据库模型完善

## 目标

在现有 Prisma schema 基础上完善工会活动业务模型，为后续接口和统计功能提供稳定数据结构。

## 当前模型

- Member
- Character
- GuildEvent
- Signup
- Attendance
- Loot
- LuckyScore
- GuildNotice

## 当前设计说明

开发数据库使用 SQLite。Prisma SQLite 连接器不使用数据库原生 enum，因此 schema 中用 `String` 字段保存枚举值；TypeScript 层的枚举定义保留在 `packages/shared`，后续接口校验应以 shared 枚举为准。

## 后续重点

- 检查字段是否覆盖真实工会活动流程。
- 明确成员、角色和报名之间的业务约束。
- 为签到、掉落、橙装和气运值统计补充必要索引。
- 增加 seed 数据，方便本地开发和测试。

## 验收标准

- Prisma schema 可迁移。
- 关键关系和唯一约束清晰。
- 新增或调整字段有文档说明。
- 至少提供一组本地开发 seed 数据。
