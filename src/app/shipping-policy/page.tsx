import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shipping Policy | AURA Fashion House",
};

export default function ShippingPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-5 text-sm text-neutral-700 leading-relaxed">
      <h1 className="text-3xl font-bold tracking-tight text-neutral-950">Shipping Policy</h1>
      <p>
        AURA Fashion House delivers across all 64 districts of Bangladesh using trusted courier
        partners.
      </p>
      <ul className="list-disc list-inside space-y-2">
        <li>
          <strong>Inside Dhaka City:</strong> ৳80 flat delivery charge (1–2 business days).
        </li>
        <li>
          <strong>Outside Dhaka:</strong> ৳160 flat delivery charge (2–4 business days).
        </li>
        <li>
          <strong>Cash on Delivery & Mobile Wallets:</strong> Available nationwide for both COD,
          bKash, and Nagad orders.
        </li>
      </ul>
    </div>
  );
}
