// 模型API相关函数

export interface Model {
  id: string;
  name: string;
  description?: string;
}

/**
 * 获取OpenAI模型列表
 * @param apiKey OpenAI API密钥
 * @param apiBaseUrl API基础URL
 * @returns 模型列表
 */
export async function getModels(apiKey: string, apiBaseUrl: string): Promise<Model[]> {
  if (!apiKey) {
    throw new Error('API key is required');
  }
  
  // 从基础URL构建模型API URL
  const baseUrl = apiBaseUrl.endsWith('/') ? apiBaseUrl.slice(0, -1) : apiBaseUrl;
  const modelsUrl = `${baseUrl.replace('/chat/completions', '')}/models`;
  
  try {
    const response = await fetch(modelsUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.statusText}`);
    }

    const data = await response.json();
    
    // 过滤并格式化模型数据
    // 只返回GPT模型，并按名称排序
    return data.data
      .filter((model: any) => {
        const id = model.id.toLowerCase();
        return id.includes('gpt');
      })
      .map((model: any) => ({
        id: model.id,
        name: model.id,
        description: ''
      }))
      .sort((a: Model, b: Model) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error('Failed to fetch models:', error);
    // 如果API调用失败，返回默认模型列表
    return getDefaultModels();
  }
}

/**
 * 获取默认模型列表（当API调用失败时使用）
 * @returns 默认模型列表
 */
export function getDefaultModels(): Model[] {
  return [
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: '快速且经济实惠的模型' },
    { id: 'gpt-4', name: 'GPT-4', description: '更强大的模型，适合复杂任务' },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: 'GPT-4的改进版本' },
  ];
}