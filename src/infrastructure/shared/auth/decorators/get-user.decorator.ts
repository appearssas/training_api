import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
} from '@nestjs/common';
import { Request } from 'express';
import { Usuario } from '@/entities/usuario.entity';

export const GetUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext): Usuario | any => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user as Usuario;

    if (!user || typeof user !== 'object') {
      throw new InternalServerErrorException('Invalid user object in request');
    }

    if (!user.id || typeof user.id !== 'number') {
      throw new InternalServerErrorException('Invalid user payload format');
    }

    if (data && typeof (user as any)[data] === 'undefined') {
      throw new InternalServerErrorException(
        `User property '${data}' not found`,
      );
    }
    return data ? (user as any)[data] : user;
  },
);
