import { ApiProperty } from '@nestjs/swagger';

export class DepositRequest {
  @ApiProperty()
  amount: number;
}
