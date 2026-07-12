import { NextResponse } from "next/server";
import { isAuthed, verifyPassword, setPassword } from "@/lib/auth";

// 修改管理员密码：需已登录 + 校验当前密码。
export async function POST(req: Request) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const current = String(body?.currentPassword ?? "");
  const next = String(body?.newPassword ?? "");

  if (!(await verifyPassword(current))) {
    return NextResponse.json({ error: "当前密码不正确" }, { status: 400 });
  }
  if (next.length < 6) {
    return NextResponse.json({ error: "新密码至少 6 位" }, { status: 400 });
  }
  if (next === current) {
    return NextResponse.json({ error: "新密码不能与当前密码相同" }, { status: 400 });
  }

  await setPassword(next);
  return NextResponse.json({ ok: true });
}
