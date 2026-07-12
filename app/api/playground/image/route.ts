import { NextResponse } from "next/server";

// 图像生成可能较慢，放宽函数执行时间。
export const maxDuration = 120;

// 服务端代理：把请求转发到 {baseUrl}/v1/images/generations，避免浏览器跨域，
// 同时不在前端直接暴露对上游的调用细节。API Key 由用户在页面填写，仅透传不存储。
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "请求体无效" }, { status: 400 });
  }

  const baseUrl = String(body.baseUrl || "").trim().replace(/\/+$/, "");
  const apiKey = String(body.apiKey || "").trim();
  const model = String(body.model || "gpt-image-2").trim();
  const prompt = String(body.prompt || "").trim();
  const size = String(body.size || "1024x1024").trim();

  if (!/^https?:\/\//i.test(baseUrl)) {
    return NextResponse.json({ error: "Base URL 需以 http(s):// 开头" }, { status: 400 });
  }
  if (!apiKey) {
    return NextResponse.json({ error: "请填写 API Key" }, { status: 400 });
  }
  if (!prompt) {
    return NextResponse.json({ error: "请填写提示词" }, { status: 400 });
  }

  const endpoint = `${baseUrl}/v1/images/generations`;

  try {
    const upstream = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model, prompt, size, n: 1 }),
    });

    const text = await upstream.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      // 上游返回非 JSON（如网关 HTML 错误页），原样截断返回错误信息。
      return NextResponse.json(
        { error: `上游返回异常（${upstream.status}）：${text.slice(0, 200)}` },
        { status: 502 }
      );
    }

    if (!upstream.ok) {
      const msg = data?.error?.message || data?.message || `请求失败（${upstream.status}）`;
      return NextResponse.json({ error: msg }, { status: upstream.status });
    }

    // 归一化输出：统一返回 [{ url?, b64_json? }]
    const items = Array.isArray(data?.data) ? data.data : [];
    return NextResponse.json({
      images: items.map((it: any) => ({ url: it?.url, b64_json: it?.b64_json })),
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: `无法连接上游服务：${e?.message || e}` },
      { status: 502 }
    );
  }
}
