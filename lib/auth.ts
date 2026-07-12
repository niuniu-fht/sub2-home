import crypto from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { cookies } from "next/headers";

const COOKIE_NAME = "s2a_admin";
const SECRET = process.env.AUTH_SECRET || "dev-secret-change-me";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
// 修改后的密码哈希存这里（与 config.json 同目录，随卷持久化）。
const AUTH_PATH = path.join(process.cwd(), "data", "auth.json");
// Cookie 有效期：7 天
const MAX_AGE = 60 * 60 * 24 * 7;

// 生成一个基于密钥的登录令牌（内容固定，用 HMAC 防伪造）。
function makeToken(): string {
  return crypto.createHmac("sha256", SECRET).update("admin-session").digest("hex");
}

async function readStoredHash(): Promise<{ salt: string; hash: string } | null> {
  try {
    const j = JSON.parse(await fs.readFile(AUTH_PATH, "utf-8"));
    return j?.salt && j?.hash ? { salt: j.salt, hash: j.hash } : null;
  } catch {
    return null;
  }
}

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 32).toString("hex");
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

// 校验密码：优先用 data/auth.json 里保存的哈希；没有则回退到环境变量。
export async function verifyPassword(password: string): Promise<boolean> {
  const stored = await readStoredHash();
  if (stored) {
    return safeEqual(hashPassword(password || "", stored.salt), stored.hash);
  }
  return safeEqual(password || "", ADMIN_PASSWORD);
}

// 保存新密码（scrypt + 随机盐），原子写入。
export async function setPassword(newPassword: string): Promise<void> {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = hashPassword(newPassword, salt);
  const tmp = `${AUTH_PATH}.tmp`;
  await fs.writeFile(tmp, JSON.stringify({ salt, hash }, null, 2), "utf-8");
  await fs.rename(tmp, AUTH_PATH);
}

export async function setSession(): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, makeToken(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function isAuthed(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return false;
  const expected = makeToken();
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
