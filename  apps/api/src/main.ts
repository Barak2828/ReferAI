import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.enableCors(); // Enable CORS for Frontend access
    await app.listen(3001); // Run on port 3001 to avoid conflict with Next.js (3000)
    console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
