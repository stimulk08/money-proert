import { TransactionType } from 'src/apps/payments/models/transaction.model';

// const typeCode: Array<[TransactionType, number]> = [
//   [TransactionType.DEPOSIT, 1],
//   [TransactionType.WITHDRAWAL, 2],
//   [TransactionType.REFUND, 3],
// ];

export const typeToCode: Record<TransactionType, number> = {
  [TransactionType.DEPOSIT]: 1,
  [TransactionType.WITHDRAWAL]: 2,
  [TransactionType.REFUND]: 3,
  [TransactionType.UNKNOWN]: 0,
};

export const codeToType: Record<number, TransactionType> = {
  1: TransactionType.DEPOSIT,
  2: TransactionType.WITHDRAWAL,
  3: TransactionType.REFUND,
  0: TransactionType.UNKNOWN,
};

// export const typeToCode: Record<TransactionType, number> =
//   Object.fromEntries<Record<TransactionType, number>>(typeCode);

// export const codeToType: Record<number, TransactionType> = Object.fromEntries(
//   typeCode.map(([type, code]) => [code, type]),
// );
