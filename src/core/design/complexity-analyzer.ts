import { ComponentDesignRequest } from '@/types/mcp-types.js';
import { getAIClientByModelName } from '@/config/ai-client-adapter.js';
import { getRecommendedModel } from '@/config/model-manager.js';
import { ModelPurpose } from '@/config/types.js';
import { streamText } from 'ai';

/**
 * Complexity analysis module
 * Handles requirement complexity analysis using both AI and rule-based approaches
 */

export interface ComplexityAnalysisResult {
  complexity: 'simple' | 'medium' | 'complex';
  estimatedBlocks: number;
  reasoning: string;
  confidence?: number;
  aiAnalysis?: string;
}

/**
 * Internal rule analysis function
 * Fast rule analysis based on UI area division, as an alternative to AI analysis
 */
function analyzeRequirementComplexityByRules(
  prompt: ComponentDesignRequest['prompt']
): ComplexityAnalysisResult {
  const textContent = prompt
    .filter((p) => p.type === 'text')
    .map((p) => p.text)
    .join(' ')
    .toLowerCase();

  // UI area detection logic
  const hasTable = /表格|列表|数据表格|table|list/.test(textContent);
  const hasSearchForm = /搜索|查询|筛选|search|filter/.test(textContent);
  const hasDetailModal = /详情|弹窗|抽屉|modal|drawer|详情页/.test(textContent);
  const hasHeader = /头部|导航|header|nav/.test(textContent);
  const hasSidebar = /侧边栏|侧栏|sidebar/.test(textContent);
  const hasFooter = /底部|footer/.test(textContent);
  const hasMultipleAreas = /多个区域|多个部分|多个模块/.test(textContent);
  const hasForm = /表单|form/.test(textContent);
  const hasCard = /卡片|card/.test(textContent);
  const hasTabs = /标签页|tabs|tab/.test(textContent);

  // Calculate UI area count
  let uiAreaCount = 0;
  if (hasTable) uiAreaCount++;
  if (hasSearchForm) uiAreaCount++;
  if (hasDetailModal) uiAreaCount++;
  if (hasHeader) uiAreaCount++;
  if (hasSidebar) uiAreaCount++;
  if (hasFooter) uiAreaCount++;
  if (hasForm) uiAreaCount++;
  if (hasCard) uiAreaCount++;
  if (hasTabs) uiAreaCount++;

  let complexity: 'simple' | 'medium' | 'complex' = 'simple';
  let estimatedBlocks = 1;
  let reasoning = '';

  // Based on UI area count to determine complexity
  if (uiAreaCount === 0) {
    // No clear UI area description, possibly a single component
    complexity = 'simple';
    estimatedBlocks = 1;
    reasoning = 'Single UI component requirement';
  } else if (uiAreaCount === 1) {
    complexity = 'simple';
    estimatedBlocks = 1;
    reasoning = `Single UI area: ${getDetectedAreas(textContent)}`;
  } else if (uiAreaCount === 2) {
    complexity = 'medium';
    estimatedBlocks = 2;
    reasoning = `Two UI areas: ${getDetectedAreas(textContent)}`;
  } else if (uiAreaCount >= 3) {
    complexity = 'complex';
    estimatedBlocks = Math.min(uiAreaCount, 4); // Maximum 4 blocks
    reasoning = `Multiple UI areas (${uiAreaCount} blocks): ${getDetectedAreas(textContent)}`;
  }

  return { complexity, estimatedBlocks, reasoning };
}

/**
 * Get detected UI area description
 */
function getDetectedAreas(textContent: string): string {
  const areas: string[] = [];
  if (/表格|列表|数据表格|table|list/.test(textContent))
    areas.push('Table area');
  if (/搜索|查询|筛选|search|filter/.test(textContent))
    areas.push('Search area');
  if (/详情|弹窗|抽屉|modal|drawer|详情页/.test(textContent))
    areas.push('Detail area');
  if (/头部|导航|header|nav/.test(textContent)) areas.push('Header area');
  if (/侧边栏|侧栏|sidebar/.test(textContent)) areas.push('Sidebar area');
  if (/底部|footer/.test(textContent)) areas.push('Footer area');
  if (/表单|form/.test(textContent)) areas.push('Form area');
  if (/卡片|card/.test(textContent)) areas.push('Card area');
  if (/标签页|tabs|tab/.test(textContent)) areas.push('Tab area');

  return areas.join('、');
}

/**
 * AI-enhanced complexity analysis
 * Use AI to understand the true complexity of user requirements
 * Support retry mechanism, up to 3 retries
 */
export async function analyzeRequirementComplexityWithAI(
  prompt: ComponentDesignRequest['prompt'],
  aiModel?: string,
  maxRetries: number = 3
): Promise<ComplexityAnalysisResult> {
  const systemPrompt = `You are an experienced front-end UI architect, specializing in analyzing the complexity of user requirements for UI.

## 任务
Analyze the front-end development requirements of the user, and determine the complexity level based on the UI area division.

## Complexity level definition
- **Simple (simple)**: Single UI area or component
  - Example: Single table, single form, single button component
  - Estimated workload: 1 design block
  
- **Medium (medium)**: 2 UI areas combined
  - Example: Table + search form, header + main content area, form + detail modal
  - Estimated workload: 2 design blocks
  
- **Complex (complex)**: 3 or more UI areas
  - Example: Header + sidebar + main content area + footer, table + search + detail + operation area
  - Estimated workload: 3 or more design blocks

## UI area type
- **Data display area**: Table, list, chart, card list
- **Form area**: Search form, input form, filter form
- **Navigation area**: Header, sidebar, breadcrumb, pagination
- **Detail area**: Modal, drawer, detail page
- **Operation area**: Button group, action bar, toolbar
- **Layout area**: Container, wrapper, grid layout

## Output format
Please respond with JSON format:
\`\`\`json
{
  "complexity": "simple|medium|complex",
  "estimatedBlocks": 1-5,
  "reasoning": "Detailed analysis reasoning",
  "confidence": 0.8,
  "aiAnalysis": "AI analysis details"
}
\`\`\`

## Analysis guidelines
1. Focus on UI area division, not business logic complexity
2. Consider user interaction patterns and data flow
3. Estimate the number of independent UI components needed
4. Provide clear reasoning for complexity level determination`;

  const userPrompt = `Please analyze the complexity of the following front-end development requirements:

${prompt
  .filter((p) => p.type === 'text')
  .map((p) => p.text)
  .join('\n')}

Please determine the complexity level and provide detailed analysis.`;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[AI] Attempt ${attempt} AI analysis...`);
      const modelName = aiModel || getRecommendedModel(ModelPurpose.ANALYSIS);
      const model = getAIClientByModelName(modelName);

      const stream = await streamText({
        system: systemPrompt,
        model: model as any,
        messages: [{ role: 'user', content: userPrompt }],
      });

      let response = '';
      for await (const part of stream.textStream) {
        response += part;
      }

      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        console.log(`[AI] Attempt ${attempt} successful, parsed JSON result`);
        return {
          complexity: result.complexity || 'medium',
          estimatedBlocks: result.estimatedBlocks || 2,
          reasoning: result.reasoning || 'AI analysis completed',
          confidence: result.confidence || 0.8,
          aiAnalysis: result.aiAnalysis || response,
        };
      } else {
        console.warn(
          `[AI] Attempt ${attempt} failed: No valid JSON found in response`
        );
        console.log(`[AI] Preparing attempt ${attempt + 1}...`);
      }
    } catch (error) {
      lastError = error as Error;
      console.warn(
        `[AI] Attempt ${attempt} failed: ${error instanceof Error ? error.message : String(error)}`
      );
      console.log(`[AI] Preparing attempt ${attempt + 1}...`);
    }
  }

  console.error(
    `[AI] All ${maxRetries} attempts failed. Last error:`,
    lastError
  );
  throw lastError || new Error('AI analysis failed after all retries');
}

/**
 * Complexity analysis main interface
 * Use AI analysis first, fallback to rule analysis if failed
 */
export async function analyzeRequirementComplexity(
  prompt: ComponentDesignRequest['prompt'],
  options: {
    useAI?: boolean;
    aiModel?: string;
    maxRetries?: number;
  } = {}
): Promise<ComplexityAnalysisResult> {
  const { useAI = true, aiModel, maxRetries = 3 } = options;

  // If AI is not used or AI analysis fails, use rule analysis
  if (!useAI) {
    return analyzeRequirementComplexityByRules(prompt);
  }

  try {
    // Try AI analysis
    const aiResult = await analyzeRequirementComplexityWithAI(
      prompt,
      aiModel,
      maxRetries
    );
    return aiResult;
  } catch (error) {
    console.warn(
      '[Complexity] AI analysis failed, fallback to rule analysis:',
      error
    );
    return analyzeRequirementComplexityByRules(prompt);
  }
}
