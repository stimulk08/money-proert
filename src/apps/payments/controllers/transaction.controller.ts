// payment.controller.ts
import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Account } from 'src/apps/payments/models/account.model';
import { Transaction } from 'src/apps/payments/models/transaction.model';
import { PaymentService } from 'src/apps/payments/payments.service';

@ApiTags('Платежи')
@Controller('transactions')
export class TransactionController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get(':id')
  getTransaction(@Param('id') id: string): Promise<Transaction> {
    return this.paymentService.getTransactionOrFail(id);
  }

  @Post(':id/confirm')
  confirmTransaction(@Param('id') id: string): Promise<Account | null> {
    return this.paymentService.confirmTransaction(id);
  }

  @Post(':id/avoid')
  avoidTransaction(@Param('id') transactionId: string) {
    return this.paymentService.avoidTransaction(transactionId);
  }

  @Post(':id/refund/')
  refund(@Param('id') transactionId: string): Promise<Account | null> {
    return this.paymentService.refund(transactionId);
  }
}
