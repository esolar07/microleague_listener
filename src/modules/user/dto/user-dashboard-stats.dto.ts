import { ApiProperty } from '@nestjs/swagger';

export class UserDashboardStatsDto {
  @ApiProperty({
    description: 'Total value of assets from pools the user has joined',
    example: 50000,
  })
  myAssets: number;

  @ApiProperty({
    description: 'Total deposits made by the user',
    example: 1500,
  })
  myDeposits: number;

  @ApiProperty({
    description: 'Total house credit available (worth) to the user',
    example: 5000,
  })
  creditAvailable: number;

  @ApiProperty({
    description: 'Total amount of upcoming (unpaid) payments',
    example: 300,
  })
  upcomingPayments: number;

  @ApiProperty({
    description: 'Total XHIFT tokens the user owns',
    example: 10000,
  })
  tokens: number;

  @ApiProperty({
    description: 'USD value of XHIFT tokens',
    example: 500,
  })
  tokenUSDValue: number;
}
