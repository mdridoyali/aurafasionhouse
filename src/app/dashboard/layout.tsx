import React from "react";
import { requireStaffPage } from "@/lib/auth/session";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const staff = await requireStaffPage();

  return (
    <div className="max-w-[1440px] mx-auto flex flex-col lg:flex-row min-h-[75vh]">
      <DashboardSidebar role={staff.role} />
      <div className="flex-1 p-4 sm:p-8 overflow-x-hidden">{children}</div>
    </div>
  );
}
