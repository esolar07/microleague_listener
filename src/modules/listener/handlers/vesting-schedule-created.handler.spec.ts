// Feature: recent-activity, Property 3: Vesting handler activity record correctness
// **Validates: Requirements 4.1, 4.2, 4.3**

import * as fc from 'fast-check';
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

// --- Helpers ---

function createMockPrisma() {
  return {
    recentActivity: {
      create: jest.fn().mockResolvedValue({}),
    },
    presaleUser: {
      upsert: jest.fn().mockResolvedValue({}),
    },
    vestingSchedule: {
      upsert: jest.fn().mockResolvedValue({}),
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

function createMockEvent(
  buyer: string,
  txHash: string,
  amountBigInt: bigint,
  scheduleId: number,
  startTime: number,
  cliff: number,
  duration: number,
) {
  return {
    transactionHash: txHash,
    blockNumber: 12345,
    index: 0,
    args: {
      buyer,
      scheduleId: BigInt(scheduleId),
      amount: amountBigInt,
      startTime: BigInt(startTime),
      cliff: BigInt(cliff),
      duration: BigInt(duration),
    },
  };
}

const contractConfig: ContractEventConfig = {
  contractAddress: '0x' + 'a'.repeat(40),
  contractName: 'TestPresale',
  abi: [],
  events: [],
  enabled: true,
  network: 'ethereum',
};

describe('VestingScheduleCreatedHandler - Property 3: Vesting handler activity record correctness', () => {
  it('should create a RecentActivity record with correct fields for any valid VestingScheduleCreated event', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          buyer: ethAddressArb,
          vestingAmount: fc.float({ min: Math.fround(0.01), max: Math.fround(1e9), noNaN: true }),
          scheduleId: fc.nat({ max: 1_000_000 }),
          txHash: txHashArb,
        }),
        fc.integer({ min: 1_000_000_000, max: 2_000_000_000 }),
        async (
          { buyer, vestingAmount, scheduleId, txHash }: { buyer: string; vestingAmount: number; scheduleId: number; txHash: string },
          blockTimestamp: number,
        ) => {
          const toBigIntWei = (val: number) =>
            BigInt(Math.round(val * 1e18));

          const amountBigInt = toBigIntWei(vestingAmount);

          const mockPrisma = createMockPrisma();
          const mockProvider = createMockProvider(blockTimestamp);
          const event = createMockEvent(
            buyer,
            txHash,
            amountBigInt,
            scheduleId,
            1_700_000_000, // startTime (fixed, not relevant to activity record)
            86400,         // cliff
            31536000,      // duration
          );

          const handler = new VestingScheduleCreatedHandler(mockPrisma);
          await handler.handle(event, contractConfig, mockProvider);

          // Verify recentActivity.create was called
          const createCall = (mockPrisma.recentActivity.create as jest.Mock);
          expect(createCall).toHaveBeenCalledTimes(1);

          const createdData = createCall.mock.calls[0][0].data;

          // Requirement 4.1: activityType = Vesting_Created, walletAddress = lowercased buyer, amount = vesting total, txHash
          expect(createdData.activityType).toBe('Vesting_Created');
          expect(createdData.walletAddress).toBe(buyer.toLowerCase());
          expect(createdData.txHash).toBe(txHash);
          expect(typeof createdData.amount).toBe('number');

          // Requirement 4.2: action = "Vesting Schedule Created"
          expect(createdData.action).toBe('Vesting Schedule Created');

          // Requirement 4.3: metadata contains scheduleId and stageId
          expect(createdData.metadata).toBeDefined();
          expect(createdData.metadata.scheduleId).toBe(scheduleId);
          expect(createdData.metadata.stageId).toBe(scheduleId);

          // usdAmount should be 0 for vesting events
          expect(createdData.usdAmount).toBe(0);

          // timestamp = block timestamp converted to Date
          expect(createdData.timestamp).toEqual(new Date(blockTimestamp * 1000));
        },
      ),
      { numRuns: 100 },
    );
  });
});
