import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ | AURA Fashion House",
};

const FAQS = [
  {
    q: "What are the delivery charges?",
    a: "Delivery inside Dhaka City is ৳80 and outside Dhaka (nationwide) is ৳160.",
  },
  {
    q: "Which payment methods do you accept?",
    a: "We accept Cash on Delivery (COD), bKash, and Nagad across Bangladesh.",
  },
  {
    q: "How do bKash and Nagad payments work?",
    a: "At checkout, select bKash or Nagad, send the exact order total to our merchant number displayed on screen, and enter your sender phone number and Transaction ID (TrxID). Our team verifies it promptly.",
  },
  {
    q: "Can I exchange my item if the size does not fit?",
    a: "Yes! Unworn items with tags intact can be exchanged for another size within 7 days of delivery directly from your order details page.",
  },
];

export default function FaqPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Frequently Asked Questions</h1>
      <div className="space-y-4">
        {FAQS.map((item, i) => (
          <div key={i} className="p-5 border border-neutral-200 rounded-2xl bg-white space-y-1.5">
            <h2 className="font-bold text-base">{item.q}</h2>
            <p className="text-sm text-neutral-600 leading-relaxed">{item.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
