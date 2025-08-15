#!/usr/bin/env node

/**
 * 批量更新导入路径：从 @/utils/config 改为 @/config
 */

import fs from 'fs';
import path from 'path';

// 需要更新的文件列表
const filesToUpdate = [
  'src/core/query/component-query.ts',
  'src/tools/design/component.ts',
  'src/tools/design/block.ts',
  'src/core/design/complexity-analyzer.ts',
  'src/core/design/strategy/analyzer.ts',
  'src/core/design/config-loader.ts',
  'src/core/design/integration/processor.ts',
  'src/core/design/blocks/designer.ts',
];

function updateFile(filePath) {
  console.log(`更新文件: ${filePath}`);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  文件不存在: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf-8');

  // 替换导入路径
  const oldPath = '@/utils/config';
  const newPath = '@/config';

  if (content.includes(oldPath)) {
    content = content.replace(new RegExp(oldPath, 'g'), newPath);
    fs.writeFileSync(filePath, content);
    console.log(`✅ 更新完成: ${filePath}`);
  } else {
    console.log(`ℹ️  无需更新: ${filePath}`);
  }
}

// 执行更新
console.log('🔧 开始批量更新导入路径...\n');

filesToUpdate.forEach(updateFile);

console.log('\n🎉 所有文件更新完成！');
