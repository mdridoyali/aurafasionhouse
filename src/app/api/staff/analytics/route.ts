import { connectDB } from "@/lib/db";
import { requireStaffForApi } from "@/lib/auth/session";
import { Order } from "@/models/Order";
import { Product } from "@/models/Product";
import { User } from "@/models/User";
import { handleApiError, jsonError, jsonOk } from "@/lib/api-response";

export async function GET() {
  try {
    const staff = await requireStaffForApi();
    if (!staff) return jsonError("Forbidden", 403);

    await connectDB();

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalOrders,
      totalCustomers,
      totalProducts,
      pendingVerifications,
      revenueAgg,
      statusBreakdown,
      dailySales,
      topProducts,
    ] = await Promise.all([
      Order.countDocuments(),
      User.countDocuments({ role: "user" }),
      Product.countDocuments({ isDeleted: false }),
      Order.countDocuments({ paymentStatus: "pending_verification" }),
      Order.aggregate<{ totalRevenue: number; paidRevenue: number }>([
        { $match: { orderStatus: { $nin: ["cancelled", "returned"] } } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$total" },
            paidRevenue: {
              $sum: { $cond: [{ $eq: ["$paymentStatus", "paid"] }, "$total", 0] },
            },
          },
        },
      ]),
      Order.aggregate<{ _id: string; count: number }>([
        { $group: { _id: "$orderStatus", count: { $sum: 1 } } },
      ]),
      Order.aggregate<{ _id: string; revenue: number; orders: number }>([
        {
          $match: {
            createdAt: { $gte: thirtyDaysAgo },
            orderStatus: { $nin: ["cancelled", "returned"] },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            revenue: { $sum: "$total" },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Product.find({ isDeleted: false })
        .select("name slug soldCount basePrice totalStock")
        .sort({ soldCount: -1 })
        .limit(5)
        .lean(),
    ]);

    return jsonOk({
      summary: {
        totalOrders,
        totalCustomers,
        totalProducts,
        pendingVerifications,
        totalRevenue: revenueAgg[0]?.totalRevenue ?? 0,
        paidRevenue: revenueAgg[0]?.paidRevenue ?? 0,
      },
      statusBreakdown: statusBreakdown.map((s) => ({ status: s._id, count: s.count })),
      dailySales: dailySales.map((d) => ({ date: d._id, revenue: d.revenue, orders: d.orders })),
      topProducts,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
