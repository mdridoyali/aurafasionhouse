import "server-only";
import type { PaymentMethod } from "@/models/Order";
import type { PaymentInitInput, PaymentInitResult, PaymentProcessor } from "./types";

const BD_PHONE_REGEX = /^01[3-9]\d{8}$/;
const TRX_ID_REGEX = /^[A-Z0-9]{6,24}$/;

export class PaymentValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PaymentValidationError";
  }
}

function normalizePhone(phone?: string): string {
  if (!phone) return "";
  return phone.replace(/[\s-]/g, "").replace(/^\+?88/, "");
}

class CashOnDeliveryProcessor implements PaymentProcessor {
  method: PaymentMethod = "cod";
  label = "Cash on Delivery";

  async initializePayment(): Promise<PaymentInitResult> {
    return {
      paymentStatus: "unpaid",
      provider: "Cash on Delivery",
    };
  }
}

class ManualMobileWalletProcessor implements PaymentProcessor {
  method: "bkash" | "nagad";
  label: string;

  constructor(method: "bkash" | "nagad", label: string) {
    this.method = method;
    this.label = label;
  }

  async initializePayment(input: PaymentInitInput): Promise<PaymentInitResult> {
    const sender = normalizePhone(input.senderNumber);
    const trxId = (input.transactionId || "").trim().toUpperCase();

    if (!BD_PHONE_REGEX.test(sender)) {
      throw new PaymentValidationError(
        `Please enter a valid 11-digit Bangladeshi ${this.label} sender number (e.g. 017XXXXXXXX).`
      );
    }

    if (!TRX_ID_REGEX.test(trxId)) {
      throw new PaymentValidationError(
        `Please enter a valid ${this.label} Transaction ID (6-24 alphanumeric characters).`
      );
    }

    return {
      paymentStatus: "pending_verification",
      provider: `${this.label} (Manual Verification)`,
      senderNumber: sender,
      transactionId: trxId,
    };
  }
}

const processors: Record<PaymentMethod, PaymentProcessor> = {
  cod: new CashOnDeliveryProcessor(),
  bkash: new ManualMobileWalletProcessor("bkash", "bKash"),
  nagad: new ManualMobileWalletProcessor("nagad", "Nagad"),
};

export function getPaymentProcessor(method: PaymentMethod): PaymentProcessor {
  const processor = processors[method];
  if (!processor) {
    throw new PaymentValidationError("Unsupported payment method.");
  }
  return processor;
}
