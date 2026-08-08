export type Nullable<T> = T | null;

export type Optional<T> = T | undefined;

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface PaginationResult {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
