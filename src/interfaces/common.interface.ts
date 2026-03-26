import { UserDocument } from 'src/modules/user/entities/user.entity';

export interface AuthenticatedRequest extends Request {
  user: UserDocument;
}

export interface ContextProps {
  req: AuthenticatedRequest;
}

// pagination.types.ts
export interface PaginationOptions {
  cursor?: string;
  limit: number;
  offset?: number;
}

export interface PaginatedResults<T> {
  data: T[];
  totalCount?: number;
  hasNextPage?: boolean;
  totalPages?: number;
  page?: number;
  limit?: number;
}
