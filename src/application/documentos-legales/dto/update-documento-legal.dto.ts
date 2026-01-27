import { PartialType } from '@nestjs/swagger';
import { CreateDocumentoLegalDto } from './create-documento-legal.dto';

export class UpdateDocumentoLegalDto extends PartialType(
  CreateDocumentoLegalDto,
) {}
