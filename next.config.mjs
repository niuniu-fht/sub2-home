/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 产出自包含的 standalone 目录，便于 Docker 极小镜像部署。
  output: "standalone",
};

export default nextConfig;
