import Link from "next/link";

export default function NotFoundPage() {
  return (
    <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-4">
      <p className="text-xs uppercase tracking-widest text-neutral-500">404</p>
      <h1 className="text-3xl font-bold">Page Not Found</h1>
      <p className="text-sm text-neutral-600">
        The page you are looking for does not exist or has moved.
      </p>
      <Link
        href="/shop"
        className="inline-block px-6 py-2.5 rounded-full bg-neutral-950 text-white text-sm font-semibold"
      >
        Return to Shop
      </Link>
    </div>
  );
}
