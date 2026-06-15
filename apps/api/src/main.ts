import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import type { NextFunction, Request, Response } from "express";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.enableCors({
    origin: config.get<string>("WEB_ORIGIN")?.split(",") ?? true,
    credentials: true
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true
    })
  );

  if (process.env.NODE_ENV !== "production") {
    app.use((req: Request, res: Response, next: NextFunction) => {
      const startedAt = Date.now();
      res.on("finish", () => {
        const duration = Date.now() - startedAt;
        const level = duration >= 1000 ? "warn" : "log";
        const message = `${req.method} ${req.originalUrl ?? req.url} ${res.statusCode} ${duration}ms`;
        console[level](duration >= 1000 ? `[slow-api] ${message}` : `[api] ${message}`);
      });
      next();
    });
  }

  const port = config.get<number>("API_PORT") ?? 4000;
  await app.listen(port);
}

bootstrap();
