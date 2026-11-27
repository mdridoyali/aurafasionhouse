import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions | AURA Fashion House",
};

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-5 text-sm text-neutral-700 leading-relaxed">
      <h1 className="text-3xl font-bold tracking-tight text-neutral-950">Terms & Conditions</h1>
      <p>
        All prices are listed in Bangladeshi Taka (BDT ৳). Orders are confirmed subject to stock
        availability and payment verification for bKash or Nagad transactions.
      </p>
      <p>
        Providing duplicate or invalid Transaction IDs will result in order cancellation and
        restoration of reserved inventory.
      </p>
    </div>
  );
}
