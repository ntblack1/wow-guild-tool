# 八块腹肌工会 Web 工具

给魔兽世界“八块腹肌工会”使用的活动报名、工会论坛与战报 Web 应用。第一版采用普通网页形式，通过微信群分享链接使用，不做微信小程序上线审核。

视觉方向：轻奇幻、移动端优先，不使用任何魔兽世界官方素材。

## 技术栈

- React + Vite + TypeScript
- Tailwind CSS
- lucide-react
- Supabase Auth + Database
- Cloudflare Pages

## 目录

```text
apps/web/             Web 前端应用
supabase/schema.sql   Supabase 建表和 RLS SQL
docs/design-system.md 设计系统
docs/design-assets.md 视觉素材说明
docs/roadmap.md       后续开发计划
```

旧的 `apps/miniapp` 和 `apps/server` 暂时保留；当前网页 MVP 的主要代码在 `apps/web`。

## 本地运行

安装依赖：

```bash
npm install
```

复制环境变量：

```powershell
Copy-Item .env.example .env
```

在 `.env` 中填写：

```bash
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-public-anon-key"
```

这两个值必须来自你的 Supabase 项目。修改 `.env` 后需要重新启动 Web 开发服务，页面才会读到新配置。

启动 Web 开发服务：

```bash
npm run dev:web
```

构建：

```bash
npm run build:web
```

测试：

```bash
npm run test:web
```

## Supabase 配置

1. 在 Supabase 创建新项目。
2. 打开 Supabase SQL Editor。
3. 执行 `supabase/schema.sql` 中的全部 SQL。
4. 打开 Authentication，启用 Email 登录。
5. 在 Project Settings 中找到 Project URL 和 anon public key。
6. 填入本地 `.env` 和 Cloudflare Pages 环境变量。

如果之前已经执行过旧版 SQL，也可以重新执行当前 `supabase/schema.sql`。脚本会修正报名状态、论坛板块的中文 check 约束，并增加取消报名所需的删除策略。

### 设置管理员

用户第一次通过邮箱登录后，会自动写入 `profiles`。把某个用户设为管理员：

```sql
update public.profiles
set role = 'admin', display_name = '团长昵称'
where id = '用户 uuid';
```

团长也可以使用：

```sql
update public.profiles
set role = 'leader'
where id = '用户 uuid';
```

## Cloudflare Pages 部署

1. 将代码推送到 GitHub。
2. 在 Cloudflare Pages 新建项目并连接仓库。
3. 构建设置：
   - Framework preset: Vite
   - Root directory: `/`
   - Build command: `npm run build:web`
   - Build output directory: `apps/web/dist`
4. 在 Cloudflare Pages 的 Environment variables 中添加：
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. 部署后，把 Pages 生成的网址分享到微信群。

## 当前 MVP 功能

- 首页展示工会名称、最近活动、最新帖子、入口和成员图。
- 邮箱登录。
- 用户创建、编辑、删除自己的多个角色。
- 管理员/团长创建活动。
- 活动列表显示报名人数、人数上限、状态和当前阵容缺口。
- 成员选择自己的角色报名，已报名后可以取消报名。
- 同一角色重复报名同一活动会显示友好提示。
- 活动详情按 T / 治疗 / DPS 展示阵容。
- 管理员/团长修改报名状态：已报名、已确认、替补、请假。
- 用户发帖、筛选板块、按最新/热门浏览帖子。
- 帖子置顶优先展示，管理员/团长可以置顶或取消置顶。
- 帖子详情展示正文、作者、评论列表，登录用户可以评论。
- 战报页静态原型和 `reports` 数据表。

## 第一版暂不做

- 微信登录
- 支付
- 复杂权限后台
- 排行榜
- 活动海报
- 官方素材或可能侵权素材

## 设计与素材

- 设计系统：[docs/design-system.md](docs/design-system.md)
- 素材说明：[docs/design-assets.md](docs/design-assets.md)
- 后续计划：[docs/roadmap.md](docs/roadmap.md)
- 首页主视觉：`apps/web/src/assets/guild-hero.png`
