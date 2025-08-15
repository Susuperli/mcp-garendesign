#!/usr/bin/env node

/**
 * AI配置验证脚本
 * 验证 config.json 配置文件的完整性和有效性
 */

import {
  validateAIConfig,
  getConfigSummary,
  testAIConnection,
} from '../dist/src/utils/config/config-validator.js';

async function main() {
  console.log('🔍 开始验证AI配置...\n');

  try {
    // 获取配置摘要
    const summary = getConfigSummary();
    console.log('📊 配置摘要:');
    console.log(`   - 提供商数量: ${summary.totalProviders}`);
    console.log(`   - 模型总数: ${summary.totalModels}`);
    console.log('   - 提供商详情:');
    summary.providers.forEach((provider) => {
      console.log(`     * ${provider.name}: ${provider.modelCount} 个模型`);
      console.log(`       ${provider.models.join(', ')}`);
    });
    console.log('');

    // 验证配置
    const validation = await validateAIConfig();

    if (validation.isValid) {
      console.log('✅ 配置验证通过！');
    } else {
      console.log('❌ 配置验证失败！');
    }

    if (validation.errors.length > 0) {
      console.log('\n🚨 错误:');
      validation.errors.forEach((error) => {
        console.log(`   - ${error}`);
      });
    }

    if (validation.warnings.length > 0) {
      console.log('\n⚠️  警告:');
      validation.warnings.forEach((warning) => {
        console.log(`   - ${warning}`);
      });
    }

    if (validation.availableModels.length > 0) {
      console.log('\n✅ 可用模型:');
      validation.availableModels.forEach((model) => {
        console.log(`   - ${model}`);
      });
    }

    // 测试连接（可选）
    if (validation.isValid && validation.availableModels.length > 0) {
      console.log('\n🔗 测试AI连接...');
      const testModel = validation.availableModels[0];
      const connectionTest = await testAIConnection(testModel);

      if (connectionTest.success) {
        console.log(`✅ 连接测试成功 (${testModel})`);
        if (connectionTest.responseTime) {
          console.log(`   响应时间: ${connectionTest.responseTime}ms`);
        }
      } else {
        console.log(`❌ 连接测试失败 (${testModel}): ${connectionTest.error}`);
      }
    }

    console.log('\n🎉 配置验证完成！');

    if (!validation.isValid) {
      process.exit(1);
    }
  } catch (error) {
    console.error('💥 验证过程中发生错误:', error);
    process.exit(1);
  }
}

main();
