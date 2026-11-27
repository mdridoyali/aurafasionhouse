"use client";

import React, { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";
import { formatDateTime } from "@/lib/format";
import { useStore } from "@/components/providers/StoreProviders";
import type { UserRole } from "@/lib/auth/rbac";

interface UserRow {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  isBlocked: boolean;
}

interface RoleLogRow {
  _id: string;
  targetEmail: string;
  changedByEmail: string;
  previousRole: string;
  newRole: string;
  reason?: string;
  createdAt: string;
}

export function AdminUsersClient() {
  const { toast } = useStore();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [logs, setLogs] = useState<RoleLogRow[]>([]);

  const loadAll = useCallback(async () => {
    const [uRes, lRes] = await Promise.all([
      fetch("/api/staff/users", { cache: "no-store" }),
      fetch("/api/admin/role-logs", { cache: "no-store" }),
    ]);
    const [uJson, lJson] = await Promise.all([uRes.json(), lRes.json()]);
    if (uJson.ok) setUsers(uJson.data.users);
    if (lJson.ok) setLogs(lJson.data.logs);
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => loadAll());
  }, [loadAll]);

  const handleRoleChange = async (user: UserRow, nextRole: UserRole) => {
    const confirm = await Swal.fire({
      title: `Change ${user.email} role to ${nextRole}?`,
      input: "text",
      inputLabel: "Audit Reason (optional)",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#0a0a0a",
    });
    if (!confirm.isConfirmed) {
      void loadAll();
      return;
    }

    const res = await fetch(`/api/admin/users/${user._id}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: nextRole, reason: confirm.value }),
    });
    const json = await res.json();
    if (!res.ok) {
      toast(json.error || "Role change failed.", "error");
      void loadAll();
      return;
    }
    toast(`Role updated to ${nextRole}`);
    void loadAll();
  };

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold">Roles & Admin Access</h1>
        <p className="text-sm text-neutral-500">
          Promote or demote moderators and admins. Every change is logged and the last admin is
          protected.
        </p>
      </div>

      <div className="border border-neutral-200 rounded-2xl bg-white overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-neutral-200 text-xs text-neutral-500 bg-neutral-50">
              <th className="py-3 px-4">User</th>
              <th className="py-3 px-4">Current Role</th>
              <th className="py-3 px-4 text-right">Assign Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} className="border-b border-neutral-100">
                <td className="py-3 px-4">
                  <p className="font-semibold">{u.name}</p>
                  <p className="text-xs text-neutral-500">{u.email}</p>
                </td>
                <td className="py-3 px-4 capitalize font-medium">{u.role}</td>
                <td className="py-3 px-4 text-right">
                  <select
                    value={u.role}
                    onChange={(e) => void handleRoleChange(u, e.target.value as UserRole)}
                    className="px-3 py-1.5 rounded-lg border border-neutral-300 text-xs font-semibold bg-white"
                  >
                    <option value="user">user</option>
                    <option value="moderator">moderator</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-bold">Role Change Audit Log</h2>
        <div className="border border-neutral-200 rounded-2xl bg-white overflow-x-auto">
          <table className="w-full text-xs sm:text-sm text-left">
            <thead>
              <tr className="border-b border-neutral-200 text-neutral-500 bg-neutral-50">
                <th className="py-2.5 px-4">Time</th>
                <th className="py-2.5 px-4">Target</th>
                <th className="py-2.5 px-4">Change</th>
                <th className="py-2.5 px-4">Changed By</th>
                <th className="py-2.5 px-4">Reason</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log._id} className="border-b border-neutral-100">
                  <td className="py-2.5 px-4 text-neutral-500 whitespace-nowrap">
                    {formatDateTime(log.createdAt)}
                  </td>
                  <td className="py-2.5 px-4 font-medium">{log.targetEmail}</td>
                  <td className="py-2.5 px-4">
                    {log.previousRole} → <strong>{log.newRole}</strong>
                  </td>
                  <td className="py-2.5 px-4">{log.changedByEmail}</td>
                  <td className="py-2.5 px-4 text-neutral-600">{log.reason || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
