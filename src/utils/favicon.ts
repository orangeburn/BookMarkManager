/**
 * 获取网站的favicon图标URL
 * @param url 网站URL
 * @returns favicon图标的URL
 */

// 创建一个简单的内存缓存，避免重复请求相同的favicon
const faviconCache: Record<string, string> = {};

export function getFaviconUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    
    // 检查缓存中是否已有此域名的favicon
    if (faviconCache[hostname]) {
      return faviconCache[hostname];
    }
    
    // 使用DuckDuckGo的favicon服务，这个服务通常更稳定
    const faviconUrl = `https://icons.duckduckgo.com/ip3/${hostname}.ico`;
    
    // 将结果存入缓存
    faviconCache[hostname] = faviconUrl;
    
    return faviconUrl;
  } catch (error) {
    // 如果URL解析失败，返回一个默认的图标
    console.warn(`无法解析URL以获取favicon: ${url}`, error);
    return '/icons/icon32.png';
  }
}