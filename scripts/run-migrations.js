#!/usr/bin/env node

require('dotenv').config();
const { execSync } = require('child_process');

try {
  console.log('🔄 Running migrations...');

  // Execute the TypeORM migration run command
  const command = 'yarn typeorm migration:run -d ./typeorm.config.ts';
  execSync(command, { stdio: 'inherit' });

  console.log('✅ Migrations executed successfully');
} catch (error) {
  console.error('❌ Error running migrations:', error.message);
  process.exit(1);
}
