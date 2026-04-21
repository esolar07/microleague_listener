import { Test, TestingModule } from '@nestjs/testing';
import { BankTransfersController } from './bank-transfers.controller';

describe('BankTransfersController', () => {
  let controller: BankTransfersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BankTransfersController],
    }).compile();

    controller = module.get<BankTransfersController>(BankTransfersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
