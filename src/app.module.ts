import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentModule } from 'src/apps/payments/payments.module';
import { LoggerMiddleware } from 'src/common/middlewares/log.middleware';

@Module({
  imports: [ConfigModule.forRoot(), PaymentModule],
  controllers: [],
  providers: [],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
