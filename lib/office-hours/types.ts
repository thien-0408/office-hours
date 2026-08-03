export interface PublicSlot {
  lecturerName: string;
  department: string | null;
  startAt: string; // ISO-8601
  endAt: string; // ISO-8601
}

// Pagination shape per capstone-api-endpoints.md §0 Conventions.
export interface PublicOfficeHoursResponse {
  content: PublicSlot[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}
