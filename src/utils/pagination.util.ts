export interface PaginationOptions {
  page?: number;
  limit?: number;
  sort?: any;
}

export interface PaginationResult<T> {
  data: T[];
  totalCount: number;
  totalPages: number;
  page: number;
  limit: number;
}

export function calculatePagination(options: PaginationOptions) {
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(100, Math.max(1, options.limit || 10));
  const skip = (page - 1) * limit;
  
  return { page, limit, skip };
}