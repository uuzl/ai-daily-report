import fetch from 'node-fetch';
import { NewsItem, SourceCredibility } from './types';

/**
 * 可信度映射：根据来源域名判断
 */
const CREDIBILITY_MAP: Record<string, SourceCredibility> = {
  // P0: 官方源头
  'openai.com': SourceCredibility.P0,
  'anthropic.com': SourceCredibility.P0,
  'claude.ai': SourceCredibility.P0,
  'deepseek.ai': SourceCredibility.P0,
  'deepseek.com': SourceCredibility.P0,
  'huggingface.co': SourceCredibility.P0,
  'google.ai': SourceCredibility.P0,
  'meta.ai': SourceCredibility.P0,
  
  // P1: 技术大牛博客
  'simonwillison.net': SourceCredibility.P1,
  'wikipedia.com': SourceCredibility.P1, // Wikipedia 有时也视为高质量
  'scholar.google.com': SourceCredibility.P1,
  
  // P2: 新闻网站
  'techcrunch.com': SourceCredibility.P2,
  'theverge.com': SourceCredibility.P2,
  'arstechnica.com': SourceCredibility.P2,
  'wired.com': SourceCredibility.P2,
  'bloomberg.com': SourceCredibility.P2,
  'reuters.com': SourceCredibility.P2,
  'cnn.com': SourceCredibility.P2,
  'bbc.com': SourceCredibility.P2,
  'nytimes.com': SourceCredibility.P2,
  '36kr.com': SourceCredibility.P2,
  'tech.sina.com.cn': SourceCredibility.P2,
  'gemini.google.com': SourceCredibility.P0, // Google Gemini
};

/**
 * 提取域名
 */
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

/**
 * 根据 URL 判断可信度
 */
export function getCredibility(url: string): SourceCredibility {
  const domain = extractDomain(url);
  
  // 精确匹配
  if (CREDIBILITY_MAP[domain]) {
    return CREDIBILITY_MAP[domain];
  }
  
  // 模糊匹配（子域名）
  for (const [key, value] of Object.entries(CREDIBILITY_MAP)) {
    if (domain.includes(key) || key.includes(domain)) {
      return value;
    }
  }
  
  return SourceCredibility.P2; // 默认为 P2
}

/**
 * 从 Tavily 搜索结果转换为 NewsItem
 */
export function convertToNewsItem(result: any, index: number): NewsItem {
  const url = result.url || '';
  const credibility = getCredibility(url);
  const title = result.title || '无标题';
  const content = result.content || result.snippet || '';
  
  // 生成摘要：截取前 150 字
  const summary = content.length > 150 
    ? content.substring(0, 150) + '...' 
    : content;
  
  // 提取域名作为来源名称
  const domain = extractDomain(url);
  const sourceName = domain.split('.')[0] || 'Unknown';
  
  // 自动分类：基于关键词
  const lowerTitle = title.toLowerCase();
  let category: NewsItem['category'] = 'tech';
  if (lowerTitle.includes('release') || lowerTitle.includes('launch') || lowerTitle.includes('发布')) {
    category = 'product';
  } else if (lowerTitle.includes('research') || lowerTitle.includes('论文') || lowerTitle.includes('study')) {
    category = 'research';
  } else if (lowerTitle.includes('hot') || lowerTitle.includes('trend') || lowerTitle.includes('爆') || lowerTitle.includes('热门')) {
    category = 'hot';
  }
  
  // 提取标签（简单分词）
  const tags = extractTags(title, content);
  
  // 生成唯一ID
  const id = `news-${Date.now()}-${index}`;
  
  return {
    id,
    title,
    summary,
    url,
    source: sourceName,
    sourceUrl: url,
    credibility,
    publishedAt: result.published_date ? new Date(result.published_date) : new Date(),
    category,
    tags
  };
}

/**
 * 简单标签提取
 */
function extractTags(title: string, content: string): string[] {
  const keywords = [
    'OpenAI', 'Claude', 'GPT', 'DeepSeek', 'AI', 'LLM', 'Transformer',
    '机器学习', '深度学习', '神经网络', '大模型', '生成式AI',
    'OpenCL', 'CUDA', 'TPU', '推理', '训练', '微调',
    'RAG', 'Agent', '智能体', '自动化', '代码生成',
    'arXiv', '论文', '研究', '算法', 'benchmark'
  ];
  
  const combined = (title + ' ' + content).toLowerCase();
  const tags: string[] = [];
  
  for (const keyword of keywords) {
    if (combined.includes(keyword.toLowerCase())) {
      tags.push(keyword);
    }
  }
  
  return tags.slice(0, 3); // 最多3个标签
}

/**
 * 生成编辑推荐摘要（基于可信度和热度）
 */
export function generateHighlights(items: NewsItem[]): string {
  const p0Items = items.filter(i => i.credibility === SourceCredibility.P0);
  const p1Items = items.filter(i => i.credibility === SourceCredibility.P1);
  
  let highlights = [];
  
  if (p0Items.length > 0) {
    highlights.push(`🔥 官方动态：${p0Items.length}条（${p0Items[0].source}等）`);
  }
  if (p1Items.length > 0) {
    highlights.push(`💡 技术深挖：${p1Items.length}条（${p1Items[0].source}等）`);
  }
  if (items.length > 15) {
    highlights.push(`📊 今日热点：共${items.length}条，信息量丰富`);
  }
  
  return highlights.join(' | ');
}
