#!/usr/bin/env node

require('dotenv').config();
const { execSync } = require('child_process');

try {
  console.log('🔄 Reverting last migration...');

  // Execute the TypeORM migration revert command
  const command = 'yarn typeorm migration:revert -d ./typeorm.config.ts';
  execSync(command, { stdio: 'inherit' });

  console.log('✅ Migration reverted successfully');
} catch (error) {
  console.error('❌ Error reverting migration:', error.message);
  process.exit(1);
}
