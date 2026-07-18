import { BadRequestException, createParamDecorator, ExecutionContext } from '@nestjs/common';

/** Reads and requires the `Idempotency-Key` header wherever money moves (see docs/QA.md §5.1/§5.2). */
export const IdempotencyKey = createParamDecorator((_data: unknown, ctx: ExecutionContext): string => {
  const key = ctx.switchToHttp().getRequest().headers['idempotency-key'];
  if (!key || typeof key !== 'string') {
    throw new BadRequestException('Idempotency-Key header is required for this operation');
  }
  return key;
});
