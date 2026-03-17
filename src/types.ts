/**
 * AI Daily Report - 类型定义
 */

export enum SourceCredibility {
  P0 = 'P0', // 官方源头: OpenAI, Claude, DeepSeek 等
  P1 = 'P1', // 技术大牛博客
  P2 = 'P2'  // 新闻网站
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  sourceUrl: string;
  credibility: SourceCredibility;
  publishedAt: Date;
  category: 'hot' | 'tech' | 'product' | 'research';
  tags: string[];
}

export interface DailyReport {
  date: string; // YYYY-MM-DD
  generatedAt: Date;
  totalItems: number;
  items: NewsItem[];
  highlights: {
    p0Count: number;
    p1Count: number;
    p2Count: number;
  };
  summary: string;
}

export interface Config {
  tavilyApiKey: string;
  searchKeywords: string[];
  maxItems: number;
  targetDate: string; // YYYY-MM-DD, 默认是昨天
  outputDir: string;
  siteUrl: string;
}
