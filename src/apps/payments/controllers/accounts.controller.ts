// payment.controller.ts
import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DepositRequest } from 'src/apps/payments/dto/request/deposite.request';
import { Account } from 'src/apps/payments/models/account.model';
import { Transaction } from 'src/apps/payments/models/transaction.model';
import { PaymentService } from 'src/apps/payments/payments.service';

@ApiTags('Аккаунты')
@Controller('accounts')
export class AccountController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  createAccount(@Body('userId') userId: string): Promise<Account | null> {
    return this.paymentService.createAccount(userId);
  }

  @Get('master')
  async getMasterAccount(): Promise<Account> {
    return this.paymentService.getMasterAccount();
  }

  @Get()
  getAllAccounts(): Promise<Account[]> {
    return this.paymentService.getAllAccounts();
  }

  @Post('bulk')
  async createAccountBulk(@Body('userId') userId: string): Promise<Account[]> {
    const accounts: Account[] = [];
    for (let i = 0; i < 10000; i++) {
      accounts.push(await this.paymentService.createAccount(userId));
    }
    return accounts;
  }

  @Get(':id')
  getAccount(@Param('id') accountId: string): Promise<Account | null> {
    return this.paymentService.getAccount(accountId);
  }

  @Post(':id/deposit')
  deposit(
    @Param('id') accountId: string,
    @Body() dto: DepositRequest,
  ): Promise<Transaction> {
    return this.paymentService.deposit(accountId, dto.amount);
  }

  @Post(':id/withdraw')
  withdraw(
    @Param('id') accountId: string,
    @Body() dto: DepositRequest,
  ): Promise<Transaction> {
    return this.paymentService.withdraw(accountId, dto.amount);
  }

  @Get(':id/transactions')
  getTransactions(@Param('id') accountId: string): Promise<Transaction[]> {
    return this.paymentService.getAccountTransactions(accountId);
  }
}
