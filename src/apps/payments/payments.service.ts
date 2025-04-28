// payment.service.ts
import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PaymentsRepository } from 'src/apps/payments/interfaces/payments.repository.interface';
import { Account } from 'src/apps/payments/models/account.model';
import {
  Transaction,
  TransactionStatus,
  TransactionType,
} from 'src/apps/payments/models/transaction.model';

@Injectable()
export class PaymentService {
  constructor(
    @Inject('PAYMENTS_REPOSITORY')
    private readonly paymentsRepository: PaymentsRepository,
  ) {}

  async createAccount(userId: string): Promise<Account> {
    return this.paymentsRepository.createAccount(userId);
  }

  async getAccount(accountId: string): Promise<Account | null> {
    return this.paymentsRepository.getAccount(accountId);
  }

  deposit(accountId: string, amount: number): Promise<Transaction> {
    return this.paymentsRepository.deposit(accountId, amount);
  }

  confirmTransaction(transactionId: string): Promise<Account | null> {
    return this.paymentsRepository.confirmTransaction(transactionId);
  }

  avoidTransaction(transactionId: string): Promise<Account> {
    return this.paymentsRepository.avoidTransaction(transactionId);
  }

  async getAccountOrFail(accountId: string): Promise<Account> {
    const account = await this.getAccount(accountId);
    if (!account) {
      throw new NotFoundException('Account not found');
    }
    return account;
  }

  async withdraw(accountId: string, amount: number): Promise<Transaction> {
    const account = await this.getAccountOrFail(accountId);
    if (account.balance < amount) {
      throw new BadRequestException('Insufficient funds');
    }

    return this.paymentsRepository.withdraw(accountId, amount);
  }

  getTransaction(transactionId: string): Promise<Transaction | null> {
    return this.paymentsRepository.getTransaction(transactionId);
  }

  async getTransactionOrFail(transactionId: string): Promise<Transaction> {
    const transaction = await this.getTransaction(transactionId);
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }
    return transaction;
  }

  async refund(transactionId: string): Promise<Account | null> {
    const transaction = await this.getTransactionOrFail(transactionId);

    if (transaction.status !== TransactionStatus.COMPLETED) {
      throw new BadRequestException('Transaction is not completed');
    }

    if (transaction.type !== TransactionType.DEPOSIT) {
      throw new BadRequestException('Transaction is not a deposit');
    }

    return this.paymentsRepository.refund(transactionId);
  }

  async getAccountTransactions(accountId: string): Promise<Transaction[]> {
    const account = await this.paymentsRepository.getAccount(accountId);
    if (!account) {
      throw new NotFoundException('Account not found');
    }
    return this.paymentsRepository.getAccountTransactions(accountId);
  }

  getAllAccounts(): Promise<Account[]> {
    return this.paymentsRepository.getAllAccounts();
  }

  getMasterAccount(): Promise<Account> {
    return this.paymentsRepository.getMasterAccount();
  }
}
