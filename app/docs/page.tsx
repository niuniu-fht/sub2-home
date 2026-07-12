import { readConfig } from "@/lib/store";
import DocsClient from "./DocsClient";

export const dynamic = "force-dynamic";

export default async function DocsPage() {
  const config = await readConfig();
  const { site } = config;
  // Base URL 优先用后台单独配置的「API Base URL」；
  // 留空时，从「跳转地址」里取域名（origin）再拼 /v1，避免把 /dashboard 这种控制台路径带进去。
  let baseUrl = (site.apiBaseUrl || "").trim().replace(/\/+$/, "");
  if (!baseUrl) {
    try {
      baseUrl = `${new URL(site.apiUrl).origin}/v1`;
    } catch {
      baseUrl = "https://api.example.com/v1";
    }
  }
  const firstModel = config.models[0]?.id || "gpt-image-2";

  return (
    <>
      <nav className="nav">
        <div className="container nav-inner">
          <a className="brand" href="/">
            <span>{site.title}</span>
          </a>
          <div className="nav-links">
            <a className="nav-link" href="/#models">
              模型广场
            </a>
            <a className="nav-link" href="/docs">
              文档
            </a>
            <a
              className="nav-link"
              href={site.apiUrl}
              target={site.apiOpenInNewTab === false ? "_self" : "_blank"}
              rel={site.apiOpenInNewTab === false ? undefined : "noreferrer"}
            >
              控制台
            </a>
          </div>
        </div>
      </nav>
      <DocsClient
        title={site.title}
        apiUrl={site.apiUrl}
        baseUrl={baseUrl}
        model={firstModel}
      />
    </>
  );
}
