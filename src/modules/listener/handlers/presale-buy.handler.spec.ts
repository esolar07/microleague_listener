// Feature: recent-activity, Property 1: Buy handler activity record correctness
// **Validates: Requirements 2.1, 2.2, 2.3**

import * as fc from 'fast-check';
import { PresaleBuyHandler } from './presale-buy.handler';
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

function createMockEvent(buyer: string, txHash: string, tokensBigInt: bigint, paymentBigInt: bigint, usdBigInt: bigint) {
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

const contractConfig: ContractEventConfig = {
  contractAddress: '0x' + 'a'.repeat(40),
  contractName: 'TestPresale',
  abi: [],
  events: [],
  enabled: true,
  network: 'ethereum',
};

describe('PresaleBuyHandler - Property 1: Buy handler activity record correctness', () => {
  it('should create a RecentActivity record with correct fields for any valid Bought event', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          buyer: ethAddressArb,
          tokens: fc.float({ min: Math.fround(0.01), max: Math.fround(1e9), noNaN: true }),
          usdAmount: fc.float({ min: 0, max: Math.fround(1e9), noNaN: true }),
          txHash: txHashArb,
        }),
        fc.integer({ min: 1_000_000_000, max: 2_000_000_000 }),
        async ({ buyer, tokens, usdAmount, txHash }: { buyer: string; tokens: number; usdAmount: number; txHash: string }, blockTimestamp: number) => {
          // Convert float values to wei (bigint) to simulate what ethers formatEther will parse back
          // The handler uses: Number(Number(formatEther(wei)).toFixed(6))
          // So we need to go: float -> wei -> formatEther -> toFixed(6) -> Number
          const toBigIntWei = (val: number) =>
            BigInt(Math.round(val * 1e18));

          const tokensBigInt = toBigIntWei(tokens);
          const usdBigInt = toBigIntWei(usdAmount);
          const paymentBigInt = toBigIntWei(1); // payment amount doesn't affect activity record

          const mockPrisma = createMockPrisma();
          const mockProvider = createMockProvider(blockTimestamp);
          const event = createMockEvent(buyer, txHash, tokensBigInt, paymentBigInt, usdBigInt);

          const handler = new PresaleBuyHandler(mockPrisma);
          await handler.handle(event, contractConfig, mockProvider);

          // Verify recentActivity.create was called
          const createCall = (mockPrisma.recentActivity.create as jest.Mock);
          expect(createCall).toHaveBeenCalledTimes(1);

          const createdData = createCall.mock.calls[0][0].data;

          // Requirement 2.1: activityType = Buy, walletAddress = lowercased buyer, amount = tokens, usdAmount, txHash
          expect(createdData.activityType).toBe('Buy');
          expect(createdData.walletAddress).toBe(buyer.toLowerCase());
          expect(createdData.txHash).toBe(txHash);

          // Requirement 2.2: action = "Purchased MLC"
          expect(createdData.action).toBe('Purchased MLC');

          // Requirement 2.3: timestamp = block timestamp converted to Date
          expect(createdData.timestamp).toEqual(new Date(blockTimestamp * 1000));

          // Verify amount and usdAmount are numbers (the handler converts via formatEther)
          expect(typeof createdData.amount).toBe('number');
          expect(typeof createdData.usdAmount).toBe('number');
        },
      ),
      { numRuns: 100 },
    );
  });
});
