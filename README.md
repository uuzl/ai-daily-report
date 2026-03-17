# 🤖 AI Daily Report

> 自动化 AI 行业日报生成与发布系统

[![GitHub Pages](https://img.shields.io/badge/GitHub-Pages-blue)](https://github.com/features/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 📋 项目简介

AI Daily Report 是一个全自动化的 AI 行业新闻聚合与发布系统。每天北京时间 8:00 自动：

1. 🔍 从多个可信源搜索 AI 领域最新动态
2. 📊 按可信度分级（官方 P0 > 技术大牛 P1 > 新闻网站 P2）
3. 📝 生成美观的 HTML 日报页面
4. 🚀 自动推送至 GitHub Pages 发布

访问地址：`https://你的用户名.github.io/ai-daily-report`

---

## ✨ 特性

- ✅ **零手动干预** - 全自动定时运行（GitHub Actions）
- 🔰 **可信度分级** - P0(官方)/P1(大牛)/P2(新闻) 三级标识
- 🎯 **智能摘要** - AI 自动提取核心内容
- 📱 **响应式设计** - 手机/平板/桌面完美适配
- 🎨 **美观 UI** - 渐变风格、毛玻璃效果、卡片式布局
- 📊 **编辑推荐** - 优先展示高可信度内容
- 🔄 **滚动加载** - 支持往期内容无限滚动（预留）
- 📦 **数据存档** - 每日 JSON 存档，便于分析

---

## 🏗️ 技术架构

```
┌─────────────────────────────────────────────────────┐
│                    GitHub Actions                    │
│          (每天 8:00 自动触发)                        │
├─────────────────────────────────────────────────────┤
│  1. Checkout repository                             │
│  2. Setup Node.js + npm ci                          │
│  3. Load secrets (Tavily API Key)                   │
│  4. Run: npm run generate                           │
│  5. Git commit & push → GitHub Pages                │
└─────────────────────────────────────────────────────┘
```

**核心依赖**:
- [Tavily API](https://tavily.com/) - AI 优化搜索
- [EJS](https://ejs.co/) - 模板引擎
- [date-fns](https://date-fns.org/) - 日期处理
- [GitHub Pages](https://pages.github.com/) - 静态托管

---

## 🚀 快速开始

### 1. Fork 本仓库

点击右上角 **Fork** 按钮，复制到你的 GitHub 账号。

### 2. 配置 Secrets

进入你的仓库 → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

添加以下 Secrets：

| 名称 | 值 | 必需 |
|------|-----|------|
| `TAVILY_API_KEY` | 你的 Tavily API Key | ✅ 必需 |
| `SEARCH_KEYWORDS` | 搜索关键词，逗号分隔（可选） | ⭕ 可选 |
| `MAX_ITEMS` | 最大新闻数 (默认15) | ⭕ 可选 |

获取 Tavily API Key：
1. 访问 https://tavily.com/
2. 注册/登录
3. 在 Dashboard 获取 API Key

### 3. 启用 GitHub Pages

进入 **Settings** → **Pages**：
- **Source**: GitHub Actions
- 无需额外配置，Actions 会自动构建

### 4. 手动触发测试（可选）

在 **Actions** 标签页，选择 "AI Daily Report" workflow，点击 **Run workflow** → **Run workflow**

### 5. 访问站点

几分钟后，访问：
```
https://你的用户名.github.io/ai-daily-report
```

---

## ⚙️ 配置说明

### 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `TAVILY_API_KEY` | Tavily API 密钥（必需） | - |
| `SEARCH_KEYWORDS` | 搜索关键词，逗号分隔 | AI相关默认关键词 |
| `MAX_ITEMS` | 每日最大新闻数 | 15 |
| `OUTPUT_DIR` | 输出目录 | ./public |

### 搜索关键词

默认搜索组合：
```
AI artificial intelligence news
OpenAI ChatGPT updates
Claude Anthropic release
DeepSeek AI developments
large language models LLM
```

可以在 `.env.example` 中修改后填入 `SEARCH_KEYWORDS`。

---

## 📊 可信度分级

| 等级 | 来源示例 | 说明 |
|------|----------|------|
| **P0** | openai.com, anthropic.com, deepseek.ai, huggingface.co | 官方源头，最高可信度 |
| **P1** | 知名技术博客（Simon Willison 等）、arXiv | 技术大牛，深度内容 |
| **P2** | TechCrunch, The Verge, Bloomberg, 36氪 | 主流新闻，综合报道 |

**优先级**: P0 > P1 > P2（首页优先展示）

---

## 📁 项目结构

```
ai-daily-report/
├── .github/
│   └── workflows/
│       └── daily.yml          # GitHub Actions 定时任务
├── src/
│   ├── index.ts              # 主程序
│   ├── fetch-news.ts         # 新闻抓取与可信度分析
│   ├── generate-html.ts      # HTML 生成器
│   └── types.ts              # 类型定义
├── public/                    # GitHub Pages 输出
│   ├── index.html           # 主页面（自动生成）
│   └── report.json          # 原始数据（可选）
├── templates/                # EJS 模板（可选扩展）
├── .env.example             # 环境变量示例
├── tsconfig.json
├── package.json
└── README.md
```

---

## 🎨 页面预览

### 首页布局

```
┌─────────────────────────────────────────────┐
│         🤖 AI Daily Report                   │
│         2026-03-17 · 人工智能领域最新动态      │
│  📊 总计:15 | 🏆官方:3 | ⭐大牛:4 | 📰新闻:8   │
├─────────────────────────────────────────────┤
│  ✨ 编辑推荐 (P0 & P1 优先展示)              │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐      │
│  │ 推荐卡片 │ │ 推荐卡片 │ │ 推荐卡片 │      │
│  └─────────┘ └─────────┘ └─────────┘      │
├─────────────────────────────────────────────┤
│  📰 全部新闻 (按可信度排序 + 时间)            │
│  ┌─────────────────────────────┐          │
│  │ 🏆 P0 官方  ⭐ OpenAI...     │          │
│  │  标题 + 摘要 + 标签 + 链接    │          │
│  └─────────────────────────────┘          │
│  ┌─────────────────────────────┐          │
│  │ ⭐ P1 大牛  📝 Simon Wi...   │          │
│  │  标题 + 摘要 + 标签 + 链接    │          │
│  └─────────────────────────────┘          │
│  ... (更多卡片)                             │
├─────────────────────────────────────────────┤
│  Powered by OpenClaw Agent                  │
│  生成时间: 2026-03-17 08:05:12             │
└─────────────────────────────────────────────┘
```

---

## 🔧 本地开发

如果需要修改代码或测试：

```bash
# 克隆仓库
git clone https://github.com/你的用户名/ai-daily-report.git
cd ai-daily-report

# 复制环境变量
cp .env.example .env
# 编辑 .env 填入 TAVILY_API_KEY

# 安装依赖
npm install

# 本地运行（测试）
npm run dev

# 生成报告（手动触发）
npm run generate

# 构建 TypeScript
npm run build
```

---

## 🐛 故障排除

### GitHub Pages 不更新？

- 检查 Actions 是否成功运行（Actions 标签页）
- 确认已启用 Pages 设置（Source: GitHub Actions）
- Pages 可能需要 1-2 分钟生效

### Tavily API 错误？

- 确认 `TAVILY_API_KEY` 已正确配置为 Secret
- 检查 API Key 是否有效（访问 Tavily Dashboard）
- 确保未超过 API 调用限额

### 没有新闻？

- 检查 `SEARCH_KEYWORDS` 是否太窄
- Tavily 有时会返回少于请求的结果（取决于内容可用性）
- 可以尝试放宽时间范围或增加关键词

---

## 📜 License

MIT © [Your Name](https://github.com/你的用户名)

---

## 🙏 致谢

- [OpenClaw](https://openclaw.ai/) - AI Agent 平台
- [Tavily](https://tavily.com/) - AI 优化的搜索引擎
- [GitHub Actions](https://github.com/features/actions) - 自动化工作流
- [EJS](https://ejs.co/) - 模板引擎

---

**Happy Coding! 🚀**
