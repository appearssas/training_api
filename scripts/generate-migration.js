#!/usr/bin/env node

require('dotenv').config();
// Registrar tsconfig-paths antes de cualquier import
require('tsconfig-paths/register');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Get the command type and migration name from command line arguments
const commandType = process.argv[2]; // 'generate' or 'create'
const migrationName = process.argv[3];

if (!commandType || !migrationName) {
  console.error('❌ Error: Command type and migration name are required');
  console.log(
    'Usage: yarn typeorm:migration:generate <command-type> <migration-name>',
  );
  console.log('Commands:');
  console.log('  generate - Generate migration from entity changes');
  console.log('  create   - Create empty migration file');
  console.log('');
  console.log('Examples:');
  console.log('  yarn typeorm:migration:generate generate AddModuleFields');
  console.log('  yarn typeorm:migration:generate create InitialSetup');
  process.exit(1);
}

if (commandType !== 'generate' && commandType !== 'create') {
  console.error('❌ Error: Command type must be "generate" or "create"');
  console.log('Valid commands: generate, create');
  process.exit(1);
}

// Construct the full path for the migration file
const migrationPath = `./src/migrations/${migrationName}`;

/**
 * Fixes MySQL 8.0 syntax issues in generated migrations
 * @param {string} filePath - Path to the migration file
 */
function fixMySQLSyntax(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Fix 1: timestamp(6) with CURRENT_TIMESTAMP without precision
  // Replace: timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
  // With:    timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
  const before1 = content;
  content = content.replace(
    /timestamp\(6\)\s+NOT\s+NULL\s+DEFAULT\s+CURRENT_TIMESTAMP(?!\()/g,
    'timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)',
  );
  if (content !== before1) {
    modified = true;
    console.log(
      '  ✓ Fixed: timestamp(6) DEFAULT CURRENT_TIMESTAMP → CURRENT_TIMESTAMP(6)',
    );
  }

  // Fix 2: ON UPDATE CURRENT_TIMESTAMP without precision
  // Replace: ON UPDATE CURRENT_TIMESTAMP
  // With:    ON UPDATE CURRENT_TIMESTAMP(6)
  const before2 = content;
  content = content.replace(
    /ON UPDATE CURRENT_TIMESTAMP(?!\()/g,
    'ON UPDATE CURRENT_TIMESTAMP(6)',
  );
  if (content !== before2) {
    modified = true;
    console.log(
      '  ✓ Fixed: ON UPDATE CURRENT_TIMESTAMP → ON UPDATE CURRENT_TIMESTAMP(6)',
    );
  }

  // Fix 3: Remove duplicate CURRENT_TIMESTAMP(6)(6)
  const before3 = content;
  content = content.replace(
    /CURRENT_TIMESTAMP\(6\)\(6\)/g,
    'CURRENT_TIMESTAMP(6)',
  );
  if (content !== before3) {
    modified = true;
    console.log('  ✓ Fixed: Removed duplicate CURRENT_TIMESTAMP(6)(6)');
  }

  // Fix 4: Ensure comma before PRIMARY KEY after ON UPDATE
  const before4 = content;
  content = content.replace(
    /ON UPDATE CURRENT_TIMESTAMP\(6\)\s+PRIMARY KEY/g,
    'ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY',
  );
  if (content !== before4) {
    modified = true;
    console.log('  ✓ Fixed: Added missing comma before PRIMARY KEY');
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('  ✅ Migration file fixed for MySQL 8.0 compatibility');
  }
}

try {
  let command;

  if (commandType === 'generate') {
    // Execute the TypeORM migration generate command
    command = `yarn typeorm migration:generate ${migrationPath} -d ./typeorm.config.ts`;
    console.log(
      `🔄 Generating migration from entity changes: ${migrationName}`,
    );
  } else {
    // Execute the TypeORM migration create command
    command = `yarn typeorm migration:create ${migrationPath}`;
    console.log(`🔄 Creating empty migration: ${migrationName}`);
  }

  execSync(command, { stdio: 'inherit' });

  // After generating, find the actual migration file and fix it
  if (commandType === 'generate') {
    console.log('🔧 Checking for MySQL 8.0 syntax issues...');

    // Find the most recently created migration file
    const migrationsDir = path.join(process.cwd(), 'src', 'migrations');
    if (fs.existsSync(migrationsDir)) {
      const files = fs
        .readdirSync(migrationsDir)
        .filter((file) => file.endsWith('.ts') && file.includes('-'))
        .map((file) => ({
          name: file,
          path: path.join(migrationsDir, file),
          time: fs.statSync(path.join(migrationsDir, file)).mtime.getTime(),
        }))
        .sort((a, b) => b.time - a.time);

      if (files.length > 0) {
        fixMySQLSyntax(files[0].path);
      }
    }
  }

  console.log(
    `✅ Migration ${commandType === 'generate' ? 'generated' : 'created'} successfully: ${migrationName}`,
  );
} catch (error) {
  console.error(
    `❌ Error ${commandType === 'generate' ? 'generating' : 'creating'} migration:`,
    error.message,
  );
  process.exit(1);
}
