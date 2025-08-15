#!/usr/bin/env node

/**
 * 测试模型推荐功能
 */

import {
  getRecommendedModel,
  getAvailableModels,
} from '../dist/src/utils/config/model-manager.js';

async function testModelRecommendation() {
  console.log('🧪 测试模型推荐功能...\n');

  try {
    // 测试不同用途的模型推荐
    const purposes = ['ANALYSIS', 'DESIGN', 'QUERY', 'INTEGRATION'];

    console.log('📋 模型推荐测试:');
    for (const purpose of purposes) {
      const recommendedModel = getRecommendedModel(purpose);
      console.log(`   ${purpose}: ${recommendedModel}`);
    }

    console.log('\n📊 可用模型列表:');
    const availableModels = getAvailableModels();
    availableModels.forEach((model) => {
      console.log(`   ${model.model} (${model.provider})`);
      console.log(`     用途: ${model.purposes.join(', ')}`);
    });

    console.log('\n✅ 模型推荐测试完成！');
  } catch (error) {
    console.error('❌ 测试失败:', error);
    process.exit(1);
  }
}

testModelRecommendation();
