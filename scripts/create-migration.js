#!/usr/bin/env node

require('dotenv').config();
const { execSync } = require('child_process');

// Get the migration name from command line arguments
const migrationName = process.argv[2];

if (!migrationName) {
  console.error('❌ Error: Migration name is required');
  console.log('Usage: yarn typeorm:migration:create <migration-name>');
  console.log('Example: yarn typeorm:migration:create InitialSetup');
  console.log('');
  console.log('This creates an empty migration file for manual SQL writing');
  process.exit(1);
}

// Construct the full path for the migration file
const migrationPath = `./src/migrations/${migrationName}`;

try {
  // Execute the TypeORM migration create command
  const command = `yarn typeorm migration:create ${migrationPath}`;

  console.log(`🔄 Creating empty migration: ${migrationName}`);
  execSync(command, { stdio: 'inherit' });

  console.log(`✅ Empty migration created successfully: ${migrationName}`);
  console.log('📝 You can now edit the migration file to add your custom SQL');
} catch (error) {
  console.error('❌ Error creating migration:', error.message);
  process.exit(1);
}
