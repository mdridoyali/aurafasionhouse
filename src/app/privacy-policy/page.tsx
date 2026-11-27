import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | AURA Fashion House",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-5 text-sm text-neutral-700 leading-relaxed">
      <h1 className="text-3xl font-bold tracking-tight text-neutral-950">Privacy Policy</h1>
      <p>
        AURA Fashion House collects only the information needed to authenticate your account,
        fulfill your orders, verify mobile wallet payments, and deliver parcels across Bangladesh.
      </p>
      <p>
        We never sell or rent customer phone numbers, addresses, or order histories to third
        parties.
      </p>
    </div>
  );
}
