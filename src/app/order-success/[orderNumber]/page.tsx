import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { connectDB } from "@/lib/db";
import { requireUserPage } from "@/lib/auth/session";
import { isStaffRole } from "@/lib/auth/rbac";
import { Order } from "@/models/Order";
import { formatBDT, formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function OrderSuccessPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const user = await requireUserPage("/login");
  await connectDB();

  const order = await Order.findOne({ orderNumber: orderNumber.toUpperCase() }).lean();
  if (!order) notFound();
  if (order.userId.toString() !== user.id && !isStaffRole(user.role)) notFound();

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-14">
      <div className="border border-neutral-200 rounded-2xl p-6 sm:p-8 bg-white text-center space-y-5">
        <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-600" />
        <div>
          <p className="text-xs uppercase tracking-widest text-neutral-500">Order Confirmed</p>
          <h1 className="text-2xl sm:text-3xl font-bold mt-1">Thank You, {order.shippingAddress.fullName}</h1>
          <p className="text-sm text-neutral-600 mt-1">
            Order Number: <strong className="font-mono">{order.orderNumber}</strong>
          </p>
        </div>

        <div className="text-left bg-neutral-50 border border-neutral-200 rounded-xl p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-neutral-500">Placed On</span>
            <span>{formatDateTime(order.createdAt)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500">Payment Method</span>
            <span className="uppercase font-medium">{order.paymentMethod}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500">Payment Status</span>
            <span className="capitalize font-medium">{order.paymentStatus.replace("_", " ")}</span>
          </div>
          {order.paymentDetails?.transactionId && (
            <div className="flex justify-between">
              <span className="text-neutral-500">Transaction ID</span>
              <span className="font-mono font-medium">{order.paymentDetails.transactionId}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-neutral-500">Delivery Charge</span>
            <span>{formatBDT(order.deliveryCharge)}</span>
          </div>
          <div className="flex justify-between font-bold text-base pt-2 border-t border-neutral-200">
            <span>Total</span>
            <span>{formatBDT(order.total)}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href={`/account/orders/${order._id.toString()}`}
            className="px-5 py-2.5 rounded-full bg-neutral-950 text-white text-sm font-semibold"
          >
            View Order & Invoice
          </Link>
          <Link
            href="/shop"
            className="px-5 py-2.5 rounded-full border border-neutral-300 text-sm font-semibold hover:bg-neutral-50"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
