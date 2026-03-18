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
   * 获取目标日期（当天）
   */
  private getTargetDate(): string {
    const now = new Date();
    return format(now, 'yyyy-MM-dd');
  }
  
  /**
   * 构建 Tavily 搜索查询
   * 注意：不能同时使用 days 参数和 after: 语法，这里只用关键词组合
   */
  private buildSearchQuery(): string {
    const keywords = this.config.searchKeywords.join(' OR ');
    // 只用关键词，时间范围由 days 参数控制
    return `(${keywords})`;
  }
  
  /**
   * 调用 Tavily API 搜索
   */
  private async fetchNews(): Promise<any[]> {
    const query = this.buildSearchQuery();
    console.log(`🔍 搜索查询: ${query}`);
    console.log(`📊 配置: maxItems=${this.config.maxItems}, keywords=${this.config.searchKeywords.join(', ')}`);
    
    try {
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
          days: 1,
          max_results: this.config.maxItems + 10,
          include_domains: [
            'openai.com', 'anthropic.com', 'deepseek.ai', 'huggingface.co',
            'arxiv.org', 'scholar.google.com',
            'techcrunch.com', 'theverge.com', 'arstechnica.com',
            'wired.com', 'bloomberg.com', 'reuters.com',
            '36kr.com', 'tech.sina.com.cn'
          ]
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Tavily API 错误: ${response.status} ${response.statusText}`);
        console.error(`📋 错误详情: ${errorText}`);
        throw new Error(`Tavily API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json() as { results: any[]; message?: string };
      console.log(`✅ Tavily 返回 ${data.results?.length || 0} 条结果`);
      if (data.message) {
        console.warn(`⚠️ Tavily 警告: ${data.message}`);
      }
      return data.results || [];
    } catch (error: unknown) {
      console.error('❌ fetchNews 异常:', error);
      // 记录到文件
      const fs = require('fs');
      const logPath = 'public/fetch-error.log';
      try {
        fs.writeFileSync(logPath, `Time: ${new Date().toISOString()}\nError: ${error}\nQuery: ${query}\nAPI Key: ${this.config.tavilyApiKey.substring(0, 10)}...`);
        console.error(`📝 错误日志已保存到 ${logPath}`);
      } catch (e) {
        // ignore
      }
      throw error;
    }
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
    
    // 7. 保存历史归档（避免重复调用 API）
    this.saveArchive(report);
    
    // 8. 生成历史索引页面
    this.generateHistoryIndex();
    
    return report;
  }
  
  /**
   * 保存 JSON 数据（用于历史记录或 API）
   */
  private saveJsonData(report: DailyReport): void {
    const jsonPath = `${this.config.outputDir}/report.json`;
    const fs = require('fs');
    if (!fs.existsSync(this.config.outputDir)) {
      fs.mkdirSync(this.config.outputDir, { recursive: true });
    }
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
   * 保存历史归档（按日期命名）
   * - 避免重复生成：检查当天是否已存在，新报告时间更晚才覆盖
   * - 保留HTML快照：同时保存渲染好的HTML页面
   */
  private saveArchive(report: DailyReport): void {
    const fs = require('fs');
    const archiveDir = `${this.config.outputDir}/archives`;
    if (!fs.existsSync(archiveDir)) {
      fs.mkdirSync(archiveDir, { recursive: true });
    }
    
    const archiveJsonPath = `${archiveDir}/${report.date}.json`;
    
    // 检查是否已存在当日归档，并比较时间戳
    if (fs.existsSync(archiveJsonPath)) {
      console.log(`⚠️  当日归档已存在 (${report.date}.json)，正在检查是否需要更新...`);
      try {
        const existingData = JSON.parse(fs.readFileSync(archiveJsonPath, 'utf8'));
        const existingAt = new Date(existingData.generatedAt).getTime();
        const newAt = report.generatedAt.getTime();
        if (newAt <= existingAt) {
          console.log(`⏭️  新报告时间不晚于已有版本，跳过保存`);
          return;
        } else {
          console.log(`🔄 新报告更新，覆盖旧版本`);
        }
      } catch (e) {
        // 如果读取失败，继续保存
        console.log(`⚠️  无法读取现有归档，将直接覆盖`);
      }
    }
    
    // 保存带日期的 JSON 归档
    fs.writeFileSync(archiveJsonPath, JSON.stringify(report, (key, value) => {
      if (value instanceof Date) {
        return value.toISOString();
      }
      return value;
    }, 2));
    console.log(`📦 归档已保存到 ${archiveJsonPath}`);
    
    // 同时保存 HTML 快照
    try {
      const html = this.htmlGen.generate(report);
      const archiveHtmlPath = `${archiveDir}/${report.date}.html`;
      fs.writeFileSync(archiveHtmlPath, html);
      console.log(`📄 HTML 归档已保存到 ${archiveHtmlPath}`);
    } catch (e) {
      console.warn(`⚠️  HTML 归档保存失败: ${e}`);
    }
  }
  
  /**
   * 生成历史索引页面（history.html）
   * 列出所有可用的往期报告
   */
  private generateHistoryIndex(): void {
    const fs = require('fs');
    const archiveDir = `${this.config.outputDir}/archives`;
    
    if (!fs.existsSync(archiveDir)) {
      console.log('⚠️  归档目录不存在，跳过历史索引生成');
      return;
    }
    
    // 扫描所有归档文件
    const files: string[] = fs.readdirSync(archiveDir)
      .filter((name: string) => name.endsWith('.json'))
      .map((name: string) => name.replace('.json', ''))
      .sort()
      .reverse(); // 最新的在前面
    
    if (files.length === 0) {
      console.log('⚠️  暂无归档文件，跳过历史索引生成');
      return;
    }
    
    // 生成所有卡片 HTML
    const cards: string[] = [];
    for (const date of files) {
      try {
        const data = JSON.parse(fs.readFileSync(`${archiveDir}/${date}.json`, 'utf8'));
        const { totalItems, highlights, summary } = data as any;
        const p0 = highlights?.p0Count || 0;
        const p1 = highlights?.p1Count || 0;
        const p2 = highlights?.p2Count || 0;
        const desc = summary ? (summary.length > 60 ? summary.substring(0, 60) + '...' : summary) : '无摘要';
        const hasHtml = fs.existsSync(`${archiveDir}/${date}.html`);
        
        cards.push(`
            <div class="card">
                <div class="date">📅 ${date}</div>
                <h3>AI 行业日报</h3>
                <div class="stats">
                    <span class="badge">🏆P0:${p0}</span>
                    <span class="badge p1">⭐P1:${p1}</span>
                    <span class="badge p2">📰P2:${p2}</span>
                    <span>📝${totalItems}条</span>
                </div>
                <div style="font-size:0.9em;color:var(--text2);margin-bottom:12px;">${desc}</div>
                <div style="display:flex; gap:10px; flex-wrap:wrap;">
                    <a href="archives/${date}.json" class="view-btn" target="_blank">📄 原始数据</a>
                    ${hasHtml ? `<a href="archives/${date}.html" class="view-btn" target="_blank" style="background:#28a745;">🌐 查看页面</a>` : ''}
                </div>
            </div>`);
      } catch (e) {
        // 跳过损坏的文件
      }
    }
    
    const now = new Date().toISOString();
    const cardsHtml = cards.join('\n');
    
    const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Daily Report - 历史归档</title>
    <style>
        :root {
          --primary: #667eea;
          --secondary: #764ba2;
          --bg: #f8f9fa;
          --card: #fff;
          --text: #212529;
          --text2: #6c757d;
          --border: #e9ecef;
          --shadow: 0 4px 6px rgba(0,0,0,0.1);
          --radius: 12px;
        }
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background:linear-gradient(135deg,var(--primary),var(--secondary)); min-height:100vh; padding:20px; }
        .container { max-width:1200px; margin:0 auto; }
        header { background:rgba(255,255,255,0.95); backdrop-filter:blur(10px); border-radius:var(--radius); padding:30px; margin-bottom:30px; box-shadow:var(--shadow); text-align:center; }
        h1 { color:var(--text); margin-bottom:10px; }
        .subtitle { color:var(--text2); margin-bottom:20px; }
        .back-link { display:inline-block; margin-top:15px; color:var(--primary); text-decoration:none; font-weight:600; }
        .grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:20px; }
        .card { background:var(--card); border-radius:var(--radius); padding:20px; box-shadow:var(--shadow); transition:transform 0.2s; }
        .card:hover { transform:translateY(-2px); }
        .date { font-size:0.9em; color:var(--text2); margin-bottom:8px; }
        .card h3 { color:var(--text); margin-bottom:12px; font-size:1.1em; }
        .stats { display:flex; gap:15px; font-size:0.85em; color:var(--text2); margin-bottom:12px; }
        .badge { background:var(--primary); color:#fff; padding:2px 8px; border-radius:10px; font-size:0.8em; }
        .badge.p0 { background:#28a745; }
        .badge.p1 { background:#ffc107; color:#000; }
        .badge.p2 { background:#6c757d; }
        .view-btn { display:inline-block; background:var(--primary); color:#fff; padding:8px 16px; border-radius:6px; text-decoration:none; font-size:0.9em; margin-top:10px; }
        .view-btn:hover { background:var(--secondary); }
        footer { text-align:center; margin-top:40px; color:rgba(255,255,255,0.8); font-size:0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>📚 AI Daily Report - 历史归档</h1>
            <p class="subtitle">共 ${files.length} 期往期报告，点击查看详情</p>
            <a href="index.html" class="back-link">← 返回最新一期</a>
        </header>
        
        <div class="grid">
${cardsHtml}
        </div>
        
        <footer>
            <p>Generated by OpenClaw Agent • ${now}</p>
        </footer>
    </div>
</body>
</html>`;
    
    const indexPath = `${this.config.outputDir}/history.html`;
    fs.writeFileSync(indexPath, html);
    console.log(`📜 历史索引已生成: ${indexPath}`);
  }
  
  /**
   * Git 提交并推送（由 GitHub Actions 处理，本地不再调用）
   */
  async commitAndPush(_report: DailyReport): Promise<void> {
    console.log('⚠️  commitAndPush() 已弃用。Git 提交由 GitHub Actions 处理。');
  }
}

/**
 * 主函数
 */
async function main() {
  const reporter = new AIReporter();
  
  try {
    console.log('🚀 开始生成 AI Daily Report...');
    const report = await reporter.generate();
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 AI Daily Report 生成完成');
    console.log('='.repeat(60));
    console.log(`📅 日期: ${report.date}`);
    console.log(`📝 新闻数: ${report.totalItems}`);
    console.log(`🏆 P0: ${report.highlights.p0Count} | ⭐ P1: ${report.highlights.p1Count} | 📰 P2: ${report.highlights.p2Count}`);
    console.log(`✨ 推荐: ${report.summary}`);
    console.log('='.repeat(60) + '\n');
    
    console.log('✅ 报告生成完成。Git 提交将由 GitHub Actions 处理。');
    process.exit(0);
  } catch (error: unknown) {
    console.error('\n' + '='.repeat(60));
    console.error('💥 生成失败');
    console.error('='.repeat(60));
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('错误类型:', err.constructor.name);
    console.error('错误信息:', err.message);
    if (err.stack) {
      console.error('堆栈跟踪:\n', err.stack);
    }
    console.error('='.repeat(60) + '\n');
    process.exit(1);
  }
}

// 运行
if (require.main === module) {
  main();
}

export { AIReporter };
