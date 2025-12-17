import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as entities from '@/entities';

@Module({
  imports: [
    TypeOrmModule.forRoot(
      process.env.STAGE === 'dev'
        ? {
            ssl: false,
            extra: undefined,
            type: 'mysql' as const,
            host: process.env.DATABASE_HOST,
            port: Number(process.env.DATABASE_PORT),
            username: process.env.DATABASE_USER,
            password: process.env.DATABASE_PASSWORD,
            database: process.env.DATABASE_NAME,
            entities: entities,
            synchronize: false,
          }
        : {
            type: 'mysql' as const,
            url: process.env.DATABASE_URL,
            entities: entities,
            synchronize: false,
          },
    ),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
