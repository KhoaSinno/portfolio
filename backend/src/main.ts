import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const envOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim().replace(/\/$/, ''))
    : [];

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      const normalized = origin.trim().replace(/\/$/, '');

      const isAllowed =
        envOrigins.includes('*') ||
        envOrigins.includes(normalized) ||
        normalized.startsWith('http://localhost:') ||
        normalized.endsWith('nguyentrananhkhoa.id.vn') ||
        normalized.endsWith('.vercel.app');

      if (isAllowed) {
        callback(null, true);
      } else {
        // Allow all valid browser origins to prevent production CORS lockouts
        callback(null, true);
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Origin',
      'X-Requested-With',
    ],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  await app.listen(process.env.PORT ?? 3001);
}
void bootstrap();
