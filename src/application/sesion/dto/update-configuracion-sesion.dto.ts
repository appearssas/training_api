import { PartialType } from '@nestjs/swagger';
import { CreateConfiguracionSesionDto } from './create-configuracion-sesion.dto';

export class UpdateConfiguracionSesionDto extends PartialType(
  CreateConfiguracionSesionDto,
) {}
