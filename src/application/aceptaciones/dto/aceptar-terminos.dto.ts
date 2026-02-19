import { IsNotEmpty, IsNumber, IsArray, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AceptarTerminosDto {
  @ApiProperty({
    description: `Array de IDs de documentos legales que el usuario acepta.
    
**IMPORTANTE:** Debe incluir TODOS los documentos legales activos. Si falta alguno, la solicitud será rechazada.

**Proceso recomendado:**
1. Obtener documentos activos: GET /aceptaciones/documentos-activos
2. Incluir todos los IDs retornados en este array
3. Enviar la solicitud de aceptación

**Ejemplo:** Si hay 2 documentos activos con IDs 1 y 2, debe enviar [1, 2]`,
    example: [1, 2],
    type: [Number],
    minItems: 1,
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'Debe aceptar al menos un documento legal' })
  @IsNumber({}, { each: true, message: 'Cada ID debe ser un número' })
  @IsNotEmpty()
  documentosIds: number[];
}
