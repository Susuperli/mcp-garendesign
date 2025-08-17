import { streamText } from 'ai';
import { ComponentDesignRequest } from '@/types/mcp-types.js';
import { getAIClientByModelName } from '@/config/ai-client-adapter.js';
import { getRecommendedModel } from '@/config/model-manager.js';
import { ModelPurpose } from '@/config/types.js';
import {
  getPrivateComponentDocs,
  getPrivateDocsDescription,
} from '@/config/rule-processors.js';
import { loadPrivateComponentCodegen } from '../config-loader.js';

/**
 * Smart Design Strategy Processor
 * Addresses the limitations of pure UI-based component division
 */

export interface SmartComponentAnalysis {
  businessDomains: string[];
  interactionPatterns: InteractionPattern[];
  existingComponentMatches: ComponentMatch[];
  recommendedBlocks: SmartDesignBlock[];
  complexity: 'simple' | 'medium' | 'complex';
  reasoning: string;
}

export interface InteractionPattern {
  type: 'parent-child' | 'sibling' | 'modal' | 'form-flow' | 'data-flow';
  description: string;
  components: string[];
  dataFlow?: string;
}

export interface ComponentMatch {
  componentName: string;
  matchScore: number;
  capabilities: string[];
  canHandle: string[];
  limitations: string[];
}

export interface SmartDesignBlock {
  blockId: string;
  blockType:
    | 'business-domain'
    | 'interaction-group'
    | 'reusable-component'
    | 'layout';
  title: string;
  description: string;
  businessDomain: string;
  components: string[];
  dependencies: string[];
  interactionPatterns: string[];
  estimatedTokens: number;
  priority: 'high' | 'medium' | 'low';
  reusePotential: 'high' | 'medium' | 'low';
  existingComponentMatches: ComponentMatch[];
}

/**
 * Analyze requirements using smart business logic division
 */
export async function analyzeRequirementsSmartly(
  request: ComponentDesignRequest
): Promise<SmartComponentAnalysis> {
  const { prompt, rules, aiModel } = request;

  // 自动加载项目配置，如果用户没有提供 rules 或 rules 为空
  let effectiveRules = rules;
  if (!rules || rules.length === 0) {
    try {
      const { rules: projectRules } = loadPrivateComponentCodegen();
      effectiveRules = projectRules;
    } catch (error) {
      effectiveRules = [];
    }
  }

  const privateComponents = getPrivateComponentDocs(effectiveRules);
  const privateComponentsDesc = getPrivateDocsDescription(effectiveRules);

  const systemPrompt = `你是一个专业的前端架构师，专门负责智能组件划分和设计策略制定。

**重要提醒**：在划分组件时，请仔细分析私有组件库中每个组件的完整功能能力。如果一个私有组件已经包含多个相关功能（如查询+列表+操作，或其他功能组合），应该优先使用这个复合组件，而不是将其功能拆分成多个独立的块。充分利用现有组件的完整能力，避免不必要的拆分。

## 核心原则

### 1. 业务逻辑优先
- 不要仅仅基于UI区域进行划分
- 识别业务领域和功能模块
- 考虑数据流和状态管理

### 2. 现有组件库感知
- **深入分析私有组件的复合能力**：仔细研究每个私有组件具备的完整功能集
- **优先匹配复合组件**：优先选择能够覆盖多个功能需求的私有组件，而不是拆分成多个简单组件
- **避免不必要的功能拆分**：如果私有组件已经包含多个相关功能，应该作为一个整体使用

### 3. 交互模式识别
- 识别组件间的交互关系
- 分析数据流向
- 考虑用户操作流程

### 4. 复用性优化
- 识别可复用的组件模式
- 考虑组件的通用性
- 优化组件间的依赖关系

## 分析维度

### 业务领域识别
- 数据管理（CRUD操作）
- 用户交互（表单、弹窗、导航）
- 数据展示（表格、图表、列表）
- 业务流程（审批、状态流转）
- 系统功能（配置、权限、设置）

### 交互模式分类
- **parent-child**: 父子组件关系（如表格行展开详情）
- **sibling**: 兄弟组件关系（如多个独立的功能模块）
- **modal**: 弹窗交互（如编辑、新增、详情弹窗）
- **form-flow**: 表单流程（如多步骤表单）
- **data-flow**: 数据流（如数据查询、过滤、排序）

### 现有组件匹配
- **分析现有组件的完整能力范围**：包括查询、列表、操作、筛选等复合功能
- **计算匹配度分数（0-1）**：考虑组件能够覆盖的需求比例
- **识别组件的优势和限制**：了解组件的完整功能边界

### 组件划分指导原则
- **优先使用复合组件**：如果一个私有组件已经包含多个相关功能，应该作为一个整体使用
- **避免功能重复拆分**：不要将已经集成在私有组件中的功能拆分成独立的块
- **优化组件组合**：选择最少的组件数量来覆盖最多的功能需求

## 输出格式

请返回JSON格式的分析结果：

\`\`\`json
{
  "businessDomains": ["数据管理", "用户交互", "数据展示"],
  "interactionPatterns": [
    {
      "type": "parent-child",
      "description": "表格行点击展开详情",
      "components": ["数据表格", "详情弹窗"],
      "dataFlow": "表格数据 -> 详情数据"
    }
  ],
  "existingComponentMatches": [
    {
      "componentName": "SmartTable",
      "matchScore": 0.8,
      "capabilities": ["数据展示", "排序", "分页"],
      "canHandle": ["表格展示", "数据操作"],
      "limitations": ["不支持复杂筛选"]
    }
  ],
  "recommendedBlocks": [
    {
      "blockId": "data-management",
      "blockType": "business-domain",
      "title": "数据管理模块",
      "description": "处理数据的增删改查操作",
      "businessDomain": "数据管理",
      "components": ["数据表格", "操作按钮", "筛选表单"],
      "dependencies": [],
      "interactionPatterns": ["data-flow", "modal"],
      "estimatedTokens": 2000,
      "priority": "high",
      "reusePotential": "high",
      "existingComponentMatches": []
    }
  ],
  "complexity": "medium",
  "reasoning": "包含数据管理和用户交互两个主要业务领域，存在表格-详情交互模式"
}
\`\`\`

## 现有组件库

${privateComponentsDesc || '无现有组件库信息'}

## 注意事项

1. **避免过度拆分**: 不要为了拆分而拆分，保持组件的内聚性
2. **考虑维护成本**: 组件数量越多，维护成本越高
3. **优化复用性**: 识别可以在其他页面复用的组件
4. **数据流清晰**: 确保组件间的数据流向清晰明确
5. **交互一致性**: 保持相似功能的交互模式一致`;

  const userPrompt = `请分析以下前端开发需求的智能组件划分策略：

${prompt
  .filter(p => p.type === 'text')
  .map(p => p.text)
  .join('\n')}

请从业务逻辑、交互模式、现有组件库匹配等角度进行深度分析。`;

  try {
    const modelName = aiModel || getRecommendedModel(ModelPurpose.ANALYSIS);
    const model = getAIClientByModelName(modelName);
    const stream = await streamText({
      system: systemPrompt,
      model: model as any,
      messages: [{ role: 'user', content: userPrompt }],
    });

    let accumulatedResponse = '';
    for await (const part of stream.textStream) {
      accumulatedResponse += part;
    }

    const jsonMatch = accumulatedResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return {
        businessDomains: result.businessDomains || [],
        interactionPatterns: result.interactionPatterns || [],
        existingComponentMatches: result.existingComponentMatches || [],
        recommendedBlocks: result.recommendedBlocks || [],
        complexity: result.complexity || 'medium',
        reasoning: result.reasoning || '智能分析完成',
      };
    }

    throw new Error('无法解析AI响应');
  } catch (error) {
    console.error('智能分析失败:', error);
    return createFallbackAnalysis(prompt, privateComponents);
  }
}

/**
 * Create fallback analysis when AI analysis fails
 */
function createFallbackAnalysis(
  prompt: ComponentDesignRequest['prompt'],
  privateComponents: any
): SmartComponentAnalysis {
  const textContent = prompt
    .filter(p => p.type === 'text')
    .map(p => p.text)
    .join(' ')
    .toLowerCase();

  const businessDomains: string[] = [];
  if (/表格|列表|数据|table|list|crud/.test(textContent)) {
    businessDomains.push('数据管理');
  }
  if (/表单|输入|form|input/.test(textContent)) {
    businessDomains.push('用户交互');
  }
  if (/图表|统计|chart|statistics/.test(textContent)) {
    businessDomains.push('数据展示');
  }

  const interactionPatterns: InteractionPattern[] = [];
  if (/弹窗|modal|drawer/.test(textContent)) {
    interactionPatterns.push({
      type: 'modal',
      description: '弹窗交互模式',
      components: ['主组件', '弹窗组件'],
    });
  }

  const existingComponentMatches: ComponentMatch[] = [];
  if (privateComponents) {
    Object.keys(privateComponents).forEach(componentName => {
      const component = privateComponents[componentName];
      if (
        component.purpose &&
        textContent.includes(component.purpose.toLowerCase())
      ) {
        existingComponentMatches.push({
          componentName,
          matchScore: 0.6,
          capabilities: [component.purpose],
          canHandle: [component.purpose],
          limitations: [],
        });
      }
    });
  }

  const complexity =
    businessDomains.length <= 1
      ? 'simple'
      : businessDomains.length <= 2
        ? 'medium'
        : 'complex';

  return {
    businessDomains,
    interactionPatterns,
    existingComponentMatches,
    recommendedBlocks: [],
    complexity,
    reasoning: '基础分析：基于关键词识别的业务领域划分',
  };
}
