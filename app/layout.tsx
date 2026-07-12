import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nektra API · 大模型统一中转",
  description: "统一 API 中转，一个密钥调用全部大模型。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
