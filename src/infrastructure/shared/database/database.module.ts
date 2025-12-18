import { Module } from '@nestjs/common';
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
            entities: entityClasses,
            synchronize: false,
          }
        : {
            type: 'mysql' as const,
            url: process.env.DATABASE_URL,
            entities: entityClasses,
            synchronize: false,
          },
    ),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
