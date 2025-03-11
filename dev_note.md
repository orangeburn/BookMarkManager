# BookMarkManager

## 项目简介

BookMark Manager 是一个用于管理 Chrome 浏览器书签的插件。通过引入大语言模型 (LLM) 对书签进行描述、关键词提取、快速分类排序、书签网址有效性检验和搜索支持，让用户快速管理自己的书签，打造自己的网络知识库。

## 需求规格说明

### 1. 运行环境

- Windows 11 系统
- Chrome 浏览器

### 2. 核心功能需求

1. **书签描述与关键词提取**
   - 自动对新增书签地址的内容进行摘要，生成摘要，可自定义修改
   - 根据摘要内容生成标签与关键词，可自定义修改
2. **分类与排序**
   - 根据所有书签的摘要，生成分类与排序
   - 用户可自定义修改分类项与排序方式
3. **书签管理**
   - 自动获取 Chrome 浏览器中的书签信息，并可同步对书签进行编辑与删除
   - 卡片式/列表式展示书签

## 开发说明

### 1. 开发原则

- 开发工作围绕 `dev_note` ，不生成与需求无关的代码
- 保证代码的简洁高效
- 适时移除多余的代码
- 采用最轻量化的方式进行开发
- 保证提供的方案与开发环境一致，不存在冲突
- 专注于核心需求与功能实现
- 提供代码的同时，明确代码对应的文件
- 确保安装的依赖正确，安装路径正确
- 当同样的问题重复出现超过3次，应反思方案思路是否正确，并尝试不同的解决方法
- 避免添加与项目无关的测试项
- 当创建新的项目文件时，更新 `dev_note.md` 文件的项目结构
- 保证终端命令的路径正确
- 避免因代码修改引入新的问题
- 避免语法错误
- 使用一致的命名约定
- 移除冗余代码，确保代码可读性和可维护性

### 2. 开发环境

1. **操作系统**
   - Windows 11
2. **开发工具**
   - VSCode
3. **编程语言**
   - JavaScript (Chrome Extension API + Vue.js/React.js)
4. **环境配置**
   - Node.js + npm/yarn
5. **依赖项**
   - OpenAI API (用于摘要生成和关键词提取)
   - Chrome Bookmarks API (用于书签管理)
   - IndexedDB/LocalStorage (本地数据存储)

### 3. UI 界面需求

1. **全局操作**

   - 设置按钮：点击后，弹出 API 输入弹窗，用户可在弹窗中输入 OpenAI API Key，格式为 OpenAI API 格式
   - 刷新按钮：检测新添加的书签，生成摘要与标签并进行归类
   - 搜索：用户可输入关键词，匹配书签标签与摘要，进行搜索

2. **分类栏**

   - 由 AI 根据所有书签的摘要，生成分类项，并对书签进行归类

3. **书签列表**

   - 可切换卡片式/列表式展示
   - 卡片展示内容：网站 icon、网址、AI 生成的标签、摘要
   - 列表展示内容：书签 icon、网址、AI 生成的标签
   - 点击卡片/列表项，打开新的浏览器标签页并跳转至该地址

## 项目结构

```
BookMark_Manager/
├── manifest.json          # Chrome 扩展配置文件
├── popup.html             # 插件主界面 HTML
├── popup.js               # 主界面交互逻辑
├── background.js          # 监听书签变化并调用 AI
├── content.js             # 可选：用于网页内容提取
├── styles.css             # UI 样式
├── api/
│   ├── openai.js          # 负责 OpenAI API 调用
│   └── bookmarks.js       # 书签管理封装
├── utils/
│   ├── storage.js         # 本地存储封装
│   ├── dom.js             # DOM 操作工具函数
│   └── ai.js              # AI 处理逻辑（摘要、关键词、分类）
├── assets/                # 存放图标、图片等资源
├── options.html           # 设置界面 HTML
└── options.js             # 设置界面逻辑
```

#### **文件功能说明**

- **`manifest.json`**\
  定义扩展的基本信息、权限、资源文件路径等。

  ```json
  {
    "manifest_version": 3,
    "name": "BookMark Manager",
    "version": "1.0",
    "permissions": ["bookmarks", "storage"],
    "background": {
      "service_worker": "background.js"
    },
    "action": {
      "default_popup": "popup.html",
      "default_icon": "assets/icon.png"
    },
    "options_page": "options.html"
  }
  ```

- **OpenAI API 请求格式示例**

  ```json
  {
    "model": "text-davinci-003",
    "prompt": "Summarize the following text: ...",
    "max_tokens": 150,
    "temperature": 0.7,
    "top_p": 1.0,
    "frequency_penalty": 0.0,
    "presence_penalty": 0.0
  }
  ```
  **字段说明**:
  - `model`: 使用的模型名称，例如 `text-davinci-003`
  - `prompt`: 请求的文本内容，例如需要生成摘要的文本
  - `max_tokens`: 返回文本的最大长度
  - `temperature`: 控制生成结果的随机性，0 为确定性输出
  - `top_p`: 另一种控制多样性的参数，与 `temperature` 类似
  - `frequency_penalty`: 控制重复词语的惩罚
  - `presence_penalty`: 控制生成内容的新颖性

- **`popup.js`**\
  主界面交互逻辑，包括书签加载、视图切换、搜索、摘要与标签提炼等。

  ```javascript
  document.addEventListener("DOMContentLoaded", () => {
    const refreshButton = document.getElementById("refresh");
    const searchBar = document.getElementById("search-bar");
    const bookmarkList = document.getElementById("bookmark-list");

    refreshButton.addEventListener("click", async () => {
      const bookmarks = await chrome.bookmarks.getTree();
      processBookmarksQueue(bookmarks);
    });

    searchBar.addEventListener("input", (event) => {
      const query = event.target.value.toLowerCase();
      const bookmarks = Array.from(document.querySelectorAll(".bookmark"));
      bookmarks.forEach((bookmark) => {
        const title = bookmark.querySelector("a").textContent.toLowerCase();
        bookmark.style.display = title.includes(query) ? "block" : "none";
      });
    });
  });

  function processBookmarksQueue(bookmarks) {
    const queue = [...bookmarks];

    async function processNext() {
      if (queue.length === 0) return;
      const bookmark = queue.shift();

      try {
        const content = await fetchBookmarkContent(bookmark.url);
        const summary = await callOpenAI(`Summarize: ${content}`);
        const tags = await callOpenAI(`Extract keywords: ${summary}`);
        renderBookmark(bookmark, summary, tags);
      } catch (error) {
        console.warn(`Failed to process bookmark: ${bookmark.url}`, error);
        renderBookmark(bookmark, "", "");
      } finally {
        processNext();
      }
    }

    processNext();
  }

  function renderBookmark(bookmark, summary, tags) {
    const bookmarkElement = document.createElement("div");
    bookmarkElement.className = "bookmark";
    bookmarkElement.innerHTML = `
      <img src="${bookmark.icon || 'assets/default-icon.png'}" alt="icon" />
      <a href="${bookmark.url}">${bookmark.title || 'No title'}</a>
      <p>${summary || 'No summary available.'}</p>
      <span>${tags || 'No tags available.'}</span>
    `;
    document.getElementById("bookmark-list").appendChild(bookmarkElement);
  }

  async function fetchBookmarkContent(url) {
    try {
      const response = await fetch(url);
      return await response.text();
    } catch {
      throw new Error("Content fetch failed");
    }
  }
  ```

## 开发计划

### 1. 搭建项目基础结构
- 创建项目目录结构，并确保目录清晰易于维护。
- 确认 `manifest.json` 和 `popup.html` 初步配置。

### 2. 配置 Chrome 扩展环境
- 配置 `manifest.json`，指定必要的权限（如 `bookmarks` 和 `storage`）。
- 确保可以在 Chrome 浏览器中加载解压的扩展。

### 3. 实现书签的读取功能
- 使用 Chrome Bookmarks API 获取书签数据。
- 实现基础的数据解析逻辑。

### 4. 在 Popup 界面展示书签列表
- 编写 `popup.js` 逻辑，动态加载书签。
- 支持卡片式和列表式两种视图切换。

### 5. 集成 OpenAI API，实现书签摘要和关键词提取
- 调用 OpenAI API 生成书签摘要。
- 自动提取关键词并为书签分类。
- 以队列形式逐个处理书签。
- 异常时显示默认信息（仅保留网址、标题）。

### 6. 设计并实现书签分类与排序逻辑
- 基于关键词和标签实现书签分类。
- 支持自定义分类项与排序方式。

### 7. 允许用户编辑书签的摘要与标签
- 提供编辑功能界面。
- 支持用户保存编辑后的摘要和标签。

### 8. 设计并实现 UI 界面（卡片式/列表式展示）
- 使用 CSS 优化界面样式。
- 实现两种展示方式的切换功能。

### 9. 添加书签管理功能（编辑、删除）
- 增加编辑和删除按钮。
- 确保操作同步到 Chrome 书签管理。

### 10. 实现搜索和筛选功能
- 支持用户按关键词进行搜索。
- 增强筛选和分类展示能力。

### 11. 进行全面测试，修复 Bug
- 执行功能性和兼容性测试。
- 修复用户反馈的 Bug。

### 12. 完善用户设置功能（API Key 管理、分类调整等）
- 添加 API Key 输入与保存功能。
- 支持分类管理的用户自定义。

### 13. 打包扩展并进行最终优化
- 清理无用代码和资源。
- 优化代码结构与性能。

### 14. 发布到 Chrome Web Store
- 生成 ZIP 包并上传到 Chrome Web Store。
- 填写必要的描述和信息进行审核发布。

