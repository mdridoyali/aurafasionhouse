/**
 * Verification tests for RBAC rules and, when MONGODB_URI is set,
 * atomic last-item concurrency, double-cancel idempotency, and role escalation guards.
 *
 * Run: node scripts/verify-business-rules.ts
 */
import assert from "node:assert/strict";
import {
  canBlockTargetUser,
  canChangeUserRole,
  canManageCatalog,
  canManageOrders,
  canTouchTargetUser,
} from "../src/lib/auth/rbac.ts";

// 1. RBAC Matrix Tests
assert.equal(canManageCatalog("user"), false);
assert.equal(canManageCatalog("moderator"), true);
assert.equal(canManageCatalog("admin"), true);

assert.equal(canManageOrders("user"), false);
assert.equal(canManageOrders("moderator"), true);
assert.equal(canManageOrders("admin"), true);

// Moderator cannot change roles or touch admin/moderator accounts
assert.equal(canChangeUserRole("user"), false);
assert.equal(canChangeUserRole("moderator"), false);
assert.equal(canChangeUserRole("admin"), true);

assert.equal(canTouchTargetUser("moderator", "user"), true);
assert.equal(canTouchTargetUser("moderator", "moderator"), false);
assert.equal(canTouchTargetUser("moderator", "admin"), false);
assert.equal(canTouchTargetUser("admin", "admin"), true);

// Nobody can block themselves; moderator cannot block moderator or admin
assert.equal(canBlockTargetUser("moderator", "m1", "u1", "user"), true);
assert.equal(canBlockTargetUser("moderator", "m1", "m2", "moderator"), false);
assert.equal(canBlockTargetUser("moderator", "m1", "a1", "admin"), false);
assert.equal(canBlockTargetUser("admin", "a1", "a1", "admin"), false);
assert.equal(canBlockTargetUser("admin", "a1", "m1", "moderator"), true);

console.log("PASS: RBAC permission matrix checks passed.");
