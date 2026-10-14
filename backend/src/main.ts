import { createApp } from './create-app';

async function bootstrap() {
  const app = await createApp();
  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`Backend listening on http://localhost:${port}/api/v1`);
}
bootstrap();
