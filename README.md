# Sub2API 首页

作为 sub2api 的门户首页：一键跳转到 API 控制台，并提供一个可后台编辑的**模型广场**，展示当前支持的模型。

## 功能

- **首页 Hero**：站点标题/副标题/描述、跳转到 API 地址（sub2api）的主按钮、文档链接、统计条。
- **模型广场**：模型卡片展示，支持按名称/ID/标签搜索、按厂商筛选，点击卡片复制模型 ID。
- **后台管理**（密码保护，`/admin`）：在线编辑站点信息、API 跳转地址、以及模型的增删改、显示开关、排序。数据存储在 `data/config.json`，保存后首页实时生效。

## 快速开始

```bash
cd sub2api-home
npm install
cp .env.local.example .env.local   # 修改管理员密码与密钥
npm run dev                        # http://localhost:3000
```

生产部署：

```bash
npm run build && npm start
```

## 配置

`.env.local`：

| 变量 | 说明 |
| --- | --- |
| `ADMIN_PASSWORD` | 后台登录密码（默认 `admin123`，请务必修改） |
| `AUTH_SECRET` | 登录 Cookie 签名密钥，生产环境改成随机长串 |

站点内容与模型均在后台 `/admin` 编辑，或直接改 `data/config.json`。

## 目录结构

```
app/
  page.tsx            首页（服务端读取配置）
  ModelPlaza.tsx      模型广场（客户端交互：搜索/筛选/复制）
  admin/page.tsx      后台管理页
  api/config          公开配置接口（仅返回已启用模型）
  api/admin/login     登录 / 退出
  api/admin/config    后台读取 / 保存配置（需登录）
lib/
  store.ts            config.json 读写（原子写入）
  auth.ts             Cookie 鉴权（HMAC 令牌）
  types.ts            类型定义
data/config.json      站点信息 + 模型数据
```

## 部署到 Vercel 注意

Vercel 的文件系统是只读的，后台保存会失败。若部署到 Serverless 平台并需要在线编辑，请将 `lib/store.ts` 的存储改为 KV / 数据库（如 Vercel KV、Upstash Redis）。自建服务器 / VPS / Docker 直接用文件存储即可正常读写。
