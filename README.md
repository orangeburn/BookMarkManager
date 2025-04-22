# BookMark Manager (BMM)

<div align="center">

![BookMark Manager Logo](./public/icons/icon128.png)

**Chrome书签智能管理工具**

</div>

## 📖 项目简介

BookMark Manager 是一个Chrome浏览器扩展，利用大语言模型(LLM)辅助书签管理，帮助用户更好地组织网络资源。它可以提取书签内容摘要、生成标签、进行智能分类，提升书签管理效率和检索体验。

## ✨ 核心功能

### 🔍 智能书签分析
- **自动摘要生成**：分析书签网页内容，生成简洁的摘要描述
- **智能标签提取**：根据网页内容自动生成相关标签，便于分类和搜索
- **网页内容爬取**：支持爬取网页内容以提高分析准确性（可选功能）

### 📂 分类管理
- **自定义分类**：创建和管理自定义书签分类
- **智能分类**：基于AI分析自动对书签进行分类
- **拖拽排序**：直观的拖放界面，轻松整理书签顺序

### 🔎 高效检索
- **全文搜索**：快速搜索书签标题、URL、标签和摘要
- **标签筛选**：通过标签快速过滤相关书签
- **多视图模式**：支持卡片视图和列表视图，满足不同浏览习惯

## 🚀 安装指南

### 开发者模式安装
1. 下载本仓库代码并解压，或克隆仓库到本地
2. 打开Chrome浏览器，访问`chrome://extensions/`
3. 开启右上角的"开发者模式"
4. 点击"加载已解压的扩展程序"按钮
5. 选择项目的`dist`目录

## 🛠️ 开发指南

### 环境要求
- Node.js 16+
- npm 或 yarn

### 本地开发
```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建扩展
npm run build-extension
```

## 📝 使用说明

### 基本操作
1. 点击Chrome工具栏中的扩展图标打开BookMark Manager
2. 在左侧边栏可以查看和管理书签分类
3. 点击"添加分类"按钮创建新的书签分类
4. 在主界面查看和管理当前分类下的书签

### AI功能配置
1. 点击右上角设置图标打开设置面板
2. 配置API密钥和API URL（支持OpenAI和兼容接口）
3. 选择AI模型（如gpt-3.5-turbo）
4. 开启或关闭网页内容爬取功能

### 智能分类
1. 切换到"智能分类"标签页
2. 系统会自动根据书签内容生成智能分类
3. 点击左侧分类查看相关书签

## 🔧 技术栈

- **前端框架**：React 18
- **状态管理**：Zustand
- **UI组件**：Tailwind CSS, Lucide React
- **拖拽功能**：@dnd-kit
- **构建工具**：Vite, TypeScript
- **AI集成**：OpenAI API (可自定义)

## 🤝 贡献指南

欢迎贡献代码、报告问题或提出新功能建议！

1. Fork 本仓库
2. 创建您的特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交您的更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 打开一个 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 详情请参阅 [LICENSE](LICENSE) 文件

## 📊 版本历史

- **v0.2.3**：当前版本，改进UI和性能优化
- **v0.2.0**：添加智能分类功能
- **v0.1.0**：初始版本，基本书签管理功能

## 📱 联系方式

如有问题或建议，请通过以下方式联系：

- 提交 [Issue](https://github.com/yourusername/bookmark-manager/issues)
- 发送邮件至：[burnstochan@gmail.com](mailto:burnstochan@gmail.com)

---

<div align="center">

**BookMark Manager** - 让书签管理更智能、更高效

</div>