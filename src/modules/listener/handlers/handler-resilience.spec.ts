// Feature: recent-activity, Property 4: Handler resilience on activity creation failure
// **Validates: Requirements 2.4, 3.4, 4.4**

import * as fc from 'fast-check';
import { PresaleBuyHandler } from './presale-buy.handler';
import { PresaleClaimHandler } from './presale-claim.handler';
import { VestingScheduleCreatedHandler } from './vesting-schedule-created.handler';
import { PrismaService } from 'src/prisma/prisma.service';
import { JsonRpcProvider } from 'ethers';
import { ContractEventConfig } from '../config/listener.config';

// --- Arbitraries ---

const hexCharArb = fc.constantFrom(
  ...'0123456789abcdef'.split(''),
);

const ethAddressArb = fc
  .array(hexCharArb, { minLength: 40, maxLength: 40 })
  .map((chars) => '0x' + chars.join(''));

const txHashArb = fc
  .array(hexCharArb, { minLength: 64, maxLength: 64 })
  .map((chars) => '0x' + chars.join(''));

const toBigIntWei = (val: number) => BigInt(Math.round(val * 1e18));

// --- Helpers ---

function createMockPrismaWithFailingActivity() {
  return {
    recentActivity: {
      create: jest.fn().mockRejectedValue(new Error('DB connection lost')),
    },
    presaleUser: {
      upsert: jest.fn().mockResolvedValue({}),
    },
    presaleTx: {
      upsert: jest.fn().mockResolvedValue({}),
      create: jest.fn().mockResolvedValue({}),
    },
    vestingSchedule: {
      upsert: jest.fn().mockResolvedValue({}),
      findMany: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockResolvedValue({}),
    },
    listenerState: {
      upsert: jest.fn().mockResolvedValue({}),
      findUnique: jest.fn().mockResolvedValue(null),
    },
  } as unknown as PrismaService;
}

function createMockProvider(timestamp: number) {
  return {
    getBlock: jest.fn().mockResolvedValue({ timestamp }),
  } as unknown as JsonRpcProvider;
}

const contractConfig: ContractEventConfig = {
  contractAddress: '0x' + 'a'.repeat(40),
  contractName: 'TestPresale',
  abi: [],
  events: [],
  enabled: true,
  network: 'ethereum',
};

// --- Buy event factory ---

function createBuyEvent(buyer: string, txHash: string, tokensBigInt: bigint, paymentBigInt: bigint, usdBigInt: bigint) {
  return {
    transactionHash: txHash,
    blockNumber: 12345,
    index: 0,
    args: {
      buyer,
      paymentToken: '0x0000000000000000000000000000000000000000',
      paymentAmount: paymentBigInt,
      tokenAmount: tokensBigInt,
      stageId: BigInt(1),
      usdValue: usdBigInt,
    },
  };
}

// --- Claim event factory ---

function createClaimEvent(buyer: string, txHash: string, amountBigInt: bigint) {
  return {
    transactionHash: txHash,
    blockNumber: 12345,
    index: 0,
    args: {
      buyer,
      amount: amountBigInt,
      schedulesClaimed: BigInt(1),
    },
  };
}

// --- Vesting event factory ---

function createVestingEvent(buyer: string, txHash: string, amountBigInt: bigint, scheduleId: number) {
  return {
    transactionHash: txHash,
    blockNumber: 12345,
    index: 0,
    args: {
      buyer,
      scheduleId: BigInt(scheduleId),
      amount: amountBigInt,
      startTime: BigInt(1_700_000_000),
      cliff: BigInt(86400),
      duration: BigInt(31536000),
    },
  };
}
