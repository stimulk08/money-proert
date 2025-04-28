import { Account } from 'src/apps/payments/models/account.model';
import { Transaction } from 'src/apps/payments/models/transaction.model';

// interfaces/account.repository.interface.ts
export interface PaymentsRepository {
  createAccount(accountId: string): Promise<Account>;
  getAccount(accountId: string): Promise<Account | null>;
  getMasterAccount(): Promise<Account>;
  getAllAccounts(): Promise<Account[]>;

  getAccountTransactions(id: string): Promise<Transaction[]>;
  getTransaction(id: string): Promise<Transaction | null>;

  refund(transactionId: string): Promise<Account>;
  deposit(accountId: string, amount: number): Promise<Transaction>;
  withdraw(accountId: string, amount: number): Promise<Transaction>;
  confirmTransaction(transactionId: string): Promise<Account>;
  avoidTransaction(transactionId: string): Promise<Account>;
}
