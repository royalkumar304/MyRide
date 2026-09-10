export interface HostEarningRecord {
  id: string;
  bookingId: string;
  vehicleName: string;
  tripDate: string;
  durationDays: number;
  grossAmount: number;        // Total paid by customer for rental
  platformCommissionRate: number; // e.g. 15%
  platformCommissionAmount: number; // e.g. gross * 0.15
  netHostEarnings: number;    // gross - platformCommissionAmount
  status: 'pending' | 'settled' | 'withdrawn';
  settlementDate?: string;
}

export interface HostEarningsSummary {
  totalGrossEarnings: number;
  totalPlatformCommission: number;
  totalNetEarnings: number;
  availableBalance: number;
  pendingSettlement: number;
  thisMonthEarnings: number;
  activeRentalsCount: number;
  completedTripsCount: number;
  chartData: {
    period: 'daily' | 'weekly' | 'monthly';
    labels: string[];
    values: number[];
  };
  recentTransactions: HostEarningRecord[];
}

export interface WithdrawalRequest {
  id: string;
  amount: number;
  payoutMethod: 'upi' | 'bank_transfer';
  destinationAccount: string;
  status: 'processing' | 'success' | 'failed';
  requestedAt: string;
}
