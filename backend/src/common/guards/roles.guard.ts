import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * Guard role. Dipakai bersama JwtAuthGuard:
 * @UseGuards(JwtAuthGuard, RolesGuard) + @Roles('admin')
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!required || required.length === 0) return true;
    const req = ctx.switchToHttp().getRequest();
    const role = req.user?.role;
    if (!role || !required.includes(role)) {
      throw new ForbiddenException('Akses ditolak untuk role Anda');
    }
    return true;
  }
}
