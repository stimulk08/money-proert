import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const swaggerPrefix = 'api';
  const config = new DocumentBuilder()
    .setTitle('CRM API')
    .setDescription(`Payment api`)
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(swaggerPrefix, app, document);

  await app.listen(process.env.PORT ?? 3001);

  const appUrl = await app.getUrl();
  console.log(`Application is running on: ${appUrl}`);
  console.log(`Swagger is running on: ${appUrl}/${swaggerPrefix}`);
}
bootstrap();
