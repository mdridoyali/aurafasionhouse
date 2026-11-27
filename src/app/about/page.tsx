import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us | AURA Fashion House",
  description: "Learn about AURA Fashion House Bangladesh, our fabrics, and our craftsmanship.",
};

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-6">
      <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">Our Story</p>
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">AURA Fashion House</h1>
      <p className="text-neutral-700 leading-relaxed">
        Founded in Dhaka, AURA Fashion House builds clean, minimal, long-lasting essentials tailored
        for the Bangladesh climate. From 180–220 GSM combed cotton tees and breathable pique polos
        to crisp Oxford shirts and tailored chinos, every piece is bio-washed and pre-shrunk for
        consistent fit after every wash.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
        <div className="p-5 rounded-2xl bg-neutral-50 border border-neutral-200">
          <p className="font-bold">Honest Fabrics</p>
          <p className="text-xs text-neutral-600 mt-1">
            Export-grade combed cotton and breathable weaves tested for humidity.
          </p>
        </div>
        <div className="p-5 rounded-2xl bg-neutral-50 border border-neutral-200">
          <p className="font-bold">Transparent Delivery</p>
          <p className="text-xs text-neutral-600 mt-1">
            Flat ৳80 inside Dhaka and ৳160 nationwide with fast dispatch.
          </p>
        </div>
        <div className="p-5 rounded-2xl bg-neutral-50 border border-neutral-200">
          <p className="font-bold">Easy Size Exchange</p>
          <p className="text-xs text-neutral-600 mt-1">
            Request a size swap directly from your order page within 7 days.
          </p>
        </div>
      </div>
    </div>
  );
}
