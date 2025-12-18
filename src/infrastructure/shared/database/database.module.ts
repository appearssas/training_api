import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as entities from '@/entities';

// Filtrar solo las clases que son entidades TypeORM (excluir enums y otros exports)
const entityClasses = Object.values(entities).filter((entity) => {
  // Debe ser una función (clase)
  if (typeof entity !== 'function') {
    return false;
  }
  // Excluir enums: los enums tienen propiedades que son strings/numbers
  // y su constructor es Object, no la función misma
  const keys = Object.keys(entity);
  if (keys.length > 0) {
    const hasEnumLikeProperties = keys.some(
      (key) =>
        typeof (entity as any)[key] === 'string' ||
        typeof (entity as any)[key] === 'number',
    );
    // Si tiene propiedades enum-like y no es una clase instanciable, es un enum
    if (hasEnumLikeProperties && !entity.prototype) {
      return false;
    }
  }
  // Debe ser una clase (tiene prototype y constructor)
  return entity.prototype && entity.prototype.constructor === entity;
}) as Array<new () => any>;

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const stage = configService.get<string>('STAGE', 'dev');

        if (stage === 'dev') {
          return {
            ssl: false,
            extra: undefined,
            type: 'mysql' as const,
            host: configService.get<string>('DATABASE_HOST', 'localhost'),
            port: configService.get<number>('DATABASE_PORT', 3306),
            username: configService.get<string>('DATABASE_USER', 'root'),
            password: configService.get<string>('DATABASE_PASSWORD', 'root'),
            database: configService.get<string>(
              'DATABASE_NAME',
              'trainings_db',
            ),
            entities: entityClasses,
            synchronize: false,
          };
        } else {
          return {
            type: 'mysql' as const,
            url: configService.get<string>('DATABASE_URL'),
            entities: entityClasses,
            synchronize: false,
          };
        }
      },
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
