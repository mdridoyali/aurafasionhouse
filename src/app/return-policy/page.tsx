import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Return & Refund Policy | AURA Fashion House",
};

export default function ReturnPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-5 text-sm text-neutral-700 leading-relaxed">
      <h1 className="text-3xl font-bold tracking-tight text-neutral-950">
        Return, Exchange & Refund Policy
      </h1>
      <p>
        We want every AURA garment to fit you right. If you ordered the wrong size or received a
        defective product, we offer a straightforward 7-day return and size exchange policy.
      </p>
      <ul className="list-disc list-inside space-y-2">
        <li>Items must be unworn, unwashed, and include original tags and packaging.</li>
        <li>
          Customers can cancel orders directly from their account while the order is Pending or
          Confirmed.
        </li>
        <li>
          Delivered orders can submit a wrong-size exchange request directly from the order page.
        </li>
        <li>
          Approved refunds for bKash/Nagad payments are returned to the original sender wallet
          within 3–5 business days.
        </li>
      </ul>
    </div>
  );
}
