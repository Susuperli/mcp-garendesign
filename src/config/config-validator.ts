/**
 * 配置验证工具
 * 验证AI配置文件的完整性和有效性
 */

import { loadAIProvidersConfig } from './ai-client-adapter.js';
import { AIProvidersConfig, AIModelConfig } from './types.js';
import { getAIClientByModelName } from './ai-client-adapter.js';

export interface ConfigValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  availableModels: string[];
  providers: string[];
}

/**
 * 验证AI配置
 */
export async function validateAIConfig(): Promise<ConfigValidationResult> {
  const result: ConfigValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    availableModels: [],
    providers: [],
  };

  try {
    // 加载配置
    const config = loadAIProvidersConfig(true); // 强制重新加载

    // 验证基本结构
    if (!config.providers || !Array.isArray(config.providers)) {
      result.isValid = false;
      result.errors.push('配置文件中缺少 providers 数组');
      return result;
    }

    if (config.providers.length === 0) {
      result.isValid = false;
      result.errors.push('配置文件中没有配置任何AI提供商');
      return result;
    }

    // 验证每个提供商
    for (const provider of config.providers) {
      result.providers.push(provider.provider);

      if (!provider.provider) {
        result.isValid = false;
        result.errors.push('提供商配置缺少 provider 字段');
        continue;
      }

      if (!provider.models || !Array.isArray(provider.models)) {
        result.isValid = false;
        result.errors.push(`提供商 ${provider.provider} 缺少 models 数组`);
        continue;
      }

      if (provider.models.length === 0) {
        result.warnings.push(`提供商 ${provider.provider} 没有配置任何模型`);
        continue;
      }

      // 验证每个模型
      for (const model of provider.models) {
        const modelValidation = validateModelConfig(model, provider.provider);

        if (!modelValidation.isValid) {
          result.isValid = false;
          result.errors.push(...modelValidation.errors);
        } else {
          result.availableModels.push(model.model);
        }
      }
    }

    // 验证是否有重复的模型名称
    const modelNames = result.availableModels;
    const duplicates = modelNames.filter(
      (name, index) => modelNames.indexOf(name) !== index
    );
    if (duplicates.length > 0) {
      result.warnings.push(`发现重复的模型名称: ${duplicates.join(', ')}`);
    }

    // 验证默认模型是否可用
    if (config.defaultModels) {
      for (const [purpose, modelName] of Object.entries(config.defaultModels)) {
        if (!result.availableModels.includes(modelName)) {
          result.warnings.push(
            `默认模型 ${modelName} (用途: ${purpose}) 在配置中不可用`
          );
        }
      }
    }

    // 验证模型用途映射
    if (config.modelPurposes) {
      for (const [modelName, purposes] of Object.entries(
        config.modelPurposes
      )) {
        if (!result.availableModels.includes(modelName)) {
          result.warnings.push(
            `模型用途映射中的模型 ${modelName} 在配置中不可用`
          );
        }
      }
    }

    return result;
  } catch (error) {
    result.isValid = false;
    result.errors.push(
      `配置加载失败: ${error instanceof Error ? error.message : String(error)}`
    );
    return result;
  }
}

/**
 * 验证单个模型配置
 */
function validateModelConfig(
  model: AIModelConfig,
  provider: string
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!model.model) {
    errors.push(`提供商 ${provider} 的模型缺少 model 字段`);
  }

  if (!model.title) {
    errors.push(`模型 ${model.model} 缺少 title 字段`);
  }

  if (!model.baseURL) {
    errors.push(`模型 ${model.model} 缺少 baseURL 字段`);
  }

  if (!model.apiKey && provider !== 'ollama') {
    errors.push(`模型 ${model.model} 缺少 apiKey 字段`);
  }

  if (!Array.isArray(model.features)) {
    errors.push(`模型 ${model.model} 的 features 字段必须是数组`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * 测试AI客户端连接
 */
export async function testAIConnection(modelName: string): Promise<{
  success: boolean;
  error?: string;
  responseTime?: number;
}> {
  try {
    const startTime = Date.now();

    // 尝试创建AI客户端
    const model = getAIClientByModelName(modelName);

    const responseTime = Date.now() - startTime;

    return {
      success: true,
      responseTime,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * 获取配置摘要
 */
export function getConfigSummary(): {
  totalProviders: number;
  totalModels: number;
  providers: Array<{
    name: string;
    modelCount: number;
    models: string[];
  }>;
} {
  try {
    const config = loadAIProvidersConfig();

    const providers = config.providers.map((provider) => ({
      name: provider.provider,
      modelCount: provider.models.length,
      models: provider.models.map((m) => m.model),
    }));

    return {
      totalProviders: providers.length,
      totalModels: providers.reduce((sum, p) => sum + p.modelCount, 0),
      providers,
    };
  } catch (error) {
    return {
      totalProviders: 0,
      totalModels: 0,
      providers: [],
    };
  }
}
