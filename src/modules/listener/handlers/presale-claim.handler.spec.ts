// Feature: recent-activity, Property 2: Claim handler activity record correctness
// **Validates: Requirements 3.1, 3.2, 3.3**

import * as fc from 'fast-check';
import { PresaleClaimHandler } from './presale-claim.handler';
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
    presaleTx: {
      create: jest.fn().mockResolvedValue({}),
    },
    vestingSchedule: {
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

function createMockEvent(buyer: string, txHash: string, amountBigInt: bigint) {
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

const contractConfig: ContractEventConfig = {
  contractAddress: '0x' + 'a'.repeat(40),
  contractName: 'TestPresale',
  abi: [],
  events: [],
  enabled: true,
  network: 'ethereum',
};

describe('PresaleClaimHandler - Property 2: Claim handler activity record correctness', () => {
  it('should create a RecentActivity record with correct fields for any valid Claimed event', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          buyer: ethAddressArb,
          tokens: fc.float({ min: Math.fround(0.01), max: Math.fround(1e9), noNaN: true }),
          txHash: txHashArb,
        }),
        fc.integer({ min: 1_000_000_000, max: 2_000_000_000 }),
        async ({ buyer, tokens, txHash }: { buyer: string; tokens: number; txHash: string }, blockTimestamp: number) => {
          const toBigIntWei = (val: number) =>
            BigInt(Math.round(val * 1e18));

          const amountBigInt = toBigIntWei(tokens);

          const mockPrisma = createMockPrisma();
          const mockProvider = createMockProvider(blockTimestamp);
          const event = createMockEvent(buyer, txHash, amountBigInt);

          const handler = new PresaleClaimHandler(mockPrisma);
          await handler.handle(event, contractConfig, mockProvider);

          // Verify recentActivity.create was called
          const createCall = (mockPrisma.recentActivity.create as jest.Mock);
          expect(createCall).toHaveBeenCalledTimes(1);

          const createdData = createCall.mock.calls[0][0].data;

          // Requirement 3.1: activityType = Claim, walletAddress = lowercased buyer, amount = tokens, txHash
          expect(createdData.activityType).toBe('Claim');
          expect(createdData.walletAddress).toBe(buyer.toLowerCase());
          expect(createdData.txHash).toBe(txHash);
          expect(typeof createdData.amount).toBe('number');

          // Requirement 3.2: action = "Claimed MLC"
          expect(createdData.action).toBe('Claimed MLC');

          // Requirement 3.3: usdAmount = 0 since claims have no USD value
          expect(createdData.usdAmount).toBe(0);

          // Requirement 3.3 (timestamp): timestamp = block timestamp converted to Date
          expect(createdData.timestamp).toEqual(new Date(blockTimestamp * 1000));
        },
      ),
      { numRuns: 100 },
    );
  });
});
