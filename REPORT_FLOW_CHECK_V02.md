# REPORT_FLOW_CHECK_V02

执行日期：2026-07-03

## 1. 完整流程是否跑通

结论：后端真实开团闭环已跑通；小程序侧已补齐团长页签到操作入口，可以支持小范围内测前的演示流程。

已通过接口完整模拟：

1. 后端健康检查。
2. seed 写入测试数据。
3. 首页活动列表加载。
4. 进入“八块腹肌今晚开团”活动详情。
5. mock 当前成员“小黑娃”报名。
6. 报名后统计从 0 变为 1。
7. 团长查看报名名单。
8. 团长锁定报名。
9. 团长根据报名生成签到。
10. 修改小黑娃为 `late`。
11. 出勤统计显示 `lateCount=1`、`totalAttendanceCount=1`。

## 2. 跑通了哪些步骤

- `GET /health` 返回 `{ success: true, data: { status: "ok" } }`。
- `GET /events` 能返回“八块腹肌今晚开团”。
- `GET /events/seed_event_ulduar_25` 能返回活动详情、团长和报名统计。
- `GET /members/seed_member_xiaoheiwa/characters` 能返回小黑娃角色“毁灭术”。
- `POST /events/seed_event_ulduar_25/signups` 能完成报名。
- `GET /events/seed_event_ulduar_25/signup-summary` 报名后显示 `signedCount=1`、`rangedSigned=1`。
- `GET /events/seed_event_ulduar_25/signups` 能在团长页展示报名名单。
- `POST /events/seed_event_ulduar_25/lock` 能锁定报名。
- `POST /events/seed_event_ulduar_25/attendance/from-signups` 能生成签到。
- `PATCH /attendance/:id` 能把签到状态改为 `late`。
- `GET /events/seed_event_ulduar_25/attendance-summary` 能返回出勤统计。

## 3. 哪些步骤失败

- 首次执行 `npm run db:migrate` 时，数据库迁移本身显示已同步，但 Prisma Client generate 阶段遇到 Windows 文件占用：
  - `EPERM: operation not permitted, rename ... query_engine-windows.dll.node`
  - 后续执行 `npx prisma migrate status --schema prisma/schema.prisma` 确认：`Database schema is up to date!`
  - 判断：这不是 migration 未应用，而是运行中的 Node/后端进程占用了 Prisma 引擎文件。真实迁移前建议先停止正在运行的后端或微信工具相关 Node 进程。
- 小程序没有项目专属构建 npm script，因此本次用 JS 语法检查和 JSON 配置解析作为本地检查。
- 本次没有用微信开发者工具真实点击截图验证所有页面，只做了项目配置、页面源码、服务封装和接口闭环检查。

## 4. 修复了哪些问题

- 团长管理页新增“查看签到”入口。
- 团长管理页新增出勤统计显示。
- 团长管理页可直接把成员签到状态改为出勤、迟到、缺席、候补。
- `apps/miniapp/services/attendance.js` 新增：
  - `listAttendance(eventId)`
  - `updateAttendance(attendanceId, data)`
- `scripts/seed.mjs` 会在写入 seed 数据前清理演示活动已有报名和签到，避免重复演示时必须手动改数据库。
- `apps/miniapp/README.md` 补充端口说明：
  - 后端 API 默认是 `http://127.0.0.1:3000`
  - 微信开发者工具“设置 - 安全设置 - 服务端口”的 `25404` 不是本项目后端 API 端口。
- `docs/tasks/T010-business-loop-check.md` 更新 V0.2 自检与修复记录。

## 5. 还遗留哪些问题

- `npm run db:migrate` 在后端或其他 Node 进程占用 Prisma Client DLL 时会显示 generate 阶段 EPERM；迁移状态本身正常。
- 小程序时间显示使用本机 `Date` 解析，当前能显示本地时间，但还没有统一标注时区。
- 报名失败提示会展示后端英文错误信息，例如 `event signup is not open`，含义明确但不够中文化。
- 团长管理页能完成主流程，但仍是基础操作页，不是最终运营后台。
- 当前没有真实登录，用户切换依赖 `apps/miniapp/config/index.js` 中的 mock ID。

## 6. 明天真实给工会成员试用前，还需要做什么

1. 先运行 `npm run db:seed`，确保演示数据恢复到干净状态。
2. 启动后端，并确认调试页健康检查成功。
3. 确认小程序 `API_BASE_URL` 指向真实可访问的后端地址。
4. 如果在手机真机预览，`127.0.0.1` 不能代表电脑后端，需要改成局域网 IP 或部署地址。
5. 提前决定试用成员是否都共用 mock“小黑娃”，还是临时改 `CURRENT_MEMBER_ID` 做多账号演示。
6. 演示前不要运行会锁定活动的操作，除非已确认要进入签到流程。

## 7. 当前最适合演示的操作路径

1. 项目根目录运行 `npm run db:seed`。
2. 项目根目录运行 `npm run dev`。
3. 微信开发者工具打开 `apps/miniapp`。
4. 进入“调试”页，点击健康检查。
5. 进入“活动”页，打开“八块腹肌今晚开团”。
6. 点击报名，使用“小黑娃 / 毁灭术 / 远程”报名。
7. 回活动详情页确认报名统计增加。
8. 进入“团长”页，点击“查看报名”。
9. 点击“锁定报名”。
10. 点击“生成签到”。
11. 点击“查看签到”。
12. 在签到名单中把小黑娃点为“迟到”。
13. 查看出勤统计中迟到人数变化。

## 8. 当前 mock 用户配置在哪里

文件：`apps/miniapp/config/index.js`

```js
const API_BASE_URL = "http://127.0.0.1:3000";
const CURRENT_MEMBER_ID = "seed_member_xiaoheiwa";
const LEADER_ID = "seed_member_laodongrenmin";
```

## 9. 当前团长账号/成员账号/测试角色数据是什么

- 团长：劳动人民
  - memberId：`seed_member_laodongrenmin`
  - role：`raid_leader`
  - 角色：`seed_character_laodongrenmin_warrior`
- 当前 mock 成员：小黑娃
  - memberId：`seed_member_xiaoheiwa`
  - role：`member`
  - 角色：`seed_character_xiaoheiwa_warlock`
  - 角色名：毁灭术
  - 职责：`ranged`
- 备用成员：眉贫笑浅
  - memberId：`seed_member_meipinxiaoqian`
  - role：`member`
  - 角色：`seed_character_meipinxiaoqian_paladin`
  - 职责：`tank`
- 测试活动：
  - eventId：`seed_event_ulduar_25`
  - 标题：八块腹肌今晚开团
  - 副本：奥杜尔 25人
  - seed 后状态：`signup_open`

## 10. 下一步开发建议

1. 将后端错误 message 做中文化映射，提升成员试用体验。
2. 增加一个简单的 mock 用户切换方式，仍不做微信登录。
3. 明确本地、局域网、部署环境的 `API_BASE_URL` 配置方式。
4. 给团长页增加更清楚的状态限制提示，例如已锁定后不再显示“开放报名”作为主要操作。
5. 再做一次微信开发者工具真实点击验收，重点看手机尺寸下按钮换行和列表可读性。

## 11. 验证命令结果

- `npm run db:seed`：通过。
- `npx prisma migrate status --schema prisma/schema.prisma`：通过，数据库 schema 已是最新。
- `npm run db:migrate`：数据库已同步；Prisma Client generate 阶段受 Windows 文件占用影响显示 EPERM。
- 小程序 JS 语法检查：通过。
- 小程序 JSON 配置解析：通过。
- `npm run build`：通过。
- `npm run test`：通过，6 个测试文件、30 个测试全部通过。

## 12. 最终内测结论

可以进入小范围内测。

建议范围：先给团长和 1-3 名熟悉流程的成员试用，只验证活动浏览、报名、团长查看名单、锁定、生成签到和修改出勤状态。

建议使用方式：本地或局域网内测前先运行 `npm run db:seed`，使用调试页确认后端健康，再按推荐演示路径操作。当前版本不适合大范围成员同时使用，也不适合直接替代正式 DKP/掉落/排行榜工具。
