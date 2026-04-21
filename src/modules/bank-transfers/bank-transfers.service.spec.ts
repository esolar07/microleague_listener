import { Test, TestingModule } from '@nestjs/testing';
import { BankTransfersService } from './bank-transfers.service';

describe('BankTransfersService', () => {
  let service: BankTransfersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BankTransfersService],
    }).compile();

    service = module.get<BankTransfersService>(BankTransfersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
