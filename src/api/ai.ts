import { Bookmark } from '../types/bookmark';
import { fetchWebContent, WebContent } from './crawler';

interface AIResponse {
  tags: string[];
  summary: string;
}

// API URL将从参数中获取，不再硬编码

export async function generateTagsAndSummary(bookmark: Bookmark, apiKey: string, apiUrl: string, modelId: string = 'gpt-3.5-turbo', useWebContent: boolean = true): Promise<AIResponse> {
  if (!apiKey) {
    throw new Error('API key is required');
  }
  
  if (!apiUrl || apiUrl.trim() === '') {
    throw new Error('API URL is required');
  }

  // 获取网页内容 - 优化：只在需要时获取
  let webContent: WebContent | null = null;
  let webContentError: string | undefined = undefined;
  
  if (useWebContent) {
    try {
      // 使用Promise.race添加超时处理，避免长时间等待
      const timeoutPromise = new Promise<WebContent>((_, reject) => {
        setTimeout(() => reject(new Error('获取网页内容超时')), 10000); // 10秒超时
      });
      
      webContent = await Promise.race([
        fetchWebContent(bookmark.url),
        timeoutPromise
      ]);
      
      // 检查是否有错误信息
      if (webContent && webContent.error) {
        webContentError = webContent.error;
        console.warn('Web content fetch warning:', webContentError);
      }
    } catch (error) {
      console.error('Failed to fetch web content:', error);
      // 错误处理：记录错误但继续执行
      webContentError = error instanceof Error ? error.message : String(error);
    }
  }

  // 构建提示词 - 优化：减少字符串拼接操作
  const promptParts = [];
  
  // 基本信息
  promptParts.push(`请分析以下网页${useWebContent ? '内容' : ''}：`);
  promptParts.push(`标题：${(webContent?.title || bookmark.title).trim()}`);
  promptParts.push(`URL：${bookmark.url}`);
  
  // 添加描述和内容（如果有）
  if (webContent?.description) {
    promptParts.push(`描述：${webContent.description.trim()}`);
  }
  
  if (webContent?.content && webContent.content.trim() !== '') {
    // 限制内容长度，避免token过多
    const truncatedContent = webContent.content.substring(0, 2000);
    promptParts.push(`内容：${truncatedContent}`);
  }
  
  // 如果有错误信息，添加到提示中
  if (webContentError) {
    promptParts.push(`注意：${webContent ? '获取网页内容时遇到问题' : '无法获取网页内容'}：${webContentError}，请尽量基于可用信息生成标签和描述。`);
  }
  
  const prompt = promptParts.join('\n');

  try {
    // 确保API URL包含完整的端点路径
    const fullApiUrl = apiUrl.includes('/chat/completions') ? apiUrl : `${apiUrl}/chat/completions`;
    
    // 使用AbortController添加请求超时控制
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时
    
    try {
      const response = await fetch(fullApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: modelId,
          messages: [
            {
              role: 'system',
              content: '你是一名专业的档案管理专家，你的目标是便于用户进行信息检索，你擅长根据网页内容提取核心关键词，并撰写简洁、精准的描述,让别人能根据标签和描述，快速了解该网页。关键词必须精准提炼网页内容，描述必须能说明网页的功能性。你的回复必须严格按照要求的格式，不添加任何多余的前缀、符号或标记。'
            },
            {
              role: 'user',
              content: `${prompt}\n\n任务目标：请根据网页的完整内容，生成3-5个简短的标签（关键词），关键词必须精准提炼网页内容,可以是中文、英文或中英文混合，以及一段简洁精准的中英文描述（中文不超过25个字，英文不超过50个字母），描述必须能说明网页的功能性,能说明这个网页内容的作用。\n格式要求：\n标签（Tags）：\n- 数量：最多5个\n- 长度：每个标签长度，中文不超过5个字，英文不超过10个字母\n- 分隔：标签之间使用逗号（,）分隔\n- 语言：支持中文、英文或中英文混合标签\n- 禁止：不要在标签中使用连字符（-）、项目符号或任何特殊字符，只使用纯文本\n描述（Description）：\n- 长度：中文不超过25个字，英文不超过50个字母\n- 要求：简洁概括网页内容，信息准确，避免空泛\n- 禁止：不要在描述前添加任何前缀（如"- 中文:"、"描述："等），直接给出描述内容\n\n请严格按照以下格式回复，不要添加任何额外的符号或标记：\n标签：标签1,标签2,标签3\n描述：这里是描述内容`
            }
          ],
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`AI API请求失败: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;
      
      // 解析AI响应
      let tags: string[] = [];
      let summary = '';
      
      // 尝试从响应中提取标签和描述
      const tagMatch = aiResponse.match(/标签(?:（Tags）)?：?[\s]*(.*)/i);
      const descMatch = aiResponse.match(/描述(?:（Description）)?：?[\s]*(.*)/i);
      
      if (tagMatch && tagMatch[1]) {
        // 处理可能的不同分隔符（逗号、顿号等）
        tags = tagMatch[1].split(/[,，、]/).map(tag => tag.trim()).filter(Boolean).slice(0, 5);
      }
      
      if (descMatch && descMatch[1]) {
        // 移除描述前的前缀
        summary = descMatch[1].trim().slice(0, 50); // 限制长度
      }
      
      return { tags, summary };
    } finally {
      // 清除超时计时器，避免内存泄漏
      clearTimeout(timeoutId);
    }
  } catch (error) {
    console.error('AI API error:', error);
    // 改进错误处理，提供更具体的错误信息
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('AI API请求超时，请稍后重试');
      }
      throw new Error(`AI API请求失败: ${error.message}`);
    }
    throw new Error('AI API请求失败，请检查网络连接和API密钥');
  }
}