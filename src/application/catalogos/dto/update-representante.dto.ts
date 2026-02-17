import { PartialType } from '@nestjs/swagger';
import { CreateRepresentanteDto } from './create-representante.dto';

export class UpdateRepresentanteDto extends PartialType(CreateRepresentanteDto) {}
