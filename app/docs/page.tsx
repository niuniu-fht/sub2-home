import { readConfig } from "@/lib/store";
import DocsClient from "./DocsClient";

export const dynamic = "force-dynamic";

export default async function DocsPage() {
  const config = await readConfig();
  const { site } = config;
  // 取后台配置的 API 地址推导出 Base URL（去掉结尾斜杠后接 /v1）。
  const base = (site.apiUrl || "https://api.example.com").replace(/\/+$/, "");
  const baseUrl = `${base}/v1`;
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
