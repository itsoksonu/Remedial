export interface ClaimFilters {
  page?: number;
  limit?: number;
  status?: string;
  patientName?: string;
  payerName?: string;
  minAmount?: number;
  maxAmount?: number;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface Claim {
  id: string;
  claimNumber: string;
  patientName: string;
  payerName: string;
  status: "submitted" | "received" | "pending" | "denied" | "paid";
  totalAmount: number;
  dateOfService: string;
  createdAt: string;
  updatedAt: string;
  // Add other fields as necessary
}
