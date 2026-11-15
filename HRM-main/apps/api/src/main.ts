import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { swaggerOptions, swaggerTitle, swaggerDescription } from './common';

export async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
    })
  );

  // Swagger Configuration --------------------------------
  // swaggerOptions, swaggerTitle, swaggerDescription variables are customized and defined in common/swagger/swagger.config.ts
  const config = new DocumentBuilder()
    .setTitle(swaggerTitle)
    .setDescription(swaggerDescription)
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api', app, document, swaggerOptions);

  // End Swagger Configurations --------------------------------

  //Enable CORS
  app.enableCors();
  app.enableShutdownHooks();

  let retries = 5;
  while (retries > 0) {
    try {
      const port = process.env.PORT || 3002;
      await app.listen(port);
      Logger.log(`App running on Port ${port}`);
      break;
    } catch (err: any) {
      const port = process.env.PORT || 3002;
      if (err.code === 'EADDRINUSE' && retries > 1) {
        Logger.warn(`Cổng ${port} đang bận, thử lại sau 1.5 giây... (còn ${retries - 1} lần thử)`);
        await new Promise((r) => setTimeout(r, 1500));
        retries--;
      } else {
        throw err;
      }
    }
  }
}
bootstrap();

