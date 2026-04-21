import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam, ApiProduces } from '@nestjs/swagger';
import { 
  TransactionsResponseDto, 
  TransactionDto,
  TransactionStatsDto,
  DeleteTransactionResponseDto
} from '../dto/transactions-response.dto';

export function ApiGetTransactions() {
  return applyDecorators(
    ApiOperation({
      summary: "Get paginated transactions",
      description: "Retrieve a paginated list of transactions with advanced filtering options"
    }),
    ApiResponse({ 
      status: 200, 
      description: "Transactions retrieved successfully.",
      type: TransactionsResponseDto
    }),
    ApiResponse({ 
      status: 400, 
      description: "Bad Request - Invalid query parameters." 
    }),
    ApiResponse({ 
      status: 500, 
      description: "Internal Server Error." 
    })
  );
}

export function ApiGetTransactionStats() {
  return applyDecorators(
    ApiOperation({
      summary: "Get transaction statistics",
      description: "Retrieve comprehensive statistics about all transactions"
    }),
    ApiResponse({ 
      status: 200, 
      description: "Transaction statistics retrieved successfully.",
      type: TransactionStatsDto
    }),
    ApiResponse({ 
      status: 500, 
      description: "Internal Server Error." 
    })
  );
}

export function ApiGetTransactionByHash() {
  return applyDecorators(
    ApiOperation({
      summary: "Get transaction by hash",
      description: "Retrieve a specific transaction by its hash"
    }),
    ApiParam({
      name: "txHash",
      description: "Transaction hash",
      example: "0x248d82de2ba25254e3b66d645674ebb4f53d6f3957add04b5a5eb4af79560001"
    }),
    ApiResponse({ 
      status: 200, 
      description: "Transaction retrieved successfully.",
      type: TransactionDto
    }),
    ApiResponse({ 
      status: 404, 
      description: "Transaction not found." 
    }),
    ApiResponse({ 
      status: 500, 
      description: "Internal Server Error." 
    })
  );
}

export function ApiGetTransactionsByAddress() {
  return applyDecorators(
    ApiOperation({
      summary: "Get transactions by wallet address",
      description: "Retrieve all transactions for a specific wallet address"
    }),
    ApiParam({
      name: "address",
      description: "Wallet address",
      example: "0x9ed422636822d4db66c26acd856bf0ce25ae6fa5"
    }),
    ApiResponse({ 
      status: 200, 
      description: "Transactions retrieved successfully.",
      type: TransactionsResponseDto
    }),
    ApiResponse({ 
      status: 500, 
      description: "Internal Server Error." 
    })
  );
}

export function ApiExportTransactions() {
  return applyDecorators(
    ApiOperation({
      summary: "Export transactions to CSV",
      description: "Export transactions to CSV format with optional filtering"
    }),
    ApiProduces('text/csv'),
    ApiResponse({ 
      status: 200, 
      description: "CSV file downloaded successfully.",
      content: {
        'text/csv': {
          schema: {
            type: 'string',
            format: 'binary'
          }
        }
      }
    }),
    ApiResponse({ 
      status: 500, 
      description: "Internal Server Error." 
    })
  );
}

export function ApiDeleteTransaction() {
  return applyDecorators(
    ApiOperation({
      summary: "Delete a transaction",
      description: "Delete a specific transaction by its hash (Admin only)"
    }),
    ApiParam({
      name: "txHash",
      description: "Transaction hash",
      example: "0x248d82de2ba25254e3b66d645674ebb4f53d6f3957add04b5a5eb4af79560001"
    }),
    ApiResponse({ 
      status: 200, 
      description: "Transaction deleted successfully.",
      type: DeleteTransactionResponseDto
    }),
    ApiResponse({ 
      status: 404, 
      description: "Transaction not found." 
    }),
    ApiResponse({ 
      status: 500, 
      description: "Internal Server Error." 
    })
  );
}