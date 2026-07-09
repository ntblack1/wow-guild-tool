# 开发启动说明

## 环境要求

- Node.js 20 或更高版本
- npm 10 或更高版本

## 常用命令

```bash
npm install
npm run db:migrate
npm run db:seed
npm run dev
npm run test
npm run build
```

默认后端地址为 `http://localhost:3000`。

## 微信小程序本地联调

1. 运行 `npm run db:migrate` 和 `npm run db:seed` 准备演示数据。
2. 运行 `npm run dev` 启动后端。
3. 用微信开发者工具导入 `apps/miniapp`。
4. 小程序 API 地址配置在 `apps/miniapp/config/index.js`，默认是 `http://192.168.50.101:3000`。
5. 当前 mock 成员是 `seed_member_xiaoheiwa`，团长入口使用 `seed_member_laodongrenmin`。
