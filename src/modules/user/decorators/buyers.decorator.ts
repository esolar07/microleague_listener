import { applyDecorators } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiQuery, ApiParam } from "@nestjs/swagger";

export function ApiCreateBuyer() {
  return applyDecorators(
    ApiOperation({ summary: "Create a new buyer" }),
    ApiResponse({ status: 201, description: "Buyer created successfully" }),
    ApiResponse({ status: 400, description: "Bad Request" }),
    ApiResponse({ status: 409, description: "Buyer already exists" })
  );
}

export function ApiGetAllBuyers() {
  return applyDecorators(
    ApiOperation({ summary: "Get all buyers with filtering and pagination" }),
    ApiQuery({ name: "search", required: false, type: String }),
    ApiQuery({ name: "status", required: false, enum: ["Active", "Inactive"] }),
    ApiQuery({ name: "page", required: false, type: Number }),
    ApiQuery({ name: "limit", required: false, type: Number }),
    ApiResponse({ status: 200, description: "Buyers retrieved successfully" })
  );
}

export function ApiGetBuyerStats() {
  return applyDecorators(
    ApiOperation({ summary: "Get buyers statistics" }),
    ApiResponse({
      status: 200,
      description: "Statistics retrieved successfully",
    })
  );
}

export function ApiGetBuyer() {
  return applyDecorators(
    ApiOperation({ summary: "Get a buyer by ID" }),
    ApiParam({ name: "id", type: String, description: "Buyer ID" }),
    ApiResponse({ status: 200, description: "Buyer retrieved successfully" }),
    ApiResponse({ status: 404, description: "Buyer not found" })
  );
}

export function ApiGetTopBuyer() {
  return applyDecorators(
    ApiOperation({
      summary: "Get top buyers",
      description:
        "Returns top active buyers sorted by tokens purchased (highest first)",
    }),
    ApiQuery({
      name: "limit",
      required: false,
      type: Number,
      example: 5,
      description: "Number of top buyers to return (default: 5)",
    })
  );
}

export function ApiGetBuyerByWallet() {
  return applyDecorators(
    ApiOperation({ summary: "Get a buyer by wallet address" }),
    ApiParam({
      name: "walletAddress",
      type: String,
      description: "Wallet address",
    }),
    ApiResponse({ status: 200, description: "Buyer retrieved successfully" }),
    ApiResponse({ status: 404, description: "Buyer not found" })
  );
}

export function ApiUpdateBuyer() {
  return applyDecorators(
    ApiOperation({ summary: "Update a buyer" }),
    ApiParam({ name: "id", type: String, description: "Buyer ID" }),
    ApiResponse({ status: 200, description: "Buyer updated successfully" }),
    ApiResponse({ status: 404, description: "Buyer not found" })
  );
}

export function ApiDeleteBuyer() {
  return applyDecorators(
    ApiOperation({ summary: "Delete a buyer" }),
    ApiParam({ name: "id", type: String, description: "Buyer ID" }),
    ApiResponse({ status: 200, description: "Buyer deleted successfully" }),
    ApiResponse({ status: 404, description: "Buyer not found" })
  );
}
