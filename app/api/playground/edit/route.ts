import { NextResponse } from "next/server";

export const maxDuration = 120;

// 图像编辑代理：JSON 转发到 {baseUrl}/images/edits。
// image 传公网图片 URL 或 base64 字符串；API Key 仅本次使用、不存储。
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
  const image = String(body.image || "").trim();

  if (!/^https?:\/\//i.test(baseUrl)) {
    return NextResponse.json({ error: "Base URL 需以 http(s):// 开头" }, { status: 400 });
  }
  if (!apiKey) {
    return NextResponse.json({ error: "请填写 API Key" }, { status: 400 });
  }
  if (!prompt) {
    return NextResponse.json({ error: "请填写提示词" }, { status: 400 });
  }
  if (!image) {
    return NextResponse.json({ error: "请提供图片的公网 URL 或 base64" }, { status: 400 });
  }

  try {
    const upstream = await fetch(`${baseUrl}/images/edits`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model, image, prompt, size, n: 1 }),
    });

    const text = await upstream.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: `上游返回异常（${upstream.status}）：${text.slice(0, 200)}` },
        { status: 502 }
      );
    }

    if (!upstream.ok) {
      const msg = data?.error?.message || data?.message || `请求失败（${upstream.status}）`;
      return NextResponse.json({ error: msg }, { status: upstream.status });
    }

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
