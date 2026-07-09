# wow-guild-tool 微信小程序 V0.1 验收报告

生成时间：2026-07-02

## 1. 本次任务完成概览

本次完成了微信小程序基础可用版本 V0.1，并补充了后端最小必要接口、测试数据脚本、数据库字段、文档和自检。

当前可以体验的基础流程：

1. 启动后端。
2. 写入本地测试数据。
3. 打开小程序首页查看活动列表。
4. 进入活动详情查看报名统计。
5. 使用 mock 成员“小黑娃”选择角色报名。
6. 在“我的”页面查看成员、角色和报名记录。
7. 在“团长管理”页面创建活动、开放报名、锁定报名、查看报名名单、从报名生成签到。
8. 在“调试”页面检查后端健康状态。

## 2. 实现了哪些页面

- `apps/miniapp/pages/index/index`：首页，展示活动列表、刷新、空状态和错误提示。
- `apps/miniapp/pages/event-detail/index`：活动详情页，展示活动信息、团长信息、职责需求、报名统计、报名按钮和报名名单。
- `apps/miniapp/pages/signup/index`：报名页，使用 mock 成员选择角色、职责、填写备注并提交报名。
- `apps/miniapp/pages/my/index`：我的页面，展示当前成员信息、角色列表和报名记录。
- `apps/miniapp/pages/leader/index`：团长管理页，支持创建活动、开放报名、锁定报名、查看报名名单、生成签到。
- `apps/miniapp/pages/debug/index`：调试页，展示 API 地址、当前成员、团长成员，并支持健康检查。

## 3. 实现了哪些 API 接入

小程序端已集中封装 API 请求：

- `GET /health`
- `GET /events`
- `POST /events`
- `GET /events/:id`
- `POST /events/:id/open-signup`
- `POST /events/:id/lock`
- `GET /events/:id/signups`
- `POST /events/:id/signups`
- `GET /events/:id/signup-summary`
- `POST /events/:id/attendance/from-signups`
- `GET /events/:id/attendance-summary`
- `GET /members/:id`
- `GET /members/:id/characters`
- `GET /members/:id/signups`

后端本次新增成员联调接口：

- `GET /members/:id`
- `GET /members/:id/characters`
- `GET /members/:id/signups`

## 4. 新增或修改了哪些文件

主要新增：

- `apps/miniapp/app.js`
- `apps/miniapp/app.json`
- `apps/miniapp/app.wxss`
- `apps/miniapp/project.config.json`
- `apps/miniapp/sitemap.json`
- `apps/miniapp/config/index.js`
- `apps/miniapp/utils/request.js`
- `apps/miniapp/utils/format.js`
- `apps/miniapp/services/*.js`
- `apps/miniapp/pages/index/*`
- `apps/miniapp/pages/event-detail/*`
- `apps/miniapp/pages/signup/*`
- `apps/miniapp/pages/my/*`
- `apps/miniapp/pages/leader/*`
- `apps/miniapp/pages/debug/*`
- `apps/miniapp/components/status-badge/*`
- `apps/server/src/routes/members.ts`
- `apps/server/test/members.test.ts`
- `scripts/seed.mjs`
- `prisma/migrations/20260702101825_init/migration.sql`
- `REPORT_MINIAPP_V01.md`

主要修改：

- `prisma/schema.prisma`
- `package.json`
- `apps/server/src/app.ts`
- `README.md`
- `CODEX.md`
- `AGENTS.md`
- `docs/dev/api-style.md`
- `docs/dev/getting-started.md`
- `docs/tasks/T016-miniapp-basic-pages.md`
- `docs/tasks/T017-leader-admin-pages.md`
- `docs/tasks/T018-member-profile.md`

## 5. 如何启动后端

在项目根目录执行：

```bash
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

默认后端地址：

```text
http://localhost:3000
```

健康检查：

```text
GET http://127.0.0.1:3000/health
```

期望返回：

```json
{
  "success": true,
  "data": {
    "status": "ok"
  }
}
```

## 6. 如何启动小程序

1. 确保后端已经运行在 `http://127.0.0.1:3000`。
2. 打开微信开发者工具。
3. 选择“导入项目”。
4. 项目目录选择：`H:\工会程序\apps\miniapp`。
5. AppID 可先使用测试号或保留 `project.config.json` 中的 `touristappid`。
6. 如本地请求被拦截，在开发者工具中关闭合法域名校验。

## 7. 如何打开微信开发者工具

本机检测到 CLI：

```text
C:\Program Files (x86)\Tencent\微信web开发者工具\cli.bat
```

手动打开方式：

1. 打开微信开发者工具。
2. 导入 `H:\工会程序\apps\miniapp`。
3. 打开后先进入底部 tab 的“调试”页。
4. 点击“测试后端健康检查”。

## 8. 是否成功自动打开微信开发者工具

未成功自动打开。

原因：

微信开发者工具 CLI 已找到，但服务端口关闭。CLI 返回：

```text
IDE service port disabled.
工具的服务端口已关闭。要使用命令行调用工具，请手动打开工具 -> 设置 -> 安全设置，将服务端口开启。
```

我没有停在交互确认，也没有修改你的微信开发者工具安全设置。已清理本次 CLI 尝试留下的等待进程。

## 9. 明天回来后应该先点哪里、看哪里

建议顺序：

1. 在项目根目录运行 `npm run dev`。
2. 打开微信开发者工具，导入 `H:\工会程序\apps\miniapp`。
3. 先点底部“调试”，点击“测试后端健康检查”。
4. 回到“活动”，确认能看到“八块腹肌今晚开团”。
5. 点进活动详情，查看报名统计。
6. 点“我要报名”，使用“小黑娃”的角色“毁灭术”报名。
7. 到“我的”查看报名记录。
8. 到“团长”查看报名名单，可尝试锁定报名和生成签到。

## 10. 当前 mock 的 memberId 是什么

当前普通成员：

```text
CURRENT_MEMBER_ID=seed_member_xiaoheiwa
```

当前团长：

```text
LEADER_ID=seed_member_laodongrenmin
```

配置位置：

```text
apps/miniapp/config/index.js
```

## 11. 如何修改 API_BASE_URL

修改文件：

```text
apps/miniapp/config/index.js
```

默认值：

```js
const API_BASE_URL = "http://127.0.0.1:3000";
```

如果使用手机真机预览，需要改成电脑局域网 IP，例如：

```js
const API_BASE_URL = "http://192.168.1.100:3000";
```

## 12. 如何生成测试数据

在项目根目录执行：

```bash
npm run db:migrate
npm run db:seed
```

Seed 数据包括：

- 团长：劳动人民，`seed_member_laodongrenmin`
- 普通成员：小黑娃，`seed_member_xiaoheiwa`
- 普通成员：眉颦笑浅，`seed_member_meipinxiaoqian`
- 角色：劳动人民战士、小黑娃毁灭术、眉颦笑浅防骑
- 活动：八块腹肌今晚开团 / 奥杜尔 25人，状态 `signup_open`

Seed 脚本使用 upsert，不会清空数据库。

## 13. 已通过的测试

已执行并通过：

```bash
npm install
npm run db:migrate
npm run db:seed
npm run build
npm run test
```

小程序静态检查：

- 所有 `apps/miniapp/**/*.js` 通过 `node -c` 语法检查。
- 所有 `apps/miniapp/**/*.json` 通过 JSON 解析检查。

后端实际健康检查：

```json
{
  "success": true,
  "data": {
    "status": "ok"
  }
}
```

测试结果：

- Test Files：6 passed
- Tests：30 passed

## 14. 未完成事项

- 未接入微信登录，当前使用 mock memberId。
- 未实现复杂权限，团长入口当前为开发期可见入口。
- 未实现支付。
- 未实现气运值、红手榜、黑手榜。
- 未实现活动海报。
- 未实现完整成员资料编辑。
- 未实现独立签到管理页面，只提供从报名生成签到的入口。
- 未完成真机预览，因为微信开发者工具服务端口未开启。

## 15. 下一步建议

1. 手动打开微信开发者工具并导入 `apps/miniapp`，完成首轮页面体验。
2. 开启微信开发者工具“设置 -> 安全设置 -> 服务端口”，方便后续自动预览。
3. 开发 T006/T018 的成员与角色管理页面，补齐角色新增/编辑。
4. 开发团长签到列表页，支持修改 present/late/absent/standby。
5. 准备微信登录任务，但先不要引入复杂权限。
6. 小程序页面体验稳定后，再规划公告、掉落、排行榜等后续功能。
