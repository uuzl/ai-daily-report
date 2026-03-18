import fs from 'fs';
import path from 'path';
import { DailyReport, NewsItem, SourceCredibility } from './types';

/**
 * HTML 模板生成器
 */
export class HTMLGenerator {
  private templateDir: string;
  
  constructor(templateDir: string = './templates') {
    this.templateDir = templateDir;
  }
  
  /**
   * 生成完整 HTML 页面
   */
  generate(report: DailyReport): string {
    const tools = [
      {
        id: 'maze',
        name: '迷宫生成器',
        description: '随机生成黑墙白底迷宫，支持自定义尺寸 n×n',
        icon: '🧩',
        status: '✅ 已就绪'
      }
      // 可扩展更多工具...
    ];

    const toolCards = tools.map(tool => `
      <a href="tools/${tool.id}.html" class="tool-card">
        <div class="tool-icon">${tool.icon}</div>
        <h3>${tool.name}</h3>
        <p>${tool.description}</p>
        <div class="tool-status">${tool.status}</div>
      </a>
    `).join('\n');

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>测试工具 - AI Daily Report</title>
    <style>
        :root {
          --primary: #667eea;
          --secondary: #764ba2;
          --bg-color: #f8f9fa;
          --card-bg: #ffffff;
          --text-main: #212529;
          --text-secondary: #6c757d;
          --shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          --radius: 12px;
        }
        
        * { margin:0; padding:0; box-sizing:border-box; }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
          min-height: 100vh;
          padding: 20px;
        }
        
        .container {
          max-width: 1200px;
          margin: 0 auto;
        }
        
        header {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-radius: var(--radius);
          padding: 30px;
          margin-bottom: 30px;
          box-shadow: var(--shadow);
          text-align: center;
        }
        
        .logo {
          font-size: 2rem;
          font-weight: 700;
          background: linear-gradient(135deg, var(--primary), var(--secondary));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 10px;
        }
        
        .subtitle {
          color: var(--text-secondary);
          font-size: 1.1rem;
        }
        
        .back-link {
          display: inline-block;
          margin-top: 15px;
          color: var(--primary);
          text-decoration: none;
          font-weight: 600;
        }
        
        .back-link:hover {
          text-decoration: underline;
        }
        
        .tools-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 25px;
        }
        
        .tool-card {
          background: var(--card-bg);
          border-radius: var(--radius);
          padding: 30px;
          box-shadow: var(--shadow);
          text-decoration: none;
          color: inherit;
          transition: transform 0.2s, box-shadow 0.2s;
          display: block;
        }
        
        .tool-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
        }
        
        .tool-icon {
          font-size: 3rem;
          margin-bottom: 15px;
        }
        
        .tool-card h3 {
          color: var(--text-main);
          font-size: 1.3rem;
          margin-bottom: 10px;
        }
        
        .tool-card p {
          color: var(--text-secondary);
          line-height: 1.6;
          margin-bottom: 15px;
        }
        
        .tool-status {
          display: inline-block;
          background: #d4edda;
          color: #155724;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
        }
        
        footer {
          text-align: center;
          padding: 30px;
          color: rgba(255, 255, 255, 0.9);
          margin-top: 40px;
          font-size: 0.9rem;
        }
        
        @media (max-width: 768px) {
          .tools-grid {
            grid-template-columns: 1fr;
          }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <a href="../index.html" class="back-link">← 返回日报首页</a>
            <div class="logo">🛠️ 测试工具</div>
            <div class="subtitle">实验性功能集合，用于快速验证想法</div>
        </header>
        
        <main class="tools-grid">
            ${toolCards}
        </main>
        
        <footer>
            <p>Powered by OpenClaw Agent</p>
        </footer>
    </div>
</body>
</html>`;
  }
    const credibilityBadge = (cred: SourceCredibility): string => {
      const badges: Record<SourceCredibility, string> = {
        [SourceCredibility.P0]: '<span class="badge badge-p0">🏆 官方</span>',
        [SourceCredibility.P1]: '<span class="badge badge-p1">⭐ 大牛</span>',
        [SourceCredibility.P2]: '<span class="badge badge-p2">📰 新闻</span>'
      };
      return badges[cred] || '';
    };
    
    const categoryIcon = (cat: NewsItem['category']): string => {
      const icons: Record<NewsItem['category'], string> = {
        hot: '🔥',
        tech: '💻',
        product: '🚀',
        research: '📚'
      };
      return icons[cat] || '📌';
    };
    
    // 生成新闻卡片 HTML
    const newsCards = report.items.map(item => `
      <article class="news-card" data-credibility="${item.credibility}" data-category="${item.category}">
        <div class="card-header">
          <div class="card-meta">
            ${categoryIcon(item.category)}
            <span class="source">${this.escapeHtml(item.source)}</span>
            ${credibilityBadge(item.credibility)}
            <span class="date">${item.publishedAt.toLocaleDateString('zh-CN')}</span>
          </div>
        </div>
        <h3 class="card-title">
          <a href="${item.url}" target="_blank" rel="noopener noreferrer">${this.escapeHtml(item.title)}</a>
        </h3>
        <p class="card-summary">${this.escapeHtml(item.summary)}</p>
        ${item.tags.length > 0 ? `
        <div class="card-tags">
          ${item.tags.map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('')}
        </div>` : ''}
        <div class="card-footer">
          <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="read-more">
            阅读原文 →
          </a>
        </div>
      </article>
    `).join('\n');
    
    // 按可信度分组统计
    const p0Count = report.items.filter(i => i.credibility === SourceCredibility.P0).length;
    const p1Count = report.items.filter(i => i.credibility === SourceCredibility.P1).length;
    const p2Count = report.items.filter(i => i.credibility === SourceCredibility.P2).length;
    
    // 编辑推荐：优先展示 P0，其次 P1
    const recommendedItems = report.items
      .filter(i => i.credibility === SourceCredibility.P0 || i.credibility === SourceCredibility.P1)
      .slice(0, 5);
    
    const recommendedHtml = recommendedItems.length > 0 ? `
      <section class="recommended-section">
        <h2>✨ 编辑推荐</h2>
        <div class="recommended-grid">
          ${recommendedItems.map(item => `
            <div class="recommended-card">
              <div class="rec-header">
                ${categoryIcon(item.category)}
                <span class="rec-source">${this.escapeHtml(item.source)}</span>
                ${credibilityBadge(item.credibility)}
              </div>
              <h3><a href="${item.url}" target="_blank">${this.escapeHtml(item.title)}</a></h3>
              <p>${this.escapeHtml(item.summary.substring(0, 120))}...</p>
            </div>
          `).join('')}
        </div>
      </section>
    ` : '';
    
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="AI Daily Report - ${report.date} 人工智能领域最新动态">
    <title>AI Daily Report - ${report.date}</title>
    <style>
        :root {
          --primary: #667eea;
          --secondary: #764ba2;
          --bg-color: #f8f9fa;
          --card-bg: #ffffff;
          --text-main: #212529;
          --text-secondary: #6c757d;
          --border-color: #e9ecef;
          --shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          --radius: 12px;
        }
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
          min-height: 100vh;
          padding: 20px;
          line-height: 1.6;
        }
        
        .container {
          max-width: 1200px;
          margin: 0 auto;
        }
        
        header {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-radius: var(--radius);
          padding: 30px;
          margin-bottom: 30px;
          box-shadow: var(--shadow);
          text-align: center;
        }
        
        .logo {
          font-size: 2rem;
          font-weight: 700;
          background: linear-gradient(135deg, var(--primary), var(--secondary));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 10px;
        }
        
        .subtitle {
          color: var(--text-secondary);
          margin-bottom: 15px;
          font-size: 1.1rem;
        }
        
        .stats {
          display: flex;
          justify-content: center;
          gap: 20px;
          flex-wrap: wrap;
          margin-top: 15px;
        }
        
        .stat-item {
          background: var(--bg-color);
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 0.9rem;
          color: var(--text-secondary);
        }
        
        .stat-item strong {
          color: var(--text-main);
          margin-left: 5px;
        }
        
        .recommended-section {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-radius: var(--radius);
          padding: 30px;
          margin-bottom: 30px;
          box-shadow: var(--shadow);
        }
        
        .recommended-section h2 {
          color: var(--text-main);
          margin-bottom: 20px;
          font-size: 1.5rem;
        }
        
        .recommended-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
        }
        
        .recommended-card {
          background: var(--bg-color);
          border-radius: 8px;
          padding: 20px;
          border-left: 4px solid var(--primary);
          transition: transform 0.2s;
        }
        
        .recommended-card:hover {
          transform: translateY(-2px);
        }
        
        .rec-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
          font-size: 0.85rem;
          color: var(--text-secondary);
        }
        
        .rec-source {
          font-weight: 600;
        }
        
        .news-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 20px;
        }
        
        .news-card {
          background: var(--card-bg);
          border-radius: var(--radius);
          padding: 25px;
          box-shadow: var(--shadow);
          transition: transform 0.2s, box-shadow 0.2s;
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        
        .news-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
        }
        
        .card-header {
          margin-bottom: 12px;
        }
        
        .card-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8rem;
          color: var(--text-secondary);
          flex-wrap: wrap;
        }
        
        .badge {
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }
        
        .badge-p0 {
          background: linear-gradient(135deg, #ffd700, #ffaa00);
          color: #000;
        }
        
        .badge-p1 {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: #fff;
        }
        
        .badge-p2 {
          background: #e9ecef;
          color: #495057;
        }
        
        .card-title {
          font-size: 1.2rem;
          line-height: 1.4;
          margin-bottom: 12px;
          color: var(--text-main);
        }
        
        .card-title a {
          text-decoration: none;
          color: inherit;
          transition: color 0.2s;
        }
        
        .card-title a:hover {
          color: var(--primary);
        }
        
        .card-summary {
          color: #495057;
          font-size: 0.95rem;
          flex-grow: 1;
          margin-bottom: 15px;
        }
        
        .card-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 15px;
        }
        
        .tag {
          background: var(--bg-color);
          color: var(--primary);
          padding: 3px 10px;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 500;
        }
        
        .card-footer {
          margin-top: auto;
        }
        
        .read-more {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          color: var(--primary);
          text-decoration: none;
          font-weight: 600;
          font-size: 0.9rem;
          transition: gap 0.2s;
        }
        
        .read-more:hover {
          gap: 8px;
        }
        
        footer {
          text-align: center;
          padding: 30px;
          color: rgba(255, 255, 255, 0.9);
          margin-top: 40px;
          font-size: 0.9rem;
        }
        
        .generated-info {
          background: rgba(0, 0, 0, 0.2);
          padding: 15px;
          border-radius: 8px;
          margin-top: 15px;
          font-size: 0.85rem;
        }
        
        @media (max-width: 768px) {
          .news-grid {
            grid-template-columns: 1fr;
          }
          
          .recommended-grid {
            grid-template-columns: 1fr;
          }
          
          .logo {
            font-size: 1.5rem;
          }
          
          header, .recommended-section {
            padding: 20px;
          }
          
          .news-card {
            padding: 20px;
          }
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid rgba(255,255,255,0.3);
          border-top: 4px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 20px auto;
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <div class="logo">🤖 AI Daily Report</div>
            <div class="subtitle">${report.date} · 人工智能领域最新动态</div>
            <div class="stats">
                <div class="stat-item">📊 总计 <strong>${report.items.length}</strong> 条</div>
                <div class="stat-item">🏆 官方 <strong>${p0Count}</strong> 条</div>
                <div class="stat-item">⭐ 大牛 <strong>${p1Count}</strong> 条</div>
                <div class="stat-item">📰 新闻 <strong>${p2Count}</strong> 条</div>
            </div>
        </header>
        
        ${recommendedHtml}
        
        <main class="news-grid" id="news-container">
            ${newsCards}
        </main>
        
        <footer>
            <p>Powered by OpenClaw Agent & GitHub Pages</p>
            <div class="generated-info">
                <p>📅 报告日期: ${report.date}</p>
                <p>⏰ 生成时间: ${report.generatedAt.toLocaleString('zh-CN')}</p>
                <p>🔗 <a href="history.html" style="color:white;text-decoration:underline;">查看往期归档</a></p>
                <p style="margin-top:10px; font-size:0.8rem; opacity:0.8;">
                    数据来源：Tavily AI Search · 可信度分级：P0(官方) > P1(大牛) > P2(新闻)
                </p>
            </div>
        </footer>
    </div>
    
    <script>
        let loading = false;
        let page = 1;
        
        window.addEventListener('scroll', () => {
          if (loading) return;
          if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100) {
            loadMore();
          }
        });
        
        async function loadMore() {
          loading = true;
          console.log('Loading more reports...');
          // 实际实现会从 JSON API 加载往期数据
          // await fetch(\`/api/reports?page=\${page}\`).then(...)
          loading = false;
          page++;
        }
    </script>
</body>
</html>`;
  }
  
  /**
   * HTML 转义（Node.js 环境）
   */
  private escapeHtml(text: string): string {
    const escapeMap: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    return text.replace(/[&<>"']/g, char => escapeMap[char] || char);
  }
  
  /**
   * 保存 HTML 到文件
   */
  save(html: string, outputPath: string = './public/index.html'): void {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(outputPath, html, 'utf-8');
  }
}
