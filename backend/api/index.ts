import type { Request, Response } from 'express';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { createApp } from '../dist/create-app';

let appPromise: Promise<NestExpressApplication> | undefined;

async function getApp(): Promise<NestExpressApplication> {
  if (!appPromise) {
    appPromise = (async () => {
      const app = await createApp();
      await app.init();
      return app;
    })();
  }
  return appPromise;
}

export default async function handler(req: Request, res: Response): Promise<void> {
  const app = await getApp();
  app.getHttpAdapter().getInstance()(req, res);
}
