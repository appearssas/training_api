import { PartialType } from '@nestjs/swagger';
import { CreateCapacitacionDto } from './create-capacitacion.dto';

export class UpdateCapacitacionDto extends PartialType(CreateCapacitacionDto) {}
