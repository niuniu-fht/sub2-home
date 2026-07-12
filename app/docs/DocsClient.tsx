"use client";

import { useEffect, useState } from "react";
import ImagePlayground from "./ImagePlayground";

function CodeBlock({ lang, code }: { lang: string; code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* 忽略 */
    }
  };
  return (
    <div className="code-block">
      <div className="code-head">
        <span className="code-lang">{lang}</span>
        <button className="copy-code" onClick={copy}>
          {copied ? "已复制 ✓" : "复制"}
        </button>
      </div>
      <pre>{code}</pre>
    </div>
  );
}

const NAV = [
  ["quickstart", "快速开始"],
  ["auth", "接口地址 & 认证"],
  ["playground", "在线测试出图"],
  ["image", "图像生成"],
  ["chat", "对话调用"],
  ["models", "支持的模型"],
  ["errors", "错误码"],
  ["faq", "常见问题"],
];

export default function DocsClient({
  title,
  apiUrl,
  baseUrl,
  model,
}: {
  title: string;
  apiUrl: string;
  baseUrl: string;
  model: string;
}) {
  const [active, setActive] = useState("quickstart");

  // 滚动高亮当前章节。
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: "-80px 0px -70% 0px" }
    );
    NAV.forEach(([id]) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  const curlImage = `curl ${baseUrl}/images/generations \\
  -H "Authorization: Bearer $SUB2API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${model}",
    "prompt": "一只戴着宇航员头盔的柴犬，赛博朋克风格，霓虹灯光",
    "size": "1024x1024",
    "n": 1
  }'`;

  const pyImage = `from openai import OpenAI

client = OpenAI(
    api_key="YOUR_SUB2API_KEY",
    base_url="${baseUrl}",
)

resp = client.images.generate(
    model="${model}",
    prompt="一只戴着宇航员头盔的柴犬，赛博朋克风格，霓虹灯光",
    size="1024x1024",
    n=1,
)
print(resp.data[0].url)`;

  const nodeImage = `import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.SUB2API_KEY,
  baseURL: "${baseUrl}",
});

const resp = await client.images.generate({
  model: "${model}",
  prompt: "一只戴着宇航员头盔的柴犬，赛博朋克风格，霓虹灯光",
  size: "1024x1024",
  n: 1,
});
console.log(resp.data[0].url);`;

  const curlChat = `curl ${baseUrl}/chat/completions \\
  -H "Authorization: Bearer $SUB2API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gpt-4o",
    "messages": [{"role": "user", "content": "你好"}]
  }'`;

  return (
    <div className="docs-layout">
      <aside className="docs-side">
        <div className="side-title">文档目录</div>
        {NAV.map(([id, label]) => (
          <a key={id} href={`#${id}`} className={active === id ? "active" : ""}>
            {label}
          </a>
        ))}
      </aside>

      <main className="docs-main">
        <h1>API 文档</h1>
        <p className="docs-lead">
          {title} 采用 <strong>OpenAI 兼容</strong> 接口协议。只需把官方 SDK 的
          <code className="inline">base_url</code> 换成本站地址、填入你的密钥，即可无缝调用。
        </p>

        <section id="quickstart" className="doc-section">
          <h2>快速开始</h2>
          <p>三步跑通第一个请求：</p>
          <ul>
            <li>
              进入 <a href={apiUrl} target="_blank" rel="noreferrer" style={{ color: "#b7aeff" }}>API 控制台</a> 注册并创建一个 API Key（形如 <code className="inline">sk-xxxx</code>）。
            </li>
            <li>把下方示例里的密钥换成你自己的。</li>
            <li>运行代码，拿到返回结果。</li>
          </ul>
          <div className="callout">
            <span className="ico">💡</span>
            <span>
              建议把密钥存到环境变量 <code className="inline">SUB2API_KEY</code>，不要硬编码进代码或提交到仓库。
            </span>
          </div>
        </section>

        <section id="auth" className="doc-section">
          <h2>接口地址 &amp; 认证</h2>
          <table className="doc-table">
            <tbody>
              <tr>
                <th>Base URL</th>
                <td>
                  <code>{baseUrl}</code>
                </td>
              </tr>
              <tr>
                <th>认证方式</th>
                <td>
                  请求头携带 <code>Authorization: Bearer &lt;API_KEY&gt;</code>
                </td>
              </tr>
              <tr>
                <th>数据格式</th>
                <td>
                  <code>Content-Type: application/json</code>
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        <section id="playground" className="doc-section">
          <h2>在线测试出图</h2>
          <p>
            无需写代码，直接在下方填入 API Key 和提示词即可调用 OpenAI 图像接口生成图片。请求经由本站服务端转发到{" "}
            <code className="inline">/v1/images/generations</code>，Key 仅本次调用透传、不会保存。
          </p>
          <ImagePlayground model={model} />
        </section>

        <section id="image" className="doc-section">
          <h2>图像生成</h2>
          <p>
            使用 <code className="inline">{model}</code> 模型，调用 <code className="inline">/images/generations</code> 接口进行文生图。支持 <code className="inline">size</code>（如 1024x1024）、<code className="inline">n</code>（生成数量）等参数。
          </p>
          <h3>cURL</h3>
          <CodeBlock lang="bash" code={curlImage} />
          <h3>Python</h3>
          <CodeBlock lang="python" code={pyImage} />
          <h3>Node.js</h3>
          <CodeBlock lang="javascript" code={nodeImage} />
        </section>

        <section id="chat" className="doc-section">
          <h2>对话调用</h2>
          <p>
            如接入了对话类模型，调用 <code className="inline">/chat/completions</code> 接口，用法与 OpenAI 完全一致：
          </p>
          <CodeBlock lang="bash" code={curlChat} />
        </section>

        <section id="models" className="doc-section">
          <h2>支持的模型</h2>
          <p>
            当前支持的模型及其 ID 可在 <a href="/#models" style={{ color: "#b7aeff" }}>模型广场</a> 查看，点击卡片即可复制模型 ID，把它填进请求的 <code className="inline">model</code> 字段即可。
          </p>
        </section>

        <section id="errors" className="doc-section">
          <h2>错误码</h2>
          <table className="doc-table">
            <thead>
              <tr>
                <th>状态码</th>
                <th>含义</th>
                <th>排查建议</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>401</td>
                <td>密钥无效或未认证</td>
                <td>检查 API Key 是否正确、是否带了 Bearer 前缀</td>
              </tr>
              <tr>
                <td>403</td>
                <td>无权限 / 模型未开通</td>
                <td>确认账号是否有该模型的调用权限</td>
              </tr>
              <tr>
                <td>429</td>
                <td>请求过于频繁 / 额度不足</td>
                <td>降低并发或充值额度后重试</td>
              </tr>
              <tr>
                <td>500 / 502</td>
                <td>上游或网关错误</td>
                <td>稍后重试，持续出现请联系管理员</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section id="faq" className="doc-section">
          <h2>常见问题</h2>
          <h3>可以直接用 OpenAI 官方 SDK 吗？</h3>
          <p>可以。只需把 base_url 改成本站地址、api_key 换成本站密钥即可，其余用法不变。</p>
          <h3>模型 ID 从哪里获取？</h3>
          <p>在首页模型广场点击任意卡片会复制其模型 ID，直接填入 model 字段。</p>
          <h3>请求超时怎么办？</h3>
          <p>图像生成耗时较长，建议客户端超时设置为 60 秒以上，并做好重试。</p>
        </section>
      </main>
    </div>
  );
}
