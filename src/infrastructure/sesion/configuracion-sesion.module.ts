import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfiguracionSesionController } from './configuracion-sesion.controller';
import { ConfiguracionSesionRepositoryAdapter } from './configuracion-sesion.repository.adapter';
import { ConfiguracionSesion } from '@/entities/sesion/configuracion-sesion.entity';
import { Usuario } from '@/entities/usuarios/usuario.entity';
import { GetActiveConfiguracionSesionUseCase } from '@/application/sesion/use-cases/get-active-configuracion-sesion.use-case';
import { CreateConfiguracionSesionUseCase } from '@/application/sesion/use-cases/create-configuracion-sesion.use-case';
import { UpdateConfiguracionSesionUseCase } from '@/application/sesion/use-cases/update-configuracion-sesion.use-case';
@Module({
  imports: [TypeOrmModule.forFeature([ConfiguracionSesion, Usuario])],
  controllers: [ConfiguracionSesionController],
  providers: [
    ConfiguracionSesionRepositoryAdapter,
    GetActiveConfiguracionSesionUseCase,
    CreateConfiguracionSesionUseCase,
    UpdateConfiguracionSesionUseCase,
    {
      provide: 'IConfiguracionSesionRepository',
      useClass: ConfiguracionSesionRepositoryAdapter,
    },
  ],
  exports: ['IConfiguracionSesionRepository'],
})
export class ConfiguracionSesionModule {}
