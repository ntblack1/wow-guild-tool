# REPORT_MEMBER_SWITCH_V02

执行日期：2026-07-03

## 1. 目标

为微信小程序增加“当前成员切换”能力，用于小范围内测阶段替代微信登录。

本方案不做微信登录、不做手机号授权、不做复杂权限，只允许内测用户在小程序内选择自己的成员身份，并保存到本地 storage。

## 2. 实现内容

- 新增后端成员列表接口：`GET /members`
- 新增小程序当前成员工具：`apps/miniapp/utils/current-member.js`
- “我的”页支持：
  - 显示当前成员选择状态
  - 拉取成员列表
  - picker 切换当前成员
  - 保存 memberId 到本地 storage
  - 清除当前成员
  - 根据当前选择展示成员详情、角色列表、报名记录
- “报名”页支持：
  - 从本地 storage 读取当前选择成员
  - 未选择成员时提示先去“我的”页选择
  - 选择成员后按该成员加载角色
  - 提交报名时使用当前选择的 memberId
- “调试”页支持：
  - 显示本地选择 memberId
  - 显示当前可用 memberId
  - 显示当前成员详情
  - 清除当前成员
- 根 `npm run test` 已纳入小程序 JS 测试。

## 3. 当前 memberId 保存在哪里

微信小程序本地 storage：

```text
wow_guild_tool_current_member_id
```

读取优先级：

1. 用户在“我的”页选择并保存到 storage 的 memberId。
2. `apps/miniapp/config/index.js` 中的 `CURRENT_MEMBER_ID` 兜底值。

报名页要求必须显式选择成员；仅有配置兜底值时会提示先选择成员，避免多人内测误用同一个默认账号报名。

## 4. 如何切换当前成员

1. 打开小程序“我的”页。
2. 在“切换当前成员”区域选择成员。
3. 小程序会保存选择结果，并刷新当前成员、角色和报名记录。
4. 需要重新选择时再次打开 picker。
5. 需要清空时点击“清除当前成员”。

## 5. 测试数据成员

- 劳动人民：`seed_member_laodongrenmin`
- 小黑娃：`seed_member_xiaoheiwa`
- 眉贫笑浅：`seed_member_meipinxiaoqian`

## 6. 后续微信登录如何替换

正式微信登录阶段建议：

1. 小程序调用微信登录获取 code。
2. 后端用 code 换取 openid。
3. 后端根据 openid 绑定或查找工会 Member。
4. 小程序不再让用户手动选择 memberId。
5. `apps/miniapp/utils/current-member.js` 改为从后端会话或本地 token 派生当前成员。
6. 页面继续通过当前成员工具读取身份，避免大范围改页面。

## 7. 验证结果

- 后端成员列表接口测试：通过。
- current-member storage 工具测试：通过。
- 报名页未选择成员提示测试：通过。
- 报名页选择成员后加载角色测试：通过。
- 小程序 JS 语法检查：通过。
- 小程序 JSON 配置解析：通过。
- `npm run build`：通过。
- `npm run test`：通过。

## 8. 内测结论

可以用于小范围内测。

建议使用方式：内测成员先进入“我的”页选择自己的成员身份，再进行报名。团长管理页仍使用 `LEADER_ID` 配置作为团长身份，不进入复杂权限阶段。
