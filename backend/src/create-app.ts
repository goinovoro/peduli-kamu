import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

export async function createApp(): Promise<NestExpressApplication> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const swaggerConfig = new DocumentBuilder()
    .setTitle('PeduliKamu API')
    .setDescription(
      'Kontrak API marketplace home-care: Pasien → Kebutuhan → Minat → Deal → Bayar (QRIS manual) → Absensi → Payout. ' +
        'Auth via cookie HttpOnly `pedulikamu_token` (fallback Bearer). ' +
        'Aturan uang: pasien batal = tanpa refund + full ke mitra; mitra wanprestasi = beku + hangus + refund/jam.',
    )
    .setVersion('0.1.0')
    .addServer('/api/v1')
    .addCookieAuth('pedulikamu_token', { type: 'apiKey', in: 'cookie' })
    .addBearerAuth()
    .build();
  const swaggerDoc = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, swaggerDoc);

  app.setGlobalPrefix('api/v1');
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'],
    exposedHeaders: ['Idempotent-Replayed'],
  });

  return app;
}
