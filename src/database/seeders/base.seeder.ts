import { DataSource } from 'typeorm';

/**
 * Clase base para seeders
 * Proporciona métodos comunes para todos los seeders
 */
export abstract class BaseSeeder {
  constructor(protected dataSource: DataSource) {}

  /**
   * Método abstracto que debe implementar cada seeder
   */
  abstract run(): Promise<void>;

  /**
   * Ejecuta el seeder dentro de una transacción
   */
  async execute(): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await this.run();
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
