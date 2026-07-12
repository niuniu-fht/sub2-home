// 图像分辨率三档价格（字符串，便于填写货币/单位，如 "$0.02" 或 "¥0.15/张"）。
export interface Pricing {
  size1k: string;
  size2k: string;
  size4k: string;
}

export interface Model {
  id: string;
  name: string;
  provider: string;
  description: string;
  context: string;
  tags: string[];
  pricing: Pricing;
  enabled: boolean;
}

export interface SiteConfig {
  title: string;
  subtitle: string;
  description: string;
  apiUrl: string;
  apiButtonText: string;
  // 文档 / 测试台使用的真实接口 Base URL（含版本号，如 https://code2alita.com/v1）。
  // 留空则自动取「跳转地址」的域名 + /v1。
  apiBaseUrl: string;
  docsUrl: string;
  // 在线生图平台入口（留空则不显示按钮）
  imageUrl: string;
  imageButtonText: string;
  // true = 新窗口打开外部链接（API 控制台 / 生图平台）；false = 当前页面打开。
  apiOpenInNewTab: boolean;
}

export interface Config {
  site: SiteConfig;
  models: Model[];
}
