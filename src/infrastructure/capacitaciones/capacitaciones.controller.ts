import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  ParseIntPipe,
} from '@nestjs/common';
import {
  CreateCapacitacionDto,
  UpdateCapacitacionDto,
} from '@/application/capacitaciones/dto';
import { CreateCapacitacionUseCase } from '@/application/capacitaciones/use-cases/create-capacitacion.use-case';
import { FindAllCapacitacionesUseCase } from '@/application/capacitaciones/use-cases/find-all-capacitaciones.use-case';
import { FindOneCapacitacionUseCase } from '@/application/capacitaciones/use-cases/find-one-capacitacion.use-case';
import { UpdateCapacitacionUseCase } from '@/application/capacitaciones/use-cases/update-capacitacion.use-case';
import { RemoveCapacitacionUseCase } from '@/application/capacitaciones/use-cases/remove-capacitacion.use-case';
import { PaginationDto } from '@/application/shared/dto/pagination.dto';

@Controller('capacitaciones')
export class CapacitacionesController {
  constructor(
    private readonly createCapacitacionUseCase: CreateCapacitacionUseCase,
    private readonly findAllCapacitacionesUseCase: FindAllCapacitacionesUseCase,
    private readonly findOneCapacitacionUseCase: FindOneCapacitacionUseCase,
    private readonly updateCapacitacionUseCase: UpdateCapacitacionUseCase,
    private readonly removeCapacitacionUseCase: RemoveCapacitacionUseCase,
  ) {}

  @Post()
  create(@Body() createCapacitacionDto: CreateCapacitacionDto) {
    return this.createCapacitacionUseCase.execute(createCapacitacionDto);
  }

  @Post('list')
  findAll(@Body() pagination: PaginationDto) {
    return this.findAllCapacitacionesUseCase.execute(pagination);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.findOneCapacitacionUseCase.execute(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCapacitacionDto: UpdateCapacitacionDto,
  ) {
    return this.updateCapacitacionUseCase.execute(id, updateCapacitacionDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.removeCapacitacionUseCase.execute(id);
  }
}
