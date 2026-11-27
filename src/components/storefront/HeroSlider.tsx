"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface BannerSlide {
  _id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  ctaText?: string;
  ctaLink?: string;
  imageUrl: string;
}

export function HeroSlider({ banners }: { banners: BannerSlide[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % banners.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [banners.length]);

  if (banners.length === 0) {
    return (
      <section className="relative bg-neutral-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-28 flex flex-col items-start gap-5">
          <span className="px-3 py-1 rounded-full bg-white/10 text-xs uppercase tracking-[0.2em]">
            AURA Fashion House
          </span>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight max-w-xl leading-tight">
            Minimal Everyday Essentials, Tailored for Bangladesh.
          </h1>
          <p className="text-neutral-300 max-w-lg text-sm sm:text-base">
            Combed cotton tees, breathable pique polos, crisp shirts, and tailored chinos.
            Cash on Delivery, bKash & Nagad nationwide.
          </p>
          <Link
            href="/shop"
            className="px-6 py-3 rounded-full bg-[#c2410c] hover:bg-[#9a3412] text-white text-sm font-semibold transition"
          >
            Explore Collection
          </Link>
        </div>
      </section>
    );
  }

  const active = banners[index]!;

  return (
    <section className="relative w-full overflow-hidden bg-neutral-950 text-white">
      <div className="relative h-[380px] sm:h-[480px] lg:h-[540px] w-full">
        <Image
          src={active.imageUrl}
          alt={active.title}
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-75"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-transparent" />

        <div className="relative z-10 max-w-7xl mx-auto h-full px-4 sm:px-6 flex flex-col justify-center items-start gap-4">
          {active.badge && (
            <span className="px-3 py-1 rounded-full bg-[#c2410c] text-white text-xs font-semibold uppercase tracking-widest">
              {active.badge}
            </span>
          )}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight max-w-2xl leading-[1.1]">
            {active.title}
          </h1>
          {active.subtitle && (
            <p className="text-sm sm:text-lg text-neutral-200 max-w-xl">{active.subtitle}</p>
          )}
          <Link
            href={active.ctaLink || "/shop"}
            className="mt-2 px-6 py-3 rounded-full bg-white text-neutral-950 hover:bg-neutral-200 text-sm font-semibold transition"
          >
            {active.ctaText || "Shop Now"}
          </Link>
        </div>

        {banners.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => setIndex((i) => (i - 1 + banners.length) % banners.length)}
              aria-label="Previous slide"
              className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 text-white items-center justify-center"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => setIndex((i) => (i + 1) % banners.length)}
              aria-label="Next slide"
              className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 text-white items-center justify-center"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
              {banners.map((b, idx) => (
                <button
                  key={b._id}
                  type="button"
                  onClick={() => setIndex(idx)}
                  aria-label={`Go to slide ${idx + 1}`}
                  className={`h-2 rounded-full transition-all ${
                    idx === index ? "w-7 bg-white" : "w-2 bg-white/50"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
