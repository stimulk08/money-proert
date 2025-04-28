export interface Account<T = any> {
  id: string;
  balance: number;
  meta: T;
}
