import { config } from 'dotenv';
config();

import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationError } from 'class-validator';
import * as session from 'express-session';
import { ResponseInterceptor } from './interceptors/response.interceptor';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Serve static files from uploads directory
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });
  const corsOptions: CorsOptions = {
    origin: '*',
  };

  function formatErrors(errors, parent = '') {
    return errors.flatMap((err) => {
      const propertyPath = parent ? `${parent}.${err.property}` : err.property;

      const currentErrors = err.constraints
        ? Object.values(err.constraints).map((message) => ({
            field: propertyPath,
            message,
            value: err.value,
          }))
        : [];

      const childErrors = err.children?.length ? formatErrors(err.children, propertyPath) : [];

      return [...currentErrors, ...childErrors];
    });
  }

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      exceptionFactory: (errors) => {
        const formatted = formatErrors(errors);
        return new BadRequestException({
          message: 'Validation failed',
          errors: formatted,
        });
      },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor(new Reflector()));
  app.enableCors(corsOptions);
  app.use(
    session({
      secret: 'your-secret-key', // Replace this with your secret
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 60000, // 1 minute for the session cookie, adjust as needed
      },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Network API')
    .setDescription('The Network API description')
    .setVersion('1.0')
    .addTag('showdown')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    })
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT || 4000);
}
bootstrap();
