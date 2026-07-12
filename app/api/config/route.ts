import { NextResponse } from "next/server";
import { readConfig } from "@/lib/store";

// 公开接口：返回站点信息 + 已启用的模型（供首页使用）。
export async function GET() {
  const config = await readConfig();
  return NextResponse.json({
    site: config.site,
    models: config.models.filter((m) => m.enabled),
  });
}
