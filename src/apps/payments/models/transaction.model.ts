export enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum TransactionType {
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  REFUND = 'REFUND',
  UNKNOWN = 'UNKNOWN',
}

export interface Transaction {
  id: string;
  accountId: string;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  createdAt: Date;
  relatedTransactionId?: string;
}
