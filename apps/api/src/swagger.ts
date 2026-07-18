import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NextFunction, Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';

const SWAGGER_PATH = 'api/docs';

/** Minimal Basic-Auth gate — no extra dependency for a single prod-only check. */
function basicAuthGuard(user: string, password: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (header?.startsWith('Basic ')) {
      const [given, givenPass] = Buffer.from(header.slice(6), 'base64').toString('utf8').split(':');
      if (given === user && givenPass === password) return next();
    }
    res.setHeader('WWW-Authenticate', 'Basic realm="Nawill API Docs"');
    res.status(401).send('Authentication required');
  };
}

/** `/api/docs` — open in dev/test, Basic-Auth protected in production (docs/TECHNICAL.md §1.8). */
export function setupSwagger(app: INestApplication): void {
  const config = app.get(ConfigService);

  if (config.get<string>('NODE_ENV') === 'production') {
    const user = config.get<string>('SWAGGER_USER');
    const password = config.get<string>('SWAGGER_PASSWORD');
    if (user && password) {
      app.use(`/${SWAGGER_PATH}`, basicAuthGuard(user, password));
    }
  }

  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('Nawill App API')
      .setDescription('Client portal & operations platform for Nawill Technology Ltd — see /docs in the repo for the full design.')
      .setVersion('1.0')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'bearer')
      .addTag('auth', 'Signup, login, password reset, 2FA')
      .addTag('users', 'Profile & staff user management')
      .addTag('organizations', 'Organizations & KYC')
      .addTag('projects', 'Client projects')
      .addTag('invoices', 'Invoices & payment initiation')
      .addTag('wallets', 'Wallet balance, funding, and wallet-paid invoices')
      .addTag('payments', 'Payment records, requery, and processor webhooks')
      .addTag('bank-accounts', 'Payout-eligible bank accounts (Paystack-verified)')
      .addTag('support', 'Support tickets')
      .addTag('analytics', 'Client-facing analytics overview')
      .addTag('countries', 'Countries and their administrative-division hierarchy')
      .addTag('health', 'Liveness/readiness checks')
      .build(),
  );

  SwaggerModule.setup(SWAGGER_PATH, app, document, {
    swaggerOptions: { persistAuthorization: true },
  });
}
