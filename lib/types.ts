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
