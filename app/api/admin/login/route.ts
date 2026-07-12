import { NextResponse } from "next/server";
import { verifyPassword, setSession, clearSession } from "@/lib/auth";

export async function POST(req: Request) {
  const { password } = await req.json().catch(() => ({ password: "" }));
  if (!(await verifyPassword(password))) {
    return NextResponse.json({ error: "密码错误" }, { status: 401 });
  }
  await setSession();
  return NextResponse.json({ ok: true });
}

// 退出登录
export async function DELETE() {
  await clearSession();
  return NextResponse.json({ ok: true });
}
