import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import 'tsconfig-paths/register';

// Cargar variables de entorno
dotenv.config();

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DATABASE_HOST || 'localhost',
  port: Number(process.env.DATABASE_PORT) || 3306,
  username: process.env.DATABASE_USER || 'root',
  password: process.env.DATABASE_PASSWORD || 'root',
  database: process.env.DATABASE_NAME || 'trainings_db',
  entities: ['src/**/*.entity{.ts,.js}'],
  migrations: ['src/migrations/[0-9]*-*.ts'],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  charset: 'utf8mb4',
  timezone: '+00:00',
});
