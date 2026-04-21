import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';
import { 
  BankTransferResponseDto, 
  BankTransferListResponseDto,
  BankTransferStatsResponseDto 
} from '../dto/bank-transfers-response.dto';
import { CreateBankTransferDto } from '../dto/create-bank-transfer.dto';
import { UpdateBankTransferDto } from '../dto/update-bank-transfer.dto';
import { VerifyBankTransferDto } from '../dto/verify-bank-transfer.dto';
import { BankTransferStatus } from '../entities/bank-transfer.entity';

export function ApiCreateBankTransfer() {
  return applyDecorators(
    ApiOperation({
      summary: 'Submit a new bank transfer for verification',
      description: 'Creates a new bank transfer record with auto-generated transaction ID'
    }),
    ApiBody({ type: CreateBankTransferDto }),
    ApiResponse({ 
      status: 201, 
      description: 'Bank transfer submitted successfully',
      type: BankTransferResponseDto
    }),
    ApiResponse({ 
      status: 400, 
      description: 'Bad Request - Invalid input data' 
    }),
    ApiResponse({ 
      status: 409, 
      description: 'Conflict - Duplicate transaction reference' 
    })
  );
}

export function ApiGetAllBankTransfers() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get all bank transfers with filtering and pagination',
      description: 'Retrieve paginated list of bank transfers with search, status filtering, and statistics'
    }),
    ApiQuery({
      name: 'search',
      required: false,
      type: String,
      description: 'Search by ID, wallet address, transaction reference, payment reference, or sender name'
    }),
    ApiQuery({
      name: 'status',
      required: false,
      enum: BankTransferStatus,
      description: 'Filter by transfer status'
    }),
    ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      description: 'Page number (default: 1)'
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      description: 'Number of records per page (default: 10, max: 100)'
    }),
    ApiQuery({
      name: 'sort',
      required: false,
      type: String,
      description: 'Sort field and order (e.g., "submittedDate: -1")'
    }),
    ApiResponse({ 
      status: 200, 
      description: 'Bank transfers retrieved successfully',
      type: BankTransferListResponseDto
    }),
    ApiResponse({ 
      status: 400, 
      description: 'Bad Request - Invalid query parameters' 
    })
  );
}

export function ApiGetBankTransfer() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get a specific bank transfer by ID',
      description: 'Retrieve detailed information for a single bank transfer'
    }),
    ApiParam({
      name: 'id',
      type: String,
      example: 'BT-2025-001',
      description: 'Bank transfer ID in BT-YYYY-XXX format'
    }),
    ApiResponse({ 
      status: 200, 
      description: 'Bank transfer retrieved successfully',
      type: BankTransferResponseDto
    }),
    ApiResponse({ 
      status: 404, 
      description: 'Bank transfer not found' 
    })
  );
}

export function ApiUpdateBankTransfer() {
  return applyDecorators(
    ApiOperation({
      summary: 'Update a bank transfer',
      description: 'Update bank transfer information (admin only)'
    }),
    ApiParam({
      name: 'id',
      type: String,
      example: 'BT-2025-001',
      description: 'Bank transfer ID in BT-YYYY-XXX format'
    }),
    ApiBody({ type: UpdateBankTransferDto }),
    ApiResponse({ 
      status: 200, 
      description: 'Bank transfer updated successfully',
      type: BankTransferResponseDto
    }),
    ApiResponse({ 
      status: 404, 
      description: 'Bank transfer not found' 
    })
  );
}

export function ApiVerifyBankTransfer() {
  return applyDecorators(
    ApiOperation({
      summary: 'Verify or reject a bank transfer',
      description: 'Admin endpoint to verify (approve) or reject a bank transfer. Triggers token allocation for verified transfers.'
    }),
    ApiParam({
      name: 'id',
      type: String,
      example: 'BT-2025-001',
      description: 'Bank transfer ID in BT-YYYY-XXX format'
    }),
    ApiBody({ type: VerifyBankTransferDto }),
    ApiResponse({ 
      status: 200, 
      description: 'Bank transfer verified successfully',
      type: BankTransferResponseDto
    }),
    ApiResponse({ 
      status: 200, 
      description: 'Bank transfer rejected successfully',
      type: BankTransferResponseDto
    }),
    ApiResponse({ 
      status: 404, 
      description: 'Bank transfer not found' 
    })
  );
}

export function ApiDeleteBankTransfer() {
  return applyDecorators(
    ApiOperation({
      summary: 'Delete a bank transfer',
      description: 'Permanently delete a bank transfer record (admin only)'
    }),
    ApiParam({
      name: 'id',
      type: String,
      example: 'BT-2025-001',
      description: 'Bank transfer ID in BT-YYYY-XXX format'
    }),
    ApiResponse({ 
      status: 200, 
      description: 'Bank transfer deleted successfully' 
    }),
    ApiResponse({ 
      status: 404, 
      description: 'Bank transfer not found' 
    })
  );
}

export function ApiGetBankTransferStats() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get bank transfer statistics',
      description: 'Retrieve overall statistics for bank transfers (counts by status, total amount)'
    }),
    ApiResponse({ 
      status: 200, 
      description: 'Statistics retrieved successfully',
      type: BankTransferStatsResponseDto
    })
  );
}