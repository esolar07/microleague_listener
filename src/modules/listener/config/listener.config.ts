import { PRESALE_ABI } from '../abis/presaleAbi';

// config/listener.config.ts
export interface ContractEventConfig {
  contractAddress: string;
  contractName: string;
  abi: any[];
  events: EventConfig[];
  startBlock?: number;
  enabled: boolean;
  network: string;
  notification?: boolean;
}

export interface EventConfig {
  eventName: string;
  handler: string; // Handler class name
  enabled: boolean;
  processPrevious: boolean;
  batchSize?: number;
}

export const LISTENER_CONFIG: ContractEventConfig[] = [
  {
    contractAddress: process.env.PRESALE_CONTRACT || '',
    contractName: 'PRESALE_CONTRACT',
    abi: PRESALE_ABI,
    network: 'ethereum',
    enabled: true,
    startBlock: 40759127, //9616518,
    events: [
      {
        eventName: 'Bought',
        handler: 'PresaleBuyHandler',
        enabled: true,
        processPrevious: true,
        batchSize: 100,
      },
      {
        eventName: 'Claimed',
        handler: 'PresaleClaimHandler',
        enabled: true,
        processPrevious: true,
        batchSize: 100,
      },
      {
        eventName: 'VestingScheduleCreated',
        handler: 'VestingScheduleCreatedHandler',
        enabled: true,
        processPrevious: true,
        batchSize: 100,
      },
    ],
  },




  {
    contractAddress: '0x28b34c9CC6E3635B538CEfD71B60C93eAdb2c04c',
    contractName: 'MyToken',
    abi: [], // ERC20_ABI
    network: 'ethereum',
    enabled: false,
    startBlock: 40759127,
    events: [
      {
        eventName: 'Transfer',
        handler: 'TokenTransferHandler',
        enabled: true,
        processPrevious: true,
        batchSize: 100,
      },
    ],
  },
];
