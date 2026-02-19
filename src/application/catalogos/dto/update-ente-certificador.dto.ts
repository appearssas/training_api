import { PartialType } from '@nestjs/swagger';
import { CreateEnteCertificadorDto } from './create-ente-certificador.dto';

export class UpdateEnteCertificadorDto extends PartialType(
  CreateEnteCertificadorDto,
) {}
