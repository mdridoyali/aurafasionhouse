import "server-only";
import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";
import type { UserRole } from "@/lib/auth/rbac";

export interface IRoleChangeLog extends Document {
  targetUserId: Types.ObjectId;
  targetEmail: string;
  changedByUserId: Types.ObjectId;
  changedByEmail: string;
  previousRole: UserRole;
  newRole: UserRole;
  reason?: string;
  createdAt: Date;
}

const RoleChangeLogSchema = new Schema<IRoleChangeLog>(
  {
    targetUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    targetEmail: { type: String, required: true },
    changedByUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    changedByEmail: { type: String, required: true },
    previousRole: { type: String, enum: ["user", "moderator", "admin"], required: true },
    newRole: { type: String, enum: ["user", "moderator", "admin"], required: true },
    reason: { type: String, trim: true, maxlength: 300 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

RoleChangeLogSchema.index({ createdAt: -1 });

export const RoleChangeLog: Model<IRoleChangeLog> =
  mongoose.models.RoleChangeLog ||
  mongoose.model<IRoleChangeLog>("RoleChangeLog", RoleChangeLogSchema);
