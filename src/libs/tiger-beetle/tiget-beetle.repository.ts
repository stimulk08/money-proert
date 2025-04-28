import {
  BadRequestException,
  Inject,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PaymentsRepository } from 'src/apps/payments/interfaces/payments.repository.interface';
import { Account } from 'src/apps/payments/models/account.model';
import {
  Transaction,
  TransactionStatus,
  TransactionType,
} from 'src/apps/payments/models/transaction.model';
import { codeToType, typeToCode } from 'src/libs/tiger-beetle/transfer-types';
import {
  Client,
  Account as TBAccount,
  Transfer,
  id,
  AccountFilterFlags,
  TransferFlags,
} from 'tigerbeetle-node';

export class TigerBeetleRepository implements PaymentsRepository {
  private readonly logger = new Logger(TigerBeetleRepository.name);
  private readonly ledger = 1;
  private readonly systemAccountId = BigInt(999);

  constructor(@Inject('TB_CLIENT') private readonly client: Client) {}

  async createAccount(): Promise<Account> {
    const accId = id();
    const tbAccount: TBAccount = {
      id: accId,
      user_data_32: 0,
      ledger: this.ledger,
      code: 1,
      flags: 0,
      debits_pending: 0n,
      debits_posted: 0n,
      credits_pending: 0n,
      credits_posted: 0n,
      user_data_128: 0n,
      user_data_64: 0n,
      reserved: 0,
      timestamp: 0n,
    };

    const [error] = await this.client.createAccounts([tbAccount]);
    if (error) {
      this.logger.error('Create account failed', error);
      throw new BadRequestException('Create account failed');
    }
    return this.mapTbAccountToDomain(tbAccount);
  }

  async getAccount(accountId: string): Promise<Account> {
    const id = BigInt(accountId);

    const [account] = await this.client.lookupAccounts([id]);
    if (!account) {
      throw new NotFoundException('Account not found');
    }

    return this.mapTbAccountToDomain(account);
  }

  async getAccountTransactions(accountId: string): Promise<Transaction[]> {
    const id = BigInt(accountId);
    const transfers = await this.client.getAccountTransfers({
      account_id: id,
      user_data_128: 0n,
      user_data_64: 0n,
      user_data_32: 0,
      code: 1,
      timestamp_min: 0n,
      timestamp_max: 0n,
      limit: 100,
      flags:
        AccountFilterFlags.debits |
        AccountFilterFlags.credits |
        AccountFilterFlags.reversed,
    });

    return transfers.map((transfer) => this.mapTransferToTransaction(transfer));
  }

  async getTransfer(transferId: string): Promise<Transfer | null> {
    const id = BigInt(transferId);
    const [transfer] = await this.client.lookupTransfers([id]);
    if (!transfer) return null;
    return transfer;
  }

  async getTransaction(transactionId: string): Promise<Transaction | null> {
    const transfer = await this.getTransfer(transactionId);
    if (!transfer) return null;
    return this.mapTransferToTransaction(transfer);
  }

  async getTransactionOrThrow(transactionId: string): Promise<Transaction> {
    const transfer = await this.getTransfer(transactionId);
    if (!transfer) {
      throw new BadRequestException('Transaction not found');
    }
    return this.mapTransferToTransaction(transfer);
  }

  async refund(transactionId: string): Promise<Account> {
    const oldTransfer = await this.getTransfer(transactionId);

    if (!oldTransfer) {
      this.logger.error('Transaction not found');
      throw new NotFoundException('Transaction not found');
    }

    const transfer: Transfer = {
      id: id(),
      debit_account_id: oldTransfer.credit_account_id,
      credit_account_id: oldTransfer.debit_account_id,
      amount: this.convertToBigInt(Number(oldTransfer.amount.toString())),
      ledger: this.ledger,
      code: typeToCode[TransactionType.REFUND],
      flags: 0,
      pending_id: 0n,
      user_data_128: 0n,
      user_data_64: 0n,
      user_data_32: 0,
      timeout: 0,
      timestamp: 0n,
    };

    const [error] = await this.client.createTransfers([transfer]);
    if (error) {
      this.logger.error('Refund failed', error);
      throw new BadRequestException('Refund failed');
    }

    return this.getAccount(oldTransfer.debit_account_id.toString());
  }

  // Two phase transfer
  async deposit(accountId: string, amount: number): Promise<Transaction> {
    if (amount <= 0) {
      this.logger.error('Deposit amount must be positive');
      throw new BadRequestException('Deposit amount must be positive');
    }

    const transfer: Transfer = {
      id: id(),
      debit_account_id: this.systemAccountId,
      credit_account_id: BigInt(accountId),
      amount: this.convertToBigInt(amount),
      ledger: this.ledger,
      code: typeToCode[TransactionType.DEPOSIT],
      flags: TransferFlags.pending,
      pending_id: 0n,
      user_data_128: 0n,
      user_data_64: 0n,
      user_data_32: 0,
      timeout: 0,
      timestamp: 0n,
    };

    const [error] = await this.client.createTransfers([transfer]);
    if (error) {
      this.logger.error('Deposit failed', error);
      throw new BadRequestException('Deposit failed');
    }
    return await this.getTransactionOrThrow(transfer.id.toString());
  }

  async withdraw(accountId: string, amount: number): Promise<Transaction> {
    if (amount <= 0) {
      this.logger.error('Withdrawal amount must be positive');
      throw new BadRequestException('Withdrawal amount must be positive');
    }

    const transfer: Transfer = {
      id: id(),
      debit_account_id: BigInt(accountId),
      credit_account_id: this.systemAccountId,
      amount: this.convertToBigInt(amount),
      ledger: this.ledger,
      code: typeToCode[TransactionType.WITHDRAWAL],
      flags: 0,
      pending_id: 0n,
      user_data_128: 0n,
      user_data_64: 0n,
      user_data_32: 0,
      timeout: 0,
      timestamp: 0n,
    };

    const [error] = await this.client.createTransfers([transfer]);
    if (error) {
      this.logger.error('Withdrawal failed', error);
      throw Error('Withdrawal failed');
    }

    return await this.getTransactionOrThrow(transfer.id.toString());
  }

  async confirmTransaction(transactionId: string): Promise<Account> {
    const pendingTransfer = await this.getTransfer(transactionId);
    if (!pendingTransfer) {
      this.logger.error('Transaction not found');
      throw new Error('Transaction not found');
    }

    const transfer: Transfer = {
      ...pendingTransfer,
      id: id(),
      pending_id: pendingTransfer.id,
      flags: TransferFlags.post_pending_transfer,
      timeout: 0,
      timestamp: 0n,
    };

    const [error] = await this.client.createTransfers([transfer]);
    if (error) {
      this.logger.error('Confirm transaction failed', error);
      throw Error('Confirm transaction failed');
    }

    return await this.getAccount(pendingTransfer.credit_account_id.toString());
  }

  async avoidTransaction(transactionId: string): Promise<Account> {
    const pendingTransfer = await this.getTransfer(transactionId);
    if (!pendingTransfer) {
      this.logger.error('Transaction not found');
      throw new Error('Transaction not found');
    }
    const transfer: Transfer = {
      ...pendingTransfer,
      id: id(),
      flags: TransferFlags.void_pending_transfer,
      timeout: 0,
      timestamp: 0n,
    };

    const [error] = await this.client.createTransfers([transfer]);
    if (error) {
      this.logger.error('Rollback transaction failed', error);
      throw Error('Rollback transaction failed');
    }

    return await this.getAccount(pendingTransfer.credit_account_id.toString());
  }

  async initializeSystemAccount() {
    try {
      const masterAccount = await this.getMasterAccount().catch(() => null);
      if (masterAccount) return;

      const errors = await this.client.createAccounts([
        {
          id: this.systemAccountId,
          user_data_128: 0n,
          ledger: this.ledger,
          code: 1,
          flags: 0,
          debits_pending: 0n,
          debits_posted: 0n,
          credits_pending: 0n,
          credits_posted: 0n,
          user_data_64: 0n,
          user_data_32: 0,
          reserved: 0,
          timestamp: 0n,
        },
      ]);
      if (errors.length > 0) {
        this.logger.error('Initialize system account failed', errors);
        throw new BadRequestException('Initialize system account failed');
      }
    } catch (error: any) {
      console.log(error);
      throw error;
    }
  }

  private convertToBigInt(amount: number): bigint {
    return BigInt(Math.round(amount * 100));
  }

  private mapTbAccountToDomain(account: TBAccount): Account {
    return {
      id: account.id.toString(),
      balance: Number(account.credits_posted - account.debits_posted) / 100,
      meta: {
        ledger: account.ledger,
        code: account.code,
        flags: account.flags,
      },
    };
  }

  private getTransactionType(code: number): TransactionType {
    return codeToType[code] || TransactionType.UNKNOWN;
  }

  private mapTransferToTransaction(transfer: Transfer): Transaction {
    return {
      id: transfer.id.toString(),
      accountId: transfer.credit_account_id.toString(),
      amount: Number(transfer.amount) / 100,
      type: this.getTransactionType(transfer.code),
      status: TransactionStatus.COMPLETED,
      createdAt: new Date(Number(transfer.timestamp)),
    };
  }

  async getAllAccounts(limit?: number): Promise<Account[]> {
    const models = await this.client.queryAccounts({
      user_data_128: 0n,
      user_data_64: 0n,
      user_data_32: 0,
      ledger: 0,
      code: 0,
      timestamp_min: 0n,
      timestamp_max: 0n,
      limit: limit || 100,
      flags: 0,
    });

    return models.map((model) => this.mapTbAccountToDomain(model));
  }

  async getMasterAccount(): Promise<Account> {
    return this.getAccount(this.systemAccountId.toString());
  }
}
