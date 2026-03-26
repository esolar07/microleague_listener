// Bank Transfer types and enums
// The actual model is defined in prisma/schema.prisma

export interface BankTransfer {
  id: string;
  transferId: string;
  walletAddress: string;
  amount: number;
  senderName: string;
  bankName: string;
  transactionRef: string;
  paymentRef: string;
  submittedDate: Date;
  status: BankTransferStatus;
  proofUrl: string;
  notes: string;
  verificationNote?: string | null;
  verifiedBy?: string | null;
  verifiedAt?: Date | null;
  rejectedBy?: string | null;
  rejectedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export enum BankTransferStatus {
  PENDING = "Pending",
  VERIFIED = "Verified", 
  REJECTED = "Rejected",
  ALL = "All",
}
