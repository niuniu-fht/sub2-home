import { NextResponse } from "next/server";

export const maxDuration = 120;

// 图像编辑代理：multipart/form-data 转发到 {baseUrl}/images/edits。
// 上传的图片文件直接透传给上游，API Key 仅本次使用、不存储。
export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "表单解析失败" }, { status: 400 });
  }

  const baseUrl = String(form.get("baseUrl") || "").trim().replace(/\/+$/, "");
  const apiKey = String(form.get("apiKey") || "").trim();
  const model = String(form.get("model") || "gpt-image-2").trim();
  const prompt = String(form.get("prompt") || "").trim();
  const size = String(form.get("size") || "1024x1024").trim();
  const image = form.get("image");
  const mask = form.get("mask");

  if (!/^https?:\/\//i.test(baseUrl)) {
    return NextResponse.json({ error: "Base URL 需以 http(s):// 开头" }, { status: 400 });
  }
  if (!apiKey) {
    return NextResponse.json({ error: "请填写 API Key" }, { status: 400 });
  }
  if (!prompt) {
    return NextResponse.json({ error: "请填写提示词" }, { status: 400 });
  }
  if (!image || typeof image === "string") {
    return NextResponse.json({ error: "请上传要编辑的图片" }, { status: 400 });
  }

  // 组装转发给上游的表单（不要手动设置 Content-Type，fetch 会自动带 multipart 边界）。
  const upstreamForm = new FormData();
  upstreamForm.append("model", model);
  upstreamForm.append("prompt", prompt);
  upstreamForm.append("size", size);
  upstreamForm.append("n", "1");
  upstreamForm.append("image", image, (image as File).name || "image.png");
  if (mask && typeof mask !== "string") {
    upstreamForm.append("mask", mask, (mask as File).name || "mask.png");
  }

  try {
    const upstream = await fetch(`${baseUrl}/images/edits`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: upstreamForm,
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
