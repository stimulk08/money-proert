import { NextFunction, Request, Response } from 'express';

import { Injectable, Logger, NestMiddleware } from '@nestjs/common';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  use(request: Request, response: Response, next: NextFunction): void {
    const { method, originalUrl, ip } = request;

    response.on('finish', () => {
      const { statusCode } = response;
      const log = `${method} ${statusCode} ${originalUrl} ${ip}`;

      if (statusCode < 400) this.logger.log(log);
      else if (statusCode < 500) this.logger.warn(log);
      else this.logger.error(log);

      if (method !== 'GET' && method !== 'DELETE') {
        this.logger.log(request.body);
      }
    });

    next();
  }
}
