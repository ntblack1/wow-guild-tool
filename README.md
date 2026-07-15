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
4. 打开 Authentication > Providers > Email，关闭 `Confirm email`（确认邮箱）。
5. 在 Project Settings 中找到 Project URL 和 anon public key。
6. 填入本地 `.env` 和 Cloudflare Pages 环境变量。

第一版登录使用工会口令 + 账号密码。成员先回答“会长口头禅是什么”，输入 `说这些` 后即可创建账号和密码；之后直接用账号密码登录。成员不需要填写真实邮箱，程序会在内部生成专用登录地址，并由 Supabase Auth 安全保存密码和登录会话。

如果之前已经执行过旧版 SQL，也可以重新执行当前 `supabase/schema.sql`。脚本会修正中文约束、删除旧的自建密码表，并把写入权限绑定到 Supabase 登录身份。旧测试版创建的本地账号不能继续使用，需要重新创建一次账号。

启用角色头像时，额外在 SQL Editor 执行 `supabase/migrations/20260715_add_character_avatars.sql`。它会添加头像字段并创建一个仅允许成员管理自己文件夹的公开头像存储桶。

账号只能使用 3-20 位小写字母、数字和下划线；工会昵称可以使用中文。口令是第一版内部测试的注册门槛，不应当作高强度安全措施。

### 设置管理员

用户第一次通过工会口令创建账号后，Supabase 会自动写入 `profiles`。在 SQL Editor 中先查看用户：

```sql
select id, display_name, role from public.profiles order by created_at desc;
```

把某个用户设为管理员：

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
- 工会口令创建账号，之后使用账号密码登录。
- 密码和登录会话由 Supabase Auth 管理，数据库写入受登录身份和角色权限保护。
- 用户创建、编辑、删除自己的多个角色。
- 角色可上传自定义头像，报名阵容会直接展示头像。
- 所有已登录成员都可以发起活动，活动默认进入报名中。
- 发起活动支持常用副本预设和自定义名称，标题自动生成，说明为选填。
- 活动列表显示报名人数、人数上限、状态和当前阵容缺口。
- 首页和活动页优先展示今日活动；报名页只需选择角色并点击一次报名。
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
