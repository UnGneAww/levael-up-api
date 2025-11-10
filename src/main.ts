import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // <-- ต้องเปิดอันนี้ เพื่อให้ @Type ทำงาน
      whitelist: true, // ตัด field ขยะทิ้ง
    }),
  );

  await app.listen(3000);
}
bootstrap();
