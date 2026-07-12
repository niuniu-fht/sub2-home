# 部署指南

## 方式一：Docker Compose（最推荐，最省事）

前提：服务器装好 Docker（含 compose 插件）。一次安装：

```bash
curl -fsSL https://get.docker.com | sh
```

部署三步：

```bash
# 1. 把项目传到服务器（git clone 或 scp 上传本目录）
cd sub2api-home

# 2. 修改 docker-compose.yml 里的 ADMIN_PASSWORD 和 AUTH_SECRET

# 3. 构建并后台启动
docker compose up -d --build
```

打开 `http://服务器IP:3000` 即可。

常用命令：

```bash
docker compose logs -f      # 看日志
docker compose restart      # 重启
docker compose down         # 停止
docker compose up -d --build  # 改代码后重新部署
```

> 模型/站点配置存在宿主机 `./data/config.json`（已通过卷挂载持久化），
> 后台改的内容会直接写到这里，容器重建也不丢。

---

## 方式二：直接用 Node + PM2（不想装 Docker）

前提：服务器装了 Node 18+。

```bash
cd sub2api-home
npm ci
npm run build

# 设置密码与密钥（也可写进 .env.local）
export ADMIN_PASSWORD=你的密码
export AUTH_SECRET=一段随机长字符串

# 用 pm2 常驻运行
npm i -g pm2
pm2 start npm --name nektra-api -- start
pm2 save && pm2 startup   # 开机自启
```

默认监听 3000 端口。

---

## 绑定域名 + HTTPS（可选，两种方式通用）

用 Nginx 反向代理到 3000 端口：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

再用 certbot 一键上 HTTPS：`certbot --nginx -d your-domain.com`

---

## 部署后检查清单

- [ ] 改掉了 `ADMIN_PASSWORD`（默认 admin123 不要用于线上）
- [ ] 改掉了 `AUTH_SECRET`（随机长串）
- [ ] 进 `/admin` 把「API 地址」填成你真实的 sub2api 控制台地址
- [ ] 服务器防火墙/安全组放行对外端口（80 或 3000）
