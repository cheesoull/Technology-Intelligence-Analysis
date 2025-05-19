import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    })
  );

  app.setGlobalPrefix('api');  
  app.enableCors();
  await app.listen(process.env.PORT || 3000, '0.0.0.0');

 console.log(`Server running at http://localhost:${process.env.PORT || 3000}`);
}
bootstrap();
