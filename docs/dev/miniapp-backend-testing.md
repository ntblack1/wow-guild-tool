# 小程序后端联调与上线测试说明

## 本地开发者工具测试

1. 准备数据库：

```bash
npm run db:migrate
npm run db:seed
```

2. 启动后端：

```bash
npm run dev
```

3. 检查后端是否可用于小程序测试：

```bash
npm run check:backend
```

看到以下结果即可继续：

```text
OK /health
OK /events
OK /members
OK /members/seed_member_xiaoheiwa/characters
Backend is ready for miniapp testing.
```

4. 微信开发者工具中打开项目根目录 `H:\工会程序`，或打开 `apps/miniapp`。

本地开发者工具默认 API 地址：

```text
http://192.168.50.101:3000
```

如果调试页显示后端不可用，先确认：

- `npm run dev` 是否正在运行。
- `npm run check:backend` 是否通过。
- 微信开发者工具项目设置里是否关闭“校验合法域名、web-view、TLS 版本以及 HTTPS 证书”。
- 小程序调试页的 API 地址是否被手动改成了错误地址；可以点“恢复默认”。

## 真机预览或体验版测试

真机不能使用 `http://127.0.0.1:3000` 访问电脑后端，因为手机上的 `127.0.0.1` 指向手机自己。

真机测试有两种方式：

### 方式 A：局域网临时测试

电脑和手机连接同一 Wi-Fi。

1. 查看电脑局域网 IP，例如 `192.168.1.23`。
2. 确认后端运行中：

```bash
npm run dev
```

3. 在小程序“调试”页把 API 地址改成：

```text
http://192.168.1.23:3000
```

4. 如果仍然失败，检查 Windows 防火墙是否允许 Node.js 监听 3000 端口。

这种方式只适合开发联调，不适合正式体验版发布。

### 方式 B：体验版/线上测试

微信小程序体验版和线上版本应使用 HTTPS 后端域名。

要求：

- 后端部署到公网服务器。
- 域名已备案并配置 HTTPS 证书。
- 在微信公众平台小程序后台配置 request 合法域名。
- 小程序 `apps/miniapp/config/index.js` 中 `MINIAPP_API_BASE_URLS.trial` 和 `MINIAPP_API_BASE_URLS.release` 改成 HTTPS 域名，例如：

```text
https://api.example.com
```

发布前检查：

```bash
npm run check:miniapp-release
```

如果这个命令失败，不要上传体验版；先修正 HTTPS API 域名。

当前项目没有微信登录，体验版测试仍使用内测成员选择方案：

- 默认成员：`seed_member_xiaoheiwa`
- 团长：`seed_member_laodongrenmin`
- 可在“我的”页切换当前成员。

## 常见问题

### 后端健康检查正常，但活动列表失败

现在 `/health` 会同时检查数据库：

```json
{
  "status": "ok",
  "database": "ok"
}
```

如果活动列表失败，优先运行：

```bash
npm run db:migrate
npm run db:seed
npm run check:backend
```

### 运行测试后演示数据被污染

后端测试已改为使用独立的 `prisma/test.db`，不会再污染本地演示库。

如果本地演示库已经混入测试数据，运行：

```bash
npm run db:seed
```

Seed 会保留固定演示成员和活动，并清理已知自动化测试夹具。
