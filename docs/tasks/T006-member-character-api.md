# T006 成员与角色管理 API

## 任务目标

建立成员和游戏角色的基础管理能力，支持后续报名、签到、掉落归属和个人主页。

## 背景说明

当前已有 `Member` 和 `Character` 数据模型，但还没有对外 API。成员代表工会中的真实玩家，角色代表玩家在魔兽世界中的游戏角色。第一版只做基础增删改查和主角色标记，不做微信登录绑定。

## 涉及文件

- `apps/server/src/routes/members.ts`
- `apps/server/src/app.ts`
- `apps/server/test/members.test.ts`
- `packages/shared/src/index.ts`
- `docs/dev/api-style.md`
- `docs/tasks/T006-member-character-api.md`

## 需要新增或修改的接口

- 新增 `GET /members`
- 新增 `POST /members`
- 新增 `GET /members/:id`
- 新增 `PATCH /members/:id`
- 新增 `GET /members/:id/characters`
- 新增 `POST /members/:id/characters`
- 新增 `PATCH /characters/:id`

## 数据模型影响

优先复用现有 `Member` 和 `Character`。如需补充字段，只允许补充非敏感、业务必需字段，例如 `roleNote`、`isActive`，并同步生成 Prisma migration。

## 验收标准

- 可以创建成员。
- 可以为成员创建角色。
- 可以查询成员详情和角色列表。
- 可以更新成员基础信息和角色基础信息。
- 所有接口符合统一响应格式。
- 角色职业值必须来自 `packages/shared` 的 `CharacterClass`。

## 不做什么

- 不做微信登录。
- 不做手机号、身份证等敏感信息。
- 不做复杂权限。
- 不做成员 DKP、气运值或排行榜计算。

## 测试要求

- 测试创建成员成功。
- 测试创建角色成功。
- 测试成员不存在时创建角色返回稳定错误码。
- 测试非法职业值返回参数错误。
- 运行 `npm run test` 必须通过。
