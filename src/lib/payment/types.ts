import type { PaymentMethod, PaymentStatus } from "@/models/Order";

export interface PaymentInitInput {
  orderNumber: string;
  amount: number;
  senderNumber?: string;
  transactionId?: string;
}

export interface PaymentInitResult {
  paymentStatus: PaymentStatus;
  provider: string;
  senderNumber?: string;
  transactionId?: string;
  gatewayRef?: string;
}

export interface PaymentProcessor {
  method: PaymentMethod;
  label: string;
  initializePayment(input: PaymentInitInput): Promise<PaymentInitResult>;
}
