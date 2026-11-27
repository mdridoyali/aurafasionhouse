import React from "react";
import { requireAdminPage } from "@/lib/auth/session";
import { AdminUsersClient } from "@/components/dashboard/AdminUsersClient";

export const dynamic = "force-dynamic";

export default async function DashboardUsersPage() {
  await requireAdminPage();
  return <AdminUsersClient />;
}
