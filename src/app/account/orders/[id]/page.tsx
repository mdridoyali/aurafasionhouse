import React from "react";
import { notFound } from "next/navigation";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { requireUserPage } from "@/lib/auth/session";
import { isStaffRole } from "@/lib/auth/rbac";
import { Order } from "@/models/Order";
import { serializeDoc } from "@/lib/format";
import { OrderDetailClient, type OrderDetailData } from "@/components/account/OrderDetailClient";

export const dynamic = "force-dynamic";

export default async function AccountOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUserPage("/login");
  if (!Types.ObjectId.isValid(id)) notFound();

  await connectDB();
  const order = await Order.findById(id).lean();
  if (!order) notFound();
  if (order.userId.toString() !== user.id && !isStaffRole(user.role)) notFound();

  return <OrderDetailClient initialOrder={serializeDoc(order) as unknown as OrderDetailData} />;
}
