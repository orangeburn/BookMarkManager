/**
 * 网页爬虫服务
 * 用于获取网页内容，提供给AI服务使用
 */

/**
 * 获取网页内容
 * @param url 网页URL
 * @returns 返回网页内容，包括标题、描述、正文等
 */
export async function fetchWebContent(url: string): Promise<WebContent | null> {
  try {
    // 设置超时时间为10秒
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    // 使用fetch API获取网页内容，添加超时控制
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
      signal: controller.signal
    }).finally(() => clearTimeout(timeoutId));

    if (!response.ok) {
      throw new Error(`Failed to fetch webpage: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    
    // 解析HTML内容
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // 提取网页标题
    const title = doc.querySelector('title')?.textContent || '';
    
    // 提取网页描述
    const metaDescription = doc.querySelector('meta[name="description"]')?.getAttribute('content') || '';
    
    // 提取网页正文内容
    // 这里使用一个简单的方法提取正文，实际应用中可能需要更复杂的算法
    const bodyText = extractMainContent(doc);
    
    return {
      title,
      description: metaDescription,
      content: bodyText,
      url
    };
  } catch (error) {
    // 提供更详细的错误信息
    let errorMessage = 'Unknown error';
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      errorMessage = '网络连接错误：无法连接到目标网站';
    } else if (error instanceof DOMException && error.name === 'AbortError') {
      errorMessage = '请求超时：网站响应时间过长';
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    console.error('Error fetching web content:', errorMessage, error);
    
    // 返回一个包含错误信息的对象，而不是null
    // 这样调用方可以知道具体发生了什么错误
    return {
      title: '',
      description: '',
      content: '',
      url,
      error: errorMessage
    };
  }
}

/**
 * 提取网页主要内容
 * 这是一个简化版的实现，实际应用中可能需要更复杂的算法
 */
function extractMainContent(doc: Document): string {
  // 移除脚本、样式等不需要的元素
  const scripts = Array.from(doc.querySelectorAll('script, style, iframe, nav, footer, header'));
  scripts.forEach(script => script.remove());
  
  // 尝试找到主要内容区域
  const mainContent = doc.querySelector('main, article, #content, .content, .article, .post');
  
  if (mainContent) {
    return mainContent.textContent?.trim() || '';
  }
  
  // 如果找不到明确的主内容区，则返回body内容，但限制长度
  const bodyText = doc.body.textContent?.trim() || '';
  return bodyText.length > 5000 ? bodyText.substring(0, 5000) + '...' : bodyText;
}

/**
 * 网页内容接口
 */
export interface WebContent {
  title: string;       // 网页标题
  description: string; // 网页描述
  content: string;     // 网页正文
  url: string;         // 网页URL
  error?: string;      // 错误信息，如果获取失败
}