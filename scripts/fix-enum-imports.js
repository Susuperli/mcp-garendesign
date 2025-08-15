#!/usr/bin/env node

/**
 * 批量修复枚举导入错误
 */

import fs from 'fs';
import path from 'path';

const filesToFix = [
  'src/core/design/integration/processor.ts',
  'src/core/design/strategy/analyzer.ts',
  'src/tools/design/block.ts',
  'src/tools/design/component.ts',
];

function fixFile(filePath) {
  console.log(`修复文件: ${filePath}`);

  let content = fs.readFileSync(filePath, 'utf-8');

  // 添加 ModelPurpose 导入
  if (!content.includes('import { ModelPurpose }')) {
    const importMatch = content.match(
      /import.*getRecommendedModel.*from.*['"]@\/utils\/config\/model-manager\.js['"];?/
    );
    if (importMatch) {
      const newImport = importMatch[0].replace(
        'getRecommendedModel',
        "getRecommendedModel } from '@/utils/config/model-manager.js';\nimport { ModelPurpose } from '@/utils/config/types.js'"
      );
      content = content.replace(importMatch[0], newImport);
    }
  }

  // 修复字符串为枚举
  content = content.replace(
    /getRecommendedModel\('ANALYSIS'\)/g,
    'getRecommendedModel(ModelPurpose.ANALYSIS)'
  );
  content = content.replace(
    /getRecommendedModel\('DESIGN'\)/g,
    'getRecommendedModel(ModelPurpose.DESIGN)'
  );
  content = content.replace(
    /getRecommendedModel\('QUERY'\)/g,
    'getRecommendedModel(ModelPurpose.QUERY)'
  );
  content = content.replace(
    /getRecommendedModel\('INTEGRATION'\)/g,
    'getRecommendedModel(ModelPurpose.INTEGRATION)'
  );

  fs.writeFileSync(filePath, content);
  console.log(`✅ 修复完成: ${filePath}`);
}

// 修复主入口文件
function fixMainIndex() {
  const filePath = 'src/utils/index.ts';
  console.log(`修复文件: ${filePath}`);

  let content = fs.readFileSync(filePath, 'utf-8');

  // 移除错误的 ModelPurpose 导出
  content = content.replace(/,\s*type ModelPurpose,?\s*\n/g, '\n');

  fs.writeFileSync(filePath, content);
  console.log(`✅ 修复完成: ${filePath}`);
}

// 执行修复
console.log('🔧 开始批量修复枚举导入错误...\n');

filesToFix.forEach(fixFile);
fixMainIndex();

console.log('\n🎉 所有文件修复完成！');
