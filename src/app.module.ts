import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './infrastructure/shared/database/database.module';
import { CapacitacionesModule } from './infrastructure/capacitaciones/capacitaciones.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    CapacitacionesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
