import { readConfig } from "@/lib/store";
import ModelPlaza from "./ModelPlaza";

// 首页在服务端直接读取配置，保证内容随后台修改实时更新。
export const dynamic = "force-dynamic";

export default async function Home() {
  const config = await readConfig();
  const { site } = config;
  const models = config.models.filter((m) => m.enabled);
  const providers = Array.from(new Set(models.map((m) => m.provider)));
  // 按后台开关决定 API 控制台链接的打开方式。
  const apiTarget = site.apiOpenInNewTab === false ? "_self" : "_blank";
  const apiRel = apiTarget === "_blank" ? "noreferrer" : undefined;

  return (
    <>
      <nav className="nav">
        <div className="container nav-inner">
          <div className="brand">
            <span>{site.title}</span>
          </div>
          <div className="nav-links">
            <a className="nav-link" href="#models">
              模型广场
            </a>
            <a className="nav-link" href="/docs">
              文档
            </a>
            <a className="nav-link" href={site.apiUrl} target={apiTarget} rel={apiRel}>
              控制台
            </a>
          </div>
        </div>
      </nav>

      <header className="hero">
        <div className="container">
          <div className="badge">
            <span className="dot" />
            服务运行中 · OpenAI 兼容
          </div>
          <h1>
            {site.subtitle.split("·")[0] || site.title}
            <br />
            <span className="grad">{site.subtitle.split("·")[1] || "一站式大模型 API"}</span>
          </h1>
          <p className="sub">{site.description}</p>
          <div className="hero-actions">
            <a className="btn btn-primary" href={site.apiUrl} target={apiTarget} rel={apiRel}>
              {site.apiButtonText || "进入 API 控制台"}
              <span aria-hidden>→</span>
            </a>
            {site.imageUrl ? (
              <a className="btn btn-accent" href={site.imageUrl} target={apiTarget} rel={apiRel}>
                {site.imageButtonText || "进入在线生图平台"}
                <span aria-hidden>↗</span>
              </a>
            ) : null}
            <a className="btn btn-ghost" href="#models">
              浏览模型广场
            </a>
          </div>

          <div className="stats">
            <div className="stat">
              <div className="num">{models.length}</div>
              <div className="label">支持模型</div>
            </div>
            <div className="stat">
              <div className="num">{providers.length}</div>
              <div className="label">模型厂商</div>
            </div>
            <div className="stat">
              <div className="num">99.9%</div>
              <div className="label">服务可用性</div>
            </div>
          </div>
        </div>
      </header>

      <ModelPlaza models={models} />

      <footer className="footer">
        <div className="container">
          © {new Date().getFullYear()} {site.title} · 基于 OpenAI 兼容协议 ·{" "}
          <a href="/admin">后台管理</a>
        </div>
      </footer>
    </>
  );
}
