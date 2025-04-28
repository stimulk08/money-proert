// payment.module.ts
import { Module } from '@nestjs/common';
import { AccountController } from './controllers/accounts.controller';
import { PaymentService } from './payments.service';
import { TigerBeetleModule } from 'src/libs/tiger-beetle/tiger-beetle.module';
import { TigerBeetleRepository } from 'src/libs/tiger-beetle/tiget-beetle.repository';
import { TransactionController } from 'src/apps/payments/controllers/transaction.controller';

const accountRepositoryProvider = {
  provide: 'PAYMENTS_REPOSITORY',
  useFactory: (tgRepository: TigerBeetleRepository) => {
    return tgRepository;
  },
  inject: [TigerBeetleRepository],
  imports: [TigerBeetleModule],
};

@Module({
  imports: [TigerBeetleModule],
  controllers: [AccountController, TransactionController],
  providers: [PaymentService, accountRepositoryProvider],
})
export class PaymentModule {}
