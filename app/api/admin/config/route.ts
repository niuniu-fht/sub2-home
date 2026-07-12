import { NextResponse } from "next/server";
import { readConfig, writeConfig } from "@/lib/store";
import { isAuthed } from "@/lib/auth";
import type { Config, Model } from "@/lib/types";

// 后台读取完整配置（含未启用模型）。
export async function GET() {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const config = await readConfig();
  return NextResponse.json(config);
}

// 简单校验，避免写入结构错误的数据。
function sanitize(body: any): Config {
  const site = body?.site ?? {};
  const models: Model[] = Array.isArray(body?.models) ? body.models : [];
  return {
    site: {
      title: String(site.title ?? ""),
      subtitle: String(site.subtitle ?? ""),
      description: String(site.description ?? ""),
      apiUrl: String(site.apiUrl ?? ""),
      apiButtonText: String(site.apiButtonText ?? "进入 API 控制台"),
      docsUrl: String(site.docsUrl ?? ""),
      imageUrl: String(site.imageUrl ?? ""),
      imageButtonText: String(site.imageButtonText ?? "进入在线生图平台"),
      apiOpenInNewTab: site.apiOpenInNewTab !== false,
    },
    models: models.map((m) => ({
      id: String(m.id ?? "").trim(),
      name: String(m.name ?? "").trim(),
      provider: String(m.provider ?? "").trim(),
      description: String(m.description ?? ""),
      context: String(m.context ?? ""),
      tags: Array.isArray(m.tags) ? m.tags.map((t) => String(t)).filter(Boolean) : [],
      pricing: {
        size1k: String(m.pricing?.size1k ?? ""),
        size2k: String(m.pricing?.size2k ?? ""),
        size4k: String(m.pricing?.size4k ?? ""),
      },
      enabled: Boolean(m.enabled),
    })),
  };
}

// 后台保存完整配置。
export async function PUT(req: Request) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "请求体无效" }, { status: 400 });
  }
  const config = sanitize(body);
  if (config.models.some((m) => !m.id || !m.name)) {
    return NextResponse.json({ error: "每个模型的 ID 和名称都不能为空" }, { status: 400 });
  }
  await writeConfig(config);
  return NextResponse.json({ ok: true });
}
