import 'dotenv/config';
import { DailyReport, Config, NewsItem, SourceCredibility } from './types';
import { convertToNewsItem, getCredibility, generateHighlights } from './fetch-news';
import { HTMLGenerator } from './generate-html';
import { format } from 'date-fns';

/**
 * AI Daily Report 主程序
 * 
 * 工作流程：
 * 1. 从环境变量读取配置
 * 2. 使用 Tavily API 搜索 AI 新闻
 * 3. 根据可信度分级和编辑推荐整理
 * 4. 生成美观的 HTML 页面
 * 5. 保存到 public/ 目录
 * 6. 自动 git commit & push
 */

class AIReporter {
  private config: Config;
  private htmlGen: HTMLGenerator;
  
  constructor() {
    this.config = {
      tavilyApiKey: process.env.TAVILY_API_KEY || '',
      searchKeywords: process.env.SEARCH_KEYWORDS?.split(',') || [
        'AI artificial intelligence news',
        'OpenAI ChatGPT updates',
        'Claude Anthropic release',
        'DeepSeek AI developments',
        'large language models LLM'
      ],
      maxItems: parseInt(process.env.MAX_ITEMS || '15', 10),
      targetDate: this.getTargetDate(),
      outputDir: process.env.OUTPUT_DIR || './public',
      siteUrl: process.env.SITE_URL || 'https://uuzl.github.io/ai-daily-report'
    };
    
    this.htmlGen = new HTMLGenerator();
  }
  
  /**
   * 获取目标日期（前一天）
   */
  private getTargetDate(): string {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    return format(yesterday, 'yyyy-MM-dd');
  }
  
  /**
   * 构建 Tavily 搜索查询
   */
  private buildSearchQuery(): string {
    const keywords = this.config.searchKeywords.join(' OR ');
    const date = this.config.targetDate;
    // Tavily 支持时间范围：过去24小时或特定日期
    return `(${keywords}) after:${date}`;
  }
  
  /**
   * 调用 Tavily API 搜索
   */
  private async fetchNews(): Promise<any[]> {
    const query = this.buildSearchQuery();
    console.log(`🔍 搜索: ${query}`);
    
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: this.config.tavilyApiKey,
        query: query,
        search_depth: 'advanced',
        topic: 'news',
        days: 1, // 只搜索过去24小时
        max_results: this.config.maxItems + 10, // 多取一些，后面再筛选
        include_domains: [
          'openai.com', 'anthropic.com', 'deepseek.ai', 'huggingface.co',
          'arxiv.org', 'scholar.google.com',
          'techcrunch.com', 'theverge.com', 'arstechnica.com'
        ]
      })
    });
    
    if (!response.ok) {
      throw new Error(`Tavily API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json() as { results: any[] };
    return data.results || [];
  }
  
  /**
   * 筛选和组织新闻（按可信度排序）
   */
  private organizeNews(rawResults: any[]): NewsItem[] {
    // 转换为 NewsItem
    const items: NewsItem[] = rawResults
      .map((result, index) => convertToNewsItem(result, index))
      .filter(item => item !== null) as NewsItem[];
    
    // 排序规则：P0 > P1 > P2，相同级别按时间倒序
    items.sort((a, b) => {
      // 先按可信度
      const credOrder = [SourceCredibility.P0, SourceCredibility.P1, SourceCredibility.P2];
      const aCred = credOrder.indexOf(a.credibility);
      const bCred = credOrder.indexOf(b.credibility);
      if (aCred !== bCred) return aCred - bCred;
      
      // 再按时间倒序
      return b.publishedAt.getTime() - a.publishedAt.getTime();
    });
    
    // 限制数量
    const limited = items.slice(0, this.config.maxItems);
    
    // 如果 P0 + P1 数量不足，用 P2 补充到 maxItems
    if (limited.length < this.config.maxItems && items.length > limited.length) {
      const remaining = items.slice(limited.length, this.config.maxItems);
      limited.push(...remaining);
    }
    
    return limited;
  }
  
  /**
   * 执行生成报告
   */
  async generate(): Promise<DailyReport> {
    console.log('🚀 开始生成 AI Daily Report...');
    
    // 1. 抓取新闻
    const rawResults = await this.fetchNews();
    console.log(`📥 获取到 ${rawResults.length} 条原始结果`);
    
    // 2. 组织新闻（排序、去重、筛选）
    const items = this.organizeNews(rawResults);
    console.log(`✅ 整理后 ${items.length} 条新闻`);
    
    const p0Count = items.filter(i => i.credibility === SourceCredibility.P0).length;
    const p1Count = items.filter(i => i.credibility === SourceCredibility.P1).length;
    const p2Count = items.filter(i => i.credibility === SourceCredibility.P2).length;
    console.log(`📊 分级: P0=${p0Count}, P1=${p1Count}, P2=${p2Count}`);
    
    // 3. 生成摘要
    const highlights = generateHighlights(items);
    console.log(`🎯 编辑推荐: ${highlights}`);
    
    // 4. 构建日报对象
    const report: DailyReport = {
      date: this.config.targetDate,
      generatedAt: new Date(),
      totalItems: items.length,
      items,
      highlights: {
        p0Count,
        p1Count,
        p2Count
      },
      summary: highlights
    };
    
    // 5. 生成 HTML
    const html = this.htmlGen.generate(report);
    this.htmlGen.save(html, `${this.config.outputDir}/index.html`);
    console.log(`💾 HTML 已保存到 ${this.config.outputDir}/index.html`);
    
    // 6. 同时保存 JSON 数据（用于后续扩展）
    this.saveJsonData(report);
    
    return report;
  }
  
  /**
   * 保存 JSON 数据（用于历史记录或 API）
   */
  private saveJsonData(report: DailyReport): void {
    const jsonPath = `${this.config.outputDir}/report.json`;
    const fs = require('fs');
    fs.writeFileSync(jsonPath, JSON.stringify(report, (key, value) => {
      // 处理 Date 对象
      if (value instanceof Date) {
        return value.toISOString();
      }
      return value;
    }, 2));
    console.log(`📋 数据已保存到 ${jsonPath}`);
  }
  
  /**
   * Git 提交并推送
   */
  async commitAndPush(report: DailyReport): Promise<void> {
    console.log('📤 开始 Git 提交和推送...');
    
    const { execSync } = require('child_process');
    
    try {
      // 添加文件
      execSync('git add public/index.html public/report.json', { stdio: 'inherit' });
      
      // 提交
      const commitMessage = `📅 AI Daily Report ${this.config.targetDate}\n\n- 自动生成 ${report.totalItems} 条新闻\n- P0: ${report.highlights.p0Count} | P1: ${report.highlights.p1Count} | P2: ${report.highlights.p2Count}`;
      execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });
      
      // 推送
      execSync('git push origin main', { stdio: 'inherit' });
      
      console.log('✅ Git 提交和推送成功！');
    } catch (error) {
      console.error('❌ Git 操作失败:', error);
      throw error;
    }
  }
}

/**
 * 主函数
 */
async function main() {
  const reporter = new AIReporter();
  
  try {
    const report = await reporter.generate();
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 AI Daily Report 生成完成');
    console.log('='.repeat(60));
    console.log(`📅 日期: ${report.date}`);
    console.log(`📝 新闻数: ${report.totalItems}`);
    console.log(`🏆 P0: ${report.highlights.p0Count} | ⭐ P1: ${report.highlights.p1Count} | 📰 P2: ${report.highlights.p2Count}`);
    console.log(`✨ 推荐: ${report.summary}`);
    console.log('='.repeat(60) + '\n');
    
    // 自动提交
    await reporter.commitAndPush(report);
    
  } catch (error) {
    console.error('💥 生成失败:', error);
    process.exit(1);
  }
}

// 运行
if (require.main === module) {
  main();
}

export { AIReporter };
