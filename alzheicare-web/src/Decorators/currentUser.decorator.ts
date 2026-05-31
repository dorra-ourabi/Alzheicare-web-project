import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    // Support GraphQL and HTTP contexts
    try {
      const gqlCtx = GqlExecutionContext.create(ctx);
      const request = gqlCtx.getContext()?.req;
      if (request) return request.user;
    } catch {
      // not a GraphQL context
    }

    const request = ctx.switchToHttp().getRequest();
    return request?.user;
  },
);
