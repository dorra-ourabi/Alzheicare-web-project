import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { UserRole } from '../../../generated/prisma/client.js';
import { ROLES_KEY } from '../../Decorators/roles.decorator.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!roles || roles.length === 0) {
      return true;
    }

    // Support both HTTP and GraphQL execution contexts
    let request: any;
    try {
      const gqlCtx = GqlExecutionContext.create(context);
      request = gqlCtx.getContext()?.req || context.switchToHttp().getRequest();
    } catch {
      request = context.switchToHttp().getRequest();
    }

    const userRole = request?.user?.role as UserRole | undefined;

    if (!userRole || !roles.includes(userRole)) {
      throw new ForbiddenException('Insufficient role');
    }

    return true;
  }
}
