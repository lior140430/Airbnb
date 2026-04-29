import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { readFileSync } from 'fs';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
    const httpsOptions =
        process.env.NODE_ENV === 'production' &&
        process.env.SSL_KEY_PATH &&
        process.env.SSL_CERT_PATH
            ? {
                  key: readFileSync(process.env.SSL_KEY_PATH),
                  cert: readFileSync(process.env.SSL_CERT_PATH),
              }
            : undefined;

    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
        httpsOptions,
    });
    app.enableCors({
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        credentials: true,
    });
    app.use(helmet({
        crossOriginResourcePolicy: { policy: 'cross-origin' },
    }));
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useStaticAssets(join(__dirname, '..', 'uploads'), {
        prefix: '/uploads',
    });

    const swaggerConfig = new DocumentBuilder()
        .setTitle('Property Service API')
        .setDescription('Property listings, chat, AI search and real-time messaging endpoints')
        .setVersion('1.0')
        .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
        .addTag('properties', 'Property listing endpoints')
        .addTag('chat', 'Chat and messaging endpoints')
        .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);

    const port = process.env.PORT ?? 4001;
    await app.listen(port, '0.0.0.0');
    console.log(`property-service listening on ${httpsOptions ? 'https' : 'http'}://0.0.0.0:${port}`);
}
bootstrap();
