import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from '@/entities/usuarios/usuario.entity';
import { Rol } from '@/entities/roles/rol.entity';
import { UsuariosController } from './usuarios.controller';
import { UsuariosRepositoryAdapter } from './usuarios.repository.adapter';
import { GetUsersUseCase } from '@/application/usuarios/use-cases/get-users.use-case';
import { GetUserByIdUseCase } from '@/application/usuarios/use-cases/get-user-by-id.use-case';
import { UpdateUserUseCase } from '@/application/usuarios/use-cases/update-user.use-case';
import { DeleteUserUseCase } from '@/application/usuarios/use-cases/delete-user.use-case';

@Module({
  imports: [TypeOrmModule.forFeature([Usuario, Rol])],
  controllers: [UsuariosController],
  providers: [
    // Repository Adapter
    {
      provide: 'IUsuariosRepository',
      useClass: UsuariosRepositoryAdapter,
    },
    // Use Cases
    GetUsersUseCase,
    GetUserByIdUseCase,
    UpdateUserUseCase,
    DeleteUserUseCase,
  ],
  exports: ['IUsuariosRepository'],
})
export class UsuariosModule {}
