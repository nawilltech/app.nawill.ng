import { NestFactory } from '@nestjs/core';
import { BadRequestException, ValidationError, ValidationPipe } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { setupSwagger } from './swagger';

// JSON.stringify() can't serialize BigInt natively; money columns (amountMinor, balanceMinor, ...)
// are BigInt end-to-end per docs/ARCHITECTURE.md §4.5, so every response needs this.
(BigInt.prototype as unknown as { toJSON: () => string }).toJSON = function () {
  return this.toString();
};

function flattenValidationErrors(errors: ValidationError[]): { field: string; message: string }[] {
  return errors.flatMap((error) => {
    if (error.children && error.children.length > 0) {
      return flattenValidationErrors(error.children).map((child) => ({
        field: `${error.property}.${child.field}`,
        message: child.message,
      }));
    }
    return Object.values(error.constraints ?? {}).map((message) => ({ field: error.property, message }));
  });
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true, rawBody: true });
  app.useLogger(app.get(Logger));

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      exceptionFactory: (errors) =>
        new BadRequestException({ message: 'Validation failed', errors: flattenValidationErrors(errors) }),
    }),
  );

  setupSwagger(app);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
}

bootstrap();
