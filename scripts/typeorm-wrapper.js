#!/usr/bin/env node

require('dotenv').config();

// Registrar tsconfig-paths
require('tsconfig-paths/register');

// Usar ts-node para ejecutar TypeORM CLI
require('ts-node').register({
  transpileOnly: true,
  compilerOptions: {
    module: 'commonjs',
  },
});

// Ejecutar TypeORM CLI
require('typeorm/cli');
